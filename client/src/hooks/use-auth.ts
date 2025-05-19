import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { loginWithEmail, loginWithGoogle, registerWithEmail, logoutUser, onAuthChange } from '@/lib/firebase';
import { useLocation } from 'wouter';

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => { throw new Error('AuthContext not initialized'); },
  loginWithGoogle: async () => { throw new Error('AuthContext not initialized'); },
  register: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => { throw new Error('AuthContext not initialized'); },
  setUserRole: () => { throw new Error('AuthContext not initialized'); },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
      
      // Get stored role if user is logged in
      if (authUser) {
        const storedRole = localStorage.getItem('userRole') as UserRole;
        if (storedRole) {
          setRole(storedRole);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const user = await loginWithEmail(email, password);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const googleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      return user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const user = await registerWithEmail(email, password);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setRole(null);
      localStorage.removeItem('userRole');
      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const setUserRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole) {
      localStorage.setItem('userRole', newRole);
      navigate('/dashboard');
    }
  };

  const value = {
    user,
    role,
    loading,
    login,
    loginWithGoogle: googleLogin,
    register,
    logout,
    setUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
