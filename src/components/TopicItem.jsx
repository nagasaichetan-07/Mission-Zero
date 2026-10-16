import React from 'react';

export const TopicItem = ({
  topic,
  isCompleted = false,
  onToggle,
  index
}) => {
  return (
    <div
      className={`topic-item ${isCompleted ? 'is-completed' : ''}`}
      onClick={() => onToggle(topic.id)}
      role="checkbox"
      aria-checked={isCompleted}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle(topic.id);
        }
      }}
    >
      <div className="topic-checkbox-container">
        <div className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}>
          {isCompleted && (
            <svg
              className="check-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      <div className="topic-content">
        <span className="topic-number">#{index + 1}</span>
        <span className="topic-title">{topic.title}</span>
      </div>
    </div>
  );
};
