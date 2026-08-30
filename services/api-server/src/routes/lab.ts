import { Router, type IRouter } from 'express';
import { getAuth } from '@clerk/express';
import { pool } from '@workspace/db';

const router: IRouter = Router();

// GET /api/lab/inventory — list cold vault units, optional ?component=, ?bloodType=, ?status=
router.get('/inventory', async (req, res) => {
  const { component, bloodType, status } = req.query as Record<string, string | undefined>;
  let query = 'SELECT * FROM blood_units WHERE 1=1';
  const params: string[] = [];
  let idx = 1;

  if (component) { query += ` AND component_type = $${idx++}`; params.push(component); }
  if (bloodType) { query += ` AND blood_type = $${idx++}`; params.push(bloodType); }
  if (status) { query += ` AND status = $${idx++}`; params.push(status); }

  query += ' ORDER BY expires_at ASC NULLS LAST, created_at DESC LIMIT 100';
  const result = await pool.query(query, params);
  return res.json(result.rows);
});

// POST /api/lab/intake — receive and barcode a new whole blood collection bag
router.post('/intake', async (req, res) => {
  const userId = getAuth(req).userId;
  const { donorHash, bloodType, donationTxId, volumeMl, vaultLocation } = req.body as Record<string, unknown>;

  if (!donorHash || !bloodType) {
    return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'donorHash and bloodType are required.' } });
  }

  const bagBarcode = `UNIT-BOTS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const expiresAt = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000); // 42 days for Whole Blood / RBC

  const result = await pool.query(
    `INSERT INTO blood_units (bag_barcode, donation_tx_id, donor_hash, blood_type, component_type, volume_ml, status, vault_location, tested_by_clerk_user_id, expires_at)
     VALUES ($1,$2,$3,$4,'whole_blood',$5,'quarantined',$6,$7,$8)
     RETURNING *`,
    [bagBarcode, donationTxId ?? null, donorHash, bloodType, volumeMl ? Number(volumeMl) : 450, vaultLocation ?? 'Intake Bay 1', userId ?? null, expiresAt]
  );

  return res.status(201).json(result.rows[0]);
});

// PUT /api/lab/tests/:id — record serology & viral screening results
router.put('/tests/:id', async (req, res) => {
  const userId = getAuth(req).userId;
  const { isReactive, viralMarkers, vaultLocation } = req.body as Record<string, unknown>;

  const reactive = Boolean(isReactive);
  const status = reactive ? 'quarantined' : 'tested_passed';

  const result = await pool.query(
    `UPDATE blood_units
     SET is_reactive = $2,
         viral_markers = $3,
         status = $4,
         vault_location = COALESCE($5, vault_location),
         tested_by_clerk_user_id = COALESCE($6, tested_by_clerk_user_id),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id, reactive, viralMarkers ? JSON.stringify(viralMarkers) : null, status, vaultLocation ?? null, userId ?? null]
  );

  if (!result.rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Blood unit not found.' } });
  return res.json(result.rows[0]);
});

// POST /api/lab/fractionate/:id — split 1 Whole Blood bag into PRBC, FFP, Platelets
router.post('/fractionate/:id', async (req, res) => {
  const userId = getAuth(req).userId;
  const parentUnit = await pool.query('SELECT * FROM blood_units WHERE id = $1', [req.params.id]);

  if (!parentUnit.rows[0]) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parent blood unit not found.' } });
  }

  const parent = parentUnit.rows[0];
  if (parent.is_reactive) {
    return res.status(400).json({ error: { code: 'REACTIVE_UNIT', message: 'Cannot fractionate reactive / infected blood unit.' } });
  }

  const now = new Date();
  const prbcExpiry = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000); // 42 days
  const ffpExpiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  const pltExpiry = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

  // Mark parent unit as fractionated
  await pool.query('UPDATE blood_units SET status=\'fractionated\', updated_at=NOW() WHERE id=$1', [parent.id]);

  // Insert child fractionated units
  const fractions = await Promise.all([
    pool.query(
      `INSERT INTO blood_units (bag_barcode, donation_tx_id, donor_hash, blood_type, component_type, volume_ml, status, vault_location, tested_by_clerk_user_id, expires_at)
       VALUES ($1,$2,$3,$4,'prbc',250,'tested_passed','Cold Vault A · Shelf 1',$5,$6) RETURNING *`,
      [`${parent.bag_barcode}-RBC`, parent.donation_tx_id, parent.donor_hash, parent.blood_type, userId ?? null, prbcExpiry]
    ),
    pool.query(
      `INSERT INTO blood_units (bag_barcode, donation_tx_id, donor_hash, blood_type, component_type, volume_ml, status, vault_location, tested_by_clerk_user_id, expires_at)
       VALUES ($1,$2,$3,$4,'ffp',200,'tested_passed','Deep Freezer -25C',$5,$6) RETURNING *`,
      [`${parent.bag_barcode}-FFP`, parent.donation_tx_id, parent.donor_hash, parent.blood_type, userId ?? null, ffpExpiry]
    ),
    pool.query(
      `INSERT INTO blood_units (bag_barcode, donation_tx_id, donor_hash, blood_type, component_type, volume_ml, status, vault_location, tested_by_clerk_user_id, expires_at)
       VALUES ($1,$2,$3,$4,'platelets',50,'tested_passed','Agitator Tray 3',$5,$6) RETURNING *`,
      [`${parent.bag_barcode}-PLT`, parent.donation_tx_id, parent.donor_hash, parent.blood_type, userId ?? null, pltExpiry]
    ),
  ]);

  return res.status(201).json({
    fractionatedFrom: parent.bag_barcode,
    fractions: fractions.map(f => f.rows[0]),
  });
});

export default router;
