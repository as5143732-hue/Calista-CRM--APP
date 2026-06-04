import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, loginWithGoogle, logoutGoogle, loginWithEmailAndPassword, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export interface User {
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

export interface AppUser {
  email: string;
  password?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  linkEmailPasswordToGoogle: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsIdle(true);
        signOut(auth);
      }, 259200000); // 3 days in milliseconds
    };

    resetTimer();

    const events = ['mousemove', 'keydown', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      
      if (u) {
        let currentRole = 'user';
        let currentName = u.displayName || u.email?.split('@')[0].replace(/\b\w/g, l => l.toUpperCase()) || 'User';
        
        try {
          // Handle 'users' collection
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            currentRole = userDoc.data().role;
            if (userDoc.data().name) {
              currentName = userDoc.data().name;
            }
          } else {
            // New user, create document
            const determinedRole = u.email === 'as5143732@gmail.com' ? 'admin' : 'user';
            currentRole = determinedRole;
            await setDoc(userDocRef, {
              email: u.email,
              name: currentName,
              role: determinedRole,
              createdAt: new Date().toISOString()
            });
          }

          // Handle 'appUsers' collection
          const appUserDocRef = doc(db, 'appUsers', u.uid);
          const appUserDoc = await getDoc(appUserDocRef);

          if (appUserDoc.exists()) {
            setAppUser(appUserDoc.data() as AppUser);
          } else {
            let manualData = null;
            if (u.email) {
              const manualUserRef = doc(db, 'appUsers', u.email);
              const manualUserDoc = await getDoc(manualUserRef);
              if (manualUserDoc.exists()) {
                manualData = manualUserDoc.data();
                await deleteDoc(manualUserRef);
              }
            }

            const newAppUser: AppUser = manualData ? (manualData as AppUser) : {
              email: u.email || '',
              password: '',
              isActive: false
            };
            await setDoc(appUserDocRef, newAppUser);
            setAppUser(newAppUser);
          }

        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.GET, `users_or_appUsers_fetch`);
          } catch(e) { console.error(e); }
        }
        
        setUser({
          name: currentName,
          email: u.email || '',
          role: currentRole,
          avatar: u.photoURL || undefined
        });
      } else {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = async () => {
    await loginWithGoogle();
    localStorage.setItem('login_time', Date.now().toString());
  };

  const loginWithEmail = async (email: string, password: string) => {
    await loginWithEmailAndPassword(email, password);
    localStorage.setItem('login_time', Date.now().toString());
  };

  const linkEmailPasswordToGoogle = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('لا يوجد مستخدم مسجل دخول حالياً');
    }
    const email = auth.currentUser.email;
    const { EmailAuthProvider, linkWithCredential, updatePassword } = await import('firebase/auth');
    const credential = EmailAuthProvider.credential(email, password);
    
    try {
      await linkWithCredential(auth.currentUser, credential);
    } catch (error: any) {
      if (error && (error.code === 'auth/provider-already-linked' || error.code === 'auth/credential-already-in-use' || String(error).includes('already-linked') || String(error).includes('credential-already-in-use'))) {
        await updatePassword(auth.currentUser, password);
      } else {
        throw error;
      }
    }

    // Update Firestore doc for appUsers (use currentUser.uid as key)
    const appUserDocRef = doc(db, 'appUsers', auth.currentUser.uid);
    const updatedAppUser: AppUser = {
      email: email,
      password: password,
      isActive: true
    };
    await setDoc(appUserDocRef, updatedAppUser, { merge: true });
    setAppUser(updatedAppUser);
  };

  const logout = async () => {
    await logoutGoogle();
    localStorage.removeItem('login_time');
    sessionStorage.removeItem('clientsPage');
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, appUser, loading, login, loginWithEmail, linkEmailPasswordToGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

