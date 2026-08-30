# Bloodchain Sovereign Health Infrastructure

National sovereign platform for blood supply telemetry, cryptographic donor provenance, and emergency shortage response for the Republic of Botswana (Ministry of Health).

---

## Workspace Structure

`
live/
├── apps/
│   ├── demo-hub/        ← Marketing site & live Hyperledger Fabric Public Ledger (#ledger)
│   ├── scyther-mobile/  ← Donor handset mobile application (Expo SDK 57 / React Native)
│   └── rubric/          ← Operator command centre & situation room (React 19 / Clerk)
├── services/
│   ├── api-server/      ← Express 5 + PostgreSQL backend API (Port 5000)
│   └── fabric-node/     ← Hyperledger Fabric gateway & ledger microservice (Port 3001)
├── packages/
│   └── db/              ← Drizzle ORM PostgreSQL schemas & database migrations
└── deployment/
    └── render.yaml      ← Multi-service Render cloud deployment blueprint
`

---

## Quickstart — Running Locally

### 1. Install Dependencies
`ash
# In C:\Users\Taylith\live
pnpm install
`

### 2. Launch Hyperledger Fabric Ledger (Port 3001)
`ash
cd services/fabric-node
npm run dev
`
*Health endpoint: http://localhost:3001/healthz*  
*Public stats: http://localhost:3001/public/stats*  
*Public ledger feed: http://localhost:3001/public/ledger*

### 3. Launch Core API Backend (Port 5000)
`ash
cd ../api-server
npm run dev
`

### 4. Launch Rubric Situation Room (Port 5176)
`ash
cd ../../apps/rubric
npm run dev
`

### 5. Launch Demo Hub Marketing Site (Port 3000 / 5173)
`ash
cd ../demo-hub
npm run dev
`

### 6. Launch Scyther Mobile (Donor Handset)
`ash
cd ../scyther-mobile
npx expo start
`

---

## Vein-to-Vein Role Matrix

| Stakeholder Group | Application | Platform | Pilot Target | Key Functions |
| :--- | :--- | :--- | :--- | :--- |
| **Donors** | **Scyther Mobile** | iOS / Android (Expo) | 50 Users | Digital blood ID card, centre turn-by-turn routing, emergency response calls, automated survey. |
| **Operators & Admins** | **Rubric** | Web (React 19) | 10 Users | National Deficit Matrix, donor verification conductor, CMS publisher, emergency shortage dispatcher. |
| **Clinicians & Doctors** | **Aegis** *(Planned)* | Web / Tablet | 20 Users | Ward blood unit ordering, emergency trauma reservations, transfusion verification. |
| **Couriers & Transit** | **Torrent** *(Planned)* | Mobile (Expo) | 20 Users | Cold-chain cooler scanning, real-time temperature telemetry, route handoff. |
| **Lab Technicians** | **Crucible** *(Planned)* | Web / Tablet | 20 Users | Blood group typing, infectious disease screening, blood fraction separation. |

---

## Deployment Blueprint

To deploy all services to Render simultaneously, use deployment/render.yaml via Render Blueprints (or link the repo to Render).
