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
    const user = await authService.signIn(email, password);
    setCurrentUser(user);
    return user;
  };

  const signUp = async (email, password, displayName) => {
    const user = await authService.signUp(email, password, displayName);
    setCurrentUser(user);
    return user;
  };

  const signInWithGoogle = async () => {
    const user = await authService.signInWithGoogle();
    setCurrentUser(user);
    return user;
  };

  const signInDemo = () => {
    const user = authService.signInDemo();
    setCurrentUser(user);
    return user;
  };

  const signOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    const updated = await authService.updateUserProfile(currentUser.uid, updates);
    setCurrentUser(updated);
    return updated;
  };

  const awardXp = (amount, reason = '') => {
    if (!currentUser) return;
    const updatedUser = gamificationService.addXp(currentUser.uid, amount);
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
        signInDemo,
        signOut,
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
