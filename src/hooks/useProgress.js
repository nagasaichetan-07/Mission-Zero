import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mission_zero_completed_topic_ids';

export const useProgress = () => {
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Failed to load completed topics from localStorage:', e);
    }
    return [];
  });

  // Save only the IDs whenever completedIds changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
    } catch (e) {
      console.error('Failed to save completed topics to localStorage:', e);
    }
  }, [completedIds]);

  const toggleTopic = useCallback((topicId) => {
    setCompletedIds(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  }, []);

  const resetSubject = useCallback((subjectTopics = []) => {
    const topicIdsToRemove = new Set(subjectTopics.map(t => t.id));
    setCompletedIds(prev => prev.filter(id => !topicIdsToRemove.has(id)));
  }, []);

  const markSubjectComplete = useCallback((subjectTopics = []) => {
    const topicIdsToAdd = subjectTopics.map(t => t.id);
    setCompletedIds(prev => Array.from(new Set([...prev, ...topicIdsToAdd])));
  }, []);

  const resetAll = useCallback(() => {
    setCompletedIds([]);
  }, []);

  const isCompleted = useCallback((topicId) => {
    return completedIds.includes(topicId);
  }, [completedIds]);

  return {
    completedIds,
    toggleTopic,
    resetSubject,
    markSubjectComplete,
    resetAll,
    isCompleted
  };
};
