/**
 * Goals & Daily Routine Tracker Service
 * Direct Cloud Firestore Integration for project `uplevel-7095f`.
 *
 * Paths:
 * - Goals: `users/{uid}/goals/{goalId}`
 * - Daily Logs: `users/{uid}/dailyLogs/{date}`
 *
 * Strict Isolation: Every user sees only their own goals.
 * No demo data or localStorage is used as the primary database.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { getStoredItem, setStoredItem, getTodayDateKey } from './storageHelper.js';

export const goalsService = {
  /**
   * Listen to all goals in real-time from Firestore: users/{uid}/goals
   * Emits updated goals array on every change.
   */
  subscribeToGoals(uid, onUpdate, onError) {
    if (!uid) {
      if (typeof onUpdate === 'function') onUpdate([]);
      return () => {};
    }

    if (db) {
      try {
        const goalsColl = collection(db, 'users', uid, 'goals');
        const q = query(goalsColl, orderBy('createdAt', 'desc'));

        return onSnapshot(
          q,
          (snapshot) => {
            const goals = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            // Update local user cache for offline resilience
            setStoredItem(`goals_${uid}`, goals);
            if (typeof onUpdate === 'function') onUpdate(goals);
          },
          (error) => {
            console.error(`[Firestore:goals] Error listening to users/${uid}/goals:`, error);
            // Fallback to user-scoped cache only
            const cached = getStoredItem(`goals_${uid}`, []);
            if (typeof onUpdate === 'function') onUpdate(cached);
            if (typeof onError === 'function') onError(error);
          }
        );
      } catch (err) {
        console.error('[Firestore:goals] Subscription setup failed:', err);
        if (typeof onError === 'function') onError(err);
      }
    }

    // Offline / fallback: return user-scoped cache (never demo goals)
    const cached = getStoredItem(`goals_${uid}`, []);
    if (typeof onUpdate === 'function') onUpdate(cached);
    return () => {};
  },

  /**
   * Get all goals for a user: users/{uid}/goals
   * Returns empty array if user has 0 goals.
   */
  async getGoals(uid) {
    if (!uid) return [];

    if (db) {
      try {
        const goalsColl = collection(db, 'users', uid, 'goals');
        const snap = await getDocs(goalsColl);
        const goals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Sort descending by creation date
        goals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        // Update user-scoped cache
        setStoredItem(`goals_${uid}`, goals);
        return goals;
      } catch (err) {
        console.warn(`[Firestore:goals] Read error at users/${uid}/goals:`, err.code, err.message);
        return getStoredItem(`goals_${uid}`, []);
      }
    }

    return getStoredItem(`goals_${uid}`, []);
  },

  /**
   * Create a new goal: users/{uid}/goals/{goalId}
   */
  async createGoal(uid, goalData) {
    if (!uid) throw new Error('Authentication required: Cannot create goal without valid UID.');

    const goalId = 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newGoal = {
      id: goalId,
      title: goalData.title.trim(),
      description: (goalData.description || '').trim(),
      category: goalData.category || 'Fitness',
      frequency: goalData.frequency || 'daily',
      targetValue: Number(goalData.targetValue) || 1,
      targetUnit: (goalData.targetUnit || 'units').trim(),
      status: 'active',
      startDate: goalData.startDate || getTodayDateKey(),
      endDate: goalData.endDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Primary write: Cloud Firestore
    if (db) {
      try {
        const goalRef = doc(db, 'users', uid, 'goals', goalId);
        await setDoc(goalRef, {
          ...newGoal,
          serverTimestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error(`[Firestore:goals] Failed to write to users/${uid}/goals/${goalId}:`, err.code, err.message);
        if (err.code !== 'permission-denied') {
          throw err;
        }
      }
    }

    // Update user-scoped local backup
    const cached = getStoredItem(`goals_${uid}`, []);
    setStoredItem(`goals_${uid}`, [newGoal, ...cached.filter((g) => g.id !== goalId)]);

    return newGoal;
  },

  /**
   * Update an existing goal: users/{uid}/goals/{goalId}
   */
  async updateGoal(uid, goalId, updates) {
    if (!uid || !goalId) throw new Error('User UID and Goal ID required to update goal.');

    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Primary write: Cloud Firestore
    if (db) {
      try {
        const goalRef = doc(db, 'users', uid, 'goals', goalId);
        await setDoc(goalRef, cleanUpdates, { merge: true });
      } catch (err) {
        console.error(`[Firestore:goals] Failed to update users/${uid}/goals/${goalId}:`, err.code, err.message);
        if (err.code !== 'permission-denied') {
          throw err;
        }
      }
    }

    // Update user-scoped local backup
    const cached = getStoredItem(`goals_${uid}`, []);
    const updated = cached.map((g) => (g.id === goalId ? { ...g, ...cleanUpdates } : g));
    setStoredItem(`goals_${uid}`, updated);

    return updated;
  },

  /**
   * Delete a goal: users/{uid}/goals/{goalId}
   */
  async deleteGoal(uid, goalId) {
    if (!uid || !goalId) throw new Error('User UID and Goal ID required to delete goal.');

    // Primary write: Cloud Firestore
    if (db) {
      try {
        const goalRef = doc(db, 'users', uid, 'goals', goalId);
        await deleteDoc(goalRef);
      } catch (err) {
        console.error(`[Firestore:goals] Failed to delete users/${uid}/goals/${goalId}:`, err.code, err.message);
        if (err.code !== 'permission-denied') {
          throw err;
        }
      }
    }

    // Update user-scoped local backup
    const cached = getStoredItem(`goals_${uid}`, []);
    const filtered = cached.filter((g) => g.id !== goalId);
    setStoredItem(`goals_${uid}`, filtered);

    return filtered;
  },

  /**
   * Get daily completion log for a specific date: users/{uid}/dailyLogs/{date}
   */
  async getDailyLog(uid, dateKey = getTodayDateKey()) {
    if (!uid) return [];

    if (db) {
      try {
        const logRef = doc(db, 'users', uid, 'dailyLogs', dateKey);
        const snap = await getDoc(logRef);
        if (snap.exists()) {
          const data = snap.data();
          const completedGoals = Array.isArray(data?.completedGoals) ? data.completedGoals : [];
          // Update cache
          const allUserLogs = getStoredItem(`dailyLogs_${uid}`, {});
          allUserLogs[dateKey] = completedGoals;
          setStoredItem(`dailyLogs_${uid}`, allUserLogs);
          return completedGoals;
        }
        return [];
      } catch (err) {
        console.warn(`[Firestore:dailyLogs] Read error at users/${uid}/dailyLogs/${dateKey}:`, err.code, err.message);
        const allUserLogs = getStoredItem(`dailyLogs_${uid}`, {});
        return allUserLogs[dateKey] || [];
      }
    }

    const allUserLogs = getStoredItem(`dailyLogs_${uid}`, {});
    return allUserLogs[dateKey] || [];
  },

  /**
   * Toggle completion of a goal on a given date: users/{uid}/dailyLogs/{date}
   * Ticking a goal on one date never mutates another date.
   */
  async toggleGoalCompletion(uid, goalId, dateKey = getTodayDateKey()) {
    if (!uid || !goalId) throw new Error('User UID and Goal ID required to toggle completion.');

    const currentCompleted = await this.getDailyLog(uid, dateKey);
    let updatedCompleted;
    let isCompletedNow;

    if (currentCompleted.includes(goalId)) {
      updatedCompleted = currentCompleted.filter((id) => id !== goalId);
      isCompletedNow = false;
    } else {
      updatedCompleted = [...currentCompleted, goalId];
      isCompletedNow = true;
    }

    // Primary write: Cloud Firestore
    if (db) {
      try {
        const logRef = doc(db, 'users', uid, 'dailyLogs', dateKey);
        await setDoc(logRef, {
          date: dateKey,
          completedGoals: updatedCompleted,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error(`[Firestore:dailyLogs] Failed to write users/${uid}/dailyLogs/${dateKey}:`, err.code, err.message);
        if (err.code !== 'permission-denied') {
          throw err;
        }
      }
    }

    // Update user-scoped local backup
    const allUserLogs = getStoredItem(`dailyLogs_${uid}`, {});
    allUserLogs[dateKey] = updatedCompleted;
    setStoredItem(`dailyLogs_${uid}`, allUserLogs);

    return {
      completedGoalIds: updatedCompleted,
      isCompletedNow,
    };
  },

  /**
   * Get all daily logs for streaks & history
   */
  getAllDailyLogs(uid) {
    if (!uid) return {};
    return getStoredItem(`dailyLogs_${uid}`, {});
  },

  /**
   * Calculate current streak & best streak from historical completion logs
   */
  calculateStreaks(uid) {
    if (!uid) return { currentStreak: 0, bestStreak: 0 };
    const allLogs = this.getAllDailyLogs(uid);
    if (!allLogs || Object.keys(allLogs).length === 0) {
      return { currentStreak: 0, bestStreak: 0 };
    }

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    // Scan past 60 days
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      const completed = allLogs[dateKey] || [];
      const hasCompleted = completed.length > 0;

      if (hasCompleted) {
        tempStreak++;
        if (i === currentStreak) {
          currentStreak++;
        }
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        if (i > 0) {
          tempStreak = 0;
        }
      }
    }

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
    };
  },

  /**
   * Clear all local caches for a user upon signout
   */
  clearUserCache(uid) {
    if (uid) {
      try {
        localStorage.removeItem(`goals_${uid}`);
        localStorage.removeItem(`dailyLogs_${uid}`);
      } catch (e) {
        console.warn('Cache clear error:', e);
      }
    }
  },
};
