import React from 'react';
import { useGameStore } from '../../core/chess/GameEngine';
import { Menu } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { zones, puzzles, timeLeft, toggleMenu } = useGameStore();
  const playerList = Object.keys(zones).map(id => ({
    id,
    playerName: zones[id].playerName,
    avatar: zones[id].avatar,
    score: zones[id].score,
    timeSpent: zones[id].timeSpent,
    errors: zones[id].errors,
  }));
  if (playerList.length === 0) return null;

  // Formatting time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  // Calculate Overall Progress
  const totalPossibleScore = puzzles.length * playerList.length;
  const currentTotalScore = playerList.reduce((acc, p) => acc + p.score, 0);
  const progressPercent = totalPossibleScore > 0 ? Math.round((currentTotalScore / totalPossibleScore) * 100) : 0;

  // Leader
  const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent);
  const leader = sortedPlayers[0];

  return (
    <header style={{
      height: '72px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'var(--bg, #0F1115)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* LEFT: Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <button 
          onClick={toggleMenu}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}
        >
          <Menu size={24} />
        </button>
        <img src="/icon.png" alt="ABCHESS Logo" width={24} height={24} />
        <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          ABCHESS Battle
        </div>
      </div>

      {/* CENTER: Round */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <div className="flex-col" style={{ alignItems: 'center' }}>
          <span className="t-caption">Раунд</span>
          <span className="t-value">1 / 1</span>
        </div>
      </div>

      {/* RIGHT: Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, justifyContent: 'flex-end' }}>
        
        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
          <span className="t-caption">Таймер</span>
          <span className="t-value" style={{ 
            fontVariantNumeric: 'tabular-nums',
            color: timeLeft <= 10 ? 'var(--danger)' : 'var(--text-primary)'
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
          <span className="t-caption">Общий прогресс</span>
          <span className="t-value">{progressPercent}%</span>
        </div>

        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
          <span className="t-caption">Лидер</span>
          <span className="t-value">
            {leader ? `${leader.playerName} (${leader.score})` : '---'}
          </span>
        </div>
      </div>
    </header>
  );
};
