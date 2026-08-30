import { Router, type IRouter, type Request } from "express";
import { getRequestAuth } from "../lib/auth";
import { pool } from "@workspace/db";

const router: IRouter = Router();

function authenticatedUserId(req: Request) {
  return getRequestAuth(req).userId;
}

router.get("/me", async (req, res) => {
  const userId = authenticatedUserId(req);
  if (!userId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in is required." } });
  const result = await pool.query("SELECT * FROM donor_profiles WHERE clerk_user_id = $1", [userId]);
  return res.json(result.rows[0] ?? null);
});

router.put("/me", async (req, res) => {
  const userId = authenticatedUserId(req);
  if (!userId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in is required." } });
  const { firstName, lastName, bloodType, district, phone, locationEnabled } = req.body as Record<string, unknown>;
  const result = await pool.query(
    `INSERT INTO donor_profiles (clerk_user_id, first_name, last_name, blood_type, district, phone, location_enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (clerk_user_id) DO UPDATE SET first_name=$2,last_name=$3,blood_type=$4,district=$5,phone=$6,location_enabled=$7,updated_at=NOW()
     RETURNING *`,
    [userId, firstName ?? "", lastName ?? "", bloodType ?? null, district ?? null, phone ?? null, locationEnabled ?? false],
  );
  return res.json(result.rows[0]);
});

router.post("/documents", async (req, res) => {
  const userId = authenticatedUserId(req);
  if (!userId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in is required." } });
  const { objectPath, documentType } = req.body as Record<string, unknown>;
  if (typeof objectPath !== "string" || !objectPath.startsWith("/objects/") || typeof documentType !== "string") {
    res.status(400).json({ error: { code: "INVALID_DOCUMENT", message: "Document metadata is required." } });
    return;
  }
  const grant = await pool.query(
    `UPDATE upload_grants SET consumed_at = NOW()
     WHERE object_path = $1 AND clerk_user_id = $2 AND consumed_at IS NULL AND expires_at > NOW()
     RETURNING object_path`,
    [objectPath, userId],
  );
  if (grant.rowCount !== 1) {
    res.status(403).json({ error: { code: "INVALID_UPLOAD", message: "This upload is not available for your account." } });
    return;
  }
  const result = await pool.query(
    `INSERT INTO donor_documents (clerk_user_id, object_path, document_type) VALUES ($1,$2,$3) RETURNING id, object_path, document_type, status, created_at`,
    [userId, objectPath, documentType],
  );
  return res.status(201).json(result.rows[0]);
});

export default router;