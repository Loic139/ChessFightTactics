// Chess engine — castling + en passant + promotion supported.
// Board: { sq: { type, color } }  sq ∈ 0..63  (a1=0, h8=63)
// State: { enPassant: sq|null, castling: { wK, wQ, bK, bQ } }

const DIRS = {
  rook:   [[1,0],[-1,0],[0,1],[0,-1]],
  bishop: [[1,1],[1,-1],[-1,1],[-1,-1]],
  queen:  [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
  king:   [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
  knight: [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],
};

export const EMPTY_STATE = { enPassant: null, castling: { wK: false, wQ: false, bK: false, bQ: false } };

export function sqToFR(sq) { return [sq % 8, sq >> 3]; }
export function frToSq(f, r) { return r * 8 + f; }
function inBounds(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }

export function algToSq(alg) {
  return (alg.charCodeAt(0) - 97) + (parseInt(alg[1]) - 1) * 8;
}
export function sqToAlg(sq) {
  const [f, r] = sqToFR(sq);
  return String.fromCharCode(97 + f) + (r + 1);
}

export function findKing(board, color) {
  for (const k in board) {
    const p = board[k];
    if (p.type === 'king' && p.color === color) return +k;
  }
  return -1;
}

// Derive initial castling rights from board position
export function initialCastlingRights(board) {
  const wKing = board[4]?.type === 'king' && board[4]?.color === 'w';
  const bKing = board[60]?.type === 'king' && board[60]?.color === 'b';
  return {
    wK: wKing && board[7]?.type === 'rook' && board[7]?.color === 'w',
    wQ: wKing && board[0]?.type === 'rook' && board[0]?.color === 'w',
    bK: bKing && board[63]?.type === 'rook' && board[63]?.color === 'b',
    bQ: bKing && board[56]?.type === 'rook' && board[56]?.color === 'b',
  };
}

export function isAttacked(board, sq, byColor) {
  const [tf, tr] = sqToFR(sq);

  const pdir = byColor === 'w' ? -1 : 1;
  for (const df of [-1, 1]) {
    const f = tf + df, r = tr + pdir;
    if (!inBounds(f, r)) continue;
    const p = board[frToSq(f, r)];
    if (p && p.color === byColor && p.type === 'pawn') return true;
  }

  for (const [df, dr] of DIRS.knight) {
    const f = tf + df, r = tr + dr;
    if (!inBounds(f, r)) continue;
    const p = board[frToSq(f, r)];
    if (p && p.color === byColor && p.type === 'knight') return true;
  }

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

// Apply a move on a board copy — handles en passant removal and castling rook move.
// Used internally for legality simulation (promotes to queen for simplicity).
function simulateMove(board, from, to, enPassant = null) {
  const next = { ...board };
  const p = next[from];
  delete next[from];

  // En passant: remove the captured pawn
  if (p.type === 'pawn' && to === enPassant) {
    delete next[p.color === 'w' ? to - 8 : to + 8];
  }

  // Castling: move the rook too
  if (p.type === 'king' && Math.abs(to - from) === 2) {
    if (to > from) { // Kingside
      next[to - 1] = next[from + 3];
      delete next[from + 3];
    } else { // Queenside
      next[to + 1] = next[from - 4];
      delete next[from - 4];
    }
  }

  // Promotion (default to queen for check simulation)
  if (p.type === 'pawn') {
    const r = to >> 3;
    next[to] = ((p.color === 'w' && r === 7) || (p.color === 'b' && r === 0))
      ? { type: 'queen', color: p.color }
      : p;
  } else {
    next[to] = p;
  }

  return next;
}

function pseudoMoves(board, sq, state = EMPTY_STATE) {
  const p = board[sq];
  if (!p) return [];
  const [f, r] = sqToFR(sq);
  const out = [];
  const { enPassant, castling } = state;

  if (p.type === 'pawn') {
    const dir = p.color === 'w' ? 1 : -1;
    const startR = p.color === 'w' ? 1 : 6;
    if (inBounds(f, r + dir) && !board[frToSq(f, r + dir)]) {
      out.push(frToSq(f, r + dir));
      if (r === startR && !board[frToSq(f, r + 2 * dir)]) out.push(frToSq(f, r + 2 * dir));
    }
    for (const df of [-1, 1]) {
      const nf = f + df, nr = r + dir;
      if (!inBounds(nf, nr)) continue;
      const t = board[frToSq(nf, nr)];
      if (t && t.color !== p.color) out.push(frToSq(nf, nr));
      // En passant capture
      if (enPassant !== null && frToSq(nf, nr) === enPassant) out.push(enPassant);
    }
  } else if (p.type === 'knight') {
    for (const [df, dr] of DIRS.knight) {
      const nf = f + df, nr = r + dr;
      if (!inBounds(nf, nr)) continue;
      const t = board[frToSq(nf, nr)];
      if (!t || t.color !== p.color) out.push(frToSq(nf, nr));
    }
  } else if (p.type === 'king') {
    for (const [df, dr] of DIRS.king) {
      const nf = f + df, nr = r + dr;
      if (!inBounds(nf, nr)) continue;
      const t = board[frToSq(nf, nr)];
      if (!t || t.color !== p.color) out.push(frToSq(nf, nr));
    }
    // Castling
    const opp = p.color === 'w' ? 'b' : 'w';
    if (p.color === 'w' && sq === 4) {
      if (castling.wK && !board[5] && !board[6]
          && board[7]?.type === 'rook' && board[7]?.color === 'w'
          && !isAttacked(board, 4, opp) && !isAttacked(board, 5, opp)) {
        out.push(6);
      }
      if (castling.wQ && !board[3] && !board[2] && !board[1]
          && board[0]?.type === 'rook' && board[0]?.color === 'w'
          && !isAttacked(board, 4, opp) && !isAttacked(board, 3, opp)) {
        out.push(2);
      }
    }
    if (p.color === 'b' && sq === 60) {
      if (castling.bK && !board[61] && !board[62]
          && board[63]?.type === 'rook' && board[63]?.color === 'b'
          && !isAttacked(board, 60, opp) && !isAttacked(board, 61, opp)) {
        out.push(62);
      }
      if (castling.bQ && !board[59] && !board[58] && !board[57]
          && board[56]?.type === 'rook' && board[56]?.color === 'b'
          && !isAttacked(board, 60, opp) && !isAttacked(board, 59, opp)) {
        out.push(58);
      }
    }
  } else {
    for (const [df, dr] of DIRS[p.type]) {
      let nf = f + df, nr = r + dr;
      while (inBounds(nf, nr)) {
        const t = board[frToSq(nf, nr)];
        if (!t) { out.push(frToSq(nf, nr)); }
        else { if (t.color !== p.color) out.push(frToSq(nf, nr)); break; }
        nf += df; nr += dr;
      }
    }
  }
  return out;
}

export function legalMoves(board, sq, state = EMPTY_STATE) {
  const p = board[sq];
  if (!p) return [];
  const legal = [];
  for (const to of pseudoMoves(board, sq, state)) {
    const next = simulateMove(board, sq, to, state.enPassant);
    const kSq = findKing(next, p.color);
    if (kSq === -1 || !isAttacked(next, kSq, p.color === 'w' ? 'b' : 'w')) legal.push(to);
  }
  return legal;
}

export function inCheck(board, color) {
  const k = findKing(board, color);
  if (k === -1) return false;
  return isAttacked(board, k, color === 'w' ? 'b' : 'w');
}

export function allLegalMoves(board, color, state = EMPTY_STATE) {
  const out = [];
  for (const k in board) {
    if (board[k].color !== color) continue;
    for (const to of legalMoves(board, +k, state)) out.push({ from: +k, to });
  }
  return out;
}

export function gameStatus(board, turnColor, state = EMPTY_STATE) {
  const moves = allLegalMoves(board, turnColor, state);
  if (moves.length > 0) return inCheck(board, turnColor) ? 'check' : 'playing';
  return inCheck(board, turnColor) ? 'checkmate' : 'stalemate';
}

// Execute a move and return { board, enPassant, castling } with updated state.
export function applyMove(board, from, to, promo, state = EMPTY_STATE) {
  const p = board[from];
  const next = simulateMove(board, from, to, state.enPassant);

  // Apply chosen promotion piece (simulateMove defaults to queen)
  if (promo && p.type === 'pawn') {
    const r = to >> 3;
    if ((p.color === 'w' && r === 7) || (p.color === 'b' && r === 0)) {
      next[to] = { type: promo, color: p.color };
    }
  }

  const cas = { ...state.castling };

  // Revoke castling rights when king or rook moves
  if (p.type === 'king') {
    if (p.color === 'w') { cas.wK = false; cas.wQ = false; }
    else                  { cas.bK = false; cas.bQ = false; }
  }
  if (p.type === 'rook') {
    if (from === 0)  cas.wQ = false;
    if (from === 7)  cas.wK = false;
    if (from === 56) cas.bQ = false;
    if (from === 63) cas.bK = false;
  }
  // Revoke if rook is captured
  if (to === 0)  cas.wQ = false;
  if (to === 7)  cas.wK = false;
  if (to === 56) cas.bQ = false;
  if (to === 63) cas.bK = false;

  // Set en passant target if pawn double-pushed
  let ep = null;
  if (p.type === 'pawn' && Math.abs((to >> 3) - (from >> 3)) === 2) {
    ep = (from + to) >> 1;
  }

  return { board: next, enPassant: ep, castling: cas };
}

const TYPE_LETTER = { king:'k', queen:'q', rook:'r', bishop:'b', knight:'n', pawn:'p' };

export function boardToFen(board, turn = 'w', castling = EMPTY_STATE.castling, enPassant = null) {
  let fen = '';
  for (let rank = 7; rank >= 0; rank--) {
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const p = board[rank * 8 + file];
      if (!p) { empty++; }
      else {
        if (empty) { fen += empty; empty = 0; }
        const l = TYPE_LETTER[p.type];
        fen += p.color === 'w' ? l.toUpperCase() : l;
      }
    }
    if (empty) fen += empty;
    if (rank > 0) fen += '/';
  }
  let cas = '';
  if (castling.wK) cas += 'K';
  if (castling.wQ) cas += 'Q';
  if (castling.bK) cas += 'k';
  if (castling.bQ) cas += 'q';
  const ep = enPassant !== null ? sqToAlg(enPassant) : '-';
  return `${fen} ${turn} ${cas || '-'} ${ep} 0 1`;
}

export function parseUciMove(uci) {
  const from = algToSq(uci.slice(0, 2));
  const to   = algToSq(uci.slice(2, 4));
  const promoMap = { q:'queen', r:'rook', b:'bishop', n:'knight' };
  return { from, to, promo: uci[4] ? promoMap[uci[4]] : null };
}

export function parseFenBoard(fenPlacement) {
  const board = {};
  const ranks = fenPlacement.split('/');
  for (let i = 0; i < 8; i++) {
    const rank = 7 - i;
    let file = 0;
    for (const ch of ranks[i]) {
      if (/\d/.test(ch)) { file += +ch; continue; }
      const isW = ch === ch.toUpperCase();
      const map = { p:'pawn', n:'knight', b:'bishop', r:'rook', q:'queen', k:'king' };
      board[frToSq(file, rank)] = { type: map[ch.toLowerCase()], color: isW ? 'w' : 'b' };
      file++;
    }
  }
  return board;
}
