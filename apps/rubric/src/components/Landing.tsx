import { useState } from 'react';
import { SignInButton } from '@clerk/react';
import { isValidClerkKey } from '@/lib/clerk-utils';
import {
  ShieldAlert, ShieldCheck, Activity, Radio, Building2, Network,
  Lock, KeyRound, IdCard, LogIn, Link2, Database, HeartPulse,
  Hospital, ChevronRight, Siren, CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldAlert,
    title: 'National Deficit Matrix',
    desc: 'Real-time blood stock tracking across Princess Marina, Nyangabgwe, and all 15 Botswana health districts.',
    tone: '#ef7482',
  },
  {
    icon: ShieldCheck,
    title: 'Sovereign ID Verification',
    desc: 'Review national Omang & donor documents with 1-click Level 2 cryptographic identity clearance.',
    tone: '#39d6e5',
  },
  {
    icon: Siren,
    title: 'Emergency Shortage Dispatch',
    desc: 'Broadcast priority shortage signals instantly to Scyther donors and Torrent transit couriers.',
    tone: '#e9b957',
  },
];

const ECOSYSTEM = [
  { icon: Database, label: 'Bloodchain Ledger', desc: 'Immutable vein-to-vein provenance', url: 'https://bloodchain.life#ledger' },
  { icon: ShieldAlert, label: 'Rubric National Ops', desc: 'You are here — command situation room', active: true, url: 'https://bloodchain.life' },
  { icon: Hospital, label: 'Aegis Clinical', desc: 'Doctor ward & STAT ordering portal', url: 'http://localhost:5177' },
  { icon: HeartPulse, label: 'Scyther Donors', desc: 'Donor mobile identity & emergency alerts', url: 'https://bloodchain.life' },
];

export default function Landing({ onLogin }: { onLogin: (roleName: string) => void }) {
  const [officerId, setOfficerId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSignIn = (demoRole?: string) => {
    if (demoRole) {
      onLogin(demoRole);
      return;
    }
    if (!officerId.trim() || accessKey.length < 4) {
      setError(true);
      setTimeout(() => setError(false), 900);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      onLogin(`Officer ${officerId.trim().toUpperCase()}`);
    }, 500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060912', color: '#e6edf3', padding: '32px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#ef7482', display: 'grid', placeItems: 'center', color: '#060912', fontWeight: 900, boxShadow: '0 0 20px rgba(239,116,130,0.35)' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.05em', color: '#ffffff' }}>
                RUBRIC <span style={{ color: '#ef7482' }}>SITUATION ROOM</span>
              </div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#8899a6', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                National Blood Supply Command & Oversight
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
              background: 'rgba(57, 214, 229, 0.1)',
              border: '1px solid rgba(57, 214, 229, 0.35)',
              color: '#39d6e5',
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <Link2 size={13} /> Part of the Bloodchain ecosystem · bloodchain.life
          </a>
        </header>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 36, alignItems: 'start' }}>
          {/* Left: Value Prop */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,116,130,0.15)', color: '#ef7482', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', marginBottom: 16 }}>
              <Radio size={12} className="animate-pulse" /> SOVEREIGN OVERSIGHT · NATIONAL OPS
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.03em' }}>
              National oversight.<br />
              <span style={{ background: 'linear-gradient(90deg, #ef7482, #39d6e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sovereign precision.
              </span>
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#9fb1c1', marginBottom: 28, maxWidth: 540 }}>
              Rubric is the national command center for the <strong>Bloodchain</strong> ecosystem in Botswana. Swallowing and superseding legacy monitoring (Vigil), Rubric unifies the National Deficit Matrix, donor verification queues, emergency shortage broadcasts, and clinical CMS into a single real-time operational situation room.
            </p>

            {/* Feature Cards */}
            <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 12, background: '#0d131f', border: '1px solid #1a2638' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${feat.tone}20`, color: feat.tone, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{feat.title}</h4>
                      <p style={{ margin: 0, fontSize: 11, color: '#8899a6', lineHeight: 1.4 }}>{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ecosystem Strip */}
            <div style={{ padding: 18, borderRadius: 14, background: '#0d131f', border: '1px solid #1a2638' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8899a6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="#39d6e5" /> Unified Bloodchain Ecosystem
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                {ECOSYSTEM.map((eco, i) => {
                  const Icon = eco.icon;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background: eco.active ? 'rgba(239,116,130,0.12)' : '#070b14',
                        border: eco.active ? '1px solid rgba(239,116,130,0.4)' : '1px solid #162130',
                        textAlign: 'center',
                      }}
                    >
                      <Icon size={16} color={eco.active ? '#ef7482' : '#39d6e5'} style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: eco.active ? '#ef7482' : '#ffffff' }}>{eco.label}</div>
                      <div style={{ fontSize: 9, color: '#8899a6', marginTop: 2 }}>{eco.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Auth / Pilot Card */}
          <div style={{ background: '#0d131f', border: '1px solid #1a2638', borderRadius: 16, padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(57,214,229,0.12)', color: '#39d6e5', display: 'grid', placeItems: 'center' }}>
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>National Officer Sign-In</h3>
                <p style={{ margin: 0, fontSize: 11, color: '#8899a6' }}>Ministry of Health & NBTS Credentials</p>
              </div>
            </div>

            {isValidClerkKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) && (
              <div style={{ marginBottom: 20 }}>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      background: 'linear-gradient(90deg, #39d6e5, #0ea5e9)',
                      color: '#060912',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(57,214,229,0.25)',
                    }}
                  >
                    <Lock size={16} /> SIGN IN WITH CLERK ACCOUNT
                  </button>
                </SignInButton>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 6px' }}>
                  <div style={{ height: 1, flex: 1, background: '#1a2638' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8899a6' }}>
                    or staff passcode
                  </span>
                  <div style={{ height: 1, flex: 1, background: '#1a2638' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8899a6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Officer Staff ID
                </label>
                <div style={{ position: 'relative' }}>
                  <IdCard size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#8899a6' }} />
                  <input
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="e.g. MOH-BW-0842"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#070b14',
                      border: `1px solid ${error && !officerId ? '#ef7482' : '#1a2638'}`,
                      borderRadius: 8,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8899a6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Access Passcode
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#8899a6' }} />
                  <input
                    type="password"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#070b14',
                      border: `1px solid ${error && !accessKey ? '#ef7482' : '#1a2638'}`,
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
                background: '#ef7482',
                color: '#060912',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(239,116,130,0.3)',
              }}
            >
              <LogIn size={16} /> {busy ? 'AUTHENTICATING…' : 'SIGN IN TO SITUATION ROOM'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ height: 1, flex: 1, background: '#1a2638' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8899a6' }}>
                Pilot Programme
              </span>
              <div style={{ height: 1, flex: 1, background: '#1a2638' }} />
            </div>

            {/* Preset Roles */}
            <div style={{ display: 'grid', gap: 8 }}>
              <button
                onClick={() => handleSignIn('National Controller (Dr. K. Moloi)')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(57, 214, 229, 0.12)',
                  border: '1px solid rgba(57, 214, 229, 0.4)',
                  color: '#39d6e5',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>🏛️ Enter as National Blood Controller</span>
                <ChevronRight size={15} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  onClick={() => handleSignIn('Verification Officer (M. Seretse)')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#070b14',
                    border: '1px solid #1a2638',
                    color: '#e6edf3',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🛡️ Verification Officer
                </button>
                <button
                  onClick={() => handleSignIn('Dispatch Lead (T. Nthomiwa)')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#070b14',
                    border: '1px solid #1a2638',
                    color: '#e6edf3',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🚨 Regional Dispatch Lead
                </button>
              </div>
            </div>

            <p style={{ margin: '18px 0 0', fontSize: 10, color: '#8899a6', textAlign: 'center', lineHeight: 1.4 }}>
              Protected under Republic of Botswana Health Regulations. All dispatch broadcasts and verifications are signed to the Hyperledger Fabric ledger.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #1a2638', textAlign: 'center', fontSize: 11, color: '#8899a6' }}>
          Rubric National Ops · a <a href="https://bloodchain.life" target="_blank" rel="noopener noreferrer" style={{ color: '#39d6e5', textDecoration: 'underline' }}>Bloodchain platform</a> · Ministry of Health, Botswana
        </footer>
      </div>
    </div>
  );
}
