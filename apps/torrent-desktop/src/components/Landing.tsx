import { useState } from 'react';
import {
  Droplets, Thermometer, Truck, ShieldCheck,
  Lock, KeyRound, IdCard, LogIn, Link2, Database,
  Hospital, ChevronRight, Navigation, MapPin, Activity,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Thermometer,
    title: 'Cold-Chain IoT Telemetry',
    desc: 'Continuous Sensitech wireless BLE temperature monitoring inside 2°C to 8°C safety bands with hold alarms.',
    tone: '#0e8490',
  },
  {
    icon: Truck,
    title: 'National Corridor Dispatch',
    desc: 'Live tracking across Gaborone, Francistown, Maun, and rural healthcare corridors with automated ETAs.',
    tone: '#ef7459',
  },
  {
    icon: ShieldCheck,
    title: 'Chain of Custody Ledger',
    desc: 'Tamper-proof cryptographic barcode handoffs from central blood bank release to hospital trauma receiving.',
    tone: '#69d8e0',
  },
];

const ECOSYSTEM = [
  { icon: Database, label: 'Bloodchain Ledger', desc: 'Immutable vein-to-vein provenance', url: 'https://bloodchain.life#ledger' },
  { icon: Truck, label: 'Torrent Transit', desc: 'You are here — logistics command', active: true, url: 'https://bloodchain.life' },
  { icon: Hospital, label: 'Aegis Clinical', desc: 'Doctor ward & STAT ordering portal', url: 'http://localhost:5177' },
  { icon: Activity, label: 'Rubric National Ops', desc: 'National deficit situation room', url: 'http://localhost:5176' },
];

export default function Landing({ onLogin }: { onLogin: (operatorName: string) => void }) {
  const [driverId, setDriverId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSignIn = (demoRole?: string) => {
    if (demoRole) {
      onLogin(demoRole);
      return;
    }
    if (!driverId.trim() || pin.length < 4) {
      setError(true);
      setTimeout(() => setError(false), 900);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      onLogin(`Dispatcher ${driverId.trim().toUpperCase()}`);
    }, 500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#10232d', color: '#e8f0eb', padding: '32px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#ef7459', display: 'grid', placeItems: 'center', color: '#10232d', fontWeight: 900, boxShadow: '4px 4px 0 rgba(105, 216, 224, 0.38)' }}>
              <Droplets size={24} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                TORRENT <span style={{ color: '#ef7459' }}>TRANSIT</span>
              </div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#9db4b6', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Cold-Chain Command & Logistics Fleet
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,116,89,0.15)', color: '#ef7459', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', marginBottom: 16 }}>
              <Navigation size={12} className="animate-pulse" /> BOTSWANA NATIONAL TRANSIT CORRIDORS
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 16px', letterSpacing: '-0.04em' }}>
              Move blood.<br />
              <span style={{ color: '#69d8e0' }}>
                Keep trust cold.
              </span>
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#9db4b6', marginBottom: 28, maxWidth: 540 }}>
              Torrent Transit is the cold-chain logistics platform of the <strong>Bloodchain</strong> ecosystem. Providing real-time cooler telemetry, route progression, custody sign-offs, and multi-district emergency dispatching to guarantee that life-saving units reach patients safely.
            </p>

            {/* Feature Cards */}
            <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 12, background: '#162f39', border: '1px solid #29424b' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${feat.tone}20`, color: feat.tone, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{feat.title}</h4>
                      <p style={{ margin: 0, fontSize: 11, color: '#9db4b6', lineHeight: 1.4 }}>{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ecosystem Strip */}
            <div style={{ padding: 18, borderRadius: 14, background: '#162f39', border: '1px solid #29424b' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#86a1a3', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="#69d8e0" /> Unified Bloodchain Ecosystem
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
                        background: eco.active ? 'rgba(239,116,89,0.15)' : '#10232d',
                        border: eco.active ? '1px solid rgba(239,116,89,0.5)' : '1px solid #29424b',
                        textAlign: 'center',
                      }}
                    >
                      <Icon size={16} color={eco.active ? '#ef7459' : '#69d8e0'} style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: eco.active ? '#ef7459' : '#ffffff' }}>{eco.label}</div>
                      <div style={{ fontSize: 9, color: '#9db4b6', marginTop: 2 }}>{eco.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Auth / Demo Card */}
          <div style={{ background: '#162f39', border: '1px solid #29424b', borderRadius: 16, padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(105,216,224,0.12)', color: '#69d8e0', display: 'grid', placeItems: 'center' }}>
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Transit Fleet Sign-In</h3>
                <p style={{ margin: 0, fontSize: 11, color: '#9db4b6' }}>Dispatcher & Courier Authentication</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9db4b6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Courier / Dispatcher ID
                </label>
                <div style={{ position: 'relative' }}>
                  <IdCard size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9db4b6' }} />
                  <input
                    type="text"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    placeholder="e.g. TR-104 (Amantle Kgosi)"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#10232d',
                      border: `1px solid ${error && !driverId ? '#ef7459' : '#29424b'}`,
                      borderRadius: 8,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9db4b6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Security PIN
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9db4b6' }} />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#10232d',
                      border: `1px solid ${error && !pin ? '#ef7459' : '#29424b'}`,
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
                background: '#ef7459',
                color: '#10232d',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '3px 3px 0 #c2533d',
              }}
            >
              <LogIn size={16} /> {busy ? 'VERIFYING FLEET…' : 'SIGN IN TO DISPATCH DESK'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ height: 1, flex: 1, background: '#29424b' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9db4b6' }}>
                Pilot Programme
              </span>
              <div style={{ height: 1, flex: 1, background: '#29424b' }} />
            </div>

            {/* Preset Roles */}
            <div style={{ display: 'grid', gap: 8 }}>
              <button
                onClick={() => handleSignIn('Amantle Kgosi (Senior Dispatcher · TR-104)')}
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
                <span>🚚 Enter as Amantle Kgosi (Dispatch Control)</span>
                <ChevronRight size={15} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  onClick={() => handleSignIn('Kagiso Moloi (Northern Fleet · TR-202)')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#10232d',
                    border: '1px solid #29424b',
                    color: '#e8f0eb',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  📍 Kagiso M. (Francistown)
                </button>
                <button
                  onClick={() => handleSignIn('Thabo Dintwa (Delta Express · TR-305)')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#10232d',
                    border: '1px solid #29424b',
                    color: '#e8f0eb',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🚁 Thabo D. (Maun Hub)
                </button>
              </div>
            </div>

            <p style={{ margin: '18px 0 0', fontSize: 10, color: '#9db4b6', textAlign: 'center', lineHeight: 1.4 }}>
              Cold-chain compliance protocols active. Cooler seals & Sensitech beacons logged continuously to the ledger.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #29424b', textAlign: 'center', fontSize: 11, color: '#9db4b6' }}>
          Torrent Transit · a <a href="https://bloodchain.life" target="_blank" rel="noopener noreferrer" style={{ color: '#69d8e0', textDecoration: 'underline' }}>Bloodchain platform</a> · Cold-Chain Logistics Command, Botswana
        </footer>
      </div>
    </div>
  );
}
