import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  loginWithGoogle as googleLogin, 
  onAuthChange 
} from '@/lib/firebase';

export type UserRole = 'junior_consultant' | 'senior_consultant' | 'admin' | 'client' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => useContext(AuthContext) as AuthContextType;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
      
      // Check for saved role in localStorage
      if (authUser) {
        const savedRole = localStorage.getItem(`role_${authUser.uid}`);
        if (savedRole) {
          setRole(savedRole as UserRole);
        }
      } else {
        setRole(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      const loggedInUser = await loginWithEmail(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      const registeredUser = await registerWithEmail(email, password);
      setUser(registeredUser);
      return registeredUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    try {
      setLoading(true);
      const loggedInUser = await googleLogin();
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const setUserRole = async (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      // Save role to localStorage for quick access
      localStorage.setItem(`role_${user.uid}`, newRole as string);
      
      // Persist to database
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/user/role', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ role: newRole })
        });
      } catch (error) {
        console.error('Failed to persist role to database:', error);
      }
    }
  };

  const value = {
    user,
    role,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    setUserRole,
  };

  // Use createElement instead of JSX to avoid build issues
  return React.createElement(AuthContext.Provider, { value }, children);
};