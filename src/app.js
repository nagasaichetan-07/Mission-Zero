import { syllabus } from './data/syllabus.js';

// Local storage keys
const STORAGE_KEY_MY = 'mission_zero_completed_topic_ids';
const STORAGE_KEY_FRIEND = 'mission_zero_friend_completed_ids';
const STORAGE_KEY_FRIEND_NAME = 'mission_zero_friend_name';

// Encoding helpers for 1-click share links and sync codes
function encodeSyncData(ids) {
  try {
    const jsonStr = JSON.stringify(ids);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch (e) {
    console.error('Encoding error:', e);
    return '';
  }
}

function decodeSyncData(code) {
  try {
    // If the user pasted a full URL, extract the query param
    if (code.includes('?friend_sync=') || code.includes('&friend_sync=')) {
      const match = code.match(/[?&]friend_sync=([^&#]+)/);
      if (match && match[1]) code = match[1];
    } else if (code.includes('#sync=')) {
      code = code.split('#sync=')[1];
    }
    const decodedStr = decodeURIComponent(escape(atob(code.trim())));
    const parsed = JSON.parse(decodedStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Decoding error:', e);
    return null;
  }
}

// Global State
class State {
  constructor() {
    this.completedIds = this.loadMyCompleted();
    this.friendCompletedIds = this.loadFriendCompleted();
    this.friendName = localStorage.getItem(STORAGE_KEY_FRIEND_NAME) || 'Study Buddy';
    
    // Check if URL has incoming friend sync code
    const urlParams = new URLSearchParams(window.location.search);
    const syncParam = urlParams.get('friend_sync');
    if (syncParam) {
      const importedIds = decodeSyncData(syncParam);
      if (importedIds) {
        this.friendCompletedIds = importedIds;
        this.saveFriendCompleted();
        this.activeView = 'friend';
        this.toastMessage = `Loaded ${this.friendName}'s progress (${importedIds.length} topics)!`;
      }
    }

    this.activeView = this.activeView || 'my'; // 'my' | 'friend' | 'compare'
    this.showPendingOnly = false;
    this.searchTerm = '';
    this.expandedSubjectIds = new Set(['sub1']);
    this.modalConfig = { isOpen: false, type: null, subject: null };
    this.shareModalOpen = false;
    this.shareModalTab = 'share'; // 'share' | 'import'
    this.showSplash = !sessionStorage.getItem('mission_zero_splash_seen');
    this.toastMessage = this.toastMessage || null;
  }

  loadMyCompleted() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveMyCompleted() {
    try {
      localStorage.setItem(STORAGE_KEY_MY, JSON.stringify(this.completedIds));
    } catch (e) {}
  }

  loadFriendCompleted() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FRIEND);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveFriendCompleted() {
    try {
      localStorage.setItem(STORAGE_KEY_FRIEND, JSON.stringify(this.friendCompletedIds));
    } catch (e) {}
  }

  toggleTopic(topicId) {
    // Only toggle my own progress
    if (this.activeView === 'friend') return;

    if (this.completedIds.includes(topicId)) {
      this.completedIds = this.completedIds.filter(id => id !== topicId);
    } else {
      this.completedIds.push(topicId);
    }
    this.saveMyCompleted();
  }

  resetSubject(subject) {
    const idsToRemove = new Set(subject.topics.map(t => t.id));
    this.completedIds = this.completedIds.filter(id => !idsToRemove.has(id));
    this.saveMyCompleted();
  }

  markAllSubject(subject) {
    const idsToAdd = subject.topics.map(t => t.id);
    this.completedIds = Array.from(new Set([...this.completedIds, ...idsToAdd]));
    this.saveMyCompleted();
  }

  resetAll() {
    this.completedIds = [];
    this.saveMyCompleted();
  }
}

const state = new State();

// Color token utility
export function getProgressColor(percent) {
  if (percent >= 76) {
    return {
      main: '#10b981',
      gradient: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
      glow: 'rgba(16, 185, 129, 0.4)',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#34d399',
      label: 'Optimal Progress'
    };
  }
  if (percent >= 36) {
    return {
      main: '#f59e0b',
      gradient: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
      glow: 'rgba(245, 158, 11, 0.4)',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#fbbf24',
      label: 'Good Momentum'
    };
  }
  return {
    main: '#ef4444',
    gradient: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
    glow: 'rgba(239, 68, 68, 0.4)',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#f87171',
    label: 'Getting Started'
  };
}

// Progress calculation
export function calculateSubjectProgress(subject, completedIds) {
  const total = subject.topics.length;
  const completed = subject.topics.filter(t => completedIds.includes(t.id)).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

export function calculateOverallProgress(syllabusList, completedIds) {
  let totalTopics = 0;
  let completedTopics = 0;
  let completedSubjects = 0;

  syllabusList.forEach(subject => {
    const prog = calculateSubjectProgress(subject, completedIds);
    totalTopics += prog.total;
    completedTopics += prog.completed;
    if (prog.completed === prog.total && prog.total > 0) {
      completedSubjects += 1;
    }
  });

  const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  return {
    completedTopics,
    totalTopics,
    percentage,
    completedSubjects,
    totalSubjects: syllabusList.length
  };
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Render Master Application
export function renderApp() {
  const appContainer = document.getElementById('root');
  if (!appContainer) return;

  // Determine active completed list based on active view
  const currentCompletedIds = state.activeView === 'friend' ? state.friendCompletedIds : state.completedIds;

  const totalTopics = syllabus.reduce((acc, sub) => acc + sub.topics.length, 0);
  const totalPending = Math.max(0, totalTopics - currentCompletedIds.length);
  const overall = calculateOverallProgress(syllabus, currentCompletedIds);
  const overallColor = getProgressColor(overall.percentage);

  // Friend stats for comparison
  const myStats = calculateOverallProgress(syllabus, state.completedIds);
  const friendStats = calculateOverallProgress(syllabus, state.friendCompletedIds);
  const myColor = getProgressColor(myStats.percentage);
  const friendColor = getProgressColor(friendStats.percentage);

  // Radial calculation
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall.percentage / 100) * circumference;

  const allExpanded = state.expandedSubjectIds.size === syllabus.length;

  appContainer.innerHTML = `
    <div class="app-shell">
      <!-- 1. Coinskill-Inspired Opening Splash -->
      <div id="splashScreen" class="splash-screen ${state.showSplash ? '' : 'splash-exit'}" style="${state.showSplash ? '' : 'display:none;'}">
        <div class="splash-glow-backdrop"></div>
        <div class="splash-kinetic-rings active">
          <div class="orbital-ring ring-1"></div>
          <div class="orbital-ring ring-2"></div>
          <div class="orbital-ring ring-3"></div>
        </div>
        <div class="splash-center-stage">
          <div class="splash-logo-wrapper drop-in">
            <div class="splash-badge-frame">
              <img src="./public/logo.png" alt="mission:zero logo" class="splash-logo-image" />
              <div class="metallic-sheen sweep"></div>
            </div>
          </div>
          <div class="splash-typography reveal">
            <h1 class="splash-title">
              MISSION<span class="splash-colon">:</span>ZERO
            </h1>
            <p class="splash-tagline visible">
              Zero Backlogs <span class="splash-dot">•</span> Absolute Mastery
            </p>
          </div>
        </div>
        <button type="button" id="skipSplashBtn" class="splash-skip-btn" aria-label="Skip animation">
          Skip ➔
        </button>
      </div>

      <!-- 2. Sticky Header -->
      <header class="site-header">
        <div class="header-container">
          <div class="brand-group" id="headerLogoBrand" title="Click to replay intro animation">
            <div class="brand-logo-badge">
              <img src="./public/logo.png" alt="mission:zero emblem" class="brand-logo-img" />
            </div>
            <div class="brand-text-block">
              <h1 class="brand-title">
                mission<span class="brand-colon">:</span>zero
              </h1>
              <span class="brand-status-sub">Study Tracker</span>
            </div>
          </div>

          <div class="header-controls">
            <!-- Share / Friend Sync Button -->
            <button
              type="button"
              id="openShareModalBtn"
              class="friend-share-btn"
              title="Share your progress or sync your friend's code"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span>Sync with Friend</span>
            </button>

            <!-- Search input -->
            <div class="search-input-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                id="topicSearchInput"
                class="search-input"
                placeholder="Search 242 topics..."
                value="${escapeHtml(state.searchTerm)}"
                aria-label="Search topics"
              />
              ${state.searchTerm ? `<button type="button" id="clearSearchBtn" class="search-clear-btn" aria-label="Clear search">✕</button>` : ''}
            </div>

            <!-- Pending filter toggle -->
            <button
              type="button"
              id="pendingFilterBtn"
              class="filter-pill-btn ${state.showPendingOnly ? 'active' : ''}"
              title="${state.showPendingOnly ? 'Showing pending only' : 'Showing all topics'}"
            >
              <span class="filter-pill-indicator"></span>
              <span>Pending Only</span>
              ${state.showPendingOnly && totalPending > 0 ? `<span class="filter-pill-counter">${totalPending}</span>` : ''}
            </button>

            <!-- Replay intro button -->
            <button
              type="button"
              id="replayIntroBtn"
              class="icon-action-btn"
              title="Replay intro animation"
              aria-label="Replay intro"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>

            <!-- Global reset button (only in My Progress view) -->
            ${state.activeView === 'my' ? `
              <button
                type="button"
                id="globalResetBtn"
                class="reset-global-btn"
                title="Reset all progress across all 8 subjects"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                <span>Reset All</span>
              </button>
            ` : ''}
          </div>
        </div>
      </header>

      <!-- 3. Main Dashboard -->
      <main class="main-content">
        <div class="content-container">
          
          <!-- View Switcher Tabs (My Progress vs Friend's Progress vs Study Buddy Duel) -->
          <div class="view-switcher-bar">
            <div class="view-switcher-pill">
              <button
                type="button"
                class="view-tab-btn ${state.activeView === 'my' ? 'active' : ''}"
                data-view="my"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                My Progress (${myStats.percentage}%)
              </button>

              <button
                type="button"
                class="view-tab-btn ${state.activeView === 'friend' ? 'active' : ''}"
                data-view="friend"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                ${escapeHtml(state.friendName)}'s Progress (${friendStats.percentage}%)
              </button>

              <button
                type="button"
                class="view-tab-btn ${state.activeView === 'compare' ? 'active' : ''}"
                data-view="compare"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Study Buddy Duel
              </button>
            </div>
          </div>

          <!-- Friend View Alert Banner -->
          ${state.activeView === 'friend' ? `
            <div class="friend-status-banner">
              <div class="friend-banner-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Viewing <strong>${escapeHtml(state.friendName)}'s</strong> checklist (${friendStats.completedTopics} / 242 topics completed)</span>
                <span class="friend-read-only-tag">Read Only</span>
              </div>
              <button type="button" id="switchBackToMyBtn" class="btn-pill">
                Switch to My Progress
              </button>
            </div>
          ` : ''}

          <!-- Study Buddy Compare Hero Widget -->
          ${state.activeView === 'compare' ? `
            <section class="compare-hero-card">
              <div class="compare-header-row">
                <div class="compare-title-block">
                  <h2>Study Buddy Head-to-Head</h2>
                  <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                    Track who's clearing more topics towards zero backlogs!
                  </p>
                </div>
                <button type="button" id="compareSyncBtn" class="friend-share-btn">
                  Update Friend's Progress
                </button>
              </div>

              <div class="compare-versus-grid">
                <!-- Player 1: You -->
                <div class="player-card is-you">
                  <div class="player-badge-line">
                    <span class="player-name">You</span>
                    <span class="subject-status-pill" style="background: ${myColor.bg}; color: ${myColor.text}; border-color: ${myColor.border};">
                      ${myStats.percentage}% Done
                    </span>
                  </div>
                  <div class="progress-wrapper">
                    <div class="progress-labels">
                      <span class="progress-count">${myStats.completedTopics} / 242 topics</span>
                      <span class="progress-percentage" style="color: ${myColor.main}">${myStats.percentage}%</span>
                    </div>
                    <div class="progress-track" style="height: 12px;">
                      <div class="progress-fill" style="width: ${myStats.percentage}%; background: ${myColor.gradient};"></div>
                    </div>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px;">
                    ${myStats.completedSubjects} of 8 subjects fully mastered
                  </div>
                </div>

                <!-- VS Badge -->
                <div class="versus-divider">
                  <div class="versus-badge">VS</div>
                </div>

                <!-- Player 2: Friend -->
                <div class="player-card is-friend">
                  <div class="player-badge-line">
                    <span class="player-name">${escapeHtml(state.friendName)}</span>
                    <span class="subject-status-pill" style="background: ${friendColor.bg}; color: ${friendColor.text}; border-color: ${friendColor.border};">
                      ${friendStats.percentage}% Done
                    </span>
                  </div>
                  <div class="progress-wrapper">
                    <div class="progress-labels">
                      <span class="progress-count">${friendStats.completedTopics} / 242 topics</span>
                      <span class="progress-percentage" style="color: ${friendColor.main}">${friendStats.percentage}%</span>
                    </div>
                    <div class="progress-track" style="height: 12px;">
                      <div class="progress-fill" style="width: ${friendStats.percentage}%; background: ${friendColor.gradient};"></div>
                    </div>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px;">
                    ${friendStats.completedSubjects} of 8 subjects fully mastered
                  </div>
                </div>
              </div>

              <!-- Leader verdict -->
              <div style="margin-top: 20px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: var(--radius-sm); text-align: center; font-size: 0.9rem;">
                ${myStats.completedTopics > friendStats.completedTopics ? `
                  🏆 <strong style="color: #60a5fa;">You are leading by ${myStats.completedTopics - friendStats.completedTopics} topics!</strong> Keep up the momentum!
                ` : myStats.completedTopics < friendStats.completedTopics ? `
                  🔥 <strong style="color: #c084fc;">${escapeHtml(state.friendName)} is ahead by ${friendStats.completedTopics - myStats.completedTopics} topics!</strong> Time to catch up!
                ` : `
                  ⚡ <strong>Dead heat tie at ${myStats.completedTopics} topics each!</strong> Who will finish the next unit first?
                `}
              </div>
            </section>
          ` : ''}

          <!-- Overall Progress Hero (for My or Friend view) -->
          ${state.activeView !== 'compare' ? `
            <section class="overall-hero-card">
              <div class="overall-hero-grid">
                <div class="hero-radial-box">
                  <div class="radial-container">
                    <svg class="radial-svg" width="136" height="136" viewBox="0 0 136 136">
                      <circle class="radial-bg" cx="68" cy="68" r="${radius}" strokeWidth="10"></circle>
                      <circle
                        class="radial-meter"
                        cx="68"
                        cy="68"
                        r="${radius}"
                        strokeWidth="10"
                        stroke="${overallColor.main}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${strokeDashoffset}"
                        style="filter: drop-shadow(0 0 8px ${overallColor.glow});"
                      ></circle>
                    </svg>
                    <div class="radial-center-content">
                      <span class="radial-percentage" style="color: ${overallColor.main};">
                        ${overall.percentage}%
                      </span>
                      <span class="radial-subtext">Completed</span>
                    </div>
                  </div>
                </div>

                <div class="hero-details">
                  <div class="hero-header-row">
                    <div>
                      <div class="hero-tagline">
                        <span class="pulse-dot" style="background-color: ${overallColor.main};"></span>
                        <span>${state.activeView === 'friend' ? `${escapeHtml(state.friendName)}'s Progress` : 'Semester Tracker'}</span>
                      </div>
                      <h2 class="hero-headline">
                        ${state.activeView === 'friend' ? `${escapeHtml(state.friendName)}'s Mastery` : 'Overall Mastery'}
                      </h2>
                    </div>

                    <div class="hero-expand-controls">
                      <button type="button" id="toggleExpandAllBtn" class="btn-pill">
                        ${allExpanded ? `
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 12 6 20 14"></polyline></svg>
                          Collapse All
                        ` : `
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          Expand All
                        `}
                      </button>
                    </div>
                  </div>

                  <div class="overall-bar-container">
                    <div class="progress-wrapper">
                      <div class="progress-labels">
                        <span class="progress-count">
                          <strong style="color: ${overallColor.main};">${overall.completedTopics}</strong> / ${overall.totalTopics} topics
                        </span>
                        <span class="progress-percentage" style="color: ${overallColor.main};">
                          ${overall.percentage}%
                        </span>
                      </div>
                      <div class="progress-track" style="height: 16px;">
                        <div
                          class="progress-fill"
                          style="width: ${overall.percentage}%; background: ${overallColor.gradient}; box-shadow: ${overall.percentage > 0 ? `0 0 12px ${overallColor.glow}` : 'none'};"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div class="stats-pills-row">
                    <div class="stat-pill">
                      <span class="stat-pill-label">Cleared</span>
                      <span class="stat-pill-val" style="color: ${overallColor.main};">
                        ${overall.completedTopics} / ${overall.totalTopics}
                      </span>
                    </div>
                    <div class="stat-pill">
                      <span class="stat-pill-label">Remaining</span>
                      <span class="stat-pill-val">
                        ${overall.totalTopics - overall.completedTopics} topics
                      </span>
                    </div>
                    <div class="stat-pill">
                      <span class="stat-pill-label">Subjects Done</span>
                      <span class="stat-pill-val">
                        ${overall.completedSubjects} / ${overall.totalSubjects}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ` : ''}

          <!-- Active Filter Banner -->
          ${(state.showPendingOnly || state.searchTerm) ? `
            <div class="active-filter-banner">
              <div class="filter-banner-text">
                ${state.showPendingOnly ? `<span class="filter-tag">Pending Only</span>` : ''}
                ${state.searchTerm ? `<span class="filter-tag">Matching "${escapeHtml(state.searchTerm)}"</span>` : ''}
              </div>
              <button type="button" id="clearAllFiltersBtn" class="clear-filters-btn">
                Clear Filters
              </button>
            </div>
          ` : ''}

          <!-- 4. Subjects Responsive Grid -->
          <section class="subjects-section">
            <div class="subjects-grid">
              ${syllabus.map(subject => renderSubjectCard(subject, currentCompletedIds)).join('')}
            </div>
          </section>
        </div>
      </main>

      <!-- 5. Footer -->
      <footer class="site-footer">
        <div class="footer-container">
          <p class="footer-brand">
            <strong>mission:zero</strong> • 8 Subjects • 242 Total Topics
          </p>
          <p class="footer-note">
            Your study progress is saved automatically in your browser's local storage.
          </p>
        </div>
      </footer>

      <!-- 6. Confirmation Modal -->
      ${renderModal()}

      <!-- 7. Share / Sync Modal -->
      ${renderShareModal()}

      <!-- 8. Toast Notification -->
      ${state.toastMessage ? `
        <div class="toast-notification" id="toastBox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>${escapeHtml(state.toastMessage)}</span>
        </div>
      ` : ''}
    </div>
  `;

  // Attach Event Listeners
  attachEvents();
}

// Render individual subject card
function renderSubjectCard(subject, completedIds) {
  const isExpanded = state.expandedSubjectIds.has(subject.id);
  const prog = calculateSubjectProgress(subject, completedIds);
  const colorToken = getProgressColor(prog.percentage);
  const isMastered = prog.percentage === 100 && prog.total > 0;
  const isReadOnly = state.activeView === 'friend';

  // Filter topics
  const filteredTopics = subject.topics.filter(topic => {
    const isDone = completedIds.includes(topic.id);
    if (state.showPendingOnly && isDone) return false;
    if (state.searchTerm.trim()) {
      const q = state.searchTerm.toLowerCase();
      const matchTitle = topic.title.toLowerCase().includes(q);
      const matchUnit = (topic.unit || '').toLowerCase().includes(q);
      if (!matchTitle && !matchUnit) return false;
    }
    return true;
  });

  // Group by unit
  const groupedUnits = [];
  let currentUnit = null;
  let currentGroup = [];

  filteredTopics.forEach(topic => {
    const uName = topic.unit || 'General Topics';
    if (uName !== currentUnit) {
      if (currentUnit !== null) {
        groupedUnits.push({ unit: currentUnit, topics: currentGroup });
      }
      currentUnit = uName;
      currentGroup = [topic];
    } else {
      currentGroup.push(topic);
    }
  });
  if (currentUnit !== null) {
    groupedUnits.push({ unit: currentUnit, topics: currentGroup });
  }

  return `
    <div class="subject-card ${isMastered ? 'is-mastered' : ''} ${isExpanded ? 'expanded' : ''}" data-subject-id="${subject.id}">
      <div class="subject-header" data-action="toggleSubject" data-id="${subject.id}">
        <div class="subject-title-row">
          <div class="subject-badge-group">
            <span class="subject-code-badge" style="border-color: ${colorToken.border}; color: ${colorToken.main};">
              ${escapeHtml(subject.name)}
            </span>
            <span class="subject-status-pill" style="background: ${colorToken.bg}; color: ${colorToken.text}; border-color: ${colorToken.border};">
              ${isMastered ? 'Mastered 🎉' : prog.percentage > 0 ? `${prog.percentage}% Done` : 'Pending'}
            </span>
          </div>

          <button type="button" class="expand-toggle-btn" aria-label="Toggle subject">
            <svg class="chevron-icon ${isExpanded ? 'open' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <h3 class="subject-full-title">${escapeHtml(subject.fullName || subject.name)}</h3>

        <div class="subject-progress-area" onclick="event.stopPropagation()">
          <div class="progress-wrapper">
            <div class="progress-labels">
              <span class="progress-count">
                <strong style="color: ${colorToken.main};">${prog.completed}</strong> / ${prog.total} topics
              </span>
              <span class="progress-percentage" style="color: ${colorToken.main};">
                ${prog.percentage}%
              </span>
            </div>
            <div class="progress-track" style="height: 10px;">
              <div
                class="progress-fill"
                style="width: ${prog.percentage}%; background: ${colorToken.gradient}; box-shadow: ${prog.percentage > 0 ? `0 0 12px ${colorToken.glow}` : 'none'};"
              ></div>
            </div>
          </div>
        </div>

        <div class="subject-quick-meta">
          <span>${prog.total} Total Topics</span>
          <span>•</span>
          <span>${prog.total - prog.completed} Remaining</span>
        </div>
      </div>

      ${isExpanded ? `
        <div class="subject-body">
          <div class="subject-actions-bar">
            <div class="action-hints">
              ${state.showPendingOnly ? `<span class="filter-active-hint">Filtering pending only</span>` : ''}
              ${isReadOnly ? `<span style="font-size:0.75rem; color:#c084fc;">Viewing friend's checklist</span>` : ''}
            </div>
            ${!isReadOnly ? `
              <div class="card-buttons">
                ${prog.completed < prog.total ? `
                  <button
                    type="button"
                    class="card-action-btn mark-all"
                    data-action="markAllSubject"
                    data-id="${subject.id}"
                    title="Mark all topics done in this subject"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 11 12 14 22 4"></polyline>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    Mark All Done
                  </button>
                ` : ''}
                ${prog.completed > 0 ? `
                  <button
                    type="button"
                    class="card-action-btn reset"
                    data-action="promptResetSubject"
                    data-id="${subject.id}"
                    title="Reset completed topics for this subject"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                    Reset
                  </button>
                ` : ''}
              </div>
            ` : ''}
          </div>

          ${filteredTopics.length === 0 ? `
            <div class="empty-topic-state">
              ${state.showPendingOnly ? `
                <p>All topics for ${escapeHtml(subject.name)} are completed! 🏆</p>
              ` : `
                <p>No topics match your search query.</p>
              `}
            </div>
          ` : `
            <div class="units-container">
              ${groupedUnits.map(group => `
                <div class="unit-section">
                  <h4 class="unit-header">${escapeHtml(group.unit)}</h4>
                  <div class="topics-list">
                    ${group.topics.map(topic => {
                      const isCompleted = completedIds.includes(topic.id);
                      const originalIndex = subject.topics.findIndex(t => t.id === topic.id);
                      return `
                        <div
                          class="topic-item ${isCompleted ? 'is-completed' : ''} ${isReadOnly ? 'read-only' : ''}"
                          ${!isReadOnly ? `data-action="toggleTopic" data-id="${topic.id}"` : ''}
                          role="checkbox"
                          aria-checked="${isCompleted}"
                          tabindex="${isReadOnly ? '-1' : '0'}"
                          style="${isReadOnly ? 'cursor:default;' : ''}"
                        >
                          <div class="topic-checkbox-container">
                            <div class="custom-checkbox ${isCompleted ? 'checked' : ''}" style="${isReadOnly && isCompleted ? 'background:#8b5cf6; border-color:#8b5cf6;' : ''}">
                              ${isCompleted ? `
                                <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              ` : ''}
                            </div>
                          </div>
                          <div class="topic-content">
                            <span class="topic-number">#${originalIndex + 1}</span>
                            <span class="topic-title">${escapeHtml(topic.title)}</span>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      ` : ''}
    </div>
  `;
}

// Confirmation modal HTML
function renderModal() {
  if (!state.modalConfig.isOpen) return '';

  const isGlobal = state.modalConfig.type === 'global';
  const title = isGlobal ? 'Reset All Progress?' : `Reset ${state.modalConfig.subject?.name || 'Subject'}?`;
  const message = isGlobal
    ? 'Are you sure you want to reset all 242 topics across all 8 subjects? This will clear your entire semester checklist.'
    : `Are you sure you want to clear all completed checkboxes for ${state.modalConfig.subject?.name} (${state.modalConfig.subject?.fullName})?`;

  return `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal-container" onclick="event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div class="modal-icon-badge danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 class="modal-title">${escapeHtml(title)}</h3>
        </div>

        <p class="modal-body">${escapeHtml(message)}</p>

        <div class="modal-actions">
          <button type="button" id="modalCancelBtn" class="btn btn-secondary">
            Cancel
          </button>
          <button type="button" id="modalConfirmBtn" class="btn btn-danger">
            Yes, Reset
          </button>
        </div>
      </div>
    </div>
  `;
}

// Share & Sync Modal HTML
function renderShareModal() {
  if (!state.shareModalOpen) return '';

  const mySyncCode = encodeSyncData(state.completedIds);
  const currentUrl = window.location.origin + window.location.pathname;
  const shareableUrl = `${currentUrl}?friend_sync=${mySyncCode}`;

  return `
    <div class="modal-overlay" id="shareModalOverlay">
      <div class="modal-container" style="max-width: 500px;" onclick="event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div class="modal-icon-badge" style="background: rgba(229, 169, 60, 0.15); color: var(--gold-primary);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">Study Buddy Sync</h3>
            <p style="font-size: 0.78rem; color: var(--text-muted);">Share progress or track your friend's study journey</p>
          </div>
        </div>

        <div class="share-modal-tabs">
          <button type="button" class="share-tab-btn ${state.shareModalTab === 'share' ? 'active' : ''}" data-share-tab="share">
            📤 Share My Progress
          </button>
          <button type="button" class="share-tab-btn ${state.shareModalTab === 'import' ? 'active' : ''}" data-share-tab="import">
            📥 Import Friend's Code
          </button>
        </div>

        ${state.shareModalTab === 'share' ? `
          <div>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 12px;">
              Send this 1-click link to your friend on WhatsApp, Discord, or Telegram. When they open it, they'll see your completed topics in their Study Buddy tab!
            </p>

            <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">1-Click Shareable Link:</label>
            <div class="code-display-box" style="margin-top: 4px;">
              <div class="code-display-text" id="shareUrlText">${escapeHtml(shareableUrl)}</div>
            </div>

            <div style="display:flex; gap: 10px; margin-bottom: 16px;">
              <button type="button" id="copyShareUrlBtn" class="btn btn-secondary" style="flex:1;">
                📋 Copy Share Link
              </button>
              <button type="button" id="copySyncCodeBtn" class="btn btn-secondary" style="flex:1;">
                🔑 Copy Sync Code Only
              </button>
            </div>

            <div style="font-size: 0.82rem; color: var(--text-muted); background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px;">
              Your stats: <strong>${state.completedIds.length} / 242 topics completed (${Math.round((state.completedIds.length/242)*100)}%)</strong>
            </div>
          </div>
        ` : `
          <div>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 12px;">
              Paste the link or sync code your friend sent you to load their checklist and track their progress:
            </p>

            <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Friend's Name:</label>
            <input
              type="text"
              id="friendNameInput"
              class="search-input"
              style="width:100%; background:#090a0f; border:1px solid var(--border-subtle); padding:8px 12px; border-radius:8px; margin-top:4px; margin-bottom:12px;"
              placeholder="e.g. Rahul / Ananya"
              value="${escapeHtml(state.friendName)}"
            />

            <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Paste Link or Sync Code:</label>
            <textarea
              id="importCodeInput"
              class="input-sync-textarea"
              placeholder="Paste the URL or sync code here..."
              style="margin-top: 4px;"
            ></textarea>

            <button type="button" id="submitImportBtn" class="btn" style="width:100%; background:linear-gradient(135deg, #e5a93c, #a855f7); color:#000; font-weight:700;">
              ⚡ Load Friend's Progress
            </button>
          </div>
        `}

        <div class="modal-actions" style="margin-top: 20px;">
          <button type="button" id="closeShareModalBtn" class="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

// Event attachments
function attachEvents() {
  // Splash exit handlers
  const skipBtn = document.getElementById('skipSplashBtn');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      state.showSplash = false;
      sessionStorage.setItem('mission_zero_splash_seen', 'true');
      renderApp();
    });
  }

  // Automatic splash timer
  if (state.showSplash) {
    setTimeout(() => {
      const splash = document.getElementById('splashScreen');
      if (splash) {
        splash.classList.add('splash-exit');
        setTimeout(() => {
          state.showSplash = false;
          sessionStorage.setItem('mission_zero_splash_seen', 'true');
          renderApp();
        }, 500);
      }
    }, 2800);
  }

  // Toast auto-hide
  if (state.toastMessage) {
    setTimeout(() => {
      state.toastMessage = null;
      const toast = document.getElementById('toastBox');
      if (toast) toast.remove();
    }, 3500);
  }

  // View switcher buttons
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeView = btn.getAttribute('data-view');
      renderApp();
    });
  });

  const switchBackBtn = document.getElementById('switchBackToMyBtn');
  if (switchBackBtn) {
    switchBackBtn.addEventListener('click', () => {
      state.activeView = 'my';
      renderApp();
    });
  }

  const compareSyncBtn = document.getElementById('compareSyncBtn');
  if (compareSyncBtn) {
    compareSyncBtn.addEventListener('click', () => {
      state.shareModalOpen = true;
      state.shareModalTab = 'import';
      renderApp();
    });
  }

  // Header handlers
  const openShareModalBtn = document.getElementById('openShareModalBtn');
  if (openShareModalBtn) {
    openShareModalBtn.addEventListener('click', () => {
      state.shareModalOpen = true;
      state.shareModalTab = 'share';
      renderApp();
    });
  }

  const headerBrand = document.getElementById('headerLogoBrand');
  if (headerBrand) {
    headerBrand.addEventListener('click', () => {
      state.showSplash = true;
      renderApp();
    });
  }

  const replayBtn = document.getElementById('replayIntroBtn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      state.showSplash = true;
      renderApp();
    });
  }

  const searchInput = document.getElementById('topicSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value;
      renderApp();
      const newInput = document.getElementById('topicSearchInput');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });
  }

  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      state.searchTerm = '';
      renderApp();
    });
  }

  const pendingFilterBtn = document.getElementById('pendingFilterBtn');
  if (pendingFilterBtn) {
    pendingFilterBtn.addEventListener('click', () => {
      state.showPendingOnly = !state.showPendingOnly;
      renderApp();
    });
  }

  const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
  if (clearAllFiltersBtn) {
    clearAllFiltersBtn.addEventListener('click', () => {
      state.showPendingOnly = false;
      state.searchTerm = '';
      renderApp();
    });
  }

  const toggleExpandAllBtn = document.getElementById('toggleExpandAllBtn');
  if (toggleExpandAllBtn) {
    toggleExpandAllBtn.addEventListener('click', () => {
      if (state.expandedSubjectIds.size === syllabus.length) {
        state.expandedSubjectIds.clear();
      } else {
        state.expandedSubjectIds = new Set(syllabus.map(s => s.id));
      }
      renderApp();
    });
  }

  const globalResetBtn = document.getElementById('globalResetBtn');
  if (globalResetBtn) {
    globalResetBtn.addEventListener('click', () => {
      state.modalConfig = { isOpen: true, type: 'global', subject: null };
      renderApp();
    });
  }

  // Delegated subject card actions
  document.querySelectorAll('[data-action="toggleSubject"]').forEach(el => {
    el.addEventListener('click', () => {
      const subId = el.getAttribute('data-id');
      if (state.expandedSubjectIds.has(subId)) {
        state.expandedSubjectIds.delete(subId);
      } else {
        state.expandedSubjectIds.add(subId);
      }
      renderApp();
    });
  });

  document.querySelectorAll('[data-action="toggleTopic"]').forEach(el => {
    el.addEventListener('click', () => {
      const topicId = el.getAttribute('data-id');
      state.toggleTopic(topicId);
      renderApp();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const topicId = el.getAttribute('data-id');
        state.toggleTopic(topicId);
        renderApp();
      }
    });
  });

  document.querySelectorAll('[data-action="markAllSubject"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const subId = el.getAttribute('data-id');
      const subject = syllabus.find(s => s.id === subId);
      if (subject) {
        state.markAllSubject(subject);
        renderApp();
      }
    });
  });

  document.querySelectorAll('[data-action="promptResetSubject"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const subId = el.getAttribute('data-id');
      const subject = syllabus.find(s => s.id === subId);
      if (subject) {
        state.modalConfig = { isOpen: true, type: 'subject', subject };
        renderApp();
      }
    });
  });

  // Modal actions
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', () => {
      state.modalConfig = { isOpen: false, type: null, subject: null };
      renderApp();
    });
  }

  const modalCancelBtn = document.getElementById('modalCancelBtn');
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', () => {
      state.modalConfig = { isOpen: false, type: null, subject: null };
      renderApp();
    });
  }

  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener('click', () => {
      if (state.modalConfig.type === 'global') {
        state.resetAll();
      } else if (state.modalConfig.type === 'subject' && state.modalConfig.subject) {
        state.resetSubject(state.modalConfig.subject);
      }
      state.modalConfig = { isOpen: false, type: null, subject: null };
      renderApp();
    });
  }

  // Share / Sync Modal actions
  const shareModalOverlay = document.getElementById('shareModalOverlay');
  if (shareModalOverlay) {
    shareModalOverlay.addEventListener('click', () => {
      state.shareModalOpen = false;
      renderApp();
    });
  }

  const closeShareModalBtn = document.getElementById('closeShareModalBtn');
  if (closeShareModalBtn) {
    closeShareModalBtn.addEventListener('click', () => {
      state.shareModalOpen = false;
      renderApp();
    });
  }

  document.querySelectorAll('[data-share-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      state.shareModalTab = tabBtn.getAttribute('data-share-tab');
      renderApp();
    });
  });

  const copyShareUrlBtn = document.getElementById('copyShareUrlBtn');
  if (copyShareUrlBtn) {
    copyShareUrlBtn.addEventListener('click', () => {
      const code = encodeSyncData(state.completedIds);
      const url = `${window.location.origin}${window.location.pathname}?friend_sync=${code}`;
      navigator.clipboard.writeText(url).then(() => {
        state.toastMessage = '1-Click Share Link copied to clipboard!';
        renderApp();
      });
    });
  }

  const copySyncCodeBtn = document.getElementById('copySyncCodeBtn');
  if (copySyncCodeBtn) {
    copySyncCodeBtn.addEventListener('click', () => {
      const code = encodeSyncData(state.completedIds);
      navigator.clipboard.writeText(code).then(() => {
        state.toastMessage = 'Sync code copied to clipboard!';
        renderApp();
      });
    });
  }

  const submitImportBtn = document.getElementById('submitImportBtn');
  if (submitImportBtn) {
    submitImportBtn.addEventListener('click', () => {
      const codeInput = document.getElementById('importCodeInput');
      const nameInput = document.getElementById('friendNameInput');
      const rawCode = codeInput ? codeInput.value : '';
      const friendName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Study Buddy';

      if (!rawCode.trim()) {
        alert('Please paste your friend’s link or sync code first.');
        return;
      }

      const importedIds = decodeSyncData(rawCode);
      if (importedIds === null) {
        alert('Invalid sync code or link. Please double-check what your friend sent.');
        return;
      }

      state.friendCompletedIds = importedIds;
      state.friendName = friendName;
      state.saveFriendCompleted();
      localStorage.setItem(STORAGE_KEY_FRIEND_NAME, friendName);

      state.shareModalOpen = false;
      state.activeView = 'friend';
      state.toastMessage = `Synced ${friendName}'s progress (${importedIds.length} topics)!`;
      renderApp();
    });
  }
}

// Initial Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
