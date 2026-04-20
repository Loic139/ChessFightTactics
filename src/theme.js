// All colors reference CSS custom properties — set by applyColorMode()
export const T = {
  bg:        'var(--t-bg)',
  panel:     'var(--t-panel)',
  panel2:    'var(--t-panel2)',
  border:    'var(--t-border)',
  borderHi:  'var(--t-borderHi)',
  text:      'var(--t-text)',
  textDim:   'var(--t-textDim)',
  textMuted: 'var(--t-textMuted)',
  accent:    'var(--t-accent)',
  accentHi:  'var(--t-accentHi)',
  accentBg:  'var(--t-accentBg)',
  accentText:'var(--t-accentText)',
  gold:      'var(--t-gold)',
  danger:    'var(--t-danger)',
  // Alpha variants (replaces "${T.accent}18" string patterns)
  accent18:  'var(--t-accent18)',
  accent33:  'var(--t-accent33)',
  accent44:  'var(--t-accent44)',
  gold18:    'var(--t-gold18)',
  gold33:    'var(--t-gold33)',
  gold44:    'var(--t-gold44)',
  danger18:  'var(--t-danger18)',
  danger33:  'var(--t-danger33)',
  danger44:  'var(--t-danger44)',
  danger55:  'var(--t-danger55)',
  // Neutral overlays (theme-aware, replaces rgba(255,255,255,0.04))
  glass:     'var(--t-glass)',
  glassMid:  'var(--t-glassMid)',
};

export const FONTS = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const DARK = {
  bg: '#0A0D12', panel: '#141B24', panel2: '#1C2734',
  border: 'rgba(255,255,255,0.1)', borderHi: 'rgba(255,255,255,0.2)',
  text: '#E8ECF2', textDim: 'rgba(232,236,242,0.6)', textMuted: 'rgba(232,236,242,0.33)',
  accent: '#7DD87D', accentHi: '#9FFFAA', accentBg: 'rgba(125,216,125,0.08)', accentText: '#0B1A0B',
  gold: '#E8B55C', danger: '#E85C5C',
  accent18: 'rgba(125,216,125,0.09)', accent33: 'rgba(125,216,125,0.2)', accent44: 'rgba(125,216,125,0.27)',
  gold18: 'rgba(232,181,92,0.09)',    gold33:   'rgba(232,181,92,0.2)',   gold44:   'rgba(232,181,92,0.27)',
  danger18: 'rgba(232,92,92,0.09)',   danger33: 'rgba(232,92,92,0.2)',    danger44: 'rgba(232,92,92,0.27)', danger55: 'rgba(232,92,92,0.33)',
  glass: 'rgba(255,255,255,0.04)', glassMid: 'rgba(255,255,255,0.08)',
};

const LIGHT = {
  bg: '#F0F4F8', panel: '#FFFFFF', panel2: '#E4EAF2',
  border: 'rgba(0,0,0,0.1)', borderHi: 'rgba(0,0,0,0.2)',
  text: '#111827', textDim: 'rgba(17,24,39,0.65)', textMuted: 'rgba(17,24,39,0.4)',
  accent: '#1E7A3A', accentHi: '#279E4A', accentBg: 'rgba(30,122,58,0.08)', accentText: '#FFFFFF',
  gold: '#9C6614', danger: '#C42B2B',
  accent18: 'rgba(30,122,58,0.09)',  accent33: 'rgba(30,122,58,0.18)',  accent44: 'rgba(30,122,58,0.25)',
  gold18: 'rgba(156,102,20,0.09)',   gold33:   'rgba(156,102,20,0.18)', gold44:   'rgba(156,102,20,0.25)',
  danger18: 'rgba(196,43,43,0.09)',  danger33: 'rgba(196,43,43,0.18)',  danger44: 'rgba(196,43,43,0.25)', danger55: 'rgba(196,43,43,0.33)',
  glass: 'rgba(0,0,0,0.04)', glassMid: 'rgba(0,0,0,0.07)',
};

export function getColorMode() {
  try { return localStorage.getItem('cft-color-mode') || 'dark'; } catch { return 'dark'; }
}

export function applyColorMode(mode) {
  const colors = mode === 'light' ? LIGHT : DARK;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(colors)) root.style.setProperty(`--t-${k}`, v);
  try { localStorage.setItem('cft-color-mode', mode); } catch (_) {}
}

// Apply immediately on module load so CSS vars are set before first render
applyColorMode(getColorMode());
