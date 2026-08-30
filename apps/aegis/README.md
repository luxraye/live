# Aegis Clinical — Bloodchain Clinician & Hospital Ward Portal

## Project Overview
- **Name**: `aegis-clinical` (project dir: `webapp`)
- **Goal**: Ultra-clean, tablet-first portal for hospital doctors, surgical staff and ward nurses in Botswana (Princess Marina, Nyangabgwe) to order blood fast, verify transfusion safety at the bedside, and report reactions — all in ≤ 3 taps. Zero blockchain jargon exposed to clinicians; ledger refs are shown passively as audit codes.
- **Design**: High-contrast clinical dark mode — `#060912` background, `#E11D48` crimson accents, `#06B6D4` cyan status, `#10B981` emerald verified badges. Oversized tap targets for gloved hands, bottom thumb-nav for tablets.

## URLs
- **Sandbox Preview**: https://3000-ial8b51jv3my9e0ep9ri2-a402f90a.sandbox.novita.ai
- **Production**: not yet deployed (Cloudflare Pages ready — `npm run deploy`)
- **Backend**: Bloodchain API at `http://localhost:5000/api` (auto-detects; falls back to demo mode when offline)

## Currently Completed Features

### Module A — Emergency & Scheduled Unit Ordering
- **STAT Trauma Order**: 1-tap emergency request → O− / O+ picker → confirm → dispatched with live 8-min countdown timer, auto-transitions to DELIVERED.
- **Elective / Ward Crossmatch Request**: Patient ID, all 8 ABO/Rh groups, 4 components (Packed RBC / FFP / Cryo / Platelets), 1–6 units, quick-pick clinical indications (PPH, sickle cell crisis, trauma surgery, GI bleed, elective surgery, severe anaemia + freeform), destination ward/OR.
- **Active Orders board**: live status chips (Dispatched → Crossmatching → Ready → Delivered) with Bloodchain ledger refs.

### Module B — Bedside Transfusion Verification
- **Dual-Verification Scanner**: sequential patient-wristband → blood-bag scan flow with laser-sweep animation; full ABO/Rh compatibility matrix (recipient ← donor); haptic vibration on result.
- **Safety Lock**: emerald "COMPATIBLE — SAFE TO TRANSFUSE" glow vs pulsing crimson "INCOMPATIBLE — DO NOT TRANSFUSE" lock with return-to-blood-bank directive.
- **Transfusion Sign-Off**: 4-digit clinician PIN keypad + digital timestamp, posted to ledger.
- **Pilot simulator**: on-screen group selectors so demo audiences can force match/mismatch scenarios.

### Module C — Adverse Reaction Checklist
- 1-tap multi-select tiles (Fever / Urticaria / Tachycardia / Hematuria) with clinical hint text, STOP-transfusion banner, optional unit/patient IDs, instant Blood Bank alert with simulated acknowledgement.

### Module D — Automated Pilot Survey Modal
- 1–5 star Ease of Ordering, 1–5 star Verification Speed, 0–10 NPS ("recommend over paper forms?"), role picker, freeform clinical feedback.
- POSTs `{ platform: "aegis-clinical", easeOfOrdering, verificationSpeed, nps, feedback, role, submittedAt }` to `POST /api/feedback`.
- Auto-prompts 25 s after a clinician's first order (once per session) + always available from bottom nav.

### Landing & Login
- Public landing page: hero pitch ("Blood at the bedside, verified in seconds"), 3 feature cards, and a Bloodchain ecosystem strip (Ledger · Blood Bank Console · Donor Network · Aegis Clinical) positioning the portal within the wider network.
- Clinician sign-in card: Staff ID / MDC Registration # + numeric PIN (pilot-mode local acceptance; production will verify against hospital staff registry), plus 1-tap "Enter Pilot Demo Mode".
- Session persisted in sessionStorage; header shows the signed-in clinician with a Sign out control that returns to the landing page.

### Module E — Impact Dashboard ("Command View")
- Hero metric: incompatible transfusions blocked this pilot + estimated liability exposure avoided ($1M+ per ABO never-event).
- Speed story: animated paper-baseline (52 min) vs Aegis STAT (8 min) comparison bars, with live clinician-minutes-saved counter.
- Live pilot activity grid (units ordered, STAT/MTP/elective counts, verifications, sign-offs, reaction alerts, pending sync) counted from real device actions via `src/stats.ts`.
- "Cost of the Status Quo" panel: expiry wastage %, cost per never-event, paper turnaround — clearly labelled pilot projections.

### Offline-First Sync Queue
- Every failed POST (ward Wi-Fi drop, power cut) persists to a localStorage queue and replays automatically: on `online` event, on backend health-probe success, and every 20 s.
- Amber "N actions pending sync" badge (tap to force retry); the Impact tab shows sync state.

### Real Camera Barcode Scanning
- Native `BarcodeDetector` (Chrome/Edge on Android tablets) reads Code 128 / ISBT 128, Code 39, EAN-13, QR, Data Matrix from the rear camera with laser-sweep overlay and haptic feedback.
- Blood groups embedded in barcode payloads (e.g. `UNIT-482913-AB+`) are parsed automatically; the pilot simulator supplies groups otherwise.
- Graceful fallback: browsers without BarcodeDetector or camera permission drop to 1-tap simulated scan.

### MTP & Safety Audio
- **ACTIVATE MTP — FULL TRAUMA PACK**: one tap dispatches 4u RBC + 4u FFP + 1 platelet pool (1:1:1 balanced resuscitation) as three linked STAT orders.
- ABO mismatch now triggers a hard Web-Audio alarm (3× two-tone square-wave) alongside vibration; matches play a soft confirmation chime.
- PIN sign-off records the signed-in clinician's ID from login on the verification and sign-off payloads.

### Cross-cutting
- Live backend health probe (`GET /api/health` every 30 s) → header shows "Bloodchain LIVE" or "Demo mode (offline)". All API calls degrade gracefully to demo mode so the clinical workflow is never blocked.

## Functional Entry Points (frontend SPA)
| Path / Action | Description |
|---|---|
| `/` | Single-page app; tabs: Order Blood · Bedside Verify · Reactions · Pilot Survey |
| `POST {API}/orders` | STAT + elective order payloads |
| `POST {API}/transfusions/verify` | Dual-scan verification result |
| `POST {API}/transfusions/signoff` | PIN sign-off with timestamp |
| `POST {API}/reactions` | Adverse reaction alert |
| `POST {API}/feedback` | Pilot survey payload |
| `GET {API}/health` | Backend liveness probe |

`{API}` = `http://localhost:5000/api`

## Data Architecture
- **Data models**: `BloodOrder`, `ScanResult`, `ReactionAlert`, `SurveyPayload` (see `src/types.ts`).
- **Storage**: stateless frontend — all persistence delegated to the Bloodchain API backend; session-only state in React. No PHI stored in the browser.
- **Compatibility engine**: full 8×8 ABO/Rh recipient←donor matrix in `src/modules/Verification.tsx`.

## Features Not Yet Implemented
- Real camera-based barcode scanning (currently simulated scans — swap `scanPatient`/`scanBag` for `html5-qrcode` or native BarcodeDetector API).
- Clinician authentication / per-user PIN validation against hospital staff registry.
- Order history & audit trail views pulled from the ledger.
- Push notifications when units are READY / DELIVERED.
- Offline queue that replays failed POSTs when connectivity returns.

## Recommended Next Steps
1. Wire real Bloodchain backend endpoints and confirm payload contracts.
2. Replace simulated scanner with `BarcodeDetector` (Chrome on Android tablets) + `html5-qrcode` fallback.
3. Add clinician login (hospital SSO or badge scan) so sign-off PINs are verified server-side.
4. Deploy to Cloudflare Pages and point `API_BASE` at the hosted Bloodchain API via env var.
5. Pilot at Princess Marina: collect `/api/feedback` payloads for the investor validation deck.

## User Guide
1. **Emergency**: tap **REQUEST EMERGENCY UNITS** → pick O− or O+ → **CONFIRM STAT DISPATCH**. Watch the countdown; collect at ward door on ARRIVED.
2. **Elective**: fill Patient ID + destination, tap group/component/units/indication chips → **SUBMIT CROSSMATCH REQUEST**.
3. **Bedside**: tab **Bedside Verify** → scan wristband → scan bag → obey the safety lock. If compatible, **TRANSFUSION SIGN-OFF** with your 4-digit PIN when the unit finishes.
4. **Reaction**: tab **Reactions** → tap symptom tiles → **ALERT BLOOD BANK NOW**.
5. **Survey**: tap **Pilot Survey** in the nav (or wait for the auto-prompt) and rate the experience.

## Deployment
- **Platform**: sandbox (wrangler pages dev via PM2); Cloudflare Pages ready
- **Status**: ✅ Active (sandbox)
- **Tech Stack**: React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Framer Motion + Lucide Icons
- **Dev**: `npm run build && pm2 start ecosystem.config.cjs` → http://localhost:3000
- **Last Updated**: 2026-08-30 (v3: impact dashboard, offline queue, camera scanning, MTP, mismatch alarm)
