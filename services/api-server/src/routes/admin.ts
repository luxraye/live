import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { anchorDonationToFabric } from "../lib/fabric";

const router: IRouter = Router();

function requireAdmin(req: Request, res: Response): string | null {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in is required." } });
    return null;
  }
  return userId;
}

// === CENTRES ===
router.get("/centres", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const result = await pool.query("SELECT * FROM donation_centres ORDER BY created_at DESC");
  return res.json(result.rows);
});

router.post("/centres", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { name, kind, address, district, latitude, longitude, phone, opensAt, closesAt, acceptsWalkIns } = req.body as Record<string, unknown>;
  if (!name || !kind) return res.status(400).json({ error: { code: "INVALID_BODY", message: "name and kind are required." } });
  const result = await pool.query(
    `INSERT INTO donation_centres (name, kind, address, district, latitude, longitude, phone, opens_at, closes_at, accepts_walk_ins) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [name, kind, address ?? null, district ?? null, latitude ?? null, longitude ?? null, phone ?? null, opensAt ?? null, closesAt ?? null, acceptsWalkIns ?? true],
  );
  return res.status(201).json(result.rows[0]);
});

router.put("/centres/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { name, kind, address, district, latitude, longitude, phone, opensAt, closesAt, acceptsWalkIns, isOpen, isActive } = req.body as Record<string, unknown>;
  const result = await pool.query(
    `UPDATE donation_centres SET name=COALESCE($2,name), kind=COALESCE($3,kind), address=$4, district=$5, latitude=$6, longitude=$7, phone=$8, opens_at=$9, closes_at=$10, accepts_walk_ins=COALESCE($11,accepts_walk_ins), is_open=COALESCE($12,is_open), is_active=COALESCE($13,is_active), updated_at=NOW() WHERE id=$1 RETURNING *`,
    [req.params.id, name, kind, address, district, latitude, longitude, phone, opensAt, closesAt, acceptsWalkIns, isOpen, isActive],
  );
  if (!result.rows[0]) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Centre not found." } });
  return res.json(result.rows[0]);
});

// === ARTICLES ===
router.get("/articles", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const result = await pool.query("SELECT * FROM health_articles ORDER BY created_at DESC");
  return res.json(result.rows);
});

router.post("/articles", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { title, slug, bodyMarkdown, topic, readTimeMinutes, iconName, isPublished } = req.body as Record<string, unknown>;
  if (!title || !slug) return res.status(400).json({ error: { code: "INVALID_BODY", message: "title and slug are required." } });
  const result = await pool.query(
    `INSERT INTO health_articles (title, slug, body_markdown, topic, read_time_minutes, icon_name, is_published, published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [title, slug, bodyMarkdown ?? "", topic ?? "general", readTimeMinutes ?? 5, iconName ?? "heart", isPublished ?? false, isPublished ? new Date() : null],
  );
  return res.status(201).json(result.rows[0]);
});

router.put("/articles/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { title, bodyMarkdown, topic, readTimeMinutes, iconName, isPublished } = req.body as Record<string, unknown>;
  const result = await pool.query(
    `UPDATE health_articles SET title=COALESCE($2,title), body_markdown=COALESCE($3,body_markdown), topic=COALESCE($4,topic), read_time_minutes=COALESCE($5,read_time_minutes), icon_name=COALESCE($6,icon_name), is_published=COALESCE($7,is_published), published_at=CASE WHEN $7=true AND published_at IS NULL THEN NOW() ELSE published_at END, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [req.params.id, title, bodyMarkdown, topic, readTimeMinutes, iconName, isPublished],
  );
  if (!result.rows[0]) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found." } });
  return res.json(result.rows[0]);
});

// === NETWORK REQUESTS ===
router.post("/network/requests", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { bloodType, priority, facilityName, description, district, latitude, longitude } = req.body as Record<string, unknown>;
  if (!bloodType || !facilityName || !description) return res.status(400).json({ error: { code: "INVALID_BODY", message: "bloodType, facilityName, and description are required." } });
  const result = await pool.query(
    `INSERT INTO donation_requests (blood_type, priority, facility_name, description, district, latitude, longitude) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [bloodType, priority ?? "planned", facilityName, description, district ?? null, latitude ?? null, longitude ?? null],
  );
  return res.status(201).json(result.rows[0]);
});

router.put("/network/requests/:id/close", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const result = await pool.query("UPDATE donation_requests SET is_open=false, closed_at=NOW() WHERE id=$1 RETURNING *", [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Request not found." } });
  return res.json(result.rows[0]);
});

// === VERIFICATION QUEUE ===
router.get("/verification-queue", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const result = await pool.query(`
    SELECT dd.*, dp.first_name, dp.last_name, dp.verification_level
    FROM donor_documents dd
    LEFT JOIN donor_profiles dp ON dd.clerk_user_id = dp.clerk_user_id
    WHERE dd.status = 'pending'
    ORDER BY dd.created_at ASC
  `);
  return res.json(result.rows);
});

router.put("/verification-queue/:documentId", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { status, verificationLevel } = req.body as Record<string, unknown>; // status: 'approved' | 'rejected'
  if (!status || !["approved", "rejected"].includes(status as string)) {
    return res.status(400).json({ error: { code: "INVALID_STATUS", message: "status must be approved or rejected." } });
  }
  await pool.query("UPDATE donor_documents SET status=$2 WHERE id=$1", [req.params.documentId, status]);
  if (status === "approved" && verificationLevel) {
    const doc = await pool.query("SELECT clerk_user_id FROM donor_documents WHERE id=$1", [req.params.documentId]);
    if (doc.rows[0]) {
      await pool.query("UPDATE donor_profiles SET verification_level=$2, updated_at=NOW() WHERE clerk_user_id=$1", [doc.rows[0].clerk_user_id, verificationLevel]);
    }
  }
  return res.json({ updated: true });
});

// === DONATION ANCHORING (FABRIC BLOCKCHAIN) ===
router.post("/donations/record", async (req, res) => {
  const operatorId = requireAdmin(req, res);
  if (!operatorId) return;

  const { clerkUserId, centreId, centreName, district, bloodType, donatedAt, notes } = req.body as Record<string, unknown>;

  if (!clerkUserId || !centreName || !bloodType) {
    return res.status(400).json({ error: { code: "INVALID_BODY", message: "clerkUserId, centreName, and bloodType are required." } });
  }

  const donationTimestamp = (donatedAt ? new Date(donatedAt as string) : new Date()).toISOString();

  // 1. Save to primary Postgres DB
  const pgResult = await pool.query(
    `INSERT INTO donor_donations (clerk_user_id, centre_id, centre_name, donated_at, verified, notes)
     VALUES ($1, $2, $3, $4, true, $5)
     RETURNING *`,
    [clerkUserId, centreId ? Number(centreId) : null, centreName, donationTimestamp, notes ?? null]
  );

  const donationRow = pgResult.rows[0];
  const txId = `tx-bc-${donationRow.id}-${Date.now().toString(36)}`;

  // 2. Anchor to Hyperledger Fabric
  const fabricProof = await anchorDonationToFabric({
    txId,
    clerkUserId: String(clerkUserId),
    centreId: String(centreId ?? "CTR-GEN-001"),
    centreName: String(centreName),
    district: String(district ?? "National"),
    bloodType: String(bloodType),
    donatedAt: donationTimestamp,
    operatorId,
  });

  return res.status(201).json({
    donation: donationRow,
    blockchainProof: fabricProof ?? { status: "pending_sync" },
  });
});

export default router;

