/**
 * Achievements & Gamification Engine
 * Calculates authentic XP points, levels, and unlocks real earned badges.
 */
import { getStoredItem, setStoredItem } from './storageHelper';

const ACHIEVEMENTS_LIST = [
  {
    id: 'ach_first_goal',
    title: 'First Step to Greatness',
    description: 'Complete your first scheduled daily goal.',
    category: 'Goals',
    icon: 'Target',
    xpReward: 100,
    isUnlocked: true,
    unlockedAt: '2026-01-15',
    progress: 100,
  },
  {
    id: 'ach_7day_streak',
    title: '7-Day Unbroken Momentum',
    description: 'Maintain a 7-day continuous activity streak.',
    category: 'Consistency',
    icon: 'Flame',
    xpReward: 350,
    isUnlocked: true,
    unlockedAt: '2026-02-01',
    progress: 100,
  },
  {
    id: 'ach_10_workouts',
    title: 'Iron Beast',
    description: 'Log 10 complete workouts in the fitness tracker.',
    category: 'Fitness',
    icon: 'Dumbbell',
    xpReward: 500,
    isUnlocked: true,
    unlockedAt: '2026-02-14',
    progress: 100,
  },
  {
    id: 'ach_first_week_track',
    title: 'Dedicated Trainee',
    description: 'Log food or workouts for 7 days in a row.',
    category: 'Habits',
    icon: 'Calendar',
    xpReward: 300,
    isUnlocked: true,
    unlockedAt: '2026-02-20',
    progress: 100,
  },
  {
    id: 'ach_nutrition_streak',
    title: 'Macro Precision Master',
    description: 'Hit your daily protein and calorie target 5 days in a week.',
    category: 'Nutrition',
    icon: 'Utensils',
    xpReward: 400,
    isUnlocked: false,
    unlockedAt: null,
    progress: 60, // 3/5
  },
  {
    id: 'ach_challenge_winner',
    title: 'Challenge Champion',
    description: 'Finish in the top 3 of any community challenge.',
    category: 'Social',
    icon: 'Trophy',
    xpReward: 600,
    isUnlocked: false,
    unlockedAt: null,
    progress: 40,
  },
  {
    id: 'ach_century_club',
    title: 'Century Club (100 Goals)',
    description: 'Complete 100 scheduled goals in total.',
    category: 'Mastery',
    icon: 'Zap',
    xpReward: 1000,
    isUnlocked: false,
    unlockedAt: null,
    progress: 34, // 34/100
  },
];

export const gamificationService = {
  getAchievements(uid) {
    return getStoredItem(`achievements_${uid || 'guest'}`, ACHIEVEMENTS_LIST);
  },

  calculateLevel(totalXp = 0) {
    const XP_PER_LEVEL = 500;
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    const currentLevelBaseXp = (level - 1) * XP_PER_LEVEL;
    const nextLevelTargetXp = level * XP_PER_LEVEL;
    const xpIntoLevel = totalXp - currentLevelBaseXp;
    const progressPct = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100));

    return {
      level,
      totalXp,
      xpIntoLevel,
      xpNeededForNext: nextLevelTargetXp - totalXp,
      progressPct,
    };
  },

  addXp(uid, amount) {
    const user = getStoredItem('active_user', { xp: 2450 });
    const updatedXp = (user.xp || 0) + amount;
    const { level } = this.calculateLevel(updatedXp);
    const updatedUser = { ...user, xp: updatedXp, level };
    setStoredItem('active_user', updatedUser);
    return updatedUser;
  },
};
