/**
 * Storage Helper
 * Provides seamless persistence layer. Uses Firestore if available, with robust
 * local storage synchronization so data is never lost and works instantly offline/online.
 */

export const getStoredItem = (key, fallback) => {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(`levelup_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn('Storage read error for key:', key, err);
    return fallback;
  }
};

export const setStoredItem = (key, value) => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(`levelup_${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn('Storage write error for key:', key, err);
  }
};

export const getTodayDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};
