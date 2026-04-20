// Synthesized sound effects via Web Audio API
let ctx = null;
let _muted = false;
try { _muted = localStorage.getItem('chess-muted') === '1'; } catch (_) {}

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.28, detune = 0) {
  if (_muted) return;
  const c = ac();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g); g.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  osc.detune.setValueAtTime(detune, c.currentTime);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + dur);
}

function noise(dur, vol = 0.18, loFreq = 80, hiFreq = 800) {
  if (_muted) return;
  const c = ac();
  const bufSize = c.sampleRate * dur;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = (loFreq + hiFreq) / 2;
  filter.Q.value = 0.5;
  const g = c.createGain();
  src.connect(filter); filter.connect(g); g.connect(c.destination);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.start(c.currentTime);
  src.stop(c.currentTime + dur);
}

function arp(notes, interval = 0.08, dur = 0.22, vol = 0.22) {
  if (_muted) return;
  notes.forEach((freq, i) => {
    setTimeout(() => tone(freq, dur, 'triangle', vol), i * interval * 1000);
  });
}

const sfx = {
  mute(v) {
    _muted = v;
    try { localStorage.setItem('chess-muted', v ? '1' : '0'); } catch (_) {}
  },
  isMuted() { return _muted; },

  // Piece placed on board — caisse enregistreuse "ka-ching"
  place() {
    // "ka" : claquement mécanique
    noise(0.025, 0.35, 800, 9000);
    tone(160, 0.055, 'sine', 0.22);
    // "ching" : cloche métallique brillante (décalée de 75ms)
    setTimeout(() => {
      tone(1175, 1.5, 'sine', 0.22);  // D6 — fondamentale
      tone(1568, 1.1, 'sine', 0.13);  // G6 — harmonique
      tone(2349, 0.7, 'sine', 0.07);  // D7 — brillance
      tone(3136, 0.45, 'sine', 0.03); // G7 — shimmer
    }, 75);
  },

  // Piece sold/refunded (prep)
  sell() {
    tone(440, 0.06, 'sine', 0.14);
    setTimeout(() => tone(330, 0.08, 'sine', 0.1), 50);
  },

  // Reroll shop — pièces de monnaie qui tombent
  reroll() {
    // Bruit de mécanisme
    noise(0.03, 0.25, 600, 7000);
    // Série de tintements de pièces
    [1760, 1480, 1320, 1175, 1047].forEach((f, i) => {
      setTimeout(() => {
        tone(f, 0.22, 'sine', 0.15 - i * 0.02);
        noise(0.015, 0.15, 1200, 8000);
      }, i * 60);
    });
  },

  // Normal move
  move() {
    noise(0.08, 0.2, 150, 900);
    tone(280, 0.08, 'sine', 0.1);
  },

  // Capture
  capture() {
    noise(0.12, 0.32, 100, 700);
    tone(220, 0.12, 'triangle', 0.16);
  },

  // Check
  check() {
    tone(740, 0.12, 'square', 0.1);
    setTimeout(() => tone(880, 0.18, 'sine', 0.14), 80);
  },

  // Promotion
  promote() {
    arp([523, 659, 784, 1047], 0.09, 0.28, 0.2);
  },

  // Game end: win
  gameEndWin() {
    arp([523, 659, 784, 1047, 1319], 0.1, 0.35, 0.22);
  },

  // Game end: loss
  gameEndLoss() {
    arp([440, 392, 349, 294], 0.12, 0.4, 0.18);
  },

  // Game end: draw
  gameEndDraw() {
    tone(494, 0.3, 'sine', 0.16);
    setTimeout(() => tone(440, 0.4, 'sine', 0.12), 200);
  },

  // UI click
  click() {
    tone(800, 0.05, 'sine', 0.1);
  },
};

export default sfx;
