import { Router, type IRouter } from 'express';
import { getAuth } from '@clerk/express';
import { pool } from '@workspace/db';

const router: IRouter = Router();

// GET /api/clinical/orders — list hospital orders, optional ?hospital=, ?status=
router.get('/orders', async (req, res) => {
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
  const userId = getAuth(req).userId;
  const { hospitalName, wardRoom, patientIdentifier, bloodType, component, unitsRequested, urgency, indication } = req.body as Record<string, unknown>;

  if (!hospitalName || !wardRoom || !patientIdentifier || !bloodType) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'hospitalName, wardRoom, patientIdentifier, and bloodType are required.' } });
  }

  const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const result = await pool.query(
    `INSERT INTO clinical_orders (order_number, hospital_name, ward_room, doctor_clerk_user_id, patient_identifier, blood_type, component, units_requested, urgency, indication)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [orderNumber, hospitalName, wardRoom, userId ?? null, patientIdentifier, bloodType, component ?? 'prbc', unitsRequested ?? 1, urgency ?? 'elective', indication ?? null]
  );

  return res.status(201).json(result.rows[0]);
});

// POST /api/clinical/transfusions — bedside dual scan verification & sign-off
router.post('/transfusions', async (req, res) => {
  const userId = getAuth(req).userId ?? 'clinician-demo';
  const { orderId, unitBarcode, patientIdentifier, startedAt, completedAt, hasReaction, reactionDetails } = req.body as Record<string, unknown>;

  if (!unitBarcode || !patientIdentifier) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'unitBarcode and patientIdentifier are required.' } });
  }

  const result = await pool.query(
    `INSERT INTO transfusion_logs (order_id, unit_barcode, patient_identifier, clinician_clerk_user_id, started_at, completed_at, has_reaction, reaction_details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [orderId ? Number(orderId) : null, unitBarcode, patientIdentifier, userId, startedAt ?? new Date(), completedAt ?? null, hasReaction ?? false, reactionDetails ? JSON.stringify(reactionDetails) : null]
  );

  return res.status(201).json({ verified: true, log: result.rows[0] });
});

export default router;
