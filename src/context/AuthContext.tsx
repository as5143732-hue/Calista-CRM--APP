import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutGoogle, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface User {
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      
      if (u) {
        let currentRole = 'user';
        
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            currentRole = userDoc.data().role;
          } else {
            // New user, create document
            const determinedRole = u.email === 'as5143732@gmail.com' ? 'admin' : 'user';
            currentRole = determinedRole;
            await setDoc(userDocRef, {
              email: u.email,
              role: determinedRole,
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
        
        setUser({
          name: u.displayName || u.email?.split('@')[0].replace(/\b\w/g, l => l.toUpperCase()) || 'User',
          email: u.email || '',
          role: currentRole,
          avatar: u.photoURL || undefined
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    await loginWithGoogle();
  };

  const logout = async () => {
    await logoutGoogle();
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
