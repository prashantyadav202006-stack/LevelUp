/**
 * Authentication Service
 * Manages Firebase Authentication and Firestore user profile synchronization
 * Strict isolation: every user is bound to their real Firebase UID and email.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase.js';
import { getStoredItem, setStoredItem } from './storageHelper.js';

export const DEFAULT_TARGETS = {
  calories: 2600,
  protein: 165,
  carbs: 280,
  fats: 70,
  water: 3500,
  steps: 10000,
};

export const DEFAULT_SETTINGS = {
  units: 'metric',
  timeZone: 'Asia/Kolkata',
  visibility: 'public',
  notifications: true,
};

export function getFriendlyAuthError(err) {
  if (!err) return 'Authentication failed. Please try again.';
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please verify your credentials or register a new account.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please provide a valid email format.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'Another authentication popup is already pending.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for LevelUp.';
    case 'auth/unauthorized-domain':
      return 'Firebase Error: This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is disabled in Firebase console. Please enable Email/Password or Google provider.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    default:
      return err.message || 'Authentication error. Please try again.';
  }
}

export const authService = {
  /**
   * Subscribe to real Firebase authentication state changes.
   * Single source of truth: emits authenticated user object or null.
   * Guarantees 0ms local rehydration + permanent Firestore persistence forever.
   */
  onAuthStateChange(callback) {
    if (!auth) {
      setStoredItem('active_user', null);
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const email = firebaseUser.email || '';
        const fallbackName = firebaseUser.displayName || (email ? email.split('@')[0] : 'Athlete');
        const defaultUsername = fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const isGoogle =
          firebaseUser.providerData?.some((p) => p.providerId === 'google.com') ||
          sessionStorage.getItem('last_auth_provider') === 'google';

        // 1. Instant user-scoped local rehydration (survives logouts & page refreshes)
        const cachedProfile = getStoredItem(`profile_${uid}`, null);
        if (cachedProfile) {
          setStoredItem('active_user', cachedProfile);
          callback(cachedProfile);
        }

        // 2. Fetch or initialize Cloud Firestore profile
        let userProfile = null;
        if (db && isFirebaseConfigured) {
          try {
            const userDocRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              userProfile = userSnap.data();
            } else {
              // Brand new user in Firestore: initialize with default or cached values
              userProfile = {
                uid,
                email,
                displayName: cachedProfile?.displayName || fallbackName,
                username: cachedProfile?.username || defaultUsername,
                avatar:
                  cachedProfile?.avatar ||
                  firebaseUser.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                level: cachedProfile?.level || 1,
                xp: cachedProfile?.xp ?? 0,
                currentStreak: cachedProfile?.currentStreak ?? 0,
                bestStreak: cachedProfile?.bestStreak ?? 0,
                authProvider: isGoogle ? 'google' : 'password',
                isOnboardingCompleted: cachedProfile?.isOnboardingCompleted === true,
                createdAt: serverTimestamp(),
                targets: cachedProfile?.targets || DEFAULT_TARGETS,
                settings: cachedProfile?.settings || DEFAULT_SETTINGS,
              };
              await setDoc(userDocRef, userProfile);

              // Public profile document for discovery & leaderboards
              try {
                const publicRef = doc(db, 'profiles', uid);
                await setDoc(publicRef, {
                  uid,
                  displayName: userProfile.displayName,
                  username: userProfile.username,
                  avatar: userProfile.avatar,
                  level: userProfile.level,
                  xp: userProfile.xp,
                  currentStreak: userProfile.currentStreak,
                  bestStreak: userProfile.bestStreak,
                  createdAt: serverTimestamp(),
                });
              } catch (pubErr) {
                console.warn('[Firestore] Profile init public error:', pubErr);
              }
            }
          } catch (err) {
            console.warn('[Firestore] Profile fetch error:', err);
          }
        }

        // Deep-merge targets and settings to ensure no customized values are ever lost
        const mergedTargets = {
          ...DEFAULT_TARGETS,
          ...(cachedProfile?.targets || {}),
          ...(userProfile?.targets || {}),
        };

        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...(cachedProfile?.settings || {}),
          ...(userProfile?.settings || {}),
        };

        const authenticatedUser = {
          uid,
          email,
          displayName:
            userProfile?.displayName ||
            cachedProfile?.displayName ||
            firebaseUser.displayName ||
            fallbackName,
          username:
            userProfile?.username ||
            cachedProfile?.username ||
            defaultUsername,
          photoURL:
            firebaseUser.photoURL ||
            userProfile?.avatar ||
            cachedProfile?.avatar,
          avatar:
            userProfile?.avatar ||
            cachedProfile?.avatar ||
            firebaseUser.photoURL ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          authProvider: isGoogle
            ? 'google'
            : (userProfile?.authProvider || cachedProfile?.authProvider || 'password'),
          isOnboardingCompleted:
            userProfile?.isOnboardingCompleted === true ||
            cachedProfile?.isOnboardingCompleted === true,
          level: userProfile?.level ?? (cachedProfile?.level || 1),
          xp: userProfile?.xp ?? (cachedProfile?.xp ?? 0),
          currentStreak: userProfile?.currentStreak ?? (cachedProfile?.currentStreak ?? 0),
          bestStreak: userProfile?.bestStreak ?? (cachedProfile?.bestStreak ?? 0),
          ...(cachedProfile || {}),
          ...(userProfile || {}),
          targets: mergedTargets,
          settings: mergedSettings,
        };

        // Cache permanently in user-scoped persistent storage and active session
        setStoredItem(`profile_${uid}`, authenticatedUser);
        setStoredItem('active_user', authenticatedUser);

        // Ensure public discovery profile in Cloud Firestore is always up-to-date for friend search
        if (db && isFirebaseConfigured) {
          try {
            const publicRef = doc(db, 'profiles', uid);
            setDoc(
              publicRef,
              {
                uid,
                displayName: authenticatedUser.displayName,
                username: authenticatedUser.username,
                avatar: authenticatedUser.avatar,
                level: authenticatedUser.level || 1,
                xp: authenticatedUser.xp || 0,
                currentStreak: authenticatedUser.currentStreak || 0,
                bestStreak: authenticatedUser.bestStreak || 0,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            ).catch(() => {});
          } catch {
            // Non-blocking public profile sync
          }
        }

        callback(authenticatedUser);
      } else {
        // User logged out or unauthenticated: clean active session only
        setStoredItem('active_user', null);
        callback(null);
      }
    });
  },

  /**
   * Sign In with Email & Password using Firebase Authentication
   */
  async signIn(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Email and password are required.');
    }

    if (!auth) {
      throw new Error('Firebase Auth is not available.');
    }

    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return userCredential.user;
  },

  /**
   * Sign Up with Email, Password & Display Name using Firebase Authentication
   */
  async signUp(email, password, displayName) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const name = displayName?.trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'Athlete');

    if (!cleanEmail || !password) {
      throw new Error('Email and password are required.');
    }

    if (!auth) {
      throw new Error('Firebase Auth is not available.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    if (name && user) {
      try {
        await updateProfile(user, { displayName: name });
      } catch (err) {
        console.warn('Could not update profile displayName:', err);
      }
    }

    // Initialize user doc in Firestore & local permanent storage
    if (user) {
      const profile = {
        uid: user.uid,
        email: cleanEmail,
        displayName: name,
        username: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        level: 1,
        xp: 150,
        currentStreak: 1,
        bestStreak: 1,
        authProvider: 'password',
        isOnboardingCompleted: false,
        targets: DEFAULT_TARGETS,
        settings: DEFAULT_SETTINGS,
      };

      setStoredItem(`profile_${user.uid}`, profile);
      setStoredItem('active_user', profile);

      if (db && isFirebaseConfigured) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { ...profile, createdAt: serverTimestamp() });

          const publicRef = doc(db, 'profiles', user.uid);
          await setDoc(publicRef, {
            uid: user.uid,
            displayName: name,
            username: profile.username,
            avatar: profile.avatar,
            level: 1,
            xp: 150,
            currentStreak: 1,
            bestStreak: 1,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.warn('[Firestore] Profile init on signup error:', e);
        }
      }
    }

    return user;
  },

  /**
   * Sign In via Google Popup
   */
  async signInWithGoogle() {
    sessionStorage.setItem('last_auth_provider', 'google');

    if (!auth) {
      throw new Error('Firebase Auth is not available.');
    }

    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  /**
   * Dispatch password reset email
   */
  async resetPassword(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error('Email is required.');
    if (!auth) throw new Error('Firebase Auth is not available.');
    await sendPasswordResetEmail(auth, cleanEmail);
  },

  /**
   * Complete Sign Out
   */
  async signOut() {
    // 1. Wipe active session user & temporary markers only
    // Note: profile_{uid} is kept intact so user's personalized targets remain forever on re-login
    setStoredItem('active_user', null);
    sessionStorage.removeItem('last_auth_provider');
    sessionStorage.removeItem('prompt_google_onboarding');
    sessionStorage.removeItem('dismissed_google_onboarding');

    // 2. Complete Firebase Sign Out
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Firebase signout error:', err);
      }
    }
  },

  /**
   * Update Profile in Firestore and local state permanently
   * All changes to targets, name, username, biometrics, and preferences are saved forever until changed.
   */
  async updateUserProfile(uid, updates) {
    if (!uid) return null;
    const current =
      getStoredItem(`profile_${uid}`, null) ||
      getStoredItem('active_user', null) ||
      {};

    const updatedTargets = updates.targets
      ? { ...(current.targets || DEFAULT_TARGETS), ...updates.targets }
      : (current.targets || DEFAULT_TARGETS);

    const updatedSettings = updates.settings
      ? { ...(current.settings || DEFAULT_SETTINGS), ...updates.settings }
      : (current.settings || DEFAULT_SETTINGS);

    const updated = {
      ...current,
      ...updates,
      targets: updatedTargets,
      settings: updatedSettings,
    };

    // Save permanently in user-scoped persistent storage (never wiped on sign out)
    setStoredItem(`profile_${uid}`, updated);
    setStoredItem('active_user', updated);

    // Update Firebase Auth profile if displayName or avatar changed
    if (auth?.currentUser && (updates.displayName || updates.avatar)) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName || auth.currentUser.displayName,
          photoURL: updates.avatar || auth.currentUser.photoURL,
        });
      } catch (authErr) {
        console.warn('Could not update Firebase Auth user profile:', authErr);
      }
    }

    // Persist permanently in Cloud Firestore
    if (db && isFirebaseConfigured) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(
          userRef,
          {
            ...updates,
            targets: updatedTargets,
            settings: updatedSettings,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Also update public profile
        const publicRef = doc(db, 'profiles', uid);
        await setDoc(
          publicRef,
          {
            uid,
            displayName: updated.displayName,
            username: updated.username,
            avatar: updated.avatar,
            level: updated.level || 1,
            xp: updated.xp || 0,
            currentStreak: updated.currentStreak || 0,
            bestStreak: updated.bestStreak || 0,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Failed to update Firestore profile:', e);
      }
    }

    return updated;
  },
};
