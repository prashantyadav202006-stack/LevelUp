/**
 * Fitness & Activity Tracker Service
 * Manages workouts, water intake, daily steps, and body weight logs
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { getStoredItem, setStoredItem, getTodayDateKey } from './storageHelper';

const INITIAL_WORKOUTS = [
  {
    id: 'wo_1',
    title: 'Heavy Push & Triceps Burnout',
    type: 'Strength',
    duration: 55, // minutes
    caloriesBurned: 420,
    notes: 'Bench press 4x8 @ 85kg, Incline DB press 3x10 @ 30kg, Cable flyes & skull crushers',
    date: getTodayDateKey(),
    createdAt: '07:30 AM',
  },
  {
    id: 'wo_2',
    title: 'Zone 2 Cardio & Core Stability',
    type: 'Cardio',
    duration: 40,
    caloriesBurned: 310,
    notes: 'Incline treadmill walk @ 5.8 km/h, 15% incline + plank tabata',
    date: '2026-10-17',
    createdAt: '06:45 PM',
  },
  {
    id: 'wo_3',
    title: 'Leg Hypertrophy & Squats',
    type: 'Strength',
    duration: 65,
    caloriesBurned: 540,
    notes: 'Barbell back squat 5x5 @ 120kg, Romanian deadlifts 4x10, Bulgarian split squats',
    date: '2026-10-15',
    createdAt: '08:00 AM',
  },
];

const INITIAL_WEIGHT_LOGS = [
  { id: 'wt_1', weight: 78.4, date: '2026-10-01' },
  { id: 'wt_2', weight: 78.1, date: '2026-10-05' },
  { id: 'wt_3', weight: 77.8, date: '2026-10-10' },
  { id: 'wt_4', weight: 77.5, date: '2026-10-14' },
  { id: 'wt_5', weight: 77.2, date: getTodayDateKey() },
];

export const fitnessService = {
  // WORKOUTS
  async getWorkouts(uid) {
    if (db && isFirebaseConfigured && uid) {
      try {
        const woColl = collection(db, 'users', uid, 'workouts');
        const snap = await getDocs(woColl);
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn('Firestore getWorkouts error:', e);
      }
    }
    return getStoredItem(`workouts_${uid || 'guest'}`, INITIAL_WORKOUTS);
  },

  async logWorkout(uid, workoutData) {
    const newWorkout = {
      id: 'workout_' + Date.now() + Math.random().toString(36).substring(2, 6),
      title: workoutData.title || 'Training Session',
      type: workoutData.type || 'Strength',
      duration: Number(workoutData.duration) || 45,
      caloriesBurned: Number(workoutData.caloriesBurned) || 300,
      notes: workoutData.notes || '',
      date: workoutData.date || getTodayDateKey(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const current = await this.getWorkouts(uid);
    const updated = [newWorkout, ...current];
    setStoredItem(`workouts_${uid || 'guest'}`, updated);

    if (db && isFirebaseConfigured && uid) {
      try {
        const woRef = doc(db, 'users', uid, 'workouts', newWorkout.id);
        await setDoc(woRef, { ...newWorkout, serverTime: serverTimestamp() });
      } catch (err) {
        console.warn('Firestore logWorkout error:', err);
      }
    }

    return newWorkout;
  },

  async deleteWorkout(uid, workoutId) {
    const current = await this.getWorkouts(uid);
    const updated = current.filter((w) => w.id !== workoutId);
    setStoredItem(`workouts_${uid || 'guest'}`, updated);

    if (db && isFirebaseConfigured && uid) {
      try {
        const woRef = doc(db, 'users', uid, 'workouts', workoutId);
        await deleteDoc(woRef);
      } catch (err) {
        console.warn('Firestore deleteWorkout error:', err);
      }
    }
    return updated;
  },

  // WATER INTAKE TRACKER
  getWaterLog(uid, dateKey = getTodayDateKey()) {
    const allWater = getStoredItem(`water_${uid || 'guest'}`, {
      [getTodayDateKey()]: 2250, // ml
    });
    return allWater[dateKey] || 0;
  },

  async addWater(uid, amountMl, dateKey = getTodayDateKey()) {
    const allWater = getStoredItem(`water_${uid || 'guest'}`, {});
    const current = allWater[dateKey] || 0;
    const updatedAmount = Math.max(0, current + amountMl);
    allWater[dateKey] = updatedAmount;
    setStoredItem(`water_${uid || 'guest'}`, allWater);

    if (db && isFirebaseConfigured && uid) {
      try {
        const waterRef = doc(db, 'users', uid, 'waterLogs', dateKey);
        await setDoc(waterRef, {
          date: dateKey,
          amountMl: updatedAmount,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Firestore addWater error:', e);
      }
    }

    return updatedAmount;
  },

  // DAILY STEPS TRACKER
  getStepsLog(uid, dateKey = getTodayDateKey()) {
    const allSteps = getStoredItem(`steps_${uid || 'guest'}`, {
      [getTodayDateKey()]: 7840,
    });
    return allSteps[dateKey] || 0;
  },

  async updateSteps(uid, count, dateKey = getTodayDateKey()) {
    const allSteps = getStoredItem(`steps_${uid || 'guest'}`, {});
    allSteps[dateKey] = Number(count) || 0;
    setStoredItem(`steps_${uid || 'guest'}`, allSteps);

    if (db && isFirebaseConfigured && uid) {
      try {
        const stepsRef = doc(db, 'users', uid, 'stepLogs', dateKey);
        await setDoc(stepsRef, {
          date: dateKey,
          steps: Number(count) || 0,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Firestore updateSteps error:', e);
      }
    }

    return allSteps[dateKey];
  },

  // BODY WEIGHT LOGS
  getWeightLogs(uid) {
    return getStoredItem(`weights_${uid || 'guest'}`, INITIAL_WEIGHT_LOGS);
  },

  async logWeight(uid, weightVal, dateKey = getTodayDateKey()) {
    const current = this.getWeightLogs(uid);
    const newEntry = {
      id: 'wt_' + Date.now(),
      weight: Number(weightVal),
      date: dateKey,
    };
    const updated = [...current, newEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
    setStoredItem(`weights_${uid || 'guest'}`, updated);

    if (db && isFirebaseConfigured && uid) {
      try {
        const wtRef = doc(db, 'users', uid, 'weightLogs', newEntry.id);
        await setDoc(wtRef, { ...newEntry, serverTime: serverTimestamp() });
      } catch (e) {
        console.warn('Firestore logWeight error:', e);
      }
    }

    return updated;
  },
};
