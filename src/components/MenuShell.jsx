import { T, FONTS } from '../theme.js';

function HomeIcon({ active }) {
  const c = active ? T.accent : T.textMuted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12L12 2l10 10" />
      <path d="M4 10v10a1 1 0 001 1h5v-5h4v5h5a1 1 0 001-1V10" />
    </svg>
  );
}

function TrophyIcon({ active }) {
  const c = active ? T.accent : T.textMuted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v8a6 6 0 01-12 0V3z" />
      <path d="M6 3H2v3a4 4 0 004 4" />
      <path d="M18 3h4v3a4 4 0 01-4 4" />
      <line x1="12" y1="15" x2="12" y2="19" />
      <line x1="8" y1="19" x2="16" y2="19" />
    </svg>
  );
}

function PersonIcon({ active }) {
  const c = active ? T.accent : T.textMuted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function GearIcon({ active }) {
  const c = active ? T.accent : T.textMuted;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

const TABS = [
  { id: 'home',      label: 'Accueil',  Icon: HomeIcon },
  { id: 'challenge', label: 'Défis',    Icon: TrophyIcon },
  { id: 'profile',   label: 'Profil',   Icon: PersonIcon },
  { id: 'settings',  label: 'Réglages', Icon: GearIcon },
];

export default function MenuShell({ activeTab, setActiveTab, children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: T.bg,
    }}>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {children}
      </div>

      <nav style={{
        display: 'flex',
        background: T.panel,
        borderTop: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1, border: 'none',
                background: active ? `${T.accentBg}` : 'transparent',
                padding: '10px 4px 12px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                transition: 'background 0.15s ease',
                borderTop: `2px solid ${active ? T.accent : 'transparent'}`,
              }}
            >
              <Icon active={active} />
              <span style={{
                fontSize: 10, fontFamily: FONTS.sans,
                fontWeight: active ? 700 : 500,
                color: active ? T.accent : T.textMuted,
                letterSpacing: 0.3,
              }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
