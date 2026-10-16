import React, { useMemo } from 'react';
import { ProgressBar } from './ProgressBar';
import { calculateOverallProgress, getProgressColor } from '../utils/progress';

export const OverallProgress = ({
  syllabus = [],
  completedIds = [],
  onExpandAll,
  onCollapseAll,
  allExpanded
}) => {
  const stats = useMemo(() => {
    return calculateOverallProgress(syllabus, completedIds);
  }, [syllabus, completedIds]);

  const colorToken = getProgressColor(stats.percentage);

  // SVG Circular progress computation
  const circleRadius = 52;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  return (
    <section className="overall-hero-card">
      <div className="overall-hero-grid">
        {/* Left: Animated Radial Progress Ring */}
        <div className="hero-radial-box">
          <div className="radial-container">
            <svg className="radial-svg" width="136" height="136" viewBox="0 0 136 136">
              <circle
                className="radial-bg"
                cx="68"
                cy="68"
                r={circleRadius}
                strokeWidth="10"
              />
              <circle
                className="radial-meter"
                cx="68"
                cy="68"
                r={circleRadius}
                strokeWidth="10"
                stroke={colorToken.main}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  filter: `drop-shadow(0 0 8px ${colorToken.glow})`
                }}
              />
            </svg>
            <div className="radial-center-content">
              <span className="radial-percentage" style={{ color: colorToken.main }}>
                {stats.percentage}%
              </span>
              <span className="radial-subtext">Completed</span>
            </div>
          </div>
        </div>

        {/* Right: Key Stats & Overall Progress Bar */}
        <div className="hero-details">
          <div className="hero-header-row">
            <div>
              <div className="hero-tagline">
                <span className="pulse-dot" style={{ backgroundColor: colorToken.main }} />
                <span>Semester Tracker</span>
              </div>
              <h2 className="hero-headline">Overall Mastery</h2>
            </div>

            <div className="hero-expand-controls">
              <button
                type="button"
                className="btn-pill"
                onClick={allExpanded ? onCollapseAll : onExpandAll}
              >
                {allExpanded ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 14 12 6 20 14" />
                    </svg>
                    Collapse All
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    Expand All
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Top Overall Progress Bar */}
          <div className="overall-bar-container">
            <ProgressBar
              completed={stats.completedTopics}
              total={stats.totalTopics}
              percentage={stats.percentage}
              size="lg"
            />
          </div>

          {/* Mini Stat Pills */}
          <div className="stats-pills-row">
            <div className="stat-pill">
              <span className="stat-pill-label">Cleared</span>
              <span className="stat-pill-val" style={{ color: colorToken.main }}>
                {stats.completedTopics} / {stats.totalTopics}
              </span>
            </div>

            <div className="stat-pill">
              <span className="stat-pill-label">Remaining</span>
              <span className="stat-pill-val">
                {stats.totalTopics - stats.completedTopics} topics
              </span>
            </div>

            <div className="stat-pill">
              <span className="stat-pill-label">Subjects Done</span>
              <span className="stat-pill-val">
                {stats.completedSubjects} / {stats.totalSubjects}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
