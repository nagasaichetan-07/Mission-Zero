import React, { useState, useMemo } from 'react';
import { ProgressBar } from './ProgressBar';
import { TopicItem } from './TopicItem';
import { calculateSubjectProgress, getProgressColor } from '../utils/progress';

export const SubjectCard = ({
  subject,
  completedIds = [],
  onToggleTopic,
  onResetRequest,
  onMarkAllComplete,
  showPendingOnly = false,
  searchTerm = '',
  isExpandedDefault = false
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);

  const { completed, total, percentage } = useMemo(() => {
    return calculateSubjectProgress(subject, completedIds);
  }, [subject, completedIds]);

  const colorToken = getProgressColor(percentage);

  // Filter topics based on search term and pending filter
  const filteredTopics = useMemo(() => {
    return (subject.topics || []).filter(topic => {
      const isDone = completedIds.includes(topic.id);
      if (showPendingOnly && isDone) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = topic.title.toLowerCase().includes(query);
        const matchesUnit = (topic.unit || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesUnit) return false;
      }
      return true;
    });
  }, [subject.topics, completedIds, showPendingOnly, searchTerm]);

  // Group filtered topics by unit
  const groupedUnits = useMemo(() => {
    const groups = [];
    let currentUnit = null;
    let currentTopics = [];

    filteredTopics.forEach((topic) => {
      const unitName = topic.unit || 'General Topics';
      if (unitName !== currentUnit) {
        if (currentUnit !== null) {
          groups.push({ unit: currentUnit, topics: currentTopics });
        }
        currentUnit = unitName;
        currentTopics = [topic];
      } else {
        currentTopics.push(topic);
      }
    });

    if (currentUnit !== null) {
      groups.push({ unit: currentUnit, topics: currentTopics });
    }

    return groups;
  }, [filteredTopics]);

  const isMastered = percentage === 100 && total > 0;

  return (
    <div className={`subject-card ${isMastered ? 'is-mastered' : ''} ${isExpanded ? 'expanded' : ''}`}>
      {/* Subject Header / Summary Card */}
      <div className="subject-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="subject-title-row">
          <div className="subject-badge-group">
            <span className="subject-code-badge" style={{ borderColor: colorToken.border, color: colorToken.main }}>
              {subject.name}
            </span>
            <span className="subject-status-pill" style={{ background: colorToken.bg, color: colorToken.text, borderColor: colorToken.border }}>
              {isMastered ? 'Mastered 🎉' : percentage > 0 ? `${percentage}% Done` : 'Pending'}
            </span>
          </div>

          <button
            type="button"
            className="expand-toggle-btn"
            aria-label={isExpanded ? 'Collapse subject' : 'Expand subject'}
          >
            <svg
              className={`chevron-icon ${isExpanded ? 'open' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <h3 className="subject-full-title">{subject.fullName || subject.name}</h3>

        {/* Progress Bar inside Subject Card */}
        <div className="subject-progress-area" onClick={(e) => e.stopPropagation()}>
          <ProgressBar
            completed={completed}
            total={total}
            percentage={percentage}
            size="md"
          />
        </div>

        <div className="subject-quick-meta">
          <span>{total} Total Topics</span>
          <span>•</span>
          <span>{total - completed} Remaining</span>
        </div>
      </div>

      {/* Expandable Topic Checklist */}
      {isExpanded && (
        <div className="subject-body">
          <div className="subject-actions-bar">
            <div className="action-hints">
              {showPendingOnly && <span className="filter-active-hint">Filtering pending only</span>}
            </div>
            <div className="card-buttons">
              {completed < total && (
                <button
                  type="button"
                  className="card-action-btn mark-all"
                  onClick={() => onMarkAllComplete(subject.topics)}
                  title="Mark all topics in this subject as completed"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Mark All Done
                </button>
              )}
              {completed > 0 && (
                <button
                  type="button"
                  className="card-action-btn reset"
                  onClick={() => onResetRequest(subject)}
                  title="Reset completed topics for this subject"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Reset
                </button>
              )}
            </div>
          </div>

          {filteredTopics.length === 0 ? (
            <div className="empty-topic-state">
              {showPendingOnly ? (
                <p>All topics for {subject.name} are completed! 🏆</p>
              ) : (
                <p>No topics match your search query.</p>
              )}
            </div>
          ) : (
            <div className="units-container">
              {groupedUnits.map((group, gIdx) => (
                <div key={gIdx} className="unit-section">
                  <h4 className="unit-header">{group.unit}</h4>
                  <div className="topics-list">
                    {group.topics.map((topic, tIdx) => (
                      <TopicItem
                        key={topic.id}
                        topic={topic}
                        index={subject.topics.findIndex(t => t.id === topic.id)}
                        isCompleted={completedIds.includes(topic.id)}
                        onToggle={onToggleTopic}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
