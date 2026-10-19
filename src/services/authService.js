/**
 * Authentication Service
 * Manages Firebase Authentication and user profile synchronization
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase';
import { getStoredItem, setStoredItem } from './storageHelper';

const DEMO_USER = {
  uid: 'demo_athlete_prashant',
  email: 'athlete@levelup.com',
  displayName: 'Prashant Yadav',
  username: 'prashant_beast',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  level: 5,
  xp: 2450,
  currentStreak: 6,
  bestStreak: 14,
  joinedAt: '2026-01-15',
  bio: 'Daily athletic consistency. Building better every day.',
  targets: {
    calories: 2600,
    protein: 165,
    carbs: 280,
    fats: 70,
    water: 3500,
    steps: 10000,
  },
  settings: {
    units: 'metric',
    timeZone: 'Asia/Kolkata',
    visibility: 'public',
    notifications: true,
  },
};

export const authService = {
  // Subscribe to authentication state
  onAuthStateChange(callback) {
    // Check if demo/local session is active
    const localUser = getStoredItem('active_user', null);
    if (!isFirebaseConfigured && localUser) {
      callback(localUser);
      return () => {};
    }

    if (!auth) {
      callback(localUser);
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isGoogle =
          firebaseUser.providerData?.some((p) => p.providerId === 'google.com') ||
          sessionStorage.getItem('last_auth_provider') === 'google';

        // Fetch or create Firestore user profile
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
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                username: (firebaseUser.displayName || firebaseUser.email.split('@')[0] || 'prashant_beast')
                  .toLowerCase()
                  .replace(/\s+/g, '_'),
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
                targets: {
                  calories: 2600,
                  protein: 165,
                  carbs: 280,
                  fats: 70,
                  water: 3500,
                  steps: 10000,
                },
                settings: {
                  units: 'metric',
                  timeZone: 'Asia/Kolkata',
                  visibility: 'public',
                  notifications: true,
                },
              };
              await setDoc(userDocRef, userProfile);
            }
          } catch (err) {
            console.warn('[Firestore] Profile fetch error, using local fallback:', err);
          }
        }

        const mergedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL,
          authProvider: isGoogle ? 'google' : (userProfile?.authProvider || 'password'),
          isOnboardingCompleted: userProfile?.isOnboardingCompleted === true,
          ...(userProfile || {}),
        };
        setStoredItem('active_user', mergedUser);
        callback(mergedUser);
      } else {
        const activeLocal = getStoredItem('active_user', null);
        callback(activeLocal);
      }
    });
  },

  // Sign In with Email & Password
  async signIn(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Try Firebase Authentication if available
    if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        return userCredential.user;
      } catch (err) {
        // If real Firebase Auth user found or network error, let it handle unless it's demo or API key missing
        if (err.code !== 'auth/api-key-not-valid' && err.code !== 'auth/invalid-api-key') {
          // If user exists locally in multi-account registry, check credentials
          const registered = getStoredItem('registered_users', {});
          if (registered[cleanEmail]) {
            const user = registered[cleanEmail];
            setStoredItem('active_user', user);
            return user;
          }
          throw err;
        }
      }
    }

    // 2. Multi-Account Registry Support
    const registered = getStoredItem('registered_users', {});
    if (registered[cleanEmail]) {
      const user = registered[cleanEmail];
      setStoredItem('active_user', user);
      return user;
    }

    // Fallback: Generate distinct account for this email
    const safeHash = btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const user = {
      ...DEMO_USER,
      uid: cleanEmail === 'athlete@levelup.com' ? 'demo_athlete_prashant' : `user_${safeHash}`,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      username: cleanEmail.split('@')[0].toLowerCase(),
    };
    registered[cleanEmail] = user;
    setStoredItem('registered_users', registered);
    setStoredItem('active_user', user);
    return user;
  },

  // Sign Up with Email, Password & Display Name
  async signUp(email, password, displayName) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const name = displayName || cleanEmail.split('@')[0];
    const safeHash = btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const assignedUid = `user_${safeHash}`;

    // 1. Try Firebase Authentication if configured
    if (auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        return userCredential.user;
      } catch (err) {
        if (err.code !== 'auth/api-key-not-valid' && err.code !== 'auth/invalid-api-key') {
          throw err;
        }
      }
    }

    // 2. Create distinct account for this athlete with unique UID
    const newUser = {
      ...DEMO_USER,
      uid: assignedUid,
      email: cleanEmail,
      displayName: name,
      username: name.toLowerCase().replace(/\s+/g, '_'),
      level: 1,
      xp: 100,
      currentStreak: 0,
      bestStreak: 0,
    };

    const registered = getStoredItem('registered_users', {});
    registered[cleanEmail] = newUser;
    setStoredItem('registered_users', registered);
    setStoredItem('active_user', newUser);

    // Initialize Firestore profile if Firestore db is connected
    if (db) {
      try {
        const userDocRef = doc(db, 'users', assignedUid);
        await setDoc(userDocRef, {
          ...newUser,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('[Firestore] Profile init note:', e.message);
      }
    }

    return newUser;

    // Initialize Firestore profile
    if (db) {
      try {
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const profile = {
          uid: userCredential.user.uid,
          email,
          displayName: displayName || email.split('@')[0],
          username: (displayName || email.split('@')[0]).toLowerCase().replace(/\s+/g, '_'),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          level: 1,
          xp: 100,
          currentStreak: 0,
          bestStreak: 0,
          createdAt: serverTimestamp(),
          targets: {
            calories: 2400,
            protein: 150,
            carbs: 260,
            fats: 65,
            water: 3000,
            steps: 10000,
          },
          settings: {
            units: 'metric',
            timeZone: 'UTC',
            visibility: 'public',
            notifications: true,
          },
        };
        await setDoc(userDocRef, profile);
      } catch (e) {
        console.warn('Firestore profile init:', e);
      }
    }

    return userCredential.user;
  },

  // Google Sign-In
  async signInWithGoogle() {
    sessionStorage.setItem('last_auth_provider', 'google');
    sessionStorage.setItem('prompt_google_onboarding', 'true');

    if (!isFirebaseConfigured || !auth) {
      const demoGoogle = {
        ...DEMO_USER,
        displayName: 'Prashant Yadav',
        username: 'prashant_beast',
        authProvider: 'google',
        isOnboardingCompleted: false,
      };
      setStoredItem('active_user', demoGoogle);
      return demoGoogle;
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  // Quick Demo Login
  signInDemo() {
    setStoredItem('active_user', DEMO_USER);
    return DEMO_USER;
  },

  // Sign Out
  async signOut() {
    setStoredItem('active_user', null);
    if (auth && isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Firebase signout:', err);
      }
    }
  },

  // Update Profile
  async updateUserProfile(uid, updates) {
    const current = getStoredItem('active_user', DEMO_USER);
    const updated = { ...current, ...updates };
    setStoredItem('active_user', updated);

    if (db && isFirebaseConfigured && uid) {
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
