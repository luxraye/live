import { Router, type IRouter } from 'express';
import { requireUser } from '../lib/auth';
import { pool } from '@workspace/db';
import { createHash } from 'node:crypto';
import { bloodType, compatibleRbc, COMPONENTS, idempotencyKey, oneOf, positiveUnits, URGENCIES } from '../lib/clinical-integrity';

const router: IRouter = Router();

// GET /api/clinical/orders — list hospital orders, optional ?hospital=, ?status=
router.get('/orders', async (req, res) => {
  if (!requireUser(req, res)) return;
  const { hospital, status } = req.query as Record<string, string | undefined>;
  let query = 'SELECT * FROM clinical_orders WHERE 1=1';
  const params: string[] = [];
  let idx = 1;

  if (hospital) { query += ` AND hospital_name ILIKE $${idx++}`; params.push(`%${hospital}%`); }
  if (status) { query += ` AND status = $${idx++}`; params.push(status); }

  query += ' ORDER BY urgency = \'stat_trauma\' DESC, created_at DESC LIMIT 50';
  const result = await pool.query(query, params);
  return res.json(result.rows);
});

// POST /api/clinical/orders — doctor creates blood request
router.post('/orders', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const body = req.body as Record<string, unknown>;
  const { hospitalName, wardRoom, patientIdentifier, bloodType: requestedBloodType, component, unitsRequested, urgency, indication } = body;
  const key = idempotencyKey(req, body);

  if (!key || typeof hospitalName !== 'string' || !hospitalName || typeof wardRoom !== 'string' || !wardRoom ||
      typeof patientIdentifier !== 'string' || !patientIdentifier || !bloodType(requestedBloodType) ||
      !oneOf(component ?? 'prbc', COMPONENTS) || positiveUnits(unitsRequested ?? 1) === null ||
      !oneOf(urgency ?? 'elective', URGENCIES) || (indication !== undefined && indication !== null && typeof indication !== 'string')) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Valid idempotencyKey, facility, patient, blood type, component, units, and urgency are required.' } });
  }

  const existing = await pool.query('SELECT * FROM clinical_orders WHERE idempotency_key = $1', [key]);
  if (existing.rows[0]) return res.status(200).json(existing.rows[0]);
  const suffix = createHash('sha256').update(key).digest('hex').slice(0, 10).toUpperCase();
  const orderNumber = `ORD-${new Date().getFullYear()}-${suffix}`;

  const result = await pool.query(
    `INSERT INTO clinical_orders (order_number, idempotency_key, hospital_name, ward_room, doctor_clerk_user_id, patient_identifier, blood_type, component, units_requested, urgency, indication)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [orderNumber, key, hospitalName, wardRoom, userId, patientIdentifier, bloodType(requestedBloodType), component ?? 'prbc', unitsRequested ?? 1, urgency ?? 'elective', indication ?? null]
  );

  if (!result.rows[0]) {
    const replay = await pool.query('SELECT * FROM clinical_orders WHERE idempotency_key = $1', [key]);
    return res.status(200).json(replay.rows[0]);
  }
  return res.status(201).json(result.rows[0]);
});

// POST /api/clinical/transfusions — bedside dual scan verification & sign-off
router.post('/transfusions', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const body = req.body as Record<string, unknown>;
  const { orderId, unitBarcode, patientIdentifier, donorBloodType, startedAt, completedAt, hasReaction, reactionDetails } = body;
  const key = idempotencyKey(req, body);

  if (!key || typeof unitBarcode !== 'string' || !unitBarcode || typeof patientIdentifier !== 'string' || !patientIdentifier ||
      !bloodType(donorBloodType) || (orderId !== undefined && orderId !== null && !/^\d+$/.test(String(orderId))) ||
      (hasReaction !== undefined && typeof hasReaction !== 'boolean')) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'idempotencyKey, unitBarcode, patientIdentifier, and donorBloodType are required.' } });
  }
  const existing = await pool.query('SELECT * FROM transfusion_logs WHERE idempotency_key = $1', [key]);
  if (existing.rows[0]) return res.status(200).json({ verified: true, log: existing.rows[0] });
  let order: any = null;
  if (orderId != null) {
    const orderResult = await pool.query('SELECT patient_identifier, blood_type FROM clinical_orders WHERE id = $1', [Number(orderId)]);
    order = orderResult.rows[0];
    if (!order) return res.status(400).json({ error: { code: 'INVALID_ORDER', message: 'Referenced order does not exist.' } });
    if (order.patient_identifier !== patientIdentifier) return res.status(409).json({ error: { code: 'PATIENT_MISMATCH', message: 'Patient does not match the referenced order.' } });
  }
  if (order && !compatibleRbc(String(donorBloodType), order.blood_type)) {
    return res.status(409).json({ error: { code: 'INCOMPATIBLE_BLOOD', message: 'Donor RBC type is incompatible with the order recipient.' } });
  }

  const result = await pool.query(
    `INSERT INTO transfusion_logs (order_id, idempotency_key, unit_barcode, patient_identifier, clinician_clerk_user_id, started_at, completed_at, has_reaction, reaction_details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [orderId != null ? Number(orderId) : null, key, unitBarcode, patientIdentifier, userId, startedAt ?? new Date(), completedAt ?? null, hasReaction ?? false, reactionDetails ? JSON.stringify(reactionDetails) : null]
  );

  // Unit inventory consumption is intentionally not performed: no inventory schema supports an atomic claim yet.
  if (!result.rows[0]) {
    const replay = await pool.query('SELECT * FROM transfusion_logs WHERE idempotency_key = $1', [key]);
    return res.status(200).json({ verified: true, log: replay.rows[0] });
  }
  return res.status(201).json({ verified: true, log: result.rows[0] });
});

export default router;
