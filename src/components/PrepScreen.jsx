import { useState, useCallback } from 'react';
import { T, FONTS } from '../theme.js';
import { LEVELS, rollShop, buildLevelBoard } from '../levels.js';
import { findKing, isAttacked } from '../engine.js';
import sfx from '../sfx.js';
import ChessBoard from './ChessBoard.jsx';
import ChessPiece from './ChessPiece.jsx';

function checkPositionLegality(baseBoard, placed) {
  const board = { ...baseBoard };
  for (const [sq, p] of Object.entries(placed)) {
    board[+sq] = { type: p.type, color: 'w' };
  }
  const bk = findKing(board, 'b');
  if (bk !== -1 && isAttacked(board, bk, 'w')) {
    return '⚠️ Position illégale : vos pièces attaquent le roi adverse. Déplacez-les.';
  }
  return null;
}

export default function PrepScreen({ gameState, setGameState, onStart, onBack }) {
  const level = LEVELS[gameState.levelIdx];
  const [placed, setPlaced] = useState({});
  const [placedCost, setPlacedCost] = useState({});
  const [spent, setSpent] = useState(0);
  const [error, setError] = useState(null);
  const [hoverSq, setHoverSq] = useState(null);

  const remaining = gameState.budget - spent;
  const baseBoard = buildLevelBoard(level);

  const fullBoard = { ...baseBoard };
  for (const [sq, p] of Object.entries(placed)) {
    fullBoard[+sq] = { type: p.type, color: 'w' };
  }

  // Simulate a board state to check legality before/after a change
  function simulateBoard(nextPlaced) {
    const board = { ...baseBoard };
    for (const [sq, p] of Object.entries(nextPlaced)) {
      board[+sq] = { type: p.type, color: 'w' };
    }
    return board;
  }

  function onDropOnSquare(sq, payload) {
    if (payload.fromShop) {
      const piece = payload.piece;
      if (spent + piece.price > gameState.budget) {
        setError('Budget insuffisant !');
        return;
      }
      const nextPlaced = { ...placed, [sq]: piece };
      const nextPlacedCost = { ...placedCost, [sq]: piece.price };
      setPlaced(nextPlaced);
      setPlacedCost(nextPlacedCost);
      setSpent(s => s + piece.price);
      setError(checkPositionLegality(baseBoard, nextPlaced));
      setGameState(g => ({ ...g, shop: g.shop.filter((_, i) => i !== payload.shopIdx) }));
      sfx.place();
    } else if (payload.fromSq != null) {
      const fromSq = payload.fromSq;
      if (fromSq === sq || !placed[fromSq]) return;
      const nextPlaced = { ...placed };
      nextPlaced[sq] = nextPlaced[fromSq];
      delete nextPlaced[fromSq];
      const nextPlacedCost = { ...placedCost };
      nextPlacedCost[sq] = nextPlacedCost[fromSq];
      delete nextPlacedCost[fromSq];
      setPlaced(nextPlaced);
      setPlacedCost(nextPlacedCost);
      setError(checkPositionLegality(baseBoard, nextPlaced));
      sfx.place();
    }
  }

  function onSquareClick(sq) {
    if (!placed[sq]) return;
    const cost = placedCost[sq] || 0;
    const nextPlaced = { ...placed };
    delete nextPlaced[sq];
    const nextPlacedCost = { ...placedCost };
    delete nextPlacedCost[sq];
    setPlaced(nextPlaced);
    setPlacedCost(nextPlacedCost);
    setSpent(s => s - cost);
    setError(checkPositionLegality(baseBoard, nextPlaced));
    sfx.sell();
  }

  function onReroll() {
    if (remaining < 1) return;
    setGameState(g => ({ ...g, shop: rollShop() }));
    setSpent(s => s + 1);
    sfx.reroll();
  }

  function onStartGame() {
    if (!hasPlaced || error) return;
    onStart({ board: fullBoard, spent });
  }

  // Prevent drop on occupied squares or squares that would give illegal position
  const accepts = useCallback((sq, payload) => {
    if (payload.fromShop) {
      if (fullBoard[sq]) return false;
      const simBoard = simulateBoard({ ...placed, [sq]: payload.piece });
      const bk = findKing(simBoard, 'b');
      return bk === -1 || !isAttacked(simBoard, bk, 'w');
    }
    if (payload.fromSq != null) {
      if (baseBoard[sq] || placed[sq] || sq === payload.fromSq) return false;
      const nextPlaced = { ...placed };
      nextPlaced[sq] = nextPlaced[payload.fromSq];
      delete nextPlaced[payload.fromSq];
      const simBoard = simulateBoard(nextPlaced);
      const bk = findKing(simBoard, 'b');
      return bk === -1 || !isAttacked(simBoard, bk, 'w');
    }
    return false;
  }, [placed, baseBoard, fullBoard]);

  const canDrag = (sq) => !!placed[sq];
  const hasPlaced = Object.keys(placed).length > 0;
  const canStart = hasPlaced && !error;
  const boardSize = Math.min(window.innerWidth - 8, 390);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.text, fontFamily: FONTS.sans,
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px', background: T.panel,
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onBack && (
            <button onClick={onBack} style={{
              background: 'transparent', border: 'none',
              color: T.textDim, cursor: 'pointer', padding: '4px 8px 4px 0',
              fontSize: 22, lineHeight: 1,
            }}>←</button>
          )}
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: T.textMuted, fontFamily: FONTS.mono }}>PRÉPARATION</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Niveau {level.number}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <BudgetChip label="Total" amount={gameState.budget} color={T.textDim} />
          <BudgetChip label="Dispo" amount={remaining} color={remaining > 0 ? T.accent : T.danger} />
        </div>
      </div>

      {/* Board area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <ChessBoard
            board={fullBoard}
            size={boardSize}
            theme={gameState.theme}
            canDrag={canDrag}
            onSquareClick={onSquareClick}
            onDropOnSquare={onDropOnSquare}
            accepts={accepts}
            hoverSq={hoverSq}
            setHoverSq={setHoverSq}
          />
        </div>
        {error && (
          <div style={{
            margin: '4px 0 0', padding: '8px 12px',
            background: T.danger18, border: `1px solid ${T.danger55}`,
            borderRadius: 8, fontSize: 11, color: T.danger, flexShrink: 0,
          }}>{error}</div>
        )}
        {hasPlaced && !error && (
          <div style={{ padding: '4px 0', fontSize: 11, color: T.textMuted, flexShrink: 0 }}>
            💡 Tap sur une pièce placée pour la vendre.
          </div>
        )}
      </div>

      {/* Shop */}
      <div style={{
        padding: '10px 12px 6px', background: T.panel,
        borderTop: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: T.textMuted, fontFamily: FONTS.mono }}>BOUTIQUE</div>
          <button
            onClick={onReroll}
            disabled={remaining < 1}
            style={{
              background: 'transparent', border: 'none',
              color: remaining >= 1 ? T.gold : T.textMuted,
              fontSize: 11, cursor: remaining >= 1 ? 'pointer' : 'default',
              fontFamily: FONTS.sans,
            }}
          >
            ↻ Reroll $1
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {gameState.shop.map((piece, i) => (
            <ShopCard key={i} index={i} piece={piece} canAfford={remaining >= piece.price} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '6px 12px 16px', flexShrink: 0 }}>
        <button
          onClick={onStartGame}
          style={{
            width: '100%', padding: '14px',
            background: canStart
              ? `linear-gradient(180deg, ${T.accentHi}, ${T.accent})`
              : 'rgba(255,255,255,0.07)',
            border: 'none', borderRadius: 12,
            color: canStart ? T.accentText : T.textMuted,
            fontWeight: 700, fontSize: 14,
            cursor: canStart ? 'pointer' : 'default',
            fontFamily: FONTS.sans, transition: 'all 0.2s ease',
          }}
        >
          {!hasPlaced
            ? "Glisse des pièces sur l'échiquier"
            : error
            ? '⚠️ Position illégale'
            : '▶ Lancer la partie !'}
        </button>
      </div>
    </div>
  );
}

function BudgetChip({ label, amount, color }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 9, letterSpacing: 1, color, opacity: 0.55, fontFamily: FONTS.mono }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: FONTS.mono }}>${amount}</div>
    </div>
  );
}

function ShopCard({ piece, index, canAfford }) {
  const card = (
    <div style={{
      width: 78, padding: '10px 6px',
      background: canAfford ? `linear-gradient(135deg, ${T.panel2}, ${T.panel})` : T.panel2,
      border: `1.5px solid ${canAfford ? 'rgba(125,216,125,0.4)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12,
      boxShadow: canAfford ? '0 0 14px rgba(125,216,125,0.1)' : 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      opacity: canAfford ? 1 : 0.4,
      cursor: canAfford ? 'grab' : 'not-allowed',
      userSelect: 'none', transition: 'all 0.15s ease',
    }}>
      <ChessPiece type={piece.type} color="w" size={40} />
      <div style={{ fontSize: 10, color: 'rgba(232,236,242,0.6)' }}>{piece.name}</div>
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: canAfford ? T.accent : T.textMuted,
        background: canAfford ? T.accent18 : 'transparent',
        padding: '2px 8px', borderRadius: 10, fontFamily: FONTS.mono,
      }}>${piece.price}</div>
      {canAfford && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>⠿ glisse</div>}
    </div>
  );

  if (!canAfford) return card;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/json', JSON.stringify({ fromShop: true, piece, shopIdx: index }));
      }}
    >
      {card}
    </div>
  );
}
