// Base API Client with interceptors for authentication and error handling
import { config } from '../config';
import { ApiError, ApiException, ApiResponse } from '../types/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.defaultTimeout = config.api.timeout;
  }

  // Get auth token from storage
  private getAuthToken(): string | null {
    return localStorage.getItem(config.auth.tokenKey);
  }

  // Build URL with query params
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  // Build headers with auth token
  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...customHeaders,
    });

    const token = this.getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // Handle response
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle no content
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    if (!response.ok) {
      let error: ApiError;
      
      if (isJson) {
        const errorData = await response.json();
        error = {
          code: errorData.code || 'UNKNOWN_ERROR',
          message: errorData.message || 'An unexpected error occurred',
          details: errorData.details,
          statusCode: response.status,
        };
      } else {
        error = {
          code: 'NETWORK_ERROR',
          message: response.statusText || 'Network error occurred',
          statusCode: response.status,
        };
      }

      // Handle 401 - Unauthorized (token expired)
      if (response.status === 401) {
        // Clear auth data and redirect to login
        localStorage.removeItem(config.auth.tokenKey);
        localStorage.removeItem(config.auth.refreshTokenKey);
        localStorage.removeItem(config.auth.userKey);
        
        // Dispatch custom event for auth context to handle
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      throw new ApiException(error, response.status);
    }

    if (isJson) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  // Make request with timeout
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    requestConfig?: RequestConfig
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = requestConfig?.timeout || this.defaultTimeout;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const url = this.buildUrl(endpoint, requestConfig?.params);
      const headers = this.buildHeaders(requestConfig?.headers);

      const fetchConfig: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && method !== 'GET') {
        fetchConfig.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchConfig);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiException({
            code: 'TIMEOUT',
            message: 'Request timed out',
            statusCode: 408,
          });
        }
        
        throw new ApiException({
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error occurred',
          statusCode: 0,
        });
      }
      
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Public methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  // File upload method
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
