import { Router, type IRouter } from 'express';
import { requireUser } from '../lib/auth';
import { pool } from '@workspace/db';

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
  const { originFacility, destinationFacility, driverName, unitBarcodes, coolerBoxId } = req.body as Record<string, unknown>;

  if (!originFacility || !destinationFacility) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'originFacility and destinationFacility are required.' } });
  }

  const manifestNumber = `TRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const result = await pool.query(
    `INSERT INTO transit_manifests (manifest_number, origin_facility, destination_facility, courier_clerk_user_id, driver_name, unit_barcodes, cooler_box_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [manifestNumber, originFacility, destinationFacility, userId ?? null, driverName ?? 'Dispatch Driver', JSON.stringify(unitBarcodes ?? []), coolerBoxId ?? null]
  );

  return res.status(201).json(result.rows[0]);
});

// POST /api/transit/logs — record real-time temperature & GPS waypoint
router.post('/logs', async (req, res) => {
  if (!requireUser(req, res)) return;
  const { manifestId, temperatureCelsius, latitude, longitude, isAlertTriggered } = req.body as Record<string, unknown>;

  if (manifestId == null || temperatureCelsius == null) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'manifestId and temperatureCelsius are required.' } });
  }

  const result = await pool.query(
    `INSERT INTO transit_telemetry (manifest_id, temperature_celsius, latitude, longitude, is_alert_triggered)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [Number(manifestId), Number(temperatureCelsius), latitude ? Number(latitude) : null, longitude ? Number(longitude) : null, isAlertTriggered ?? null]
  );

  return res.status(201).json(result.rows[0]);
});

// PUT /api/transit/manifests/:id/status — update manifest status & delivery signature
router.put('/manifests/:id/status', async (req, res) => {
  if (!requireUser(req, res)) return;
  const { status, recipientSignature } = req.body as Record<string, unknown>;

  if (!status) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'status is required.' } });
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
