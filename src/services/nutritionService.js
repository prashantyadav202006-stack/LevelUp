/**
 * Nutrition & Diet Tracker Service
 * Manages daily meal logs, verified food database, macro calculations, and favorites
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase.js';
import { getStoredItem, setStoredItem, getTodayDateKey } from './storageHelper.js';

// Verified Healthy Food Database for instant search & logging
export const FOOD_DATABASE = [
  { id: 'f_oats', name: 'Rolled Oats with Chia Seeds', serving: '100g', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, category: 'Grains' },
  { id: 'f_chicken', name: 'Grilled Chicken Breast', serving: '150g', calories: 247, protein: 46.5, carbs: 0, fats: 5.4, category: 'Protein' },
  { id: 'f_eggs', name: 'Whole Eggs (Boiled / Poached)', serving: '2 large (100g)', calories: 155, protein: 12.6, carbs: 1.1, fats: 10.6, category: 'Protein' },
  { id: 'f_whey', name: 'Whey Protein Isolate Shake', serving: '1 scoop (32g)', calories: 120, protein: 25.0, carbs: 2.0, fats: 1.0, category: 'Supplements' },
  { id: 'f_rice', name: 'Steamed Jasmine / Brown Rice', serving: '150g cooked', calories: 195, protein: 4.2, carbs: 42.0, fats: 0.6, category: 'Carbs' },
  { id: 'f_salmon', name: 'Wild Atlantic Salmon Fillet', serving: '150g', calories: 312, protein: 34.0, carbs: 0, fats: 18.5, category: 'Protein' },
  { id: 'f_banana', name: 'Fresh Banana', serving: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27.0, fats: 0.3, category: 'Fruit' },
  { id: 'f_yogurt', name: 'Greek Yogurt 0% Fat', serving: '170g', calories: 100, protein: 18.0, carbs: 6.0, fats: 0, category: 'Dairy' },
  { id: 'f_almonds', name: 'Raw Whole Almonds', serving: '30g', calories: 173, protein: 6.4, carbs: 6.1, fats: 15.0, category: 'Fats' },
  { id: 'f_avocado', name: 'Fresh Avocado', serving: '1/2 medium (100g)', calories: 160, protein: 2.0, carbs: 8.5, fats: 14.7, category: 'Fats' },
  { id: 'f_broccoli', name: 'Steamed Broccoli Florets', serving: '150g', calories: 51, protein: 4.2, carbs: 10.0, fats: 0.6, category: 'Vegetables' },
  { id: 'f_sweet_potato', name: 'Baked Sweet Potato', serving: '200g', calories: 180, protein: 4.0, carbs: 41.4, fats: 0.3, category: 'Carbs' },
  { id: 'f_peanut_butter', name: 'Natural Peanut Butter', serving: '2 tbsp (32g)', calories: 188, protein: 8.0, carbs: 7.0, fats: 16.0, category: 'Fats' },
  { id: 'f_paneer', name: 'Low-Fat Cottage Cheese / Paneer', serving: '100g', calories: 180, protein: 18.0, carbs: 4.0, fats: 10.0, category: 'Protein' },
];

export const nutritionService = {
  // Get all meal logs for a specific date
  async getDayLogs(uid, dateKey = getTodayDateKey()) {
    if (db && isFirebaseConfigured && uid) {
      try {
        const foodColl = collection(db, 'users', uid, 'foodLogs');
        const snap = await getDocs(foodColl);
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const filtered = list.filter(
            (item) => item.date === dateKey && !item.id?.startsWith('log_sample_')
          );
          if (filtered.length > 0) return filtered;
        }
      } catch (e) {
        console.warn('Firestore foodLogs error:', e);
      }
    }

    const allLogs = getStoredItem(`foodLogs_${uid || 'guest'}`, {});
    const dayEntries = allLogs[dateKey] || [];
    return dayEntries.filter((item) => !item.id?.startsWith('log_sample_'));
  },

  // Add a new food entry
  async addFoodLog(uid, entryData) {
    const dateKey = entryData.date || getTodayDateKey();
    const newEntry = {
      id: 'food_' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: entryData.name,
      mealType: entryData.mealType || 'lunch',
      serving: entryData.serving || '1 serving',
      quantity: Number(entryData.quantity) || 1,
      calories: Math.round(Number(entryData.calories) || 0),
      protein: Math.round(Number(entryData.protein) || 0),
      carbs: Math.round(Number(entryData.carbs) || 0),
      fats: Math.round(Number(entryData.fats) || 0),
      date: dateKey,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const allLogs = getStoredItem(`foodLogs_${uid || 'guest'}`, {});
    const dayList = allLogs[dateKey] || [];
    allLogs[dateKey] = [newEntry, ...dayList];
    setStoredItem(`foodLogs_${uid || 'guest'}`, allLogs);

    if (db && isFirebaseConfigured && uid) {
      try {
        const foodDocRef = doc(db, 'users', uid, 'foodLogs', newEntry.id);
        await setDoc(foodDocRef, { ...newEntry, serverTime: serverTimestamp() });
      } catch (err) {
        console.warn('Firestore addFoodLog error:', err);
      }
    }

    return newEntry;
  },

  // Delete a food entry
  async deleteFoodLog(uid, logId, dateKey = getTodayDateKey()) {
    const allLogs = getStoredItem(`foodLogs_${uid || 'guest'}`, {});
    const dayList = allLogs[dateKey] || [];
    allLogs[dateKey] = dayList.filter((item) => item.id !== logId);
    setStoredItem(`foodLogs_${uid || 'guest'}`, allLogs);

    if (db && isFirebaseConfigured && uid) {
      try {
        const foodDocRef = doc(db, 'users', uid, 'foodLogs', logId);
        await deleteDoc(foodDocRef);
      } catch (err) {
        console.warn('Firestore deleteFoodLog error:', err);
      }
    }
    return allLogs[dateKey];
  },

  // Calculate day totals (Calories, Protein, Carbs, Fats)
  calculateTotals(logs = [], targets = { calories: 2400, protein: 150, carbs: 260, fats: 65 }) {
    const consumed = logs.reduce(
      (acc, item) => ({
        calories: acc.calories + (Number(item.calories) || 0),
        protein: acc.protein + (Number(item.protein) || 0),
        carbs: acc.carbs + (Number(item.carbs) || 0),
        fats: acc.fats + (Number(item.fats) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const remainingCalories = Math.max(0, targets.calories - consumed.calories);

    return {
      consumed,
      targets,
      remainingCalories,
      caloriesPct: Math.min(100, Math.round((consumed.calories / targets.calories) * 100)),
      proteinPct: Math.min(100, Math.round((consumed.protein / targets.protein) * 100)),
      carbsPct: Math.min(100, Math.round((consumed.carbs / targets.carbs) * 100)),
      fatsPct: Math.min(100, Math.round((consumed.fats / targets.fats) * 100)),
    };
  },

  // Save Favorite Foods
  getFavorites(uid) {
    return getStoredItem(`favorites_${uid || 'guest'}`, []);
  },

  toggleFavorite(uid, food) {
    const current = this.getFavorites(uid);
    const exists = current.some((f) => f.id === food.id || f.name === food.name);
    const updated = exists
      ? current.filter((f) => f.id !== food.id && f.name !== food.name)
      : [...current, food];
    setStoredItem(`favorites_${uid || 'guest'}`, updated);
    return updated;
  },
};
