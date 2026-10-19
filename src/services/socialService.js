/**
 * Social Competition & Friends Service
 * Manages fair leaderboards, friend requests, and athletic community challenges
 */
import { getStoredItem, setStoredItem } from './storageHelper';

const INITIAL_FRIENDS = [
  {
    id: 'f_alex',
    username: 'alex_iron',
    displayName: 'Alex Mercer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    level: 7,
    xp: 3820,
    currentStreak: 12,
    goalsCompleted: 48,
    status: 'Training Heavy',
  },
  {
    id: 'f_sophia',
    username: 'sophia_lift',
    displayName: 'Sophia Sterling',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    level: 6,
    xp: 3100,
    currentStreak: 8,
    goalsCompleted: 39,
    status: 'Hybrid Marathon Prep',
  },
  {
    id: 'f_rohan',
    username: 'rohan_sprint',
    displayName: 'Rohan Sharma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    level: 5,
    xp: 2600,
    currentStreak: 6,
    goalsCompleted: 32,
    status: 'DSA & Strength Phase',
  },
];

export const ALL_COMMUNITY_USERS = [
  {
    id: 'user_elena_v',
    username: 'elena_v',
    displayName: 'Elena Vance',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    level: 7,
    xp: 3950,
    currentStreak: 14,
    goalsCompleted: 52,
    discipline: 'Endurance & Half Marathon',
    bio: 'Pushing tempo intervals every sunrise. Sub-90m half marathon goal.',
    location: 'Denver, CO',
  },
  {
    id: 'user_marcus_cole',
    username: 'marcus_iron',
    displayName: 'Marcus Cole',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    level: 8,
    xp: 4420,
    currentStreak: 18,
    goalsCompleted: 68,
    discipline: 'Powerlifting & Hypertrophy',
    bio: 'Squat, Bench, Deadlift standard. 600kg total target in progress.',
    location: 'Austin, TX',
  },
  {
    id: 'user_priya_patel',
    username: 'priya_flow',
    displayName: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    level: 6,
    xp: 3200,
    currentStreak: 9,
    goalsCompleted: 41,
    discipline: 'HIIT & Functional Mobility',
    bio: 'Mobility before intensity. Daily core and flexibility flow.',
    location: 'London, UK',
  },
  {
    id: 'user_liam_chen',
    username: 'liam_beast',
    displayName: 'Liam Chen',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    level: 9,
    xp: 5120,
    currentStreak: 24,
    goalsCompleted: 85,
    discipline: 'Calisthenics & Gymnastics',
    bio: 'Planchan, front lever, muscle-up mastery. Bodyweight warrior.',
    location: 'San Francisco, CA',
  },
  {
    id: 'user_david_miller',
    username: 'david_tri',
    displayName: 'David Miller',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    level: 5,
    xp: 2750,
    currentStreak: 7,
    goalsCompleted: 33,
    discipline: 'Triathlon & Cycling',
    bio: 'Swimming laps, road cycling, and brick sessions. Ironman 70.3 prep.',
    location: 'Seattle, WA',
  },
  {
    id: 'user_maya_lin',
    username: 'maya_sprint',
    displayName: 'Maya Lin',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    level: 6,
    xp: 3380,
    currentStreak: 11,
    goalsCompleted: 44,
    discipline: 'Track & 400m Sprinting',
    bio: 'Explosive acceleration and lactate threshold work. Never skip track day.',
    location: 'Toronto, Canada',
  },
  {
    id: 'user_tara_endure',
    username: 'tara_trail',
    displayName: 'Tara Brooks',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    level: 7,
    xp: 3890,
    currentStreak: 15,
    goalsCompleted: 58,
    discipline: 'Trail Running & Ultra Prep',
    bio: 'Elevation gain is my therapy. 50k mountain ultra training cycle.',
    location: 'Boulder, CO',
  },
  {
    id: 'user_jordan_reed',
    username: 'jordan_oly',
    displayName: 'Jordan Reed',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    level: 8,
    xp: 4600,
    currentStreak: 21,
    goalsCompleted: 74,
    discipline: 'Olympic Weightlifting',
    bio: 'Snatch and Clean & Jerk perfection. Speed under the barbell.',
    location: 'Chicago, IL',
  },
];

const INITIAL_REQUESTS = [
  {
    id: 'req_elena',
    senderId: 'user_elena_v',
    displayName: 'Elena Vance',
    username: 'elena_v',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    mutualFriends: 2,
    level: 4,
    sentAt: '2 hours ago',
  },
];

const INITIAL_CHALLENGES = [
  {
    id: 'ch_7day_streak',
    title: '7-Day Unbroken Habit Sprint',
    description: 'Complete 100% of your daily scheduled goals for 7 consecutive days.',
    type: 'Consistency',
    startDate: '2026-10-15',
    endDate: '2026-10-22',
    participantsCount: 142,
    rewardXp: 500,
    badgeReward: 'Unstoppable Titan',
    isJoined: true,
    userProgress: 85, // percentage
  },
  {
    id: 'ch_5_workouts',
    title: '5 Iron Sessions This Week',
    description: 'Log 5 dedicated workout sessions with 45+ minutes duration.',
    type: 'Fitness',
    startDate: '2026-10-18',
    endDate: '2026-10-25',
    participantsCount: 98,
    rewardXp: 400,
    badgeReward: 'Iron Beast',
    isJoined: true,
    userProgress: 40,
  },
  {
    id: 'ch_10k_steps',
    title: '70,000 Weekly Steps Sprint',
    description: 'Accumulate 70k total steps over 7 days through morning cardio and daily walks.',
    type: 'Cardio',
    startDate: '2026-10-19',
    endDate: '2026-10-26',
    participantsCount: 230,
    rewardXp: 450,
    badgeReward: 'Road Warrior',
    isJoined: false,
    userProgress: 0,
  },
];

const GLOBAL_LEADERBOARD = [
  {
    rank: 1,
    username: 'viktor_titan',
    displayName: 'Viktor Kane',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    xp: 5420,
    level: 11,
    goalsCompleted: 78,
    currentStreak: 24,
    badge: '🏆 Champion',
  },
  {
    rank: 2,
    username: 'maya_crossfit',
    displayName: 'Maya Lin',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    xp: 4950,
    level: 10,
    goalsCompleted: 69,
    currentStreak: 19,
    badge: '🥈 Master',
  },
  {
    rank: 3,
    username: 'alex_iron',
    displayName: 'Alex Mercer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    xp: 3820,
    level: 7,
    goalsCompleted: 48,
    currentStreak: 12,
    badge: '🥉 Elite',
  },
  {
    rank: 4,
    username: 'sophia_lift',
    displayName: 'Sophia Sterling',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    xp: 3100,
    level: 6,
    goalsCompleted: 39,
    currentStreak: 8,
    badge: '⚡ Pro',
  },
  {
    rank: 5,
    username: 'prashant_beast',
    displayName: 'Prashant Yadav (You)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    xp: 2450,
    level: 5,
    goalsCompleted: 34,
    currentStreak: 6,
    isCurrentUser: true,
    badge: '🔥 Rising',
  },
  {
    rank: 6,
    username: 'rohan_sprint',
    displayName: 'Rohan Sharma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    xp: 2600,
    level: 5,
    goalsCompleted: 32,
    currentStreak: 6,
    badge: '⚡ Pro',
  },
  {
    rank: 7,
    username: 'marcus_v',
    displayName: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    xp: 1980,
    level: 4,
    goalsCompleted: 26,
    currentStreak: 4,
    badge: '⚔️ Trainee',
  },
];

export const socialService = {
  // FRIENDS
  getFriends(uid) {
    return getStoredItem(`friends_${uid || 'guest'}`, []);
  },

  removeFriend(uid, friendId) {
    const current = this.getFriends(uid);
    const updated = current.filter((f) => f.id !== friendId);
    setStoredItem(`friends_${uid || 'guest'}`, updated);
    return updated;
  },

  getFriendRequests(uid) {
    return getStoredItem(`requests_${uid || 'guest'}`, []);
  },

  acceptFriendRequest(uid, requestId) {
    const requests = this.getFriendRequests(uid);
    const target = requests.find((r) => r.id === requestId);
    if (!target) return this.getFriends(uid);

    const newFriend = {
      id: target.senderId,
      username: target.username,
      displayName: target.displayName,
      avatar: target.avatar,
      level: target.level || 1,
      xp: 500,
      currentStreak: 1,
      goalsCompleted: 5,
      status: 'Recently Added',
    };

    const currentFriends = this.getFriends(uid);
    const updatedFriends = [...currentFriends, newFriend];
    const updatedRequests = requests.filter((r) => r.id !== requestId);

    setStoredItem(`friends_${uid || 'guest'}`, updatedFriends);
    setStoredItem(`requests_${uid || 'guest'}`, updatedRequests);

    return { updatedFriends, updatedRequests };
  },

  rejectFriendRequest(uid, requestId) {
    const requests = this.getFriendRequests(uid);
    const updated = requests.filter((r) => r.id !== requestId);
    setStoredItem(`requests_${uid || 'guest'}`, updated);
    return updated;
  },

  sendFriendRequest(uid, username) {
    const cleanUser = username.trim().toLowerCase().replace('@', '');
    const sent = getStoredItem(`sent_requests_${uid || 'guest'}`, []);
    if (!sent.includes(cleanUser)) {
      setStoredItem(`sent_requests_${uid || 'guest'}`, [...sent, cleanUser]);
    }
    return {
      success: true,
      message: `Friend request dispatched to @${cleanUser}! ⚡`,
    };
  },

  sendFriendRequestToUser(uid, targetUser) {
    const sent = getStoredItem(`sent_requests_${uid || 'guest'}`, []);
    if (!sent.includes(targetUser.id) && !sent.includes(targetUser.username)) {
      setStoredItem(`sent_requests_${uid || 'guest'}`, [...sent, targetUser.id, targetUser.username]);
    }
    return {
      success: true,
      message: `Friend request dispatched to ${targetUser.displayName} (@${targetUser.username})! ⚡`,
    };
  },

  getSentRequests(uid) {
    return getStoredItem(`sent_requests_${uid || 'guest'}`, []);
  },

  cancelSentRequest(uid, handleOrId) {
    const sent = this.getSentRequests(uid);
    const target = String(handleOrId).toLowerCase().replace(/^@/, '');
    const updated = sent.filter((s) => String(s).toLowerCase().replace(/^@/, '') !== target);
    setStoredItem(`sent_requests_${uid || 'guest'}`, updated);
    return updated;
  },

  getAllCommunityAthletes(uid) {
    const friends = this.getFriends(uid);
    const friendIds = new Set(friends.map((f) => f.id));
    const friendUsernames = new Set(friends.map((f) => f.username.toLowerCase()));
    const sentList = new Set(this.getSentRequests(uid).map((s) => String(s).toLowerCase()));

    return ALL_COMMUNITY_USERS.map((user) => ({
      ...user,
      isFriend: friendIds.has(user.id) || friendUsernames.has(user.username.toLowerCase()),
      isPending: sentList.has(user.id.toLowerCase()) || sentList.has(user.username.toLowerCase()),
    }));
  },

  searchCommunityAthletes(uid, queryStr) {
    const all = this.getAllCommunityAthletes(uid);
    if (!queryStr || !queryStr.trim()) return all;

    const q = queryStr.trim().toLowerCase().replace('@', '');
    return all.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.discipline && u.discipline.toLowerCase().includes(q)) ||
        (u.bio && u.bio.toLowerCase().includes(q)) ||
        (u.location && u.location.toLowerCase().includes(q))
    );
  },

  // CHALLENGES
  getChallenges(uid) {
    return getStoredItem(`challenges_${uid || 'guest'}`, INITIAL_CHALLENGES);
  },

  toggleJoinChallenge(uid, challengeId) {
    const list = this.getChallenges(uid);
    const updated = list.map((ch) =>
      ch.id === challengeId
        ? {
            ...ch,
            isJoined: !ch.isJoined,
            participantsCount: ch.isJoined ? ch.participantsCount - 1 : ch.participantsCount + 1,
          }
        : ch
    );
    setStoredItem(`challenges_${uid || 'guest'}`, updated);
    return updated;
  },

  createChallenge(uid, challengeData) {
    const list = this.getChallenges(uid);
    const newChallenge = {
      id: 'ch_' + Date.now(),
      title: challengeData.title,
      description: challengeData.description || '',
      type: challengeData.type || 'Custom',
      startDate: challengeData.startDate,
      endDate: challengeData.endDate,
      participantsCount: 1,
      rewardXp: Number(challengeData.rewardXp) || 300,
      badgeReward: challengeData.badgeReward || 'Challenger',
      isJoined: true,
      userProgress: 0,
    };
    const updated = [newChallenge, ...list];
    setStoredItem(`challenges_${uid || 'guest'}`, updated);
    return newChallenge;
  },

  // LEADERBOARDS
  getLeaderboard(period = 'weekly', filter = 'global') {
    return GLOBAL_LEADERBOARD;
  },
};
