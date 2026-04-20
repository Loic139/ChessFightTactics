// Compact chess engine — enough for the prototype.
// No castling/en-passant/50-move-rule. Promotion is supported.
// Board is an object { sq: { type, color } } where sq ∈ 0..63 (a1=0, h8=63).

// Direction offsets for piece movement (file, rank)
const DIRS = {
  rook:   [[1,0],[-1,0],[0,1],[0,-1]],
  bishop: [[1,1],[1,-1],[-1,1],[-1,-1]],
  queen:  [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
  king:   [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
  knight: [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],
};

const SLIDING = new Set(['rook','bishop','queen']);

function sqToFR(sq) { return [sq % 8, sq >> 3]; }
function frToSq(f, r) { return r * 8 + f; }
function inBounds(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }

function algToSq(alg) {
  return (alg.charCodeAt(0) - 97) + (parseInt(alg[1]) - 1) * 8;
}
function sqToAlg(sq) {
  const [f, r] = sqToFR(sq);
  return String.fromCharCode(97 + f) + (r + 1);
}

// Find the king square for given color
function findKing(board, color) {
  for (const k in board) {
    const p = board[k];
    if (p.type === 'king' && p.color === color) return +k;
  }
  return -1;
}

// Is `sq` attacked by `byColor` in `board`?
function isAttacked(board, sq, byColor) {
  const [tf, tr] = sqToFR(sq);

  // Pawn attacks
  const pdir = byColor === 'w' ? -1 : 1; // attacker came from this direction
  for (const df of [-1, 1]) {
    const f = tf + df, r = tr + pdir;
    if (!inBounds(f, r)) continue;
    const p = board[frToSq(f, r)];
    if (p && p.color === byColor && p.type === 'pawn') return true;
  }

  // Knight
  for (const [df, dr] of DIRS.knight) {
    const f = tf + df, r = tr + dr;
    if (!inBounds(f, r)) continue;
    const p = board[frToSq(f, r)];
    if (p && p.color === byColor && p.type === 'knight') return true;
  }

  // Sliding (rook/bishop/queen) + king
  const lineChecks = [
    { dirs: [[1,0],[-1,0],[0,1],[0,-1]], types: ['rook','queen'] },
    { dirs: [[1,1],[1,-1],[-1,1],[-1,-1]], types: ['bishop','queen'] },
  ];
  for (const { dirs, types } of lineChecks) {
    for (const [df, dr] of dirs) {
      let f = tf + df, r = tr + dr, steps = 1;
      while (inBounds(f, r)) {
        const p = board[frToSq(f, r)];
        if (p) {
          if (p.color === byColor && types.includes(p.type)) return true;
          if (p.color === byColor && p.type === 'king' && steps === 1) return true;
          break;
        }
        f += df; r += dr; steps++;
      }
    }
  }

  return false;
}

// Pseudo-legal moves from a square (no king-safety filter).
function pseudoMoves(board, sq) {
  const p = board[sq];
  if (!p) return [];
  const [f, r] = sqToFR(sq);
  const out = [];

  if (p.type === 'pawn') {
    const dir = p.color === 'w' ? 1 : -1;
    const startR = p.color === 'w' ? 1 : 6;
    // forward 1
    if (inBounds(f, r + dir) && !board[frToSq(f, r + dir)]) {
      out.push(frToSq(f, r + dir));
      // forward 2 from start
      if (r === startR && !board[frToSq(f, r + 2 * dir)]) {
        out.push(frToSq(f, r + 2 * dir));
      }
    }
    // captures
    for (const df of [-1, 1]) {
      const nf = f + df, nr = r + dir;
      if (!inBounds(nf, nr)) continue;
      const t = board[frToSq(nf, nr)];
      if (t && t.color !== p.color) out.push(frToSq(nf, nr));
    }
  } else if (p.type === 'knight' || p.type === 'king') {
    for (const [df, dr] of DIRS[p.type]) {
      const nf = f + df, nr = r + dr;
      if (!inBounds(nf, nr)) continue;
      const t = board[frToSq(nf, nr)];
      if (!t || t.color !== p.color) out.push(frToSq(nf, nr));
    }
  } else {
    for (const [df, dr] of DIRS[p.type]) {
      let nf = f + df, nr = r + dr;
      while (inBounds(nf, nr)) {
        const t = board[frToSq(nf, nr)];
        if (!t) { out.push(frToSq(nf, nr)); }
        else {
          if (t.color !== p.color) out.push(frToSq(nf, nr));
          break;
        }
        nf += df; nr += dr;
      }
    }
  }
  return out;
}

// Legal moves: pseudo-moves filtered by leave-own-king-in-check.
function legalMoves(board, sq) {
  const p = board[sq];
  if (!p) return [];
  const moves = pseudoMoves(board, sq);
  const legal = [];
  for (const to of moves) {
    const next = { ...board };
    delete next[sq];
    next[to] = p;
    const kSq = findKing(next, p.color);
    if (kSq === -1 || !isAttacked(next, kSq, p.color === 'w' ? 'b' : 'w')) {
      legal.push(to);
    }
  }
  return legal;
}

function inCheck(board, color) {
  const k = findKing(board, color);
  if (k === -1) return false;
  return isAttacked(board, k, color === 'w' ? 'b' : 'w');
}

// All legal moves for a color: [{from, to}]
function allLegalMoves(board, color) {
  const out = [];
  for (const k in board) {
    if (board[k].color !== color) continue;
    const sq = +k;
    for (const to of legalMoves(board, sq)) out.push({ from: sq, to });
  }
  return out;
}

function gameStatus(board, turnColor) {
  const moves = allLegalMoves(board, turnColor);
  if (moves.length > 0) return inCheck(board, turnColor) ? 'check' : 'playing';
  return inCheck(board, turnColor) ? 'checkmate' : 'stalemate';
}

// Apply a move; returns new board. Handles promotion if `promo` given.
function applyMove(board, from, to, promo) {
  const next = { ...board };
  const p = next[from];
  delete next[from];
  if (p.type === 'pawn') {
    const [, r] = sqToFR(to);
    if ((p.color === 'w' && r === 7) || (p.color === 'b' && r === 0)) {
      next[to] = { type: promo || 'queen', color: p.color };
      return next;
    }
  }
  next[to] = p;
  return next;
}

// Simple FEN parser → our board format (positions only, piece-placement field).
function parseFenBoard(fenPlacement) {
  const board = {};
  const ranks = fenPlacement.split('/');
  for (let i = 0; i < 8; i++) {
    const rank = 7 - i;
    let file = 0;
    for (const ch of ranks[i]) {
      if (/\d/.test(ch)) { file += +ch; continue; }
      const isW = ch === ch.toUpperCase();
      const map = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
      board[frToSq(file, rank)] = { type: map[ch.toLowerCase()], color: isW ? 'w' : 'b' };
      file++;
    }
  }
  return board;
}

Object.assign(window, {
  sqToAlg, algToSq, sqToFR, frToSq,
  legalMoves, allLegalMoves, inCheck, gameStatus, applyMove,
  parseFenBoard, findKing, isAttacked,
});
