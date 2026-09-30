import { Router, type IRouter } from 'express';
import { getRequestAuth } from '../lib/auth';
import { pool } from '@workspace/db';

const router: IRouter = Router();

type UnitStatus = 'pending' | 'verified' | 'quarantine' | 'processed' | 'disposed';
type ScreeningGate = 'awaiting' | 'passed' | 'quarantine';
type ComponentType = 'PRBC' | 'FFP' | 'PLT';

type Screening = {
  aboForward: string;
  aboReverse: string;
  rhd: string;
  hiv: string;
  hbsag: string;
  hcv: string;
  vdrl: string;
  gate: ScreeningGate;
};

type LabUnit = {
  id: string;
  donorCode: string;
  collectionSite: string;
  collectedAt: string;
  volumeMl: number;
  bloodGroup: string | null;
  status: UnitStatus;
  screening: Screening;
  createdAt: string;
};

type LabComponent = {
  id: string;
  parentUnitId: string;
  type: ComponentType;
  volumeMl: number;
  storage: string;
  expiresAt: string;
  shelf: string;
  status: 'available' | 'expiring' | 'dispatched' | 'expired';
  bloodGroup?: string | null;
};

const now = Date.now();
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const makeScreening = (gate: ScreeningGate = 'awaiting'): Screening => ({
  aboForward: gate === 'awaiting' ? '—' : 'A',
  aboReverse: gate === 'awaiting' ? '—' : 'A',
  rhd: gate === 'awaiting' ? '—' : '+',
  hiv: gate === 'awaiting' ? 'pending' : 'non-reactive',
  hbsag: gate === 'awaiting' ? 'pending' : 'non-reactive',
  hcv: gate === 'awaiting' ? 'pending' : 'non-reactive',
  vdrl: gate === 'awaiting' ? 'pending' : 'non-reactive',
  gate,
});

const mockUnits: LabUnit[] = [
  {
    id: 'WB-260830-001',
    donorCode: 'DRV-9A71',
    collectionSite: 'Princess Marina Mobile Drive',
    collectedAt: new Date(now - 38 * 60 * 1000).toISOString(),
    volumeMl: 450,
    bloodGroup: 'A+',
    status: 'verified',
    screening: makeScreening('passed'),
    createdAt: new Date(now - 38 * 60 * 1000).toISOString(),
  },
  {
    id: 'WB-260830-002',
    donorCode: 'DRV-4F28',
    collectionSite: 'Gaborone CBD Drive',
    collectedAt: new Date(now - 51 * 60 * 1000).toISOString(),
    volumeMl: 450,
    bloodGroup: 'O-',
    status: 'pending',
    screening: makeScreening(),
    createdAt: new Date(now - 51 * 60 * 1000).toISOString(),
  },
  {
    id: 'WB-260830-003',
    donorCode: 'DRV-7C13',
    collectionSite: 'Molepolole Outreach Hub',
    collectedAt: new Date(now - 2.6 * 60 * 60 * 1000).toISOString(),
    volumeMl: 450,
    bloodGroup: 'B+',
    status: 'quarantine',
    screening: {
      ...makeScreening('quarantine'),
      hiv: 'reactive',
      gate: 'quarantine',
    },
    createdAt: new Date(now - 2.6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'WB-260829-016',
    donorCode: 'DRV-2D64',
    collectionSite: 'Francistown Northern Bank',
    collectedAt: new Date(now - 18 * 60 * 60 * 1000).toISOString(),
    volumeMl: 450,
    bloodGroup: 'O-',
    status: 'processed',
    screening: makeScreening('passed'),
    createdAt: new Date(now - 18 * 60 * 60 * 1000).toISOString(),
  },
];

const mockComponents: LabComponent[] = [
  {
    id: 'PRBC-260829-016',
    parentUnitId: 'WB-260829-016',
    type: 'PRBC',
    volumeMl: 280,
    storage: '4°C',
    expiresAt: hoursFromNow(31),
    shelf: 'A1',
    status: 'expiring',
    bloodGroup: 'O-',
  },
  {
    id: 'FFP-260829-016',
    parentUnitId: 'WB-260829-016',
    type: 'FFP',
    volumeMl: 220,
    storage: '-25°C',
    expiresAt: hoursFromNow(7000),
    shelf: 'C2',
    status: 'available',
    bloodGroup: 'O-',
  },
  {
    id: 'PLT-260829-016',
    parentUnitId: 'WB-260829-016',
    type: 'PLT',
    volumeMl: 60,
    storage: '22°C / AGIT',
    expiresAt: hoursFromNow(95),
    shelf: 'D4',
    status: 'available',
    bloodGroup: 'O-',
  },
  {
    id: 'PRBC-260828-041',
    parentUnitId: 'WB-260828-041',
    type: 'PRBC',
    volumeMl: 290,
    storage: '4°C',
    expiresAt: hoursFromNow(112),
    shelf: 'A3',
    status: 'available',
    bloodGroup: 'A+',
  },
  {
    id: 'PLT-260830-004',
    parentUnitId: 'WB-260830-004',
    type: 'PLT',
    volumeMl: 60,
    storage: '22°C / AGIT',
    expiresAt: hoursFromNow(22),
    shelf: 'D1',
    status: 'expiring',
    bloodGroup: 'B+',
  },
];

const genId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

async function syncInitialUnitsToDb() {
  try {
    for (const unit of mockUnits) {
      await pool.query(
        `INSERT INTO blood_units (bag_barcode, donor_hash, blood_type, component_type, volume_ml, status, is_reactive, viral_markers, collected_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'whole_blood', $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (bag_barcode) DO NOTHING`,
        [
          unit.id,
          unit.donorCode,
          unit.bloodGroup || 'UNKNOWN',
          unit.volumeMl,
          unit.status,
          unit.status === 'quarantine',
          JSON.stringify(unit.screening),
          unit.collectedAt,
          unit.createdAt,
        ]
      );
    }
  } catch (err) {
    // Graceful note: Database might not be connected or ready yet
  }
}
void syncInitialUnitsToDb();

// GET /dashboard & /api/dashboard
router.get(['/dashboard', '/lab/dashboard'], async (_req, res) => {
  let quarantineCount = mockUnits.filter((u) => u.status === 'quarantine').length;
  let expiringSoonCount = mockComponents.filter((c) => c.status === 'expiring').length;

  try {
    const qCountRes = await pool.query(`SELECT COUNT(*)::int AS count FROM blood_units WHERE status = 'quarantine' OR is_reactive = true`);
    if (qCountRes.rows[0]) {
      quarantineCount = Number(qCountRes.rows[0].count);
    }
  } catch {
    // fallback to in-memory count
  }

  return res.json({
    receivedToday: 128,
    processedToday: 96,
    quarantineCount,
    expiringSoonCount,
    verifiedRate: 94.6,
    throughput: { current: 32, target: 40, unit: 'units / hr' },
  });
});

// GET /units & /api/units
router.get(['/units', '/lab/units'], async (req, res) => {
  const { status, search } = req.query as { status?: string; search?: string };

  let unitsList = mockUnits;

  try {
    const dbRes = await pool.query(
      `SELECT bag_barcode, donor_hash, blood_type, component_type, volume_ml, status, vault_location, is_reactive, viral_markers, collected_at, expires_at, created_at
       FROM blood_units
       WHERE component_type = 'whole_blood'
       ORDER BY created_at DESC
       LIMIT 100`
    );
    if (dbRes.rows.length > 0) {
      const dbUnits: LabUnit[] = dbRes.rows.map((row: any) => {
        const existing = mockUnits.find((u) => u.id === row.bag_barcode);
        if (existing) return existing;
        const gate: ScreeningGate = row.status === 'quarantine' || row.is_reactive ? 'quarantine' : row.status === 'verified' || row.status === 'processed' || row.status === 'fractionated' ? 'passed' : 'awaiting';
        return {
          id: row.bag_barcode,
          donorCode: row.donor_hash,
          collectionSite: 'Princess Marina Blood Bank',
          collectedAt: row.collected_at ? new Date(row.collected_at).toISOString() : new Date().toISOString(),
          volumeMl: Number(row.volume_ml) || 450,
          bloodGroup: row.blood_type && row.blood_type !== 'UNKNOWN' ? row.blood_type : null,
          status: (row.status === 'fractionated' ? 'processed' : row.status) as UnitStatus,
          screening: row.viral_markers && typeof row.viral_markers === 'object' ? row.viral_markers : makeScreening(gate),
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        };
      });

      for (const m of mockUnits) {
        if (!dbUnits.some((d) => d.id === m.id)) {
          dbUnits.push(m);
        }
      }
      unitsList = dbUnits;
    }
  } catch (err) {
    // Database fallback
  }

  let result = unitsList;
  if (status && status !== 'all') {
    result = result.filter((u) => u.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter((u) =>
      [u.id, u.donorCode, u.collectionSite, u.bloodGroup].filter(Boolean).some((v) => v!.toLowerCase().includes(s))
    );
  }
  return res.json(result);
});

// POST /units & /api/units
router.post(['/units', '/lab/units'], async (req, res) => {
  const body = req.body as Partial<LabUnit>;
  const createdAt = new Date().toISOString();
  const unit: LabUnit = {
    id: body.id || genId('WB'),
    donorCode: body.donorCode || 'DNR-' + Math.floor(10000 + Math.random() * 90000),
    collectionSite: body.collectionSite || 'Princess Marina Blood Bank',
    collectedAt: body.collectedAt || createdAt,
    volumeMl: Number(body.volumeMl) || 450,
    bloodGroup: body.bloodGroup || null,
    status: (body.status as UnitStatus) || 'pending',
    screening: body.screening || makeScreening(),
    createdAt,
  };
  mockUnits.unshift(unit);

  try {
    await pool.query(
      `INSERT INTO blood_units (bag_barcode, donor_hash, blood_type, component_type, volume_ml, status, collected_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (bag_barcode) DO UPDATE SET status = EXCLUDED.status, blood_type = EXCLUDED.blood_type, updated_at = NOW()`,
      [
        unit.id,
        unit.donorCode,
        unit.bloodGroup || 'UNKNOWN',
        'whole_blood',
        unit.volumeMl,
        unit.status,
        unit.collectedAt,
        unit.createdAt,
      ]
    );
  } catch (err) {
    console.warn('[lab] Warning: failed to persist blood unit to PostgreSQL:', err);
  }

  return res.status(201).json(unit);
});

// POST /units/:id/screen & /api/units/:id/screen
router.post(['/units/:id/screen', '/lab/units/:id/screen'], async (req, res) => {
  const unit = mockUnits.find((u) => u.id === req.params.id);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  const input = req.body as Partial<Screening>;
  const reactive = [input.hiv, input.hbsag, input.hcv, input.vdrl].some((v) => v === 'reactive');
  const bloodGroup = input.aboForward && input.rhd ? `${input.aboForward}${input.rhd}` : unit.bloodGroup || 'O+';

  unit.screening = {
    aboForward: input.aboForward || 'A',
    aboReverse: input.aboReverse || 'A',
    rhd: input.rhd || '+',
    hiv: input.hiv || 'non-reactive',
    hbsag: input.hbsag || 'non-reactive',
    hcv: input.hcv || 'non-reactive',
    vdrl: input.vdrl || 'non-reactive',
    gate: reactive ? 'quarantine' : 'passed',
  };
  unit.bloodGroup = bloodGroup;
  unit.status = reactive ? 'quarantine' : 'verified';

  try {
    await pool.query(
      `UPDATE blood_units
       SET status = $1, blood_type = $2, is_reactive = $3, viral_markers = $4, updated_at = NOW()
       WHERE bag_barcode = $5`,
      [
        unit.status,
        unit.bloodGroup,
        reactive,
        JSON.stringify(unit.screening),
        unit.id,
      ]
    );
  } catch (err) {
    console.warn('[lab] Warning: failed to update blood unit in PostgreSQL:', err);
  }

  return res.json(unit);
});

// POST /units/:id/fractionate & /api/units/:id/fractionate
router.post(['/units/:id/fractionate', '/lab/units/:id/fractionate'], async (req, res) => {
  const unit = mockUnits.find((u) => u.id === req.params.id);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  if (unit.status !== 'verified') {
    return res.status(409).json({ error: 'Only a verified unit that passed serology can be fractionated' });
  }

  const shelf = req.body?.shelf || 'A2';
  const created: LabComponent[] = [
    {
      id: genId('PRBC'),
      parentUnitId: unit.id,
      type: 'PRBC',
      volumeMl: 280,
      storage: '4°C',
      expiresAt: hoursFromNow(42 * 24),
      shelf,
      status: 'available',
      bloodGroup: unit.bloodGroup,
    },
    {
      id: genId('FFP'),
      parentUnitId: unit.id,
      type: 'FFP',
      volumeMl: 220,
      storage: '-25°C',
      expiresAt: hoursFromNow(365 * 24),
      shelf: 'C1',
      status: 'available',
      bloodGroup: unit.bloodGroup,
    },
    {
      id: genId('PLT'),
      parentUnitId: unit.id,
      type: 'PLT',
      volumeMl: 60,
      storage: '22°C / AGIT',
      expiresAt: hoursFromNow(5 * 24),
      shelf: 'D2',
      status: 'available',
      bloodGroup: unit.bloodGroup,
    },
  ];
  mockComponents.unshift(...created);
  unit.status = 'processed';

  try {
    await pool.query(
      `UPDATE blood_units SET status = 'fractionated', updated_at = NOW() WHERE bag_barcode = $1`,
      [unit.id]
    );
    for (const comp of created) {
      await pool.query(
        `INSERT INTO blood_units (bag_barcode, donor_hash, blood_type, component_type, volume_ml, status, vault_location, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (bag_barcode) DO NOTHING`,
        [
          comp.id,
          unit.donorCode,
          comp.bloodGroup || 'UNKNOWN',
          comp.type.toLowerCase(),
          comp.volumeMl,
          comp.status,
          comp.shelf,
          comp.expiresAt,
        ]
      );
    }
  } catch (err) {
    console.warn('[lab] Warning: failed to record fractionated components in PostgreSQL:', err);
  }

  return res.status(201).json(created);
});

// GET /vault & /api/vault
router.get(['/vault', '/lab/vault'], (_req, res) => {
  const shelves = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4'];
  const zoneFor = (shelf: string) =>
    shelf.startsWith('A') || shelf.startsWith('B') ? 'RBC REFRIGERATOR' : shelf.startsWith('C') ? 'PLASMA FREEZER' : 'PLATELET AGITATOR';
  const tempFor = (shelf: string) =>
    shelf.startsWith('A') || shelf.startsWith('B') ? '4°C' : shelf.startsWith('C') ? '-25°C' : '22°C';

  return res.json(
    shelves.map((shelf) => {
      const component = mockComponents.find((item) => item.shelf === shelf);
      const hoursRemaining = component
        ? Math.round((new Date(component.expiresAt).getTime() - Date.now()) / 3_600_000)
        : 0;
      return {
        shelf,
        zone: zoneFor(shelf),
        temperature: tempFor(shelf),
        component: component
          ? {
              id: component.id,
              type: component.type,
              bloodGroup: component.bloodGroup ?? '—',
              expiresAt: component.expiresAt,
              hoursRemaining,
              parentUnitId: component.parentUnitId,
            }
          : null,
        status: component?.status === 'expiring' ? 'expiring' : component ? 'occupied' : 'empty',
      };
    })
  );
});

export default router;
