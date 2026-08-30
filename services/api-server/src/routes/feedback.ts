import { Router, type IRouter } from 'express';
import { getAuth } from '@clerk/express';
import { pool } from '@workspace/db';
const router: IRouter = Router();
router.post('/', async (req, res) => {
  const userId = getAuth(req).userId;
  const { sessionId, responses, appVersion, platform } = req.body as Record<string, unknown>;
  if (!responses || typeof responses !== 'object') return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'responses is required.' } });
  const result = await pool.query(
    `INSERT INTO feedback_responses (clerk_user_id, session_id, responses, app_version, platform) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [userId ?? null, sessionId ?? null, JSON.stringify(responses), appVersion ?? null, platform ?? null]
  );
  return res.status(201).json({ id: result.rows[0].id });
});
router.get('/', async (req, res) => {
  const userId = getAuth(req).userId;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sign in is required.' } });
  const result = await pool.query('SELECT * FROM feedback_responses ORDER BY created_at DESC LIMIT 100');
  return res.json(result.rows);
});
export default router;
