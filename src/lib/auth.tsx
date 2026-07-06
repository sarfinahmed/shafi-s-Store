import React, { createContext, useContext, useEffect, useState } from "react";
import { User, db } from "./db";
import { auth, dbInit } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.initDb();
    let userUnsub: () => void;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Initial fetch/creation
        const u = await db.login(firebaseUser.email || "", firebaseUser.uid, firebaseUser.displayName || "");
        setUser(u);
        
        // Listen to changes (e.g. balance, totalSpent updates from admin or purchases)
        userUnsub = onSnapshot(doc(dbInit, "users", firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as User);
          }
        });
      } else {
        if (userUnsub) userUnsub();
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (userUnsub) userUnsub();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const u = await db.login(result.user.email || "", result.user.uid, result.user.displayName || "");
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const u = await db.login(result.user.email || "", result.user.uid, name);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const deleteAccount = async () => {
    if (!auth.currentUser || !user) return;
    try {
      setLoading(true);
      await db.deleteUser(user.id);
      await deleteUser(auth.currentUser);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = await db.updateUser(user.id, updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, registerWithEmail, logout, deleteAccount, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
