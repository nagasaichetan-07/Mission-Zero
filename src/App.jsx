import React, { useState, useMemo, useCallback } from 'react';
import { syllabus } from './data/syllabus';
import { useProgress } from './hooks/useProgress';
import { Header } from './components/Header';
import { OverallProgress } from './components/OverallProgress';
import { SubjectCard } from './components/SubjectCard';
import { ConfirmModal } from './components/ConfirmModal';
import { OpeningSplash } from './components/OpeningSplash';

export function App() {
  const {
    completedIds,
    toggleTopic,
    resetSubject,
    markSubjectComplete,
    resetAll
  } = useProgress();

  // Opening animation splash state (show once per visit or on replay)
  const [showSplash, setShowSplash] = useState(true);

  // Filters & Search
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Expand / collapse all subjects state
  const [expandedSubjectIds, setExpandedSubjectIds] = useState(() => {
    // By default, open the first subject so the user immediately sees the checklist
    return new Set(['sub1']);
  });

  // Reset confirmation modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // 'subject' | 'global'
    subject: null
  });

  // Calculate total pending topics
  const totalPendingCount = useMemo(() => {
    const totalTopics = syllabus.reduce((acc, sub) => acc + sub.topics.length, 0);
    return Math.max(0, totalTopics - completedIds.length);
  }, [completedIds]);

  // Handlers for subject expansion
  const handleExpandAll = useCallback(() => {
    setExpandedSubjectIds(new Set(syllabus.map(s => s.id)));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandedSubjectIds(new Set());
  }, []);

  const allExpanded = useMemo(() => {
    return expandedSubjectIds.size === syllabus.length;
  }, [expandedSubjectIds]);

  // Modal triggers
  const promptSubjectReset = useCallback((subject) => {
    setModalConfig({
      isOpen: true,
      type: 'subject',
      subject
    });
  }, []);

  const promptGlobalReset = useCallback(() => {
    setModalConfig({
      isOpen: true,
      type: 'global',
      subject: null
    });
  }, []);

  const handleConfirmReset = useCallback(() => {
    if (modalConfig.type === 'subject' && modalConfig.subject) {
      resetSubject(modalConfig.subject.topics);
    } else if (modalConfig.type === 'global') {
      resetAll();
    }
    setModalConfig({ isOpen: false, type: null, subject: null });
  }, [modalConfig, resetSubject, resetAll]);

  const handleCloseModal = useCallback(() => {
    setModalConfig({ isOpen: false, type: null, subject: null });
  }, []);

  return (
    <div className="app-shell">
      {/* Coinskill-Style Opening Logo Animation */}
      {showSplash && (
        <OpeningSplash onFinish={() => setShowSplash(false)} />
      )}

      {/* Main App Layout */}
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showPendingOnly={showPendingOnly}
        onTogglePendingOnly={() => setShowPendingOnly(prev => !prev)}
        onGlobalResetRequest={promptGlobalReset}
        onReplaySplash={() => setShowSplash(true)}
        totalPendingCount={totalPendingCount}
      />

      <main className="main-content">
        <div className="content-container">
          {/* Overall Progress Hero */}
          <OverallProgress
            syllabus={syllabus}
            completedIds={completedIds}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            allExpanded={allExpanded}
          />

          {/* Active Filter Banner when searching or filtering */}
          {(showPendingOnly || searchTerm) && (
            <div className="active-filter-banner">
              <div className="filter-banner-text">
                {showPendingOnly && <span className="filter-tag">Pending Only</span>}
                {searchTerm && (
                  <span className="filter-tag">
                    Matching "{searchTerm}"
                  </span>
                )}
              </div>
              <button
                type="button"
                className="clear-filters-btn"
                onClick={() => {
                  setShowPendingOnly(false);
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Subjects Grid */}
          <section className="subjects-section">
            <div className="subjects-grid">
              {syllabus.map(subject => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  completedIds={completedIds}
                  onToggleTopic={toggleTopic}
                  onResetRequest={promptSubjectReset}
                  onMarkAllComplete={markSubjectComplete}
                  showPendingOnly={showPendingOnly}
                  searchTerm={searchTerm}
                  isExpandedDefault={expandedSubjectIds.has(subject.id)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-container">
          <p className="footer-brand">
            <strong>mission:zero</strong> • 8 Subjects • 242 Total Topics
          </p>
          <p className="footer-note">
            Your study progress is saved automatically in your browser's local storage.
          </p>
        </div>
      </footer>

      {/* Safety Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={
          modalConfig.type === 'global'
            ? 'Reset All Progress?'
            : `Reset ${modalConfig.subject?.name || 'Subject'}?`
        }
        message={
          modalConfig.type === 'global'
            ? 'Are you sure you want to reset all 242 topics across all 8 subjects? This will clear your entire semester checklist.'
            : `Are you sure you want to clear all completed checkboxes for ${modalConfig.subject?.name} (${modalConfig.subject?.fullName})?`
        }
        confirmText="Yes, Reset"
        confirmVariant="danger"
        onConfirm={handleConfirmReset}
        onCancel={handleCloseModal}
      />
    </div>
  );
}

export default App;
