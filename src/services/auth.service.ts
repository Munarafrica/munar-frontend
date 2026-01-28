// Authentication Service
import { config } from '../config';
import { apiClient } from '../lib/api-client';
import { 
  AuthResponse, 
  LoginRequest, 
  SignUpRequest, 
  User, 
  ProfileUpdateRequest,
  ApiResponse,
  MutationResponse 
} from '../types/api';
import { delay, mockUsers, generateId } from './mock/data';

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (config.features.useMockData) {
      await delay(800);
      
      // Mock login - always succeeds for demo
      const user = mockUsers[0];
      const response: AuthResponse = {
        user,
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      
      // Store tokens
      this.setAuthData(response);
      
      return response;
    }

    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    this.setAuthData(response.data);
    return response.data;
  }

  // Sign up user
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

  // Logout user
  async logout(): Promise<void> {
    if (config.features.useMockData) {
      await delay(300);
      this.clearAuthData();
      return;
    }

    try {
      await apiClient.post('/auth/logout');
    } finally {
      this.clearAuthData();
    }
  }

  // Get current user
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
      return response.data;
    } catch {
      this.clearAuthData();
      return null;
    }
  }

  // Update profile
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

  // Request password reset
  async requestPasswordReset(email: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(800);
      return { success: true, message: 'Password reset email sent' };
    }

    return apiClient.post<MutationResponse>('/auth/forgot-password', { email });
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(800);
      return { success: true, message: 'Password reset successfully' };
    }

    return apiClient.post<MutationResponse>('/auth/reset-password', { token, newPassword });
  }

  // Verify email
  async verifyEmail(token: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(500);
      return { success: true, message: 'Email verified successfully' };
    }

    return apiClient.post<MutationResponse>('/auth/verify-email', { token });
  }

  // Resend verification email
  async resendVerificationEmail(): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(500);
      return { success: true, message: 'Verification email sent' };
    }

    return apiClient.post<MutationResponse>('/auth/resend-verification');
  }

  // Refresh token
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

  // Helper methods
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

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem(config.auth.tokenKey);
  }
}

export const authService = new AuthService();
