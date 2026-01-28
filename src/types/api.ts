// API Response and Error Types

// Standard API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  statusCode: number;
}

export class ApiException extends Error {
  constructor(
    public error: ApiError,
    public statusCode: number = 500
  ) {
    super(error.message);
    this.name = 'ApiException';
  }
}

// Request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  search?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  avatarUrl?: string;
  accountType: 'individual' | 'organization';
  currency: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  organization?: string;
  currency?: string;
  avatarUrl?: string;
}

// Event types for API
export interface CreateEventRequest {
  name: string;
  type: 'Physical' | 'Virtual' | 'Hybrid';
  description?: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  subdomain?: string;
  customDomain?: string;
  coverImageUrl?: string;
  country?: string;
  venueLocation?: string;
  categories?: string[];
  isRecurring?: boolean;
  recurringConfig?: RecurringEventConfig;
}

export interface RecurringEventConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDates?: string[];
  endDate?: string;
  occurrences?: number;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: 'draft' | 'published' | 'unpublished';
}

// Ticket types for API
export interface CreateTicketRequest {
  eventId: string;
  name: string;
  type: 'Single' | 'Group';
  groupSize?: number;
  isFree: boolean;
  price?: number;
  quantityTotal: number;
  salesStart: string;
  salesEnd: string;
  minPerOrder: number;
  maxPerOrder: number;
  visibility: 'Public' | 'Hidden' | 'Invite Only';
  description?: string;
  allowTransfer: boolean;
  allowResale: boolean;
  refundPolicy: 'Refundable' | 'Non-refundable';
  requireAttendeeInfo: boolean;
}

export interface UpdateTicketRequest extends Partial<CreateTicketRequest> {
  status?: 'Draft' | 'On Sale' | 'Sold Out' | 'Hidden';
}

// File upload
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Generic mutation response
export interface MutationResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}
