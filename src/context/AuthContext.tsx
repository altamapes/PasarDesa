import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  sellerProfile: any | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, whatsapp: string) => Promise<void>;
  updateLocation: (latitude: number, longitude: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSellerProfile(data);
            setIsAdmin(data.role === 'admin' || currentUser.email === 'altamapes@gmail.com');
          } else {
            setSellerProfile(null);
            setIsAdmin(currentUser.email === 'altamapes@gmail.com');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setSellerProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const updateProfile = async (name: string, whatsapp: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      const profileData = {
        uid: user.uid,
        name,
        whatsapp,
      };

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...profileData,
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(docRef, {
          ...profileData,
          createdAt: docSnap.data().createdAt
        }, { merge: true });
      }
      
      setSellerProfile({ ...profileData, createdAt: docSnap.exists() ? docSnap.data().createdAt : new Date() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!user || !sellerProfile) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        latitude,
        longitude
      }, { merge: true });
      
      setSellerProfile({ ...sellerProfile, latitude, longitude });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, sellerProfile, isAdmin, loading, login, logout, updateProfile, updateLocation }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
