import { Router, type IRouter } from 'express';
import { pool } from '@workspace/db';
const router: IRouter = Router();
router.get('/', async (req, res) => {
  const { q, type, lat, lng } = req.query as Record<string, string | undefined>;
  let query = `
    SELECT *,
      CASE WHEN ($1::float IS NOT NULL AND $2::float IS NOT NULL)
        THEN point($3::float, $4::float) <@> point(longitude, latitude) * 1.60934
        ELSE NULL
      END AS distance_km
    FROM donation_centres
    WHERE is_active = true
  `;
  const params: (string | number | null)[] = [lat ?? null, lng ?? null, lng ?? null, lat ?? null];
  let paramIdx = 5;
  if (q) { query += ` AND (name ILIKE $${paramIdx} OR district ILIKE $${paramIdx} OR address ILIKE $${paramIdx})`; params.push(`%${q}%`); paramIdx++; }
  if (type) { query += ` AND kind = $${paramIdx}`; params.push(type); paramIdx++; }
  query += ` ORDER BY distance_km ASC NULLS LAST, name ASC`;
  const result = await pool.query(query, params);
  return res.json(result.rows);
});
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM donation_centres WHERE id = $1 AND is_active = true', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Centre not found.' } });
  return res.json(result.rows[0]);
});
export default router;
