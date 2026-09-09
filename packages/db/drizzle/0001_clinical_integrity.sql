-- Idempotency keys are nullable for backwards-compatible rollout; non-null values are unique.
ALTER TABLE clinical_orders ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE transfusion_logs ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE transit_manifests ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE transit_telemetry ADD COLUMN IF NOT EXISTS event_id text;
CREATE UNIQUE INDEX IF NOT EXISTS clinical_orders_idempotency_key_uidx ON clinical_orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transfusion_logs_idempotency_key_uidx ON transfusion_logs (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transit_manifests_idempotency_key_uidx ON transit_manifests (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transit_telemetry_event_id_uidx ON transit_telemetry (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transfusion_logs_order_id_idx ON transfusion_logs (order_id);
CREATE INDEX IF NOT EXISTS transit_telemetry_manifest_id_idx ON transit_telemetry (manifest_id);