// Authentication Context — manages user state and all auth operations
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, MutationResponse } from '../types/api';
import { authService } from '../services';
import { config } from '../config';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  // Core auth
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;

  // Profile
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;

  // Email verification (PIN)
  verifyEmail: (email: string, pin: string) => Promise<void>;
  resendVerification: (email: string) => Promise<MutationResponse>;

  // Password reset (PIN-based)
  requestPasswordReset: (email: string) => Promise<MutationResponse>;
  verifyResetPin: (email: string, pin: string) => Promise<MutationResponse<{ verified: boolean }>>;
  resetPassword: (email: string, pin: string, newPassword: string) => Promise<MutationResponse>;

  // Change password (authenticated)
  changePassword: (currentPassword: string, newPassword: string) => Promise<MutationResponse>;

  // Utilities
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        });
      } catch {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    initAuth();

    // Listen for forced logout events (e.g., token expired)
    const handleLogout = () => {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please log in again.',
      });
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // Proactive token refresh every 90 minutes
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const REFRESH_INTERVAL = 90 * 60 * 1000;
    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem(config.auth.tokenKey);
      if (!token) return;
      try {
        await authService.refreshToken();
      } catch {
        // Refresh failed silently — will be caught by next API call
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated]);

  // ─── Core Auth ───────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.login({ email, password });
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      }));
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, confirmPassword: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.signUp({ email, password, confirmPassword });
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Sign up failed',
      }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // ─── Profile ─────────────────────────────────────────
  const updateProfile = useCallback(async (data: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const updatedUser = await authService.updateProfile(data);
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Profile update failed',
      }));
      throw err;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setState(prev => ({ ...prev, user }));
      }
    } catch {
      // Silently fail
    }
  }, []);

  // ─── Email Verification ──────────────────────────────
  const verifyEmail = useCallback(async (email: string, pin: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authService.verifyEmail(email, pin);
      if (result.data) {
        setState(prev => ({
          ...prev,
          user: result.data!,
          isLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Verification failed',
      }));
      throw err;
    }
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<MutationResponse> => {
    try {
      return await authService.resendVerificationEmail(email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend';
      setState(prev => ({ ...prev, error: msg }));
      throw err;
    }
  }, []);

  // ─── Password Reset ────────────────────────────────
  const requestPasswordReset = useCallback(async (email: string): Promise<MutationResponse> => {
    try {
      return await authService.requestPasswordReset(email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset PIN';
      throw new Error(msg);
    }
  }, []);

  const verifyResetPin = useCallback(async (email: string, pin: string): Promise<MutationResponse<{ verified: boolean }>> => {
    try {
      return await authService.verifyResetPin(email, pin);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PIN verification failed';
      throw new Error(msg);
    }
  }, []);

  const resetPassword = useCallback(async (email: string, pin: string, newPassword: string): Promise<MutationResponse> => {
    try {
      return await authService.resetPassword(email, pin, newPassword);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      throw new Error(msg);
    }
  }, []);

  // ─── Change Password (authenticated) ────────────────
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<MutationResponse> => {
    try {
      return await authService.changePassword(currentPassword, newPassword);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Password change failed';
      throw new Error(msg);
    }
  }, []);

  // ─── Utilities ──────────────────────────────────────
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    signUp,
    logout,
    updateProfile,
    refreshUser,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    verifyResetPin,
    resetPassword,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protected routes (optional utility)
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      );
    }
    if (!isAuthenticated) return null;
    return <Component {...props} />;
  };
}
