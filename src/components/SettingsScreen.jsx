import { useState } from 'react';
import { T, FONTS, applyColorMode, getColorMode } from '../theme.js';
import { getPieceSet, setPieceSet } from './ChessPiece.jsx';
import sfx from '../sfx.js';

const BOARD_THEMES = [
  { id: 'slate', label: 'Ardoise',   light: '#DEE3E6', dark: '#788A94' },
  { id: 'wood',  label: 'Bois',      light: '#F0D9B5', dark: '#B58863' },
  { id: 'green', label: 'Classique', light: '#EEEED2', dark: '#769656' },
];

const PIECE_SETS = [
  { id: 'cburnett', label: 'CBurnett', desc: 'Style moderne' },
  { id: 'alpha',    label: 'Alpha',    desc: 'Style minimaliste' },
  { id: 'merida',   label: 'Merida',   desc: 'Style classique' },
];

export default function SettingsScreen({ gameState, setGameState }) {
  const [muted, setMuted] = useState(sfx.isMuted());
  const [pieceSet, setPieceSetState] = useState(getPieceSet());
  const [colorMode, setColorModeState] = useState(getColorMode());

  function toggleSound() {
    const next = !muted;
    setMuted(next);
    sfx.mute(next);
    if (!next) sfx.click();
  }

  function setTheme(id) {
    setGameState(g => ({ ...g, theme: id }));
    sfx.click();
  }

  function onPieceSet(id) {
    setPieceSet(id);
    setPieceSetState(id);
    sfx.click();
  }

  function toggleColorMode() {
    const next = colorMode === 'dark' ? 'light' : 'dark';
    applyColorMode(next);
    setColorModeState(next);
    sfx.click();
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.text, fontFamily: FONTS.sans,
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: T.textMuted, fontFamily: FONTS.mono }}>PRÉFÉRENCES</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2, letterSpacing: -0.5 }}>Réglages</div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Interface */}
        <Section title="Interface">
          <div style={{ display: 'flex', gap: 10 }}>
            {['dark', 'light'].map(mode => {
              const active = colorMode === mode;
              const isDark = mode === 'dark';
              return (
                <button
                  key={mode}
                  onClick={() => { applyColorMode(mode); setColorModeState(mode); sfx.click(); }}
                  style={{
                    flex: 1, border: `2px solid ${active ? T.accent : T.border}`,
                    borderRadius: 12, overflow: 'hidden',
                    background: active ? T.accentBg : 'transparent',
                    cursor: 'pointer', padding: 0,
                    boxShadow: active ? `0 0 0 3px ${T.accent33}` : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Mini preview */}
                  <div style={{
                    height: 40, padding: '8px 10px',
                    background: isDark ? '#0A0D12' : '#F0F4F8',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: isDark ? '#7DD87D' : '#1E7A3A' }} />
                  </div>
                  <div style={{
                    padding: '6px 4px', background: isDark ? '#141B24' : '#FFFFFF',
                    fontSize: 10, fontWeight: active ? 700 : 500,
                    color: active ? T.accent : T.textMuted,
                    fontFamily: FONTS.sans, textAlign: 'center',
                  }}>{isDark ? 'Sombre' : 'Clair'}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Sound */}
        <Section title="Audio">
          <ToggleRow
            label="Sons du jeu"
            desc="Bruitages des pièces, captures et fins de partie"
            checked={!muted}
            onToggle={toggleSound}
          />
        </Section>

        {/* Board theme */}
        <Section title="Apparence de l'échiquier">
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            {BOARD_THEMES.map(th => {
              const active = gameState.theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  style={{
                    flex: 1, border: `2px solid ${active ? T.accent : T.border}`,
                    borderRadius: 12, overflow: 'hidden',
                    background: 'transparent', cursor: 'pointer', padding: 0,
                    boxShadow: active ? `0 0 0 3px ${T.accent33}` : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    {[false, true, true, false].map((isLight, i) => (
                      <div key={i} style={{ height: 28, background: isLight ? th.light : th.dark }} />
                    ))}
                  </div>
                  <div style={{
                    padding: '6px 4px', background: T.panel,
                    fontSize: 10, fontWeight: active ? 700 : 500,
                    color: active ? T.accent : T.textMuted,
                    fontFamily: FONTS.sans, textAlign: 'center',
                  }}>{th.label}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Piece set */}
        <Section title="Apparence des pièces">
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            {PIECE_SETS.map(ps => {
              const active = pieceSet === ps.id;
              return (
                <button
                  key={ps.id}
                  onClick={() => onPieceSet(ps.id)}
                  style={{
                    flex: 1, border: `2px solid ${active ? T.accent : T.border}`,
                    borderRadius: 12, overflow: 'hidden',
                    background: active ? T.accentBg : T.glass,
                    cursor: 'pointer', padding: '10px 6px 8px',
                    boxShadow: active ? `0 0 0 3px ${T.accent33}` : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', gap: 2 }}>
                    <img src={`pieces/${ps.id}/wK.svg`} width={32} height={32}
                      style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
                      alt="" draggable={false} />
                    <img src={`pieces/${ps.id}/bQ.svg`} width={32} height={32}
                      style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
                      alt="" draggable={false} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? T.accent : T.textMuted, fontFamily: FONTS.sans, textAlign: 'center' }}>{ps.label}</div>
                  <div style={{ fontSize: 9, color: T.textMuted, fontFamily: FONTS.sans, textAlign: 'center' }}>{ps.desc}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* About */}
        <Section title="À propos">
          <div style={{ padding: '14px', background: T.glass, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AboutRow label="Version" value="1.0.0" />
            <AboutRow label="Moteur IA" value="Stockfish 18 Lite" />
            <AboutRow label="Pièces" value="cburnett / alpha / merida" />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${T.border}`,
        fontSize: 9, letterSpacing: 2, color: T.textMuted, fontFamily: FONTS.mono, fontWeight: 700,
      }}>{title.toUpperCase()}</div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{label}</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{desc}</div>
      </div>
      <button onClick={onToggle} style={{
        width: 46, height: 26, borderRadius: 13,
        background: checked ? T.accent : T.glassMid,
        border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 20, height: 20, borderRadius: 10,
          background: '#fff', transition: 'left 0.2s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }} />
      </button>
    </div>
  );
}

function AboutRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: T.textMuted }}>{label}</span>
      <span style={{ fontSize: 12, color: T.textDim, fontFamily: FONTS.mono }}>{value}</span>
    </div>
  );
}
