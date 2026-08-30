import { Router, type IRouter } from 'express';
import { getRequestAuth } from '../lib/auth';
import { pool } from '@workspace/db';
const router: IRouter = Router();
router.get('/overview', async (req, res) => {
  const userId = getRequestAuth(req).userId;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sign in is required.' } });
  const [donors, pendingDocs, activeCentres, openRequests, totalResponses, articles, feedback] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM donor_profiles'),
    pool.query("SELECT COUNT(*) FROM donor_documents WHERE status = 'pending'"),
    pool.query('SELECT COUNT(*) FROM donation_centres WHERE is_active = true'),
    pool.query('SELECT COUNT(*) FROM donation_requests WHERE is_open = true'),
    pool.query('SELECT SUM(response_count) FROM donation_requests'),
    pool.query('SELECT COUNT(*) FROM health_articles WHERE is_published = true'),
    pool.query('SELECT COUNT(*) FROM feedback_responses'),
  ]);
  return res.json({
    totalDonors: Number(donors.rows[0]?.count ?? 0),
    pendingVerifications: Number(pendingDocs.rows[0]?.count ?? 0),
    activeCentres: Number(activeCentres.rows[0]?.count ?? 0),
    openRequests: Number(openRequests.rows[0]?.count ?? 0),
    totalResponses: Number(totalResponses.rows[0]?.sum ?? 0),
    publishedArticles: Number(articles.rows[0]?.count ?? 0),
    feedbackSubmissions: Number(feedback.rows[0]?.count ?? 0),
  });
});
export default router;
