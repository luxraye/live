import { Router, type IRouter } from 'express';
import { getRequestAuth } from '../lib/auth';
import { pool } from '@workspace/db';
const router: IRouter = Router();
router.get('/requests', async (req, res) => {
  const { priority, bloodType, limit = '20', offset = '0' } = req.query as Record<string, string>;
  let query = 'SELECT *, NOW() - created_at AS age FROM donation_requests WHERE is_open = true';
  const params: (string | number)[] = [];
  let idx = 1;
  if (priority) { query += ` AND priority = $${idx++}`; params.push(priority); }
  if (bloodType) { query += ` AND blood_type = $${idx++}`; params.push(bloodType); }
  query += ` ORDER BY priority = 'critical' DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(Number(limit), Number(offset));
  const result = await pool.query(query, params);
  return res.json(result.rows);
});
router.post('/requests/:id/respond', async (req, res) => {
  const userId = getRequestAuth(req).userId;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sign in is required.' } });
  const requestId = Number(req.params.id);
  await pool.query(`INSERT INTO request_responses (request_id, clerk_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [requestId, userId]);
  await pool.query(`UPDATE donation_requests SET response_count = (SELECT COUNT(*) FROM request_responses WHERE request_id = $1) WHERE id = $1`, [requestId]);
  const updated = await pool.query('SELECT response_count FROM donation_requests WHERE id = $1', [requestId]);
  return res.json({ responded: true, responseCount: updated.rows[0]?.response_count ?? 0 });
});
export default router;
