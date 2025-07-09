import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  loginWithGoogle as googleLogin, 
  onAuthChange 
} from '@/lib/firebase';

export type UserRole = 'field-rep' | 'sales-rep' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUserRole: (role: UserRole) => void;
  testLogin: () => void;
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
    // Check for test user first
    const testUser = localStorage.getItem('test_user');
    const testRole = localStorage.getItem('userRole');
    
    console.log('Auth hook checking for test user:', { testUser, testRole });
    
    if (testUser && testRole) {
      console.log('Found test user, setting auth state');
      setUser(JSON.parse(testUser));
      setRole(testRole as UserRole);
      setLoading(false);
      return;
    }
    
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
      
      // Handle test user logout
      if (localStorage.getItem('test_user')) {
        localStorage.removeItem('test_user');
        localStorage.removeItem('userRole');
        setUser(null);
        setRole(null);
        return;
      }
      
      await logoutUser();
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const setUserRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      // Save role to localStorage
      localStorage.setItem(`role_${user.uid}`, newRole as string);
    }
  };

  const testLogin = () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true
    } as User;
    
    // Set localStorage
    localStorage.setItem('test_user', JSON.stringify(mockUser));
    localStorage.setItem('userRole', 'field-rep');
    
    // Update state immediately
    setUser(mockUser);
    setRole('field-rep');
    setLoading(false);
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
    testLogin,
  };

  // Use createElement instead of JSX to avoid build issues
  return React.createElement(AuthContext.Provider, { value }, children);
};