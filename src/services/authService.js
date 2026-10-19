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

const DEFAULT_TARGETS = {
  calories: 2600,
  protein: 165,
  carbs: 280,
  fats: 70,
  water: 3500,
  steps: 10000,
};

const DEFAULT_SETTINGS = {
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
   */
  onAuthStateChange(callback) {
    if (!auth) {
      setStoredItem('active_user', null);
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isGoogle =
          firebaseUser.providerData?.some((p) => p.providerId === 'google.com') ||
          sessionStorage.getItem('last_auth_provider') === 'google';

        const email = firebaseUser.email || '';
        const fallbackName = firebaseUser.displayName || (email ? email.split('@')[0] : 'Athlete');
        const defaultUsername = fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        // Fetch or initialize Firestore user profile
        let userProfile = null;
        if (db && isFirebaseConfigured) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              userProfile = userSnap.data();
            } else {
              userProfile = {
                uid: firebaseUser.uid,
                email: email,
                displayName: fallbackName,
                username: defaultUsername,
                avatar:
                  firebaseUser.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                level: 1,
                xp: 150,
                currentStreak: 1,
                bestStreak: 1,
                authProvider: isGoogle ? 'google' : 'password',
                isOnboardingCompleted: false,
                createdAt: serverTimestamp(),
                targets: DEFAULT_TARGETS,
                settings: DEFAULT_SETTINGS,
              };
              await setDoc(userDocRef, userProfile);
            }
          } catch (err) {
            console.warn('[Firestore] Profile fetch error:', err);
          }
        }

        const authenticatedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: userProfile?.displayName || firebaseUser.displayName || fallbackName,
          username: userProfile?.username || defaultUsername,
          photoURL: firebaseUser.photoURL || userProfile?.avatar,
          avatar:
            userProfile?.avatar ||
            firebaseUser.photoURL ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          authProvider: isGoogle ? 'google' : (userProfile?.authProvider || 'password'),
          isOnboardingCompleted: userProfile?.isOnboardingCompleted === true,
          level: userProfile?.level || 1,
          xp: userProfile?.xp || 150,
          currentStreak: userProfile?.currentStreak || 1,
          bestStreak: userProfile?.bestStreak || 1,
          targets: userProfile?.targets || DEFAULT_TARGETS,
          settings: userProfile?.settings || DEFAULT_SETTINGS,
          ...(userProfile || {}),
        };

        // Cache active user for fast offline restore
        setStoredItem('active_user', authenticatedUser);
        callback(authenticatedUser);
      } else {
        // User logged out or unauthenticated: clean state immediately
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

    // Initialize user doc in Firestore
    if (db && user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
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
          createdAt: serverTimestamp(),
          targets: DEFAULT_TARGETS,
          settings: DEFAULT_SETTINGS,
        };
        await setDoc(userDocRef, profile);
      } catch (e) {
        console.warn('[Firestore] Profile init on signup error:', e);
      }
    }

    return user;
  },

  /**
   * Sign In via Google Popup
   */
  async signInWithGoogle() {
    sessionStorage.setItem('last_auth_provider', 'google');
    sessionStorage.setItem('prompt_google_onboarding', 'true');

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
    // 1. Wipe active session user & temporary markers
    setStoredItem('active_user', null);
    sessionStorage.removeItem('last_auth_provider');
    sessionStorage.removeItem('prompt_google_onboarding');

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
   * Update Profile in Firestore and local state
   */
  async updateUserProfile(uid, updates) {
    if (!uid) return null;
    const current = getStoredItem('active_user', null) || {};
    const updated = { ...current, ...updates };
    setStoredItem('active_user', updated);

    if (db && isFirebaseConfigured) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, updates, { merge: true });
      } catch (e) {
        console.warn('Failed to update Firestore profile:', e);
      }
    }
    return updated;
  },
};
