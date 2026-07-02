import { useCallback, useEffect, useRef, useState, memo } from 'react';
import React from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../../core/chess/GameEngine';
import { audioManager } from '../../core/services/AudioManager';

interface GameZoneProps {
  zoneId: string;
  side: 'left' | 'right';
}

type FeedbackType = 'correct' | 'incorrect' | 'completed' | null;

const PLAYER_COLORS = {
  'zone-a': { lightSquare: '#e8e8ef', darkSquare: '#4a4a6a' },
  'zone-b': { lightSquare: '#ede8e8', darkSquare: '#6a4a4a' },
  'zone-c': { lightSquare: '#e8ede8', darkSquare: '#4a6a4a' },
  'zone-d': { lightSquare: '#edede8', darkSquare: '#6a6a4a' },
};

const AVATARS: Record<string, string> = {
  'zone-a': '/avatars/1.png',
  'zone-b': '/avatars/2.png',
  'zone-c': '/avatars/3.png',
  'zone-d': '/avatars/4.png',
};

export const GameZone = memo(({ zoneId }: GameZoneProps) => {
  // ── Read from GameEngine (single source of truth) ──────────────────────────
  const zone            = useGameStore((s) => s.zones[zoneId]);
  const isGameActive    = useGameStore((s) => s.status === 'active');
  const isGameFinished  = useGameStore((s) => s.status === 'completed');
  const isPaused        = useGameStore((s) => s.settings.isMenuOpen);
  const isMuted         = useGameStore((s) => s.settings.isMuted);
  const showMoveHints   = useGameStore((s) => s.settings.showMoveHints);
  const showSolutionHints = useGameStore((s) => s.settings.showSolutionHints);
  const maxSolutionHints  = useGameStore((s) => s.settings.maxSolutionHintsPerPuzzle);
  const maxAttempts       = useGameStore((s) => s.settings.maxAttemptsPerPuzzle);
  const boardTheme        = useGameStore((s) => s.settings.boardTheme);
  const puzzlesLength     = useGameStore((s) => s.puzzles.length);
  const currentPuzzle     = useGameStore((s) => {
    const idx = s.zones[zoneId]?.puzzleIndex ?? 0;
    return s.puzzles[idx] ?? null;
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const makeMove    = useGameStore((s) => s.makeMove);
  const requestHint = useGameStore((s) => s.requestHint);

  // ── Local UI state (purely visual — no chess logic) ────────────────────────
  const [feedback, setFeedback]     = useState<FeedbackType>(null);
  const [boardWidth, setBoardWidth] = useState(0);
  // squareStyles for move hints (legal moves) and solution hints
  const [moveHintSquares, setMoveHintSquares] = useState<Record<string, React.CSSProperties>>({});
  const [solutionHintSquares, setSolutionHintSquares] = useState<Record<string, React.CSSProperties>>({});
  const [shaking, setShaking]       = useState(false);
  const [scoreBump, setScoreBump]   = useState(false);
  // boardKey: incremented to force-remount react-chessboard on incorrect move
  const [boardKey, setBoardKey]     = useState(0);

  const prevScoreRef    = useRef(zone?.score ?? 0);
  const sizerRef        = useRef<HTMLDivElement>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimeout    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimeout     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Responsive board sizing ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sizerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // The board-block has padding inside its content rect? No, contentRect excludes padding.
        // Cap max size to 640px so it doesn't get ridiculously large on huge monitors
        setBoardWidth(Math.floor(Math.min(width, height, 640)));
      }
    });
    observer.observe(sizerRef.current);
    return () => observer.disconnect();
  }, [zoneId]);

  // ── Reset visual state on puzzle change ────────────────────────────────────
  useEffect(() => {
    setBoardKey((k) => k + 1);
    setFeedback(null);
    setMoveHintSquares({});
    setSolutionHintSquares({});
    if (hintTimeout.current) clearTimeout(hintTimeout.current);
  }, [zone?.puzzleIndex, boardTheme]);

  // ── Score bump animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (zone && zone.score > prevScoreRef.current) {
      setScoreBump(true);
      setTimeout(() => setScoreBump(false), 220);
    }
    prevScoreRef.current = zone?.score ?? 0;
  }, [zone?.score]);

  // ── Shake helper ─────────────────────────────────────────────────────────────
  const triggerShake = useCallback(() => {
    setShaking(true);
    if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
    shakeTimeout.current = setTimeout(() => setShaking(false), 250);
  }, []);

  // ── onPieceDrop ────────────────────────────────────────────────────────────
  // UI calls makeMove and just reacts to the result.
  // All chess logic (validation, reset, hint clearing) is inside GameEngine.
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }) => {
      if (!isGameActive || isGameFinished || isPaused || !targetSquare) return false;

      setMoveHintSquares({});
      setSolutionHintSquares({});

      const res = makeMove(zoneId, sourceSquare, targetSquare);

      if (res === 'correct' || res === 'completed') {
        if (!isMuted) audioManager.synth_move();
        setFeedback(res === 'completed' ? 'completed' : 'correct');
        if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
        feedbackTimeout.current = setTimeout(() => setFeedback(null), 800);
        return true;
      } else {
        if (!isMuted) audioManager.synth_error();
        triggerShake();
        setFeedback('incorrect');
        if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
        feedbackTimeout.current = setTimeout(() => setFeedback(null), 500);

        // Force-remount board after 800ms (GameEngine has already reset the FEN)
        setTimeout(() => setBoardKey((k) => k + 1), 800);
        return false;
      }
    },
    [isGameActive, isGameFinished, isPaused, makeMove, zoneId, isMuted, triggerShake],
  );

  // ── Move hints: show legal moves on drag/click ──────────────────────────────
  const onPieceDrag = ({ square }: { isSparePiece: boolean; piece: any; square: string | null }) => {
    if (!showMoveHints || !zone || !square) return;
    const lm = zone.boardState.legalMoves[square] ?? [];
    if (lm.length === 0) return;
    const newSquares: Record<string, React.CSSProperties> = {};
    newSquares[square] = { background: 'rgba(91, 108, 255, 0.3)', borderRadius: '50%' };
    lm.forEach((to) => {
      newSquares[to] = {
        background: 'radial-gradient(circle, rgba(0,0,0,.2) 28%, transparent 28%)',
        borderRadius: '50%',
      };
    });
    setMoveHintSquares(newSquares);
  };

  const onSquareClick = ({ square }: { piece: any; square: string }) => {
    if (!showMoveHints || !zone) return;
    const lm = zone.boardState.legalMoves[square] ?? [];
    if (lm.length === 0) {
      setMoveHintSquares({});
      return;
    }
    const newSquares: Record<string, React.CSSProperties> = {};
    newSquares[square] = { background: 'rgba(91, 108, 255, 0.3)' };
    lm.forEach((to) => {
      newSquares[to] = {
        background: 'radial-gradient(circle, rgba(0,0,0,.2) 28%, transparent 28%)',
        borderRadius: '50%',
      };
    });
    setMoveHintSquares(newSquares);
  };

  // ── Solution hint button ────────────────────────────────────────────────────
  const handleSolutionHint = () => {
    const hint = requestHint(zoneId);
    if (!hint) return;

    setSolutionHintSquares({
      [hint.from]: { background: 'rgba(34, 197, 94, 0.55)', borderRadius: '4px', boxShadow: 'inset 0 0 0 3px rgba(34,197,94,0.9)' },
      [hint.to]:   { background: 'rgba(34, 197, 94, 0.35)', borderRadius: '4px', boxShadow: 'inset 0 0 0 3px rgba(34,197,94,0.7)' },
    });

    if (hintTimeout.current) clearTimeout(hintTimeout.current);
    hintTimeout.current = setTimeout(() => setSolutionHintSquares({}), 4000);
  };

  // ── Derived display values ──────────────────────────────────────────────────
  if (!zone) return null;

  const { boardState } = zone;
  const fen = boardState.fen;
  const sideToMove = fen.split(' ')[1] === 'b' ? 'black' : 'white';
  const boardOrientation: 'white' | 'black' = sideToMove;

  // Status text is computed from GameEngine's boardState — UI doesn't call chess.js
  const statusText =
    isGameFinished || zone.isFinished           ? 'Завершено'
    : feedback === 'correct'                    ? (boardState.isCheckmate ? 'Мат!' : boardState.isInCheck ? 'Шах!' : 'Верно!')
    : feedback === 'completed'                  ? (boardState.isCheckmate ? 'Мат!' : 'Верно!')
    : feedback === 'incorrect'                  ? 'Ошибка'
    : 'В игре';

  const statusColor =
    statusText === 'Верно!' || statusText === 'Шах!' || statusText === 'Мат!' ? 'var(--success)'
    : statusText === 'Ошибка'   ? 'var(--danger)'
    : statusText === 'Завершено' ? 'var(--accent)'
    : 'var(--text-secondary)';

  let darkSquareColor = PLAYER_COLORS[zoneId as keyof typeof PLAYER_COLORS]?.darkSquare ?? '#4a4a6a';
  let lightSquareColor = PLAYER_COLORS[zoneId as keyof typeof PLAYER_COLORS]?.lightSquare ?? '#e8e8ef';

  if (boardTheme === 'classic') { darkSquareColor = '#B58863'; lightSquareColor = '#F0D9B5'; }
  else if (boardTheme === 'emerald') { darkSquareColor = '#739552'; lightSquareColor = '#EBECD0'; }

  const boardBorderColor =
    feedback === 'correct' || feedback === 'completed' ? 'var(--success)'
    : feedback === 'incorrect'                          ? 'var(--danger)'
    : 'var(--border)';

  const puzzleNum = Math.min((zone.puzzleIndex ?? 0) + 1, puzzlesLength);
  const attemptsLeft = maxAttempts > 0 ? maxAttempts - zone.attempts : null;
  const hintsLeft = showSolutionHints && maxSolutionHints > 0 ? maxSolutionHints - zone.hintsUsed : null;
  const canUseHint = showSolutionHints && (maxSolutionHints === 0 || zone.hintsUsed < maxSolutionHints);

  // Check square highlight
  const checkSquareStyles: Record<string, React.CSSProperties> = boardState.checkSquare
    ? { [boardState.checkSquare]: { background: 'rgba(239, 68, 68, 0.45)', borderRadius: '4px' } }
    : {};

  // Last move highlight
  const lastMoveStyles: Record<string, React.CSSProperties> = boardState.lastMove
    ? {
        [boardState.lastMove.from]: { background: 'rgba(91,108,255,0.25)' },
        [boardState.lastMove.to]:   { background: 'rgba(91,108,255,0.45)' },
      }
    : {};

  // Merge: lastMove → check → moveHints → solutionHints (highest priority)
  const squareStyles: Record<string, React.CSSProperties> = {
    ...lastMoveStyles,
    ...checkSquareStyles,
    ...moveHintSquares,
    ...solutionHintSquares,
  };

  return (
    <div className="game-zone">
      {/* ── PLAYER BLOCK ── */}
      <div className="player-block">
        <div className="flex-row gap-2">
          <img
            src={zone.avatar || AVATARS[zoneId]}
            alt="avatar"
            className="player-avatar"
            style={{ objectFit: 'cover' }}
          />
          <div className="flex-col">
            <span className="t-h3">{zone.playerName}</span>
            <span className="t-caption" style={{ color: statusColor }}>{statusText}</span>
          </div>
        </div>

        <div className="flex-col" style={{ alignItems: 'flex-end', minWidth: '120px' }}>
          <div className="flex-row gap-2">
            <span className="t-caption">Score:</span>
            <span className={`t-value ${scoreBump ? 'score-bump' : ''}`}>{zone.score}</span>
            <span className="t-caption" style={{ marginLeft: 8 }}>Puzzle {puzzleNum}/{puzzlesLength}</span>
          </div>
          {attemptsLeft !== null && (
            <div className="flex-row gap-1" style={{ marginTop: 4 }}>
              {Array.from({ length: maxAttempts }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < zone.attempts ? 'var(--danger)' : 'var(--surface-hover)',
                    border: '1px solid var(--border)',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
          )}
          <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(zone.score / puzzlesLength) * 100}%`,
              background: 'var(--text-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* ── BOARD BLOCK ── */}
      <div className="board-block" ref={sizerRef}>
        <div
          className={`board-sizer${shaking ? ' board-shake' : ''}`}
          style={{
            border: `2px solid ${boardBorderColor}`,
            transition: 'border-color 0.2s ease',
            width: boardWidth > 0 ? boardWidth : '100%',
            height: boardWidth > 0 ? boardWidth : '100%',
          }}
        >
          {boardWidth > 0 && (
            <div key={`board-${boardKey}`} className="fade-transition" style={{ width: boardWidth, height: boardWidth }}>
              <Chessboard
                key={boardKey}
                options={{
                  position: fen,
                  boardOrientation,
                  boardStyle: { width: boardWidth, height: boardWidth },
                  darkSquareStyle: { backgroundColor: darkSquareColor },
                  lightSquareStyle: { backgroundColor: lightSquareColor },
                  dropSquareStyle: { boxShadow: 'inset 0 0 1px 4px rgba(255,255,255,0.3)' },
                  allowDragging: isGameActive && !isGameFinished && !isPaused && !zone.isFinished,
                  animationDurationInMs: 180,
                  onPieceDrop,
                  onPieceDrag,
                  onSquareClick,
                  squareStyles,
                }}
              />
            </div>
          )}
          {isPaused && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }} />
          )}
        </div>
      </div>

      {/* ── PUZZLE BLOCK ── */}
      {currentPuzzle && (
        <div key={`puzzle-${puzzleNum}`} className="puzzle-block fade-transition">
          <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="t-h3">{currentPuzzle.title}</span>
            <span className="t-caption">{currentPuzzle.difficulty}</span>
          </div>
          <div className="t-body" style={{ marginTop: '4px' }}>
            {currentPuzzle.description}
          </div>

          {/* ── HINT BUTTON ── */}
          {showSolutionHints && isGameActive && !isGameFinished && !isPaused && !zone.isFinished && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={handleSolutionHint}
                disabled={!canUseHint}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  background: canUseHint ? 'rgba(34,197,94,0.12)' : 'transparent',
                  border: `1px solid ${canUseHint ? 'rgba(34,197,94,0.5)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  color: canUseHint ? 'rgba(34,197,94,0.9)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: canUseHint ? 'pointer' : 'not-allowed',
                  opacity: canUseHint ? 1 : 0.5,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '14px' }}>💡</span>
                {hintsLeft !== null ? `Подсказка (${hintsLeft})` : 'Подсказка'}
              </button>
              {Object.keys(solutionHintSquares).length > 0 && (
                <span style={{ fontSize: '11px', color: 'rgba(34,197,94,0.9)', fontStyle: 'italic' }}>
                  Правильная фигура подсвечена зелёным
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
