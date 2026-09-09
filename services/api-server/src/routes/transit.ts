import { Router, type IRouter } from 'express';
import { createHash } from 'node:crypto';
import { requireUser } from '../lib/auth';
import { pool } from '@workspace/db';
import { coordinate, finiteNumber, idempotencyKey, oneOf, TRANSIT_STATUSES } from '../lib/clinical-integrity';

const router: IRouter = Router();

// GET /api/transit/manifests — list active dispatches, optional ?status=
router.get('/manifests', async (req, res) => {
  if (!requireUser(req, res)) return;
  const { status } = req.query as Record<string, string | undefined>;
  let query = 'SELECT * FROM transit_manifests WHERE 1=1';
  const params: string[] = [];
  if (status) { query += ' AND status = $1'; params.push(status); }
  query += ' ORDER BY created_at DESC LIMIT 50';
  const result = await pool.query(query, params);
  return res.json(result.rows);
});

// POST /api/transit/manifests — create a new dispatch crate
router.post('/manifests', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const body = req.body as Record<string, unknown>;
  const { originFacility, destinationFacility, driverName, unitBarcodes, coolerBoxId } = body;
  const key = idempotencyKey(req, body);

  if (!key || typeof originFacility !== 'string' || !originFacility || typeof destinationFacility !== 'string' ||
      !destinationFacility || (driverName !== undefined && typeof driverName !== 'string') ||
      (coolerBoxId !== undefined && coolerBoxId !== null && typeof coolerBoxId !== 'string') ||
      (unitBarcodes !== undefined && (!Array.isArray(unitBarcodes) || unitBarcodes.some((v) => typeof v !== 'string' || !v)))) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'idempotencyKey, facilities, and a valid unitBarcodes array are required.' } });
  }

  const existing = await pool.query('SELECT * FROM transit_manifests WHERE idempotency_key = $1', [key]);
  if (existing.rows[0]) return res.status(200).json(existing.rows[0]);
  const manifestNumber = `TRN-${new Date().getFullYear()}-${createHash('sha256').update(key).digest('hex').toUpperCase()}`;

  const result = await pool.query(
    `INSERT INTO transit_manifests (manifest_number, idempotency_key, origin_facility, destination_facility, courier_clerk_user_id, driver_name, unit_barcodes, cooler_box_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [manifestNumber, key, originFacility, destinationFacility, userId ?? null, driverName ?? 'Dispatch Driver', JSON.stringify(unitBarcodes ?? []), coolerBoxId ?? null]
  );

  if (!result.rows[0]) {
    const replay = await pool.query('SELECT * FROM transit_manifests WHERE idempotency_key = $1', [key]);
    return res.status(200).json(replay.rows[0]);
  }
  return res.status(201).json(result.rows[0]);
});

// POST /api/transit/logs — record real-time temperature & GPS waypoint
router.post('/logs', async (req, res) => {
  if (!requireUser(req, res)) return;
  const body = req.body as Record<string, unknown>;
  const { manifestId, temperatureCelsius, latitude, longitude, isAlertTriggered } = body;
  const eventId = typeof req.header('Event-Id') === 'string' ? req.header('Event-Id') : body.eventId;

  if (manifestId == null || !/^\d+$/.test(String(manifestId)) || !eventId || typeof eventId !== 'string' ||
      !finiteNumber(temperatureCelsius) || temperatureCelsius < -100 || temperatureCelsius > 100 ||
      coordinate(latitude, -90, 90) === null && latitude !== null && latitude !== undefined ||
      coordinate(longitude, -180, 180) === null && longitude !== null && longitude !== undefined) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'eventId, manifestId, temperature, and valid coordinates are required.' } });
  }
  const manifest = await pool.query('SELECT id FROM transit_manifests WHERE id = $1', [Number(manifestId)]);
  if (!manifest.rows[0]) return res.status(400).json({ error: { code: 'INVALID_MANIFEST', message: 'Referenced manifest does not exist.' } });
  const existing = await pool.query('SELECT * FROM transit_telemetry WHERE event_id = $1', [eventId]);
  if (existing.rows[0]) return res.status(200).json(existing.rows[0]);

  const result = await pool.query(
    `INSERT INTO transit_telemetry (manifest_id, event_id, temperature_celsius, latitude, longitude, is_alert_triggered)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING *`,
    [Number(manifestId), eventId, temperatureCelsius, latitude ?? null, longitude ?? null, isAlertTriggered ?? null]
  );

  if (!result.rows[0]) {
    const replay = await pool.query('SELECT * FROM transit_telemetry WHERE event_id = $1', [eventId]);
    return res.status(200).json(replay.rows[0]);
  }
  return res.status(201).json(result.rows[0]);
});

// PUT /api/transit/manifests/:id/status — update manifest status & delivery signature
router.put('/manifests/:id/status', async (req, res) => {
  if (!requireUser(req, res)) return;
  const { status, recipientSignature } = req.body as Record<string, unknown>;

  if (!oneOf(status, TRANSIT_STATUSES)) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'status is required.' } });
  }

  const current = await pool.query('SELECT status FROM transit_manifests WHERE id = $1', [req.params.id]);
  if (!current.rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Manifest not found.' } });
  if (current.rows[0].status === 'delivered' || current.rows[0].status === 'compromised') {
    return res.status(409).json({ error: { code: 'INVALID_TRANSITION', message: 'Finalized manifests cannot change status.' } });
  }
  const result = await pool.query(
    `UPDATE transit_manifests
     SET status = $2,
         recipient_signature = COALESCE($3, recipient_signature),
         delivered_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE delivered_at END,
         departed_at = CASE WHEN $2 = 'in_transit' AND departed_at IS NULL THEN NOW() ELSE departed_at END
     WHERE id = $1
     RETURNING *`,
    [req.params.id, status, recipientSignature ?? null]
  );

  if (!result.rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Manifest not found.' } });
  return res.json(result.rows[0]);
});

export default router;
