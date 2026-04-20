import { parseFenBoard } from './engine.js';

export const SHOP_PIECES = [
  { type: 'pawn',   name: 'Pion',     price: 1 },
  { type: 'knight', name: 'Cavalier', price: 3 },
  { type: 'bishop', name: 'Fou',      price: 3 },
  { type: 'rook',   name: 'Tour',     price: 5 },
  { type: 'queen',  name: 'Dame',     price: 8 },
];

export const LEVELS = [
  { number: 1, bonus: 10, fen: '4k3/pppp4/8/8/8/8/8/4K3' },
  { number: 2, bonus: 12, fen: 'r3k2r/pppppppp/8/8/8/8/8/4K3' },
  { number: 3, bonus: 15, fen: 'r1bqk2r/pppppppp/2n2n2/8/8/8/8/4K3' },
];

export function rollShop(count = 3) {
  return Array.from({ length: count }, () =>
    SHOP_PIECES[Math.floor(Math.random() * SHOP_PIECES.length)]
  );
}

export function buildLevelBoard(level) {
  return parseFenBoard(level.fen);
}
