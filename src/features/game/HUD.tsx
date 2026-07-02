import React from 'react';
import { useGameStore } from '../../core/chess/GameEngine';

export const HUD: React.FC = () => {
  const { zones, puzzles, timeLeft } = useGameStore();
  const playerList = Object.keys(zones).map(id => ({
    id,
    playerName: zones[id].playerName,
    avatar: zones[id].avatar,
    score: zones[id].score,
    timeSpent: zones[id].timeSpent,
    errors: zones[id].errors,
  }));
  if (playerList.length === 0) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const totalPossibleScore = puzzles.length * playerList.length;
  const currentTotalScore = playerList.reduce((acc, p) => acc + p.score, 0);
  const progressPercent = totalPossibleScore > 0 ? Math.round((currentTotalScore / totalPossibleScore) * 100) : 0;

  const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent);
  const leader = sortedPlayers[0];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: '60px',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      fontFamily: 'Inter, sans-serif',
      width: '100%',
      padding: '0 24px'
    }}>
      <div className="flex-row gap-1">
        <span className="t-caption">Раунд</span>
        <span className="t-value">1 / 1</span>
      </div>

      <div className="flex-row gap-1">
        <span className="t-caption">Таймер</span>
        <span className="t-value" style={{ 
          fontVariantNumeric: 'tabular-nums',
          color: timeLeft <= 10 ? 'var(--danger)' : 'var(--text-primary)' 
        }}>
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="flex-row gap-1">
        <span className="t-caption">Общий прогресс</span>
        <span className="t-value">{progressPercent}%</span>
      </div>

      <div className="flex-row gap-1">
        <span className="t-caption">Лидер</span>
        <span className="t-value">
          {leader ? `${leader.playerName} (${leader.score})` : '---'}
        </span>
      </div>
    </div>
  );
};
