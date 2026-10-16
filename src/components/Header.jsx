import React from 'react';

export const Header = ({
  searchTerm = '',
  onSearchChange,
  showPendingOnly = false,
  onTogglePendingOnly,
  onGlobalResetRequest,
  onReplaySplash,
  totalPendingCount = 0
}) => {
  return (
    <header className="site-header">
      <div className="header-container">
        {/* Brand identity */}
        <div className="brand-group" onClick={onReplaySplash} title="Click to replay intro animation">
          <div className="brand-logo-badge">
            <img
              src="/logo.png"
              alt="mission:zero emblem"
              className="brand-logo-img"
              onError={(e) => {
                e.target.src = './logo.png';
              }}
            />
          </div>
          <div className="brand-text-block">
            <h1 className="brand-title">
              mission<span className="brand-colon">:</span>zero
            </h1>
            <span className="brand-status-sub">Study Tracker</span>
          </div>
        </div>

        {/* Global Controls */}
        <div className="header-controls">
          {/* Search bar */}
          <div className="search-input-box">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search 242 topics..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search topics"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Pending Only Toggle */}
          <button
            type="button"
            className={`filter-pill-btn ${showPendingOnly ? 'active' : ''}`}
            onClick={onTogglePendingOnly}
            title={showPendingOnly ? 'Showing pending only' : 'Showing all topics'}
          >
            <span className="filter-pill-indicator" />
            <span>Pending Only</span>
            {showPendingOnly && totalPendingCount > 0 && (
              <span className="filter-pill-counter">{totalPendingCount}</span>
            )}
          </button>

          {/* Intro Replay Icon */}
          <button
            type="button"
            className="icon-action-btn"
            onClick={onReplaySplash}
            title="Replay intro animation"
            aria-label="Replay intro"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>

          {/* Reset All Button */}
          <button
            type="button"
            className="reset-global-btn"
            onClick={onGlobalResetRequest}
            title="Reset all progress across all 8 subjects"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset All</span>
          </button>
        </div>
      </div>
    </header>
  );
};
