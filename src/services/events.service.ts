// Events Service
import { config } from '../config';
import { apiClient } from '../lib/api-client';
import { 
  ApiResponse, 
  PaginatedResponse, 
  SearchParams, 
  CreateEventRequest, 
  UpdateEventRequest,
  MutationResponse,
  UploadResponse
} from '../types/api';
import { EventData, Metric, ChecklistItem, Module, Activity } from '../components/event-dashboard/types';
import { delay, mockEvents, generateId } from './mock/data';

// Extended event type for list view
export interface EventListItem {
  id: string;
  name: string;
  type: 'Physical' | 'Virtual' | 'Hybrid';
  status: string;
  date: string;
  time: string;
  ticketsSold: number | string;
  coverImageUrl?: string;
}

class EventsService {
  // Get all events for current user
  async getEvents(params?: SearchParams): Promise<PaginatedResponse<EventListItem>> {
    if (config.features.useMockData) {
      await delay(600);
      
      let filtered = mockEvents.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        status: e.status === 'draft' ? 'Draft' : e.status === 'published' ? 'Published' : 'Scheduled',
        date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: e.time,
        ticketsSold: Math.floor(Math.random() * 500),
      }));
      
      // Apply search
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(e => 
          e.name.toLowerCase().includes(search) ||
          e.type.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filtered,
        meta: {
          currentPage: params?.page || 1,
          totalPages: 1,
          totalItems: filtered.length,
          itemsPerPage: params?.limit || 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    return apiClient.get<PaginatedResponse<EventListItem>>('/events', { params });
  }

  // Get single event by ID
  async getEvent(eventId: string): Promise<EventData> {
    if (config.features.useMockData) {
      await delay(400);
      const event = mockEvents.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');
      return event;
    }

    const response = await apiClient.get<ApiResponse<EventData>>(`/events/${eventId}`);
    return response.data;
  }

  // Create new event
  async createEvent(data: CreateEventRequest): Promise<EventData> {
    if (config.features.useMockData) {
      await delay(800);
      
      const newEvent: EventData = {
        id: generateId('evt'),
        name: data.name,
        date: data.startDate,
        time: data.startTime,
        type: data.type,
        websiteUrl: `https://${data.subdomain || 'event'}.munar.site`,
        currency: data.currency || config.app.defaultCurrency,
        status: 'draft',
        phase: 'setup',
      };
      
      mockEvents.push(newEvent);
      return newEvent;
    }

    const response = await apiClient.post<ApiResponse<EventData>>('/events', data);
    return response.data;
  }

  // Update event
  async updateEvent(eventId: string, data: UpdateEventRequest): Promise<EventData> {
    if (config.features.useMockData) {
      await delay(500);
      
      const index = mockEvents.findIndex(e => e.id === eventId);
      if (index === -1) throw new Error('Event not found');
      
      mockEvents[index] = { ...mockEvents[index], ...data } as EventData;
      return mockEvents[index];
    }

    const response = await apiClient.patch<ApiResponse<EventData>>(`/events/${eventId}`, data);
    return response.data;
  }

  // Delete event
  async deleteEvent(eventId: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(500);
      
      const index = mockEvents.findIndex(e => e.id === eventId);
      if (index !== -1) mockEvents.splice(index, 1);
      
      return { success: true, message: 'Event deleted successfully' };
    }

    return apiClient.delete<MutationResponse>(`/events/${eventId}`);
  }

  // Clone event
  async cloneEvent(eventId: string): Promise<EventData> {
    if (config.features.useMockData) {
      await delay(600);
      
      const original = mockEvents.find(e => e.id === eventId);
      if (!original) throw new Error('Event not found');
      
      const cloned: EventData = {
        ...original,
        id: generateId('evt'),
        name: `${original.name} (Copy)`,
        status: 'draft',
      };
      
      mockEvents.push(cloned);
      return cloned;
    }

    const response = await apiClient.post<ApiResponse<EventData>>(`/events/${eventId}/clone`);
    return response.data;
  }

  // Publish event
  async publishEvent(eventId: string): Promise<EventData> {
    return this.updateEvent(eventId, { status: 'published' });
  }

  // Unpublish event
  async unpublishEvent(eventId: string): Promise<EventData> {
    return this.updateEvent(eventId, { status: 'unpublished' });
  }

  // Upload cover image
  async uploadCoverImage(eventId: string, file: File): Promise<UploadResponse> {
    if (config.features.useMockData) {
      await delay(1000);
      return {
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      };
    }

    return apiClient.upload<UploadResponse>(`/events/${eventId}/cover`, file);
  }

  // Get event metrics/analytics
  async getEventMetrics(eventId: string): Promise<Metric[]> {
    if (config.features.useMockData) {
      await delay(400);
      return [
        { id: 'm1', label: 'Tickets Sold/registrations', value: '3/5', context: 'setup' },
        { id: 'm2', label: 'Website Views', value: '12', context: 'setup' },
        { id: 'm3', label: 'Voting Activity', value: 'Not Configured', context: 'setup' },
        { id: 'm4', label: 'Total Revenue', value: '₦4.5M', context: 'setup' },
        { id: 'm5', label: 'Check-ins', value: '0', context: 'setup' },
        { id: 'm6', label: 'Survey Responses', value: '0', context: 'setup' },
      ];
    }

    const response = await apiClient.get<ApiResponse<Metric[]>>(`/events/${eventId}/metrics`);
    return response.data;
  }

  // Get event checklist
  async getEventChecklist(eventId: string): Promise<ChecklistItem[]> {
    if (config.features.useMockData) {
      await delay(300);
      return [
        { id: 'c1', label: 'Add tickets or registration', status: 'not-started', actionLabel: 'Set up', phase: 'setup' },
        { id: 'c2', label: 'Customize event website', status: 'in-progress', actionLabel: 'Customize', phase: 'setup' },
        { id: 'c3', label: 'Add speakers and schedule', status: 'not-started', actionLabel: 'Set up', phase: 'setup' },
      ];
    }

    const response = await apiClient.get<ApiResponse<ChecklistItem[]>>(`/events/${eventId}/checklist`);
    return response.data;
  }

  // Get event modules status
  async getEventModules(eventId: string): Promise<Module[]> {
    if (config.features.useMockData) {
      await delay(300);
      return [
        { id: 'mod1', name: 'Event Website', description: 'Customize your landing page', icon: 'globe', status: 'active', actionLabel: 'Manage', iconColor: 'green' },
        { id: 'mod2', name: 'Tickets', description: 'Create and manage ticket tiers', icon: 'ticket', status: 'not-started', actionLabel: 'Manage', iconColor: 'orange' },
        { id: 'mod3', name: 'Schedule & Agenda', description: 'Manage sessions and timeline', icon: 'calendar', status: 'not-started', actionLabel: 'Create', iconColor: 'pink' },
        { id: 'mod4', name: 'People & Speakers', description: 'Speaker profiles and Bios', icon: 'mic', status: 'not-started', actionLabel: 'Set up', iconColor: 'green' },
        { id: 'mod5', name: 'Sponsors', description: 'Create and manage brand partners', icon: 'users', status: 'not-started', actionLabel: 'Set up', iconColor: 'blue' },
        { id: 'mod6', name: 'Forms and surveys', description: 'Customize your landing page', icon: 'file-text', status: 'active', actionLabel: 'Manage', iconColor: 'pink' },
        { id: 'mod7', name: 'Voting', description: 'Setup live polls and awards', icon: 'globe', status: 'not-started', actionLabel: 'Manage', iconColor: 'indigo' },
        { id: 'mod8', name: 'Event Media & Gallery', description: 'Customize your landing page', icon: 'globe', status: 'not-started', actionLabel: 'Manage', iconColor: 'purple' },
        { id: 'mod9', name: 'Merchandise', description: 'Sell items and add-ons', icon: 'shopping-bag', status: 'not-started', actionLabel: 'Manage', iconColor: 'gray' },
        { id: 'mod10', name: 'DP & Cover Maker', description: 'Create branded social images', icon: 'image', status: 'not-started', actionLabel: 'Manage', iconColor: 'purple' },
      ];
    }

    const response = await apiClient.get<ApiResponse<Module[]>>(`/events/${eventId}/modules`);
    return response.data;
  }

  // Get event activity feed
  async getEventActivities(eventId: string, limit: number = 10): Promise<Activity[]> {
    if (config.features.useMockData) {
      await delay(300);
      return [
        { id: 'a1', type: 'ticket', message: 'New VIP Ticket purchased by John Doe', timestamp: new Date().toISOString(), isHighPriority: true },
        { id: 'a2', type: 'form', message: 'Speaker application received', timestamp: new Date(Date.now() - 3600000).toISOString(), isHighPriority: false },
        { id: 'a3', type: 'system', message: 'Event website published', timestamp: '2026-01-24T10:00:00', isHighPriority: false },
        { id: 'a4', type: 'ticket', message: 'Sponsorship proposal sent to Acme Corp', timestamp: new Date(Date.now() - 7200000).toISOString(), isHighPriority: false },
        { id: 'a5', type: 'form', message: 'Registration form updated', timestamp: new Date(Date.now() - 10800000).toISOString(), isHighPriority: false },
      ];
    }

    const response = await apiClient.get<ApiResponse<Activity[]>>(`/events/${eventId}/activities`, { params: { limit } });
    return response.data;
  }
}

export const eventsService = new EventsService();
