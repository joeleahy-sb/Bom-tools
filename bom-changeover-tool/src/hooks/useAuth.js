import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const ALLOWED_DOMAIN = '@standardbots.com';

export function useAuth() {
  // undefined = still loading, null = signed out, object = signed in
  const [user,      setUser]      = useState(undefined);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !u.email?.endsWith(ALLOWED_DOMAIN)) {
        // Wrong domain — sign out immediately
        signOut(auth);
        setUser(null);
        setAuthError(`Access restricted to ${ALLOWED_DOMAIN} accounts.`);
      } else {
        setUser(u);
        setAuthError(null);
      }
    });
    return unsub;
  }, []);

  const login = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('Sign-in failed. Please try again.');
      }
    }
  };

  const logout = () => signOut(auth);

  return { user, login, logout, authError, loading: user === undefined };
}
