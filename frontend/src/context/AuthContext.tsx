import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';
import { authAPI, workspaceAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pulse_access_token'));
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceAPI.list();
      const listData = Array.isArray(res.data) ? res.data : ((res.data as any)?.results || []);
      setWorkspaces(listData);
      if (listData.length > 0) {
        setCurrentWorkspaceState((prev) => {
          if (!prev || !listData.some((w: Workspace) => w.id === prev.id)) {
            return listData[0];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
      setWorkspaces([]);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token && !user) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('pulse_user', JSON.stringify(res.data));
          await fetchWorkspaces();
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      } else if (token && user && workspaces.length === 0) {
        await fetchWorkspaces();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await authAPI.login({ email: cleanEmail, password });
    const { access, refresh, user: userData } = res.data;
    localStorage.setItem('pulse_access_token', access);
    localStorage.setItem('pulse_refresh_token', refresh);
    localStorage.setItem('pulse_user', JSON.stringify(userData));
    setUser(userData);
    setToken(access);
    await fetchWorkspaces();
  };

  const register = async (data: any) => {
    await authAPI.register(data);
  };

  const logout = () => {
    localStorage.removeItem('pulse_access_token');
    localStorage.removeItem('pulse_refresh_token');
    localStorage.removeItem('pulse_user');
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspaceState(null);
  };

  const setCurrentWorkspace = (ws: Workspace) => {
    setCurrentWorkspaceState(ws);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('pulse_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        workspaces,
        currentWorkspace,
        isLoading,
        login,
        register,
        logout,
        setCurrentWorkspace,
        refreshWorkspaces: fetchWorkspaces,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
