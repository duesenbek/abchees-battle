import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../core/chess/GameEngine';
import { audioManager } from '../../core/services/AudioManager';

export const PodiumScreen: React.FC = () => {
  const { zones, resetGame, startGame, settings } = useGameStore();
  const isMuted = settings.isMuted;
  
  const playerList = Object.keys(zones).map(id => ({
    id,
    playerName: zones[id].playerName,
    avatar: zones[id].avatar,
    score: zones[id].score,
    timeSpent: zones[id].timeSpent,
    errors: zones[id].errors,
  }));
  const [entered, setEntered] = useState(false);
  const [trophyBounce, setTrophyBounce] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setEntered(true), 50);
    const t2 = setTimeout(() => setTrophyBounce(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (playerList.length === 0) return null;

  const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent);
  const winner = sortedPlayers[0];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  const handlePlayAgain = () => {
    if (!isMuted) audioManager.play('start');
    resetGame();
    startGame();
  };

  const handleBack = () => resetGame();

  const PLACE_MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: 'var(--bg)',
      overflowY: 'auto',
      padding: '40px 24px 60px',
      position: 'relative',
    }}>

      {/* ── CSS Keyframes ── */}
      <style>{`
        @keyframes winner-drop-in {
          0% { opacity: 0; transform: translateY(-40px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes trophy-entrance {
          0%   { opacity: 0; transform: translateY(-60px) rotate(-8deg) scale(0.7); }
          60%  { transform: translateY(8px) rotate(3deg) scale(1.05); }
          80%  { transform: translateY(-4px) rotate(-2deg) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
        }
        @keyframes trophy-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-10px) rotate(2deg); }
          66%       { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes avatar-pop {
          0%   { opacity: 0; transform: scale(0.3) rotate(-20deg); }
          70%  { transform: scale(1.1) rotate(4deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes avatar-ring {
          0%, 100% { box-shadow: 0 0 0 0px rgba(59,130,246,0.5), 0 0 0 0px rgba(59,130,246,0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(59,130,246,0.3), 0 0 0 16px rgba(59,130,246,0.1); }
        }
        @keyframes name-slide-up {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine-sweep {
          0%   { background-position: -200% center; }
          100% { background-position: 300% center; }
        }
        @keyframes stat-pop {
          0%   { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes row-slide {
          0%   { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        .trophy-animate {
          animation: trophy-entrance 0.9s cubic-bezier(0.34,1.56,0.64,1) both,
                     trophy-float 4s ease-in-out 1.2s infinite;
        }
        .trophy-idle {
          animation: trophy-float 4s ease-in-out infinite;
        }
        .avatar-animate {
          animation: avatar-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.4s both,
                     avatar-ring 3s ease-in-out 1.2s infinite;
        }
        .shine-text {
          background: linear-gradient(90deg, #fff 0%, #fff 30%, #60a5fa 50%, #fff 70%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shine-sweep 3s linear 1s infinite;
        }
        .sparkle-star {
          position: absolute;
          font-size: 20px;
          animation: sparkle 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* ── WINNER HERO ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 48,
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>

        {/* Sparkles */}
        <div style={{ position: 'relative', width: '100%', height: 0 }}>
          <span className="sparkle-star" style={{ top: -80, left: '15%', animationDelay: '0s' }}>✦</span>
          <span className="sparkle-star" style={{ top: -60, left: '80%', animationDelay: '0.8s' }}>✦</span>
          <span className="sparkle-star" style={{ top: -40, left: '5%', animationDelay: '1.4s', fontSize: 12 }}>✦</span>
          <span className="sparkle-star" style={{ top: -90, left: '90%', animationDelay: '0.4s', fontSize: 14 }}>✦</span>
        </div>

        {/* Trophy */}
        <div
          className={trophyBounce ? 'trophy-animate' : ''}
          style={{ marginBottom: 32, filter: 'drop-shadow(0 24px 40px rgba(245,158,11,0.5))' }}
        >
          <img
            src="/images/trophy-perspective.webp"
            alt="Trophy"
            style={{ width: 180, height: 180, objectFit: 'contain' }}
          />
        </div>

        {/* Winner label */}
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.25em',
          color: 'rgba(245,158,11,0.8)',
          textTransform: 'uppercase',
          marginBottom: 16,
          animation: entered ? 'name-slide-up 0.5s ease 0.2s both' : 'none',
        }}>
          🏆 Победитель
        </div>

        {/* Avatar */}
        <div
          className="avatar-animate"
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid rgba(59,130,246,0.8)',
            marginBottom: 20,
          }}
        >
          <img
            src={winner.avatar || '/avatars/1.png'}
            alt={winner.playerName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Winner name */}
        <h1
          className="shine-text"
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: 24,
            animation: entered ? 'name-slide-up 0.6s ease 0.5s both' : 'none',
          }}
        >
          {winner.playerName}
        </h1>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: 40,
          alignItems: 'center',
          animation: entered ? 'stat-pop 0.5s ease 0.8s both' : 'none',
        }}>
          {/* Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 40,
              fontWeight: 800,
              color: 'var(--accent)',
              lineHeight: 1,
            }}>{winner.score}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Очков
            </span>
          </div>

          <div style={{ width: 1, height: 48, background: 'var(--border)' }} />

          {/* Time */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img
                src="/images/clock-perspective.webp"
                alt="clock"
                style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
              />
              <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>
                {formatTime(winner.timeSpent)}
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Время
            </span>
          </div>

          <div style={{ width: 1, height: 48, background: 'var(--border)' }} />

          {/* Errors */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: winner.errors > 0 ? 'var(--danger)' : 'var(--success)', lineHeight: 1 }}>
              {winner.errors}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Ошибок
            </span>
          </div>
        </div>
      </div>

      {/* ── RANKING TABLE ── */}
      <div style={{
        width: '100%',
        maxWidth: 700,
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        animation: entered ? 'winner-drop-in 0.6s ease 1s both' : 'none',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px 1fr 80px 90px 80px',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          <span>#</span>
          <span>Игрок</span>
          <span style={{ textAlign: 'right' }}>Очки</span>
          <span style={{ textAlign: 'right' }}>Время</span>
          <span style={{ textAlign: 'right' }}>Ошибки</span>
        </div>

        {/* Rows */}
        {sortedPlayers.map((player, index) => {
          const isWinner = index === 0;
          return (
            <div
              key={player.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 80px 90px 80px',
                padding: '14px 20px',
                borderBottom: index < sortedPlayers.length - 1 ? '1px solid var(--border)' : 'none',
                background: isWinner ? 'rgba(59,130,246,0.06)' : 'transparent',
                alignItems: 'center',
                animation: entered ? `row-slide 0.4s ease ${1.1 + index * 0.1}s both` : 'none',
                transition: 'background 0.2s',
              }}
            >
              {/* Place */}
              <div style={{ fontSize: index < 3 ? 20 : 14, fontWeight: 700, color: isWinner ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {index < 3 ? PLACE_MEDALS[index] : index + 1}
              </div>

              {/* Player info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                  border: isWinner ? '2px solid var(--accent)' : '2px solid var(--border)',
                  flexShrink: 0,
                }}>
                  <img src={player.avatar || '/avatars/1.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{
                  fontWeight: isWinner ? 700 : 400,
                  color: isWinner ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 15,
                }}>
                  {player.playerName}
                  {isWinner && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.05em' }}>ПОБЕДИТЕЛЬ</span>}
                </span>
              </div>

              {/* Score */}
              <span style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: isWinner ? 'var(--accent)' : 'var(--text-primary)' }}>
                {player.score}
              </span>

              {/* Time */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                <img src="/images/clock-perspective.webp" alt="" style={{ width: 16, height: 16, objectFit: 'contain', opacity: 0.6 }} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{formatTime(player.timeSpent)}</span>
              </div>

              {/* Errors */}
              <span style={{ textAlign: 'right', fontSize: 14, color: player.errors > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {player.errors}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── BUTTONS ── */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 32,
        animation: entered ? 'stat-pop 0.5s ease 1.4s both' : 'none',
      }}>
        <button className="btn-secondary" onClick={handleBack} style={{ width: 160, height: 48 }}>
          На главную
        </button>
        <button className="btn-primary" onClick={handlePlayAgain} style={{ width: 160, height: 48 }}>
          Ещё раз
        </button>
      </div>
    </div>
  );
};
