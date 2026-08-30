import { Router, type IRouter } from 'express';
import { pool } from '@workspace/db';
const router: IRouter = Router();
router.get('/', async (req, res) => {
  const { topic } = req.query as Record<string, string | undefined>;
  let query = 'SELECT id, title, slug, topic, read_time_minutes, icon_name, published_at FROM health_articles WHERE is_published = true';
  const params: string[] = [];
  if (topic) { query += ' AND topic = $1'; params.push(topic); }
  query += ' ORDER BY published_at DESC';
  const result = await pool.query(query, params);
  return res.json(result.rows);
});
router.get('/:slug', async (req, res) => {
  const result = await pool.query('SELECT * FROM health_articles WHERE slug = $1 AND is_published = true', [req.params.slug]);
  if (!result.rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found.' } });
  return res.json(result.rows[0]);
});
export default router;
