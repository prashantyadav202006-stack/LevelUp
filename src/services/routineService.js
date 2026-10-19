/**
 * Daily Routine Tracker Service
 * Manages structured time-blocked protocols (Morning, Afternoon, Evening, Night)
 */
import { getStoredItem, setStoredItem, getTodayDateKey } from './storageHelper.js';

export const routineService = {
  getRoutines(uid) {
    const list = getStoredItem(`routines_${uid || 'guest'}`, []);
    return (list || []).filter(
      (r) =>
        !r.id?.startsWith('rt_morning_') &&
        !r.id?.startsWith('rt_afternoon_') &&
        !r.id?.startsWith('rt_evening_') &&
        !r.id?.startsWith('rt_night_')
    );
  },

  addRoutineItem(uid, item) {
    const current = this.getRoutines(uid);
    const newItem = {
      id: 'rt_' + Date.now(),
      timeBlock: item.timeBlock || 'Morning',
      timeHint: item.timeHint || '08:00 AM',
      title: item.title,
      detail: item.detail || '',
    };
    const updated = [...current, newItem];
    setStoredItem(`routines_${uid || 'guest'}`, updated);
    return newItem;
  },

  deleteRoutineItem(uid, routineId) {
    const current = this.getRoutines(uid);
    const updated = current.filter((r) => r.id !== routineId);
    setStoredItem(`routines_${uid || 'guest'}`, updated);
    return updated;
  },

  getCompletedRoutines(uid, dateKey = getTodayDateKey()) {
    const allLogs = getStoredItem(`routineLogs_${uid || 'guest'}`, {});
    const dayLogs = allLogs[dateKey] || [];
    return dayLogs.filter(
      (id) =>
        !id.startsWith('rt_morning_') &&
        !id.startsWith('rt_afternoon_') &&
        !id.startsWith('rt_evening_') &&
        !id.startsWith('rt_night_')
    );
  },

  toggleRoutineCompletion(uid, routineId, dateKey = getTodayDateKey()) {
    const allLogs = getStoredItem(`routineLogs_${uid || 'guest'}`, {});
    const currentDay = allLogs[dateKey] || [];
    const updated = currentDay.includes(routineId)
      ? currentDay.filter((id) => id !== routineId)
      : [...currentDay, routineId];
    allLogs[dateKey] = updated;
    setStoredItem(`routineLogs_${uid || 'guest'}`, allLogs);
    return updated;
  },
};
