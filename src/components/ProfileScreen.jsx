import { useState } from 'react';
import { T, FONTS } from '../theme.js';
import { LEVELS } from '../levels.js';
import ChessPiece from './ChessPiece.jsx';

export default function ProfileScreen({ profile, setProfile, gameState }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.name);

  const { gamesPlayed, wins, losses, draws } = profile;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  const levelsCompleted = profile.levelsCompleted.length;

  function saveName() {
    const name = draft.trim() || 'Joueur';
    setProfile(p => ({ ...p, name }));
    setEditing(false);
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
        <div style={{ fontSize: 9, letterSpacing: 3, color: T.textMuted, fontFamily: FONTS.mono }}>COMPTE</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2, letterSpacing: -0.5 }}>Profil</div>
      </div>

      {/* Avatar + name */}
      <div style={{
        margin: '16px 16px 0',
        padding: '20px 16px',
        background: T.panel,
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 16,
        flexShrink: 0,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: `linear-gradient(135deg, ${T.accentBg}, ${T.accent18})`,
          border: `2px solid ${T.accent33}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ChessPiece type="king" color="w" size={40} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus
                maxLength={20}
                style={{
                  flex: 1, background: T.bg, border: `1px solid ${T.accent}`,
                  borderRadius: 8, padding: '6px 10px',
                  color: T.text, fontSize: 15, fontWeight: 700, fontFamily: FONTS.sans,
                  outline: 'none',
                }}
              />
              <button onClick={saveName} style={{
                background: T.accent, border: 'none', borderRadius: 8,
                padding: '6px 12px', color: T.accentText, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 13,
              }}>OK</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{profile.name}</div>
              <button onClick={() => { setDraft(profile.name); setEditing(true); }} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: T.textMuted, fontSize: 12, padding: '2px 6px',
                fontFamily: FONTS.sans,
              }}>Modifier</button>
            </div>
          )}
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
            Niveau {LEVELS[Math.min(gameState.levelIdx, LEVELS.length - 1)].number} •
            <span style={{ color: T.gold, fontFamily: FONTS.mono, marginLeft: 4 }}>${gameState.budget}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        margin: '12px 16px 0',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 10, flexShrink: 0,
      }}>
        <StatCard label="Parties jouées" value={gamesPlayed} color={T.text} />
        <StatCard label="Victoires" value={wins} color={T.accent} />
        <StatCard label="Défaites" value={losses} color={T.danger} />
        <StatCard label="Nulles" value={draws} color={T.gold} />
      </div>

      {/* Win rate */}
      {gamesPlayed > 0 && (
        <div style={{
          margin: '12px 16px 0',
          padding: '16px',
          background: T.panel, borderRadius: 14,
          border: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Taux de victoire</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.accent, fontFamily: FONTS.mono }}>{winRate}%</div>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${winRate}%`,
              background: `linear-gradient(90deg, ${T.accent}, ${T.accentHi})`,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <RateBar label="V" value={wins} total={gamesPlayed} color={T.accent} />
            <RateBar label="N" value={draws} total={gamesPlayed} color={T.gold} />
            <RateBar label="D" value={losses} total={gamesPlayed} color={T.danger} />
          </div>
        </div>
      )}

      {/* Level progress */}
      <div style={{
        margin: '12px 16px 20px',
        padding: '16px',
        background: T.panel, borderRadius: 14,
        border: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>Progression</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {LEVELS.map((level, idx) => {
            const done = profile.levelsCompleted.includes(idx);
            const unlocked = idx === 0 || profile.levelsCompleted.includes(idx - 1);
            return (
              <div key={idx} style={{
                flex: 1, padding: '10px 6px',
                background: done ? T.accent18 : T.glass,
                border: `1px solid ${done ? T.accent44 : T.border}`,
                borderRadius: 10,
                textAlign: 'center', opacity: unlocked ? 1 : 0.35,
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <ChessPiece type="king" color={done ? 'w' : 'b'} size={22} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: done ? T.accent : T.textMuted, fontFamily: FONTS.mono }}>
                  Niv. {level.number}
                </div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 1 }}>
                  {done ? 'Réussi' : unlocked ? 'Débloqué' : 'Verrouillé'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      padding: '14px',
      background: T.panel, borderRadius: 12,
      border: `1px solid ${T.border}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: FONTS.mono, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function RateBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4,
        background: color + '22', border: `1px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color, fontFamily: FONTS.mono,
      }}>{label}</div>
      <span style={{ fontSize: 11, color: T.textDim, fontFamily: FONTS.mono }}>{pct}%</span>
    </div>
  );
}
