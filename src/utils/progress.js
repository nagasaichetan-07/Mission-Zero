/**
 * Utility functions for progress calculation and styling
 */

export const calculateSubjectProgress = (subject, completedIds = []) => {
  if (!subject || !Array.isArray(subject.topics) || subject.topics.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const completed = subject.topics.filter(t => completedIds.includes(t.id)).length;
  const total = subject.topics.length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
};

export const calculateOverallProgress = (syllabusList = [], completedIds = []) => {
  if (!Array.isArray(syllabusList) || syllabusList.length === 0) {
    return {
      completedTopics: 0,
      totalTopics: 0,
      percentage: 0,
      completedSubjects: 0,
      totalSubjects: 0
    };
  }

  let totalTopics = 0;
  let completedTopics = 0;
  let completedSubjects = 0;

  syllabusList.forEach(subject => {
    const subProg = calculateSubjectProgress(subject, completedIds);
    totalTopics += subProg.total;
    completedTopics += subProg.completed;
    if (subProg.completed === subProg.total && subProg.total > 0) {
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
};

/**
 * Returns color tokens based on progress percentage
 * Red (0-35%) -> Amber (36-75%) -> Green (76-100%)
 */
export const getProgressColor = (percent) => {
  if (percent >= 76) {
    return {
      main: '#10b981',       // Emerald Green
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
      main: '#f59e0b',       // Radiant Amber
      gradient: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
      glow: 'rgba(245, 158, 11, 0.4)',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#fbbf24',
      label: 'Good Momentum'
    };
  }
  return {
    main: '#ef4444',         // Crimson Red
    gradient: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
    glow: 'rgba(239, 68, 68, 0.4)',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#f87171',
    label: 'Getting Started'
  };
};
