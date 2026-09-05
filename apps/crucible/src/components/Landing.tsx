import { useState } from 'react';
import {
  FlaskConical, ShieldCheck, Beaker, Snowflake,
  Lock, KeyRound, IdCard, LogIn, Link2, Database,
  Hospital, ChevronRight, Activity, Truck, HeartHandshake,
} from 'lucide-react';

export interface LabOperatorProfile {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  title: string;
  idCode: string;
  labStation: string;
  station: string;
  shift: string;
  specialty: string;
  clearanceLevel: string;
  qcScore: string;
  avatarColor: string;
}

export const LAB_PROFILES: Record<string, LabOperatorProfile> = {
  tebogo: {
    id: 'tebogo',
    name: 'Tebogo Modise',
    shortName: 'Tebogo',
    initials: 'TM',
    title: 'Senior Serologist & Viral Screening Lead',
    idCode: 'LB-482',
    labStation: 'Princess Marina Central Transfusion Lab (Zone A)',
    station: 'Princess Marina Central Transfusion Lab (Zone A)',
    shift: '07:00 – 19:00 CAT (Active)',
    specialty: 'ABO/RhD & Chemiluminescence Immunoassay (CLIA)',
    clearanceLevel: 'ISO 15189 Master Clearance',
    qcScore: '99.9% Viral Detection Fidelity',
    avatarColor: '#0e8490',
  },
  naledi: {
    id: 'naledi',
    name: 'Naledi Sechele',
    shortName: 'Naledi',
    initials: 'NS',
    title: 'Component Fractionation Specialist',
    idCode: 'LB-209',
    labStation: 'NBTS National Fractionation Cleanroom (Suite 3)',
    station: 'NBTS National Fractionation Cleanroom (Suite 3)',
    shift: '06:00 – 18:00 CAT (Active)',
    specialty: 'Centrifugal PRBC / FFP / Cryo Separation',
    clearanceLevel: 'Sterile Processing Level 3',
    qcScore: '100% Component Yield Compliance',
    avatarColor: '#166534',
  },
  boipelo: {
    id: 'boipelo',
    name: 'Dr. Boipelo Khama',
    shortName: 'Dr. Khama',
    initials: 'BK',
    title: 'Director of Blood Bank Quality & Transfusion Safety',
    idCode: 'LB-101',
    labStation: 'Botswana National Blood Transfusion Service (HQ)',
    station: 'Botswana National Blood Transfusion Service (HQ)',
    shift: 'General Duty & On-Call Director',
    specialty: 'Immunohematology & Adverse Reaction Audit',
    clearanceLevel: 'National Medical Director Clearance',
    qcScore: '100% Release Verification Audit',
    avatarColor: '#9333ea',
  },
};

export function resolveLabProfile(roleInput?: string | null): LabOperatorProfile {
  if (!roleInput || typeof roleInput !== 'string') {
    return LAB_PROFILES.tebogo;
  }
  const lower = roleInput.toLowerCase();
  if (lower.includes('naledi')) return LAB_PROFILES.naledi;
  if (lower.includes('boipelo') || lower.includes('khama')) return LAB_PROFILES.boipelo;
  if (lower.includes('tebogo')) return LAB_PROFILES.tebogo;

  const clean = roleInput.replace(/^Technologist\s+/i, '').split('(')[0]?.trim() || 'Lab Technologist';
  const initials = clean.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'LT';
  const stationStr = 'Regional Blood Bank Processing Unit';
  return {
    id: 'custom',
    name: clean,
    shortName: clean.split(' ')[0] || 'Technologist',
    initials,
    title: 'Certified Medical Laboratory Scientist',
    idCode: 'LB-900',
    labStation: stationStr,
    station: stationStr,
    shift: 'Shift 02 · Active Duty',
    specialty: 'Clinical Serology & Storage',
    clearanceLevel: 'Standard Lab Clearance',
    qcScore: '99.7% Quality Assurance',
    avatarColor: '#0e8490',
  };
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Serology & Viral Screening Gate',
    desc: 'Automated barrier protocol: HIV 1/2, HBsAg, HCV, VDRL, and forward/reverse ABO typing before unit release.',
    tone: '#0e8490',
  },
  {
    icon: Beaker,
    title: 'Component Fractionation Engine',
    desc: 'One-click centrifugal separation of Whole Blood bags into Packed RBCs, Fresh Frozen Plasma, and Platelet pools.',
    tone: '#ef7459',
  },
  {
    icon: Snowflake,
    title: 'Cold Vault Matrix (A1–D4)',
    desc: 'Continuous -25°C to 4°C zone telemetry, shelf-by-shelf capacity mapping, and real-time 48h expiry watchlists.',
    tone: '#69d8e0',
  },
];

const ECOSYSTEM = [
  { icon: HeartHandshake, label: 'Scyther Mobile', desc: 'Donor intake & booking', url: 'https://bloodchain-scyther.onrender.com' },
  { icon: FlaskConical, label: 'Crucible Lab', desc: 'You are here — lab & vault', active: true, url: 'https://bloodchain.life' },
  { icon: Hospital, label: 'Aegis Clinical', desc: 'Hospital STAT orders', url: 'https://bloodchain-aegis.onrender.com' },
  { icon: Truck, label: 'Torrent Transit', desc: 'Cold-chain dispatch fleet', url: 'https://bloodchain-torrent-desktop.onrender.com' },
  { icon: Activity, label: 'Rubric Ops', desc: 'National deficit situation room', url: 'https://bloodchain-rubric.onrender.com' },
];

export default function Landing({ onLogin }: { onLogin: (operatorName: string) => void }) {
  const [techId, setTechId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSignIn = (demoRole?: string) => {
    if (demoRole) {
      onLogin(demoRole);
      return;
    }
    if (!techId.trim() || pin.length < 4) {
      setError(true);
      setTimeout(() => setError(false), 900);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      onLogin(`Technologist ${techId.trim().toUpperCase()}`);
    }, 500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1618', color: '#e6f4f1', padding: '32px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#0e8490', display: 'grid', placeItems: 'center', color: '#ffffff', fontWeight: 900, boxShadow: '4px 4px 0 rgba(105, 216, 224, 0.38)' }}>
              <FlaskConical size={24} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                CRUCIBLE <span style={{ color: '#69d8e0' }}>LAB</span>
              </div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#88a8a4', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Serology Screening, Fractionation & Cold Vault
              </div>
            </div>
          </div>

          <a
            href="https://bloodchain.life"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 20,
              background: 'rgba(105, 216, 224, 0.1)',
              border: '1px solid rgba(105, 216, 224, 0.35)',
              color: '#69d8e0',
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Link2 size={13} /> Part of the Bloodchain ecosystem · bloodchain.life
          </a>
        </header>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 36, alignItems: 'start' }}>
          {/* Left: Value Prop */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(14,132,144,0.2)', color: '#69d8e0', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', marginBottom: 16 }}>
              <FlaskConical size={12} className="animate-pulse" /> ISO 15189 TESTING & BLOOD BANK PROTOCOLS
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 16px', letterSpacing: '-0.04em' }}>
              Screen the blood.<br />
              <span style={{ color: '#69d8e0' }}>
                Release the components.
              </span>
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#88a8a4', marginBottom: 28, maxWidth: 540 }}>
              Crucible Lab is the laboratory processing portal of the <strong>Bloodchain</strong> ecosystem. Providing medical technologists with dense, operator-first workflows for whole blood intake, viral screening gates, high-yield component fractionation, and cold vault inventory security.
            </p>

            {/* Feature Cards */}
            <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 12, background: '#122629', border: '1px solid #1f3d42' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${feat.tone}20`, color: feat.tone, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{feat.title}</h4>
                      <p style={{ margin: 0, fontSize: 11, color: '#88a8a4', lineHeight: 1.4 }}>{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ecosystem Strip */}
            <div style={{ padding: 18, borderRadius: 14, background: '#122629', border: '1px solid #1f3d42' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#88a8a4', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={14} color="#69d8e0" /> Vein-to-Vein Bloodchain Integration
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                {ECOSYSTEM.map((eco, i) => {
                  const Icon = eco.icon;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background: eco.active ? 'rgba(14,132,144,0.25)' : '#0a1618',
                        border: eco.active ? '1px solid rgba(105,216,224,0.6)' : '1px solid #1f3d42',
                        textAlign: 'center',
                      }}
                    >
                      <Icon size={16} color={eco.active ? '#69d8e0' : '#88a8a4'} style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: eco.active ? '#69d8e0' : '#ffffff' }}>{eco.label}</div>
                      <div style={{ fontSize: 9, color: '#88a8a4', marginTop: 2 }}>{eco.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Auth / Demo Card */}
          <div style={{ background: '#122629', border: '1px solid #1f3d42', borderRadius: 16, padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(105,216,224,0.12)', color: '#69d8e0', display: 'grid', placeItems: 'center' }}>
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Laboratory Sign-In</h3>
                <p style={{ margin: 0, fontSize: 11, color: '#88a8a4' }}>Medical Technologist Authentication</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#88a8a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Technologist ID / License #
                </label>
                <div style={{ position: 'relative' }}>
                  <IdCard size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#88a8a4' }} />
                  <input
                    type="text"
                    value={techId}
                    onChange={(e) => setTechId(e.target.value)}
                    placeholder="e.g. LB-482 (Tebogo Modise)"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#0a1618',
                      border: `1px solid ${error && !techId ? '#ef7459' : '#1f3d42'}`,
                      borderRadius: 8,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#88a8a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Security PIN / Token
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#88a8a4' }} />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#0a1618',
                      border: `1px solid ${error && !pin ? '#ef7459' : '#1f3d42'}`,
                      borderRadius: 8,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSignIn()}
              disabled={busy}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                background: '#0e8490',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '3px 3px 0 #08565e',
              }}
            >
              <LogIn size={16} /> {busy ? 'VERIFYING LAB CLEARANCE…' : 'SIGN IN TO LAB WORKSTATION'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ height: 1, flex: 1, background: '#1f3d42' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#88a8a4' }}>
                Pilot Programme
              </span>
              <div style={{ height: 1, flex: 1, background: '#1f3d42' }} />
            </div>

            {/* Preset Roles */}
            <div style={{ display: 'grid', gap: 8 }}>
              <button
                onClick={() => handleSignIn('Tebogo Modise (Senior Serologist · LB-482)')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(105, 216, 224, 0.12)',
                  border: '1px solid rgba(105, 216, 224, 0.4)',
                  color: '#69d8e0',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>🔬 Enter as Tebogo Modise (Serology Lead)</span>
                <ChevronRight size={15} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  onClick={() => handleSignIn('Naledi Sechele (Fractionation · LB-209)')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#0a1618',
                    border: '1px solid #1f3d42',
                    color: '#e6f4f1',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🧪 Naledi S. (Cleanroom)
                </button>
                <button
                  onClick={() => handleSignIn('Dr. Boipelo Khama (Director · LB-101)')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#0a1618',
                    border: '1px solid #1f3d42',
                    color: '#e6f4f1',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  📋 Dr. Khama (Director)
                </button>
              </div>
            </div>

            <p style={{ margin: '18px 0 0', fontSize: 10, color: '#88a8a4', textAlign: 'center', lineHeight: 1.4 }}>
              Zero-tolerance viral screening safety active. Every fractionated bag is cryptographic signed onto the ledger.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #1f3d42', textAlign: 'center', fontSize: 11, color: '#88a8a4' }}>
          Crucible Lab · a <a href="https://bloodchain.life" target="_blank" rel="noopener noreferrer" style={{ color: '#69d8e0', textDecoration: 'underline' }}>Bloodchain platform</a> · National Transfusion Laboratory Network, Botswana
        </footer>
      </div>
    </div>
  );
}
