import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { gamificationService } from '../services/gamificationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    return await authService.signIn(email, password);
  };

  const signUp = async (email, password, displayName) => {
    return await authService.signUp(email, password, displayName);
  };

  const signInWithGoogle = async () => {
    return await authService.signInWithGoogle();
  };

  const signOut = async () => {
    setCurrentUser(null);
    await authService.signOut();
  };

  const resetPassword = async (email) => {
    await authService.resetPassword(email);
  };

  const updateProfile = async (updates) => {
    if (!currentUser?.uid) return;
    const updated = await authService.updateUserProfile(currentUser.uid, updates);
    setCurrentUser(updated);
    return updated;
  };

  const awardXp = (amount, reason = '') => {
    if (!currentUser?.uid) return;
    const updatedUser = gamificationService.addXp(currentUser.uid, amount, currentUser);
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
        awardXp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
