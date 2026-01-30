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
import { getEventPayload, setEventPayload } from '../lib/event-storage';
import { delay, mockEvents, generateId } from './mock/data';
import { ticketsService } from './tickets.service';
import { formsService } from './forms.service';
import { programService } from './program.service';
import * as sponsorsService from './sponsors.service';
import * as merchandiseService from './merchandise.service';
import * as votingService from './voting.service';

const EVENTS_STORAGE_KEY = 'munar_events';
const PROGRESS_STORAGE_KEY = 'munar_event_progress';

type EventProgress = {
  modules: Module[];
  activities: Activity[];
};

const defaultModules = (): Module[] => [
  { id: 'mod1', name: 'Event Website', description: 'Customize your landing page', icon: 'globe', status: 'not-started', actionLabel: 'Customize', iconColor: 'green' },
  { id: 'mod2', name: 'Tickets', description: 'Create and manage ticket tiers', icon: 'ticket', status: 'not-started', actionLabel: 'Set up', iconColor: 'orange' },
  { id: 'mod3', name: 'Schedule & Agenda', description: 'Manage sessions and timeline', icon: 'calendar', status: 'not-started', actionLabel: 'Set up', iconColor: 'pink' },
  { id: 'mod4', name: 'People & Speakers', description: 'Speaker profiles and Bios', icon: 'mic', status: 'not-started', actionLabel: 'Set up', iconColor: 'green' },
  { id: 'mod5', name: 'Sponsors', description: 'Create and manage brand partners', icon: 'users', status: 'not-started', actionLabel: 'Set up', iconColor: 'blue' },
  { id: 'mod6', name: 'Forms and surveys', description: 'Collect attendee data and feedback', icon: 'file-text', status: 'not-started', actionLabel: 'Set up', iconColor: 'pink' },
  { id: 'mod7', name: 'Voting', description: 'Setup live polls and awards', icon: 'vote', status: 'not-started', actionLabel: 'Set up', iconColor: 'indigo' },
  { id: 'mod8', name: 'Event Media & Gallery', description: 'Upload and publish gallery', icon: 'globe', status: 'not-started', actionLabel: 'Set up', iconColor: 'purple' },
  { id: 'mod9', name: 'DP & Cover Maker', description: 'Create branded social images', icon: 'image', status: 'not-started', actionLabel: 'Set up', iconColor: 'purple' },
  { id: 'mod10', name: 'Merchandise', description: 'Sell items and add-ons', icon: 'shopping-bag', status: 'not-started', actionLabel: 'Set up', iconColor: 'gray' },
  { id: 'mod11', name: 'Analytics', description: 'Overview of your event analytics', icon: 'layout', status: 'active', actionLabel: 'View', iconColor: 'indigo' },
];

const checklistConfig = [
  { id: 'tickets', label: 'Add tickets or registration', module: 'Tickets', actionLabel: 'Set up' },
  { id: 'website', label: 'Customize event website', module: 'Event Website', actionLabel: 'Customize' },
  { id: 'schedule', label: 'Add schedule and speakers', module: 'Schedule & Agenda', actionLabel: 'Set up' },
  { id: 'sponsors', label: 'Add sponsors', module: 'Sponsors', actionLabel: 'Set up' },
  { id: 'forms', label: 'Create forms and surveys', module: 'Forms and surveys', actionLabel: 'Set up' },
  { id: 'gallery', label: 'Upload event media', module: 'Event Media & Gallery', actionLabel: 'Set up' },
  { id: 'dp', label: 'Create DP & cover maker', module: 'DP & Cover Maker', actionLabel: 'Set up' },
  { id: 'merch', label: 'Add merchandise', module: 'Merchandise', actionLabel: 'Set up' },
  { id: 'voting', label: 'Enable voting', module: 'Voting', actionLabel: 'Set up' },
];

const loadStoredEvents = (): EventData[] => {
  if (typeof window === 'undefined') return mockEvents;
  const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
  if (!raw) return mockEvents;
  try {
    return JSON.parse(raw) as EventData[];
  } catch {
    return mockEvents;
  }
};

const saveStoredEvents = (events: EventData[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }
  mockEvents.length = 0;
  mockEvents.push(...events);
};

const loadProgressStore = (): Record<string, EventProgress> => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, EventProgress>;
  } catch {
    return {};
  }
};

const saveProgressStore = (store: Record<string, EventProgress>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
};

const ensureProgress = (eventId: string): EventProgress => {
  const store = loadProgressStore();
  if (!store[eventId]) {
    store[eventId] = {
      modules: defaultModules(),
      activities: [],
    };
    saveProgressStore(store);
  }
  return store[eventId];
};

const updateProgress = (eventId: string, progress: EventProgress) => {
  const store = loadProgressStore();
  store[eventId] = progress;
  saveProgressStore(store);
};

const buildChecklist = (modules: Module[]): ChecklistItem[] => {
  const items = checklistConfig.map((item) => {
    const moduleObj = modules.find((module) => module.name === item.module);
    const moduleStatus = moduleObj?.status ?? 'not-started';
    return {
      id: item.id,
      label: item.label,
      status: moduleStatus === 'active' ? 'completed' : 'not-started',
      actionLabel: item.actionLabel,
      phase: 'setup',
      count: moduleObj?.count ?? 0,
    } as ChecklistItem;
  });

  // Move completed items to the bottom while preserving relative order
  const notCompleted = items.filter(i => i.status !== 'completed');
  const completed = items.filter(i => i.status === 'completed');
  return [...notCompleted, ...completed];
};

const getServiceModuleCounts = async (eventId: string): Promise<Record<string, number>> => {
  const [tickets, forms, products, campaigns, sponsors, speakers, sessions] = await Promise.all([
    ticketsService.getTickets(eventId).catch(() => []),
    formsService.getForms(eventId).catch(() => []),
    merchandiseService.getProducts(eventId).catch(() => []),
    votingService.getCampaigns(eventId).catch(() => []),
    sponsorsService.getSponsors(eventId).catch(() => []),
    programService.getSpeakers(eventId).catch(() => []),
    programService.getSessions(eventId).catch(() => []),
  ]);

  return {
    'Tickets': tickets.length,
    'Forms and surveys': forms.length,
    'Merchandise': products.length,
    'Voting': campaigns.length,
    'Sponsors': sponsors.length,
    'People & Speakers': speakers.length,
    'Schedule & Agenda': sessions.length,
  };
};

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
      
      const events = loadStoredEvents();
      let filtered = events.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        status: e.status === 'draft' ? 'Draft' : e.status === 'published' ? 'Published' : 'Scheduled',
        date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: e.time,
        ticketsSold: Math.floor(Math.random() * 500),
        coverImageUrl: e.coverImageUrl,
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
      const events = loadStoredEvents();
      const event = events.find(e => e.id === eventId);
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
      const events = loadStoredEvents();
      const websiteUrl = data.customDomain
        ? `https://${data.customDomain}`
        : `https://${data.subdomain || 'event'}.munar.site`;
      const newEvent: EventData = {
        id: generateId('evt'),
        name: data.name,
        description: data.description,
        date: data.startDate,
        time: data.startTime,
        endDate: data.endDate,
        endTime: data.endTime,
        type: data.type,
        websiteUrl,
        coverImageUrl: data.coverImageUrl,
        country: data.country,
        venueLocation: data.venueLocation,
        categories: data.categories,
        currency: data.currency || config.app.defaultCurrency,
        status: 'draft',
        phase: 'setup',
      };

      events.push(newEvent);
      saveStoredEvents(events);
      ensureProgress(newEvent.id);
      this.recordActivity(newEvent.id, {
        type: 'system',
        message: `Event "${newEvent.name}" created`,
        isHighPriority: true,
        module: 'System',
        icon: 'system',
      });
      return newEvent;
    }

    const response = await apiClient.post<ApiResponse<EventData>>('/events', data);
    return response.data;
  }

  // Update event
  async updateEvent(eventId: string, data: UpdateEventRequest): Promise<EventData> {
    if (config.features.useMockData) {
      await delay(500);
      
      const events = loadStoredEvents();
      const index = events.findIndex(e => e.id === eventId);
      if (index === -1) throw new Error('Event not found');

      const websiteUrl = data.customDomain
        ? `https://${data.customDomain}`
        : data.subdomain
          ? `https://${data.subdomain}.munar.site`
          : events[index].websiteUrl;

      events[index] = { ...events[index], ...data, websiteUrl } as EventData;
      saveStoredEvents(events);
      this.recordActivity(eventId, {
        type: 'system',
        message: `Event details updated`,
        isHighPriority: false,
        module: 'System',
        icon: 'system',
      });
      return events[index];
    }

    const response = await apiClient.patch<ApiResponse<EventData>>(`/events/${eventId}`, data);
    return response.data;
  }

  // Delete event
  async deleteEvent(eventId: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(500);
      
      const events = loadStoredEvents();
      const index = events.findIndex(e => e.id === eventId);
      if (index !== -1) events.splice(index, 1);
      saveStoredEvents(events);
      const store = loadProgressStore();
      if (store[eventId]) {
        delete store[eventId];
        saveProgressStore(store);
      }
      
      return { success: true, message: 'Event deleted successfully' };
    }

    return apiClient.delete<MutationResponse>(`/events/${eventId}`);
  }

  // Clone event
  async cloneEvent(eventId: string): Promise<EventData> {
    if (config.features.useMockData) {
      await delay(600);
      
      const events = loadStoredEvents();
      const original = events.find(e => e.id === eventId);
      if (!original) throw new Error('Event not found');
      
      const cloned: EventData = {
        ...original,
        id: generateId('evt'),
        name: `${original.name} (Copy)`,
        status: 'draft',
      };

      events.push(cloned);
      saveStoredEvents(events);
      ensureProgress(cloned.id);
      this.recordActivity(cloned.id, {
        type: 'system',
        message: `Event cloned from "${original.name}"`,
        isHighPriority: false,
        module: 'System',
        icon: 'system',
      });
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
      const progress = ensureProgress(eventId);
      const payloadCounts = getEventPayload<Record<string, number>>(eventId, 'module_counts', {});
      const serviceCounts = await getServiceModuleCounts(eventId).catch(() => ({}));
      const counts = { ...payloadCounts, ...serviceCounts };
      const modulesWithCounts = progress.modules.map(m => ({ ...m, count: counts[m.name] ?? m.count ?? 0 }));
      return buildChecklist(modulesWithCounts);
    }

    const response = await apiClient.get<ApiResponse<ChecklistItem[]>>(`/events/${eventId}/checklist`);
    return response.data;
  }

  // Get event modules status
  async getEventModules(eventId: string): Promise<Module[]> {
    if (config.features.useMockData) {
      await delay(300);
      const progress = ensureProgress(eventId);
      const payloadCounts = getEventPayload<Record<string, number>>(eventId, 'module_counts', {});
      const serviceCounts = await getServiceModuleCounts(eventId).catch(() => ({}));
      const counts = { ...payloadCounts, ...serviceCounts };
      return progress.modules.map(m => ({ ...m, count: counts[m.name] ?? m.count ?? 0 }));
    }

    const response = await apiClient.get<ApiResponse<Module[]>>(`/events/${eventId}/modules`);
    return response.data;
  }

  // Get event activity feed
  async getEventActivities(eventId: string, limit: number = 10): Promise<Activity[]> {
    if (config.features.useMockData) {
      await delay(300);
      const progress = ensureProgress(eventId);
      return progress.activities.slice(0, limit);
    }

    const response = await apiClient.get<ApiResponse<Activity[]>>(`/events/${eventId}/activities`, { params: { limit } });
    return response.data;
  }

  recordActivity(eventId: string, activity: Omit<Activity, 'id' | 'timestamp'>): Activity[] {
    const progress = ensureProgress(eventId);
    const newActivity: Activity = {
      id: generateId('act'),
      timestamp: new Date().toISOString(),
      ...activity,
    };
    progress.activities = [newActivity, ...progress.activities].slice(0, 20);
    updateProgress(eventId, progress);
    return progress.activities;
  }

  updateModuleCount(eventId: string, moduleName: string, count: number, activityMessage?: string, icon?: string) {
    // Persist counts in payload store
    const existing = getEventPayload<Record<string, number>>(eventId, 'module_counts', {});
    const next = { ...existing, [moduleName]: count };
    setEventPayload(eventId, 'module_counts', next);

    this.setModuleStatus(eventId, moduleName, count > 0 ? 'active' : 'not-started');
    if (activityMessage) {
      this.recordActivity(eventId, {
        type: 'system',
        message: activityMessage,
        isHighPriority: false,
        module: moduleName,
        icon,
      });
    }
  }

  setModuleStatus(eventId: string, moduleName: string, status: Module['status'], activityMessage?: string) {
    const progress = ensureProgress(eventId);
    progress.modules = progress.modules.map((module) =>
      module.name === moduleName ? { ...module, status } : module,
    );
    updateProgress(eventId, progress);
    if (activityMessage) {
      this.recordActivity(eventId, {
        type: 'system',
        message: activityMessage,
        isHighPriority: false,
      });
    }
  }

  markModuleActive(eventId: string, moduleName: string, activityMessage: string) {
    this.setModuleStatus(eventId, moduleName, 'active', activityMessage);
  }
}

export const eventsService = new EventsService();
