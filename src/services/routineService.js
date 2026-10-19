/**
 * Daily Routine Tracker Service
 * Manages structured time-blocked protocols (Morning, Afternoon, Evening, Night)
 */
import { getStoredItem, setStoredItem, getTodayDateKey } from './storageHelper';

const INITIAL_ROUTINES = [
  {
    id: 'rt_morning_1',
    timeBlock: 'Morning',
    timeHint: '06:30 AM',
    title: 'Hydration & Electrolytes',
    detail: 'Drink 500ml water with sea salt and lemon',
  },
  {
    id: 'rt_morning_2',
    timeBlock: 'Morning',
    timeHint: '07:00 AM',
    title: 'Sunlight & Mobility Drill',
    detail: '10 mins outdoor natural light and hip flexor stretches',
  },
  {
    id: 'rt_morning_3',
    timeBlock: 'Morning',
    timeHint: '07:30 AM',
    title: 'High-Protein Breakfast',
    detail: 'Eggs, oats, and creatine shake (40g+ protein)',
  },
  {
    id: 'rt_afternoon_1',
    timeBlock: 'Afternoon',
    timeHint: '01:00 PM',
    title: 'Deep Work Sprint 1',
    detail: '90-min focused DSA/Engineering session without phone',
  },
  {
    id: 'rt_afternoon_2',
    timeBlock: 'Afternoon',
    timeHint: '04:30 PM',
    title: 'Workout & Training',
    detail: 'Push workout or sprint session at gym',
  },
  {
    id: 'rt_evening_1',
    timeBlock: 'Evening',
    timeHint: '08:00 PM',
    title: 'Macro-Target Dinner',
    detail: 'Clean whole foods meeting daily protein target',
  },
  {
    id: 'rt_evening_2',
    timeBlock: 'Evening',
    timeHint: '09:30 PM',
    title: 'Digital Sunset',
    detail: 'Blue light filters on, plan tomorrow’s 3 major priorities',
  },
  {
    id: 'rt_night_1',
    timeBlock: 'Night',
    timeHint: '10:30 PM',
    title: 'Deep Recovery Sleep',
    detail: 'Cool bedroom (19°C), dark curtains, target 8 hours',
  },
];

export const routineService = {
  getRoutines(uid) {
    return getStoredItem(`routines_${uid || 'guest'}`, INITIAL_ROUTINES);
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
    const allLogs = getStoredItem(`routineLogs_${uid || 'guest'}`, {
      [getTodayDateKey()]: ['rt_morning_1', 'rt_morning_2'],
    });
    return allLogs[dateKey] || [];
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
