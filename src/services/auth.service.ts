// Authentication Service — full auth flow with PIN-based verification & password reset
import { config } from '../config';
import { apiClient } from '../lib/api-client';
import {
  AuthResponse,
  LoginRequest,
  SignUpRequest,
  User,
  ProfileUpdateRequest,
  ApiResponse,
  MutationResponse,
} from '../types/api';
import { delay, mockUsers, generateId } from './mock/data';

class AuthService {
  // ─── Login ──────────────────────────────────────────────
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (config.features.useMockData) {
      await delay(800);
      const user = mockUsers[0];
      const response: AuthResponse = {
        user,
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      this.setAuthData(response);
      return response;
    }

    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    this.setAuthData(response.data);
    return response.data;
  }

  // ─── Sign Up ────────────────────────────────────────────
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    if (config.features.useMockData) {
      await delay(1000);
      const newUser: User = {
        id: generateId('user'),
        email: data.email,
        accountType: 'individual',
        currency: 'NGN',
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const response: AuthResponse = {
        user: newUser,
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      this.setAuthData(response);
      return response;
    }

    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', data);
    this.setAuthData(response.data);
    return response.data;
  }

  // ─── Logout ─────────────────────────────────────────────
  async logout(): Promise<void> {
    if (config.features.useMockData) {
      await delay(300);
      this.clearAuthData();
      return;
    }

    try {
      const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
      await apiClient.post('/auth/logout', { refreshToken });
    } finally {
      this.clearAuthData();
    }
  }

  // ─── Get Current User ──────────────────────────────────
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (!token) return null;

    if (config.features.useMockData) {
      await delay(300);
      const userData = localStorage.getItem(config.auth.userKey);
      return userData ? JSON.parse(userData) : mockUsers[0];
    }

    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      // Update local cache
      localStorage.setItem(config.auth.userKey, JSON.stringify(response.data));
      return response.data;
    } catch {
      this.clearAuthData();
      return null;
    }
  }

  // ─── Update Profile ────────────────────────────────────
  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    if (config.features.useMockData) {
      await delay(500);
      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');
      const updatedUser: User = {
        ...currentUser,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(config.auth.userKey, JSON.stringify(updatedUser));
      return updatedUser;
    }

    const response = await apiClient.patch<ApiResponse<User>>('/auth/profile', data);
    localStorage.setItem(config.auth.userKey, JSON.stringify(response.data));
    return response.data;
  }

  // ─── Email Verification (PIN-based) ────────────────────
  async verifyEmail(email: string, pin: string): Promise<MutationResponse<User>> {
    if (config.features.useMockData) {
      await delay(800);
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        const verified = { ...currentUser, isEmailVerified: true };
        localStorage.setItem(config.auth.userKey, JSON.stringify(verified));
        return { success: true, message: 'Email verified successfully', data: verified };
      }
      return { success: true, message: 'Email verified successfully' };
    }

    const response = await apiClient.post<ApiResponse<User>>('/auth/verify-email', { email, pin });
    // Update cached user
    if (response.data) {
      localStorage.setItem(config.auth.userKey, JSON.stringify(response.data));
    }
    return { success: true, message: response.message || 'Email verified', data: response.data };
  }

  async resendVerificationEmail(email: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(500);
      return { success: true, message: 'Verification PIN sent' };
    }

    const response = await apiClient.post<ApiResponse<null>>('/auth/resend-verification', { email });
    return { success: true, message: response.message || 'Verification PIN sent' };
  }

  // ─── Forgot Password (PIN-based) ──────────────────────
  async requestPasswordReset(email: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(800);
      return { success: true, message: 'Password reset PIN sent' };
    }

    const response = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return { success: true, message: response.message || 'Reset PIN sent' };
  }

  async verifyResetPin(email: string, pin: string): Promise<MutationResponse<{ verified: boolean }>> {
    if (config.features.useMockData) {
      await delay(500);
      return { success: true, message: 'PIN verified', data: { verified: true } };
    }

    const response = await apiClient.post<ApiResponse<{ verified: boolean }>>('/auth/verify-reset-pin', { email, pin });
    return { success: true, message: response.message || 'PIN verified', data: response.data };
  }

  async resetPassword(email: string, pin: string, newPassword: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(800);
      return { success: true, message: 'Password reset successfully' };
    }

    const response = await apiClient.post<ApiResponse<null>>('/auth/reset-password', { email, pin, password: newPassword });
    return { success: true, message: response.message || 'Password reset successfully' };
  }

  // ─── Change Password (authenticated) ──────────────────
  async changePassword(currentPassword: string, newPassword: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(500);
      return { success: true, message: 'Password changed successfully' };
    }

    const response = await apiClient.post<ApiResponse<null>>('/auth/change-password', { currentPassword, newPassword });
    return { success: true, message: response.message || 'Password changed' };
  }

  // ─── Refresh Token ────────────────────────────────────
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);

    if (config.features.useMockData) {
      await delay(300);
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      return {
        user,
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken });
    this.setAuthData(response.data);
    return response.data;
  }

  // ─── Helpers ──────────────────────────────────────────
  private setAuthData(auth: AuthResponse): void {
    localStorage.setItem(config.auth.tokenKey, auth.accessToken);
    localStorage.setItem(config.auth.refreshTokenKey, auth.refreshToken);
    localStorage.setItem(config.auth.userKey, JSON.stringify(auth.user));
  }

  private clearAuthData(): void {
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.refreshTokenKey);
    localStorage.removeItem(config.auth.userKey);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(config.auth.tokenKey);
  }
}

export const authService = new AuthService();
