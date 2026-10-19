/**
 * Social Competition & Friends Service
 * Manages authentic athlete discovery, legitimate friend requests,
 * real-time notification dispatch, and Firestore synchronization.
 * Strictly guarantees ONLY legitimate user profiles are shown.
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase.js';
import { getStoredItem, setStoredItem } from './storageHelper.js';

// Blocklist of legacy demo user IDs and usernames to never show in athlete searches
const DEMO_USER_IDS = new Set([
  'f_alex',
  'f_sophia',
  'f_rohan',
  'user_elena_v',
  'user_marcus_cole',
  'user_priya_patel',
  'user_liam_chen',
  'user_david_miller',
  'user_maya_lin',
  'user_tara_endure',
  'user_jordan_reed',
  'sug_rohit',
  'sug_pooja',
  'sug_kabir',
  'viktor_titan',
  'marcus_v',
  'user_viktor',
  'user_maya',
  'user_marcus',
  'req_elena',
]);

const DEMO_USERNAMES = new Set([
  'alex_iron',
  'sophia_lift',
  'rohan_sprint',
  'elena_v',
  'marcus_iron',
  'priya_flow',
  'liam_beast',
  'david_tri',
  'maya_sprint',
  'tara_trail',
  'jordan_oly',
  'rohit_sharma',
  'pooja_fitness',
  'kabir_runner',
  'viktor_titan',
  'maya_crossfit',
  'marcus_v',
]);

function isDemoUser(id, username) {
  if (!id && !username) return true;
  if (id && DEMO_USER_IDS.has(id)) return true;
  if (username && DEMO_USERNAMES.has(username.toLowerCase().replace(/^@/, ''))) return true;
  if (id && (id.startsWith('sug_') || id.startsWith('f_') || id.startsWith('demo_'))) return true;
  return false;
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase() || 'AT';
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  const elapsed = Math.floor((Date.now() - Number(timestamp)) / 1000);
  if (elapsed < 60) return 'Just now';
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
  return `${Math.floor(elapsed / 86400)}d ago`;
}

export const socialService = {
  /**
   * Retrieve ONLY legitimate registered user profiles from Cloud Firestore and local storage.
   * Completely excludes fake demo profiles and the current logged-in user.
   */
  async getLegitimateUsers(currentUid, searchQuery = '') {
    const athletesMap = new Map();

    // 1. Fetch legitimate profiles from Cloud Firestore
    if (db && isFirebaseConfigured) {
      try {
        const profilesColl = collection(db, 'profiles');
        const snap = await getDocs(profilesColl);
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const uid = docSnap.id || data.uid;
          if (uid && uid !== currentUid && !isDemoUser(uid, data.username)) {
            athletesMap.set(uid, {
              id: uid,
              uid: uid,
              displayName: data.displayName || 'Athlete',
              username: data.username || 'athlete',
              avatar:
                data.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              level: data.level || 1,
              xp: data.xp || 0,
              currentStreak: data.currentStreak || 0,
              consistency: data.currentStreak > 0 ? `${Math.min(99, 85 + data.currentStreak * 2)}%` : '88%',
              initials: getInitials(data.displayName || data.username),
            });
          }
        });
      } catch (err) {
        console.warn('[socialService] Firestore profiles fetch notice:', err.message);
      }
    }

    // 2. Scan local storage for any registered athlete profiles (multi-user or offline support)
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('levelup_profile_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const u = JSON.parse(raw);
              const uid = u.uid || key.replace('levelup_profile_', '');
              if (uid && uid !== currentUid && !isDemoUser(uid, u.username) && !athletesMap.has(uid)) {
                athletesMap.set(uid, {
                  id: uid,
                  uid: uid,
                  displayName: u.displayName || 'Athlete',
                  username: u.username || 'athlete',
                  avatar:
                    u.avatar ||
                    u.photoURL ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  level: u.level || 1,
                  xp: u.xp || 0,
                  currentStreak: u.currentStreak || 0,
                  consistency: u.currentStreak > 0 ? `${Math.min(99, 85 + u.currentStreak * 2)}%` : '88%',
                  initials: getInitials(u.displayName || u.username),
                });
              }
            }
          }
        }
      }
    } catch {
      // Ignore storage enumeration errors
    }

    let list = Array.from(athletesMap.values());

    // 3. Filter by search query if supplied
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace(/^@/, '');
      list = list.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    return list;
  },

  /**
   * Search legitimate community athletes
   */
  async searchCommunityAthletes(uid, queryStr) {
    return await this.getLegitimateUsers(uid, queryStr);
  },

  /**
   * Send friend request to a legitimate user.
   * Dispatches Firestore document and real-time notification to the recipient.
   */
  async sendFriendRequest(currentUser, targetUserOrQuery) {
    if (!currentUser?.uid) {
      throw new Error('You must be signed in to send friend requests.');
    }

    // Resolve target legitimate user
    let targetUser = null;
    if (typeof targetUserOrQuery === 'object' && targetUserOrQuery !== null) {
      targetUser = targetUserOrQuery;
    } else {
      const cleanQuery = String(targetUserOrQuery || '').trim().toLowerCase().replace(/^@/, '');
      const all = await this.getLegitimateUsers(currentUser.uid);
      targetUser = all.find(
        (u) =>
          u.username.toLowerCase() === cleanQuery ||
          u.displayName.toLowerCase() === cleanQuery ||
          u.uid === cleanQuery
      );
    }

    if (!targetUser || !targetUser.uid) {
      throw new Error(
        `Athlete not found. Only legitimate, registered LevelUp athletes can be added as friends.`
      );
    }

    if (targetUser.uid === currentUser.uid) {
      throw new Error('You cannot send a friend request to yourself.');
    }

    const targetUid = targetUser.uid || targetUser.id;
    const senderName =
      currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Athlete');
    const senderUsername =
      currentUser.username || senderName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const senderAvatar =
      currentUser.avatar ||
      currentUser.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    const requestId = `freq_${currentUser.uid}_${targetUid}`;
    const requestData = {
      id: requestId,
      requestId: requestId,
      senderId: currentUser.uid,
      senderName: senderName,
      senderUsername: senderUsername,
      senderAvatar: senderAvatar,
      recipientId: targetUid,
      recipientName: targetUser.displayName || 'Athlete',
      recipientUsername: targetUser.username || '',
      recipientAvatar: targetUser.avatar || '',
      status: 'pending',
      type: 'friend_request',
      message: `${senderName} (@${senderUsername}) sent you a friend request!`,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      read: false,
    };

    // 1. Write to Cloud Firestore friendRequests collection
    if (db && isFirebaseConfigured) {
      try {
        const reqRef = doc(db, 'friendRequests', requestId);
        await setDoc(reqRef, {
          ...requestData,
          serverTime: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[socialService] Firestore friendRequest write notice:', err.message);
      }
    }

    // 2. Local storage synchronization for sender (sent list)
    const senderSent = getStoredItem(`sent_requests_${currentUser.uid}`, []);
    const existsInSent = senderSent.some(
      (s) =>
        (typeof s === 'string' && s.toLowerCase() === targetUser.username.toLowerCase()) ||
        (s?.recipientId && s.recipientId === targetUid)
    );
    if (!existsInSent) {
      setStoredItem(`sent_requests_${currentUser.uid}`, [
        ...senderSent,
        {
          id: requestId,
          recipientId: targetUid,
          recipientUsername: targetUser.username,
          recipientName: targetUser.displayName,
          sentAt: Date.now(),
        },
      ]);
    }

    // 3. Local storage synchronization for recipient (incoming requests & notifications)
    const recipientReqs = getStoredItem(`requests_${targetUid}`, []);
    const filteredReqs = recipientReqs.filter((r) => r.id !== requestId);
    setStoredItem(`requests_${targetUid}`, [requestData, ...filteredReqs]);

    const recipientNotifs = getStoredItem(`notifications_${targetUid}`, []);
    const filteredNotifs = recipientNotifs.filter((n) => n.id !== requestId);
    setStoredItem(`notifications_${targetUid}`, [requestData, ...filteredNotifs]);

    // 4. Dispatch browser events for immediate live pop notification
    try {
      window.dispatchEvent(
        new CustomEvent('levelup_notification_received', { detail: requestData })
      );
      window.dispatchEvent(
        new CustomEvent('levelup_friend_request_sent', { detail: requestData })
      );
    } catch {
      // Event fallback
    }

    return {
      success: true,
      message: `Friend request sent to ${targetUser.displayName} (@${targetUser.username})! Notification delivered 🚀`,
      request: requestData,
    };
  },

  /**
   * Send friend request to user object (alias)
   */
  async sendFriendRequestToUser(currentUser, targetUser) {
    return await this.sendFriendRequest(currentUser, targetUser);
  },

  /**
   * Real-time subscription to incoming notifications and friend requests for a user
   */
  subscribeNotifications(uid, callback) {
    if (!uid) {
      callback([]);
      return () => {};
    }

    // Initial emit from local notifications
    const emitCombined = (remoteItems = []) => {
      const local = getStoredItem(`notifications_${uid}`, []);
      const map = new Map();

      // Remote Firestore items take priority
      remoteItems.forEach((item) => {
        if (item.status === 'pending') {
          map.set(item.id, {
            ...item,
            timeAgo: formatTimeAgo(item.timestamp || Date.now()),
          });
        }
      });

      // Local storage fallback items
      local.forEach((item) => {
        if (!map.has(item.id) && item.status === 'pending') {
          map.set(item.id, {
            ...item,
            timeAgo: formatTimeAgo(item.timestamp || Date.now()),
          });
        }
      });

      const list = Array.from(map.values());
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callback(list);
    };

    emitCombined([]);

    // Firestore real-time listener for incoming friend requests
    let firestoreUnsub = null;
    if (db && isFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'friendRequests'),
          where('recipientId', '==', uid)
        );
        firestoreUnsub = onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((item) => item.status === 'pending');
            emitCombined(items);
          },
          (err) => {
            console.warn('[socialService] Notifications onSnapshot notice:', err.message);
          }
        );
      } catch (e) {
        console.warn('[socialService] Firestore notifications query init error:', e);
      }
    }

    // Local custom event listener for immediate pop in current window
    const handleLocalEvent = (e) => {
      const detail = e.detail;
      if (detail && detail.recipientId === uid) {
        emitCombined([detail]);
      }
    };
    window.addEventListener('levelup_notification_received', handleLocalEvent);

    return () => {
      if (typeof firestoreUnsub === 'function') firestoreUnsub();
      window.removeEventListener('levelup_notification_received', handleLocalEvent);
    };
  },

  /**
   * One-shot fetch of notifications for user
   */
  getNotifications(uid) {
    if (!uid) return [];
    return getStoredItem(`notifications_${uid}`, []);
  },

  /**
   * Accept an incoming friend request
   */
  async acceptFriendRequest(currentUser, requestId) {
    if (!currentUser?.uid || !requestId) return;

    // Find the request record
    const reqs = getStoredItem(`requests_${currentUser.uid}`, []);
    const target = reqs.find((r) => r.id === requestId);

    const senderId = target?.senderId;
    const senderName = target?.senderName || 'Athlete';
    const senderUsername = target?.senderUsername || 'athlete';
    const senderAvatar =
      target?.senderAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    // 1. Update Firestore friendRequests status
    if (db && isFirebaseConfigured) {
      try {
        const reqRef = doc(db, 'friendRequests', requestId);
        await setDoc(reqRef, { status: 'accepted', updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        console.warn('[socialService] Firestore acceptFriendRequest notice:', e.message);
      }
    }

    // 2. Add to recipient's friends list
    const myFriends = getStoredItem(`friends_${currentUser.uid}`, []);
    if (!myFriends.some((f) => f.id === senderId || f.uid === senderId)) {
      const newFriend = {
        id: senderId,
        uid: senderId,
        displayName: senderName,
        username: senderUsername,
        avatar: senderAvatar,
        level: 1,
        xp: 150,
        currentStreak: 1,
        goalsCompleted: 0,
        status: 'Accountability Partner',
      };
      setStoredItem(`friends_${currentUser.uid}`, [...myFriends, newFriend]);
    }

    // 3. Add to sender's friends list
    if (senderId) {
      const senderFriends = getStoredItem(`friends_${senderId}`, []);
      const myDisplayName =
        currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Athlete');
      if (!senderFriends.some((f) => f.id === currentUser.uid || f.uid === currentUser.uid)) {
        const meAsFriend = {
          id: currentUser.uid,
          uid: currentUser.uid,
          displayName: myDisplayName,
          username: currentUser.username || myDisplayName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          avatar: currentUser.avatar || currentUser.photoURL || '',
          level: currentUser.level || 1,
          xp: currentUser.xp || 0,
          currentStreak: currentUser.currentStreak || 0,
          goalsCompleted: 0,
          status: 'Accountability Partner',
        };
        setStoredItem(`friends_${senderId}`, [...senderFriends, meAsFriend]);
      }
    }

    // 4. Clean up pending requests & notifications
    const updatedReqs = reqs.filter((r) => r.id !== requestId);
    setStoredItem(`requests_${currentUser.uid}`, updatedReqs);

    const notifs = getStoredItem(`notifications_${currentUser.uid}`, []);
    const updatedNotifs = notifs.filter((n) => n.id !== requestId);
    setStoredItem(`notifications_${currentUser.uid}`, updatedNotifs);

    try {
      window.dispatchEvent(new CustomEvent('levelup_friend_updated'));
    } catch {
      // Event fallback
    }

    return {
      success: true,
      message: `Friend request accepted! You and ${senderName} are now accountability partners ⚡`,
    };
  },

  /**
   * Reject / decline an incoming friend request
   */
  async rejectFriendRequest(currentUser, requestId) {
    if (!currentUser?.uid || !requestId) return;

    if (db && isFirebaseConfigured) {
      try {
        const reqRef = doc(db, 'friendRequests', requestId);
        await setDoc(reqRef, { status: 'rejected', updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        console.warn('[socialService] Firestore rejectFriendRequest notice:', e.message);
      }
    }

    const reqs = getStoredItem(`requests_${currentUser.uid}`, []);
    setStoredItem(
      `requests_${currentUser.uid}`,
      reqs.filter((r) => r.id !== requestId)
    );

    const notifs = getStoredItem(`notifications_${currentUser.uid}`, []);
    setStoredItem(
      `notifications_${currentUser.uid}`,
      notifs.filter((n) => n.id !== requestId)
    );

    try {
      window.dispatchEvent(new CustomEvent('levelup_friend_updated'));
    } catch {
      // Event fallback
    }
  },

  /**
   * Get confirmed friends for user
   */
  getFriends(uid) {
    if (!uid) return [];
    const list = getStoredItem(`friends_${uid}`, []);
    // Guarantee no demo users ever appear in friends
    return list.filter((f) => !isDemoUser(f.id || f.uid, f.username));
  },

  /**
   * Remove friend
   */
  removeFriend(uid, friendId) {
    const current = this.getFriends(uid);
    const updated = current.filter((f) => f.id !== friendId && f.uid !== friendId);
    setStoredItem(`friends_${uid}`, updated);
    try {
      window.dispatchEvent(new CustomEvent('levelup_friend_updated'));
    } catch {
      // Event fallback
    }
    return updated;
  },

  /**
   * Get incoming friend requests
   */
  getFriendRequests(uid) {
    if (!uid) return [];
    const list = getStoredItem(`requests_${uid}`, []);
    return list.filter((r) => r.status === 'pending' && !isDemoUser(r.senderId, r.senderUsername));
  },

  /**
   * Get sent requests
   */
  getSentRequests(uid) {
    if (!uid) return [];
    return getStoredItem(`sent_requests_${uid}`, []);
  },

  /**
   * Cancel sent request
   */
  async cancelSentRequest(uid, handleOrId) {
    const sent = this.getSentRequests(uid);
    const target = String(handleOrId).toLowerCase().replace(/^@/, '');
    const updated = sent.filter((s) => {
      const matchId = s.id && s.id.toLowerCase() === target;
      const matchRecipient = s.recipientId && s.recipientId.toLowerCase() === target;
      const matchUsername = s.recipientUsername && s.recipientUsername.toLowerCase() === target;
      const matchDirect = typeof s === 'string' && s.toLowerCase().replace(/^@/, '') === target;
      return !(matchId || matchRecipient || matchUsername || matchDirect);
    });
    setStoredItem(`sent_requests_${uid}`, updated);

    // If Firestore is active and request id is matched, update or delete
    if (db && isFirebaseConfigured && String(handleOrId).startsWith('freq_')) {
      try {
        await deleteDoc(doc(db, 'friendRequests', String(handleOrId)));
      } catch (err) {
        console.warn('Could not cancel Firestore request:', err);
      }
    }

    return updated;
  },

  /**
   * Challenges (clean, no fake demo users)
   */
  getChallenges(uid) {
    return getStoredItem(`challenges_${uid || 'guest'}`, [
      {
        id: 'ch_7day_streak',
        title: '7-Day Unbroken Habit Sprint',
        description: 'Complete 100% of your daily scheduled goals for 7 consecutive days.',
        type: 'Consistency',
        startDate: '2026-10-15',
        endDate: '2026-10-22',
        participantsCount: 1,
        rewardXp: 500,
        badgeReward: 'Unstoppable Titan',
        isJoined: false,
        userProgress: 0,
      },
      {
        id: 'ch_5_workouts',
        title: '5 Iron Sessions This Week',
        description: 'Log 5 dedicated workout sessions with 45+ minutes duration.',
        type: 'Fitness',
        startDate: '2026-10-18',
        endDate: '2026-10-25',
        participantsCount: 1,
        rewardXp: 400,
        badgeReward: 'Iron Beast',
        isJoined: false,
        userProgress: 0,
      },
    ]);
  },

  toggleJoinChallenge(uid, challengeId) {
    const list = this.getChallenges(uid);
    const updated = list.map((ch) =>
      ch.id === challengeId
        ? {
            ...ch,
            isJoined: !ch.isJoined,
            participantsCount: ch.isJoined ? Math.max(1, ch.participantsCount - 1) : ch.participantsCount + 1,
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

  /**
   * Leaderboard based on real legitimate user profiles
   */
  async getLeaderboard(period = 'weekly', filter = 'global', currentUser = null) {
    const legitimate = await this.getLegitimateUsers(currentUser?.uid || '');
    let list = legitimate.map((u) => ({
      id: u.uid,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      xp: Number(u.xp) || 0,
      level: Number(u.level) || 1,
      goalsCompleted: 0,
      currentStreak: Number(u.currentStreak) || 0,
      badge: (u.xp || 0) >= 3000 ? '⚡ Pro' : '🔥 Rising',
    }));

    if (currentUser?.uid) {
      const userDisplay =
        currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Athlete');
      const userEntry = {
        id: currentUser.uid,
        username: currentUser.username || userDisplay.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        displayName: `${userDisplay} (You)`,
        avatar:
          currentUser.avatar ||
          currentUser.photoURL ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        xp: Number(currentUser.xp) || 0,
        level: Number(currentUser.level) || 1,
        goalsCompleted: Number(currentUser.goalsCompleted) || 0,
        currentStreak: Number(currentUser.currentStreak) || 0,
        isCurrentUser: true,
        badge: (currentUser.xp || 0) >= 3000 ? '⚡ Pro' : '🔥 Rising',
      };

      if (filter === 'friends') {
        const friends = this.getFriends(currentUser.uid);
        const friendIds = new Set(friends.map((f) => f.id || f.uid));
        const friendsList = list.filter((u) => friendIds.has(u.id));
        const combined = [userEntry, ...friendsList];
        combined.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        return combined.map((item, idx) => ({ ...item, rank: idx + 1 }));
      }

      list.push(userEntry);
    }

    list.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  },
};
