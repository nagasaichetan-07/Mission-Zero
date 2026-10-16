import React from 'react';
import { getProgressColor } from '../utils/progress';

export const ProgressBar = ({
  completed = 0,
  total = 0,
  percentage = 0,
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = true,
  className = ''
}) => {
  const colorToken = getProgressColor(percentage);

  const heightMap = {
    sm: '6px',
    md: '10px',
    lg: '16px'
  };

  return (
    <div className={`progress-wrapper ${className}`}>
      {showLabel && (
        <div className="progress-labels">
          <span className="progress-count">
            <strong style={{ color: colorToken.main }}>{completed}</strong> / {total} topics
          </span>
          <span className="progress-percentage" style={{ color: colorToken.main }}>
            {percentage}%
          </span>
        </div>
      )}
      <div
        className="progress-track"
        style={{ height: heightMap[size] || '10px' }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, percentage))}%`,
            background: colorToken.gradient,
            boxShadow: percentage > 0 ? `0 0 12px ${colorToken.glow}` : 'none'
          }}
        />
      </div>
    </div>
  );
};
