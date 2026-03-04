// Tickets Service – Full ticketing module API layer
import { config } from '../config';
import { apiClient } from '../lib/api-client';
import {
  ApiResponse,
  PaginatedResponse,
  SearchParams,
  CreateTicketRequest,
  UpdateTicketRequest,
  MutationResponse,
  TicketQuestion,
  CreateQuestionRequest,
  TicketSettingsData,
  CheckoutRequest,
  CheckoutResponse,
  PublicTicketsResponse,
} from '../types/api';
import { TicketType, Attendee } from '../components/event-dashboard/types';
import { delay, mockTickets, mockAttendees, generateId } from './mock/data';

/** Map a raw DB attendee row to the frontend Attendee shape */
function normalizeAttendee(raw: any): Attendee {
  const status = raw.status === 'checked-in' ? 'Checked In'
    : raw.status === 'cancelled' ? 'Cancelled'
    : 'Confirmed';  // 'registered' or anything else → Confirmed
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    ticketTypeId: raw.ticketId || raw.ticketTypeId || '',
    ticketTypeName: raw.ticketName || raw.ticketTypeName || '',
    purchaseDate: raw.createdAt || '',
    status,
    checkedIn: raw.status === 'checked-in',
    checkedInAt: raw.checkedInAt || null,
    orderReference: raw.orderReference || '',
    qrCode: raw.qrCode || '',
    questionAnswers: raw.questionAnswers,
    metadata: raw.metadata,
  };
}

class TicketsService {
  // ══════════════════════════════════════════════════════════
  //  TICKET CRUD
  // ══════════════════════════════════════════════════════════

  async getTickets(eventId: string, params?: SearchParams): Promise<TicketType[]> {
    if (config.features.useMockData) {
      await delay(400);
      return mockTickets.filter(t => t.eventId === eventId);
    }
    const response = await apiClient.get<ApiResponse<TicketType[]>>(`/events/${eventId}/tickets`, { params: params as Record<string, string | number | boolean | undefined> });
    return response.data;
  }

  async getTicket(eventId: string, ticketId: string): Promise<TicketType> {
    if (config.features.useMockData) {
      await delay(300);
      const ticket = mockTickets.find(t => t.id === ticketId);
      if (!ticket) throw new Error('Ticket not found');
      return ticket;
    }
    const response = await apiClient.get<ApiResponse<TicketType>>(`/events/${eventId}/tickets/${ticketId}`);
    return response.data;
  }

  async createTicket(eventId: string, data: Omit<CreateTicketRequest, 'eventId'>): Promise<TicketType> {
    if (config.features.useMockData) {
      await delay(600);
      const newTicket: TicketType = {
        eventId,
        id: generateId('t'),
        name: data.name,
        type: data.type,
        groupSize: data.groupSize,
        isFree: data.isFree,
        price: data.price,
        quantitySold: 0,
        quantityTotal: data.quantityTotal,
        status: (data.status as any) || 'Draft',
        salesStart: data.salesStart,
        salesEnd: data.salesEnd,
        minPerOrder: data.minPerOrder,
        maxPerOrder: data.maxPerOrder,
        visibility: data.visibility,
        description: data.description,
        perks: data.perks,
        allowTransfer: data.allowTransfer,
        allowResale: data.allowResale,
        refundPolicy: data.refundPolicy,
        requireAttendeeInfo: data.requireAttendeeInfo,
      };
      mockTickets.push(newTicket);
      return newTicket;
    }
    const response = await apiClient.post<ApiResponse<TicketType>>(`/events/${eventId}/tickets`, data);
    return response.data;
  }

  async updateTicket(eventId: string, ticketId: string, data: UpdateTicketRequest): Promise<TicketType> {
    if (config.features.useMockData) {
      await delay(400);
      const index = mockTickets.findIndex(t => t.id === ticketId);
      if (index === -1) throw new Error('Ticket not found');
      mockTickets[index] = { ...mockTickets[index], ...data } as TicketType;
      return mockTickets[index];
    }
    const response = await apiClient.patch<ApiResponse<TicketType>>(`/events/${eventId}/tickets/${ticketId}`, data);
    return response.data;
  }

  async deleteTicket(eventId: string, ticketId: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(400);
      const index = mockTickets.findIndex(t => t.id === ticketId);
      if (index !== -1) mockTickets.splice(index, 1);
      return { success: true, message: 'Ticket deleted successfully' };
    }
    return apiClient.delete<MutationResponse>(`/events/${eventId}/tickets/${ticketId}`);
  }

  async duplicateTicket(eventId: string, ticketId: string): Promise<TicketType> {
    if (config.features.useMockData) {
      await delay(500);
      const original = mockTickets.find(t => t.id === ticketId);
      if (!original) throw new Error('Ticket not found');
      const duplicated: TicketType = {
        ...original,
        id: generateId('t'),
        name: `${original.name} (Copy)`,
        status: 'Draft',
        quantitySold: 0,
      };
      mockTickets.push(duplicated);
      return duplicated;
    }
    const response = await apiClient.post<ApiResponse<TicketType>>(`/events/${eventId}/tickets/${ticketId}/duplicate`);
    return response.data;
  }

  async reorderTickets(eventId: string, order: string[]): Promise<void> {
    if (config.features.useMockData) {
      await delay(300);
      return;
    }
    await apiClient.patch(`/events/${eventId}/tickets/reorder`, { order });
  }

  // ══════════════════════════════════════════════════════════
  //  ATTENDEES
  // ══════════════════════════════════════════════════════════

  async getAttendees(eventId: string, params?: SearchParams & { ticketId?: string; status?: string }): Promise<PaginatedResponse<Attendee>> {
    if (config.features.useMockData) {
      await delay(500);
      let filtered = [...mockAttendees];
      if (params?.ticketId) filtered = filtered.filter(a => a.ticketTypeId === params.ticketId);
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(a => a.name.toLowerCase().includes(search) || a.email.toLowerCase().includes(search));
      }
      return {
        data: filtered,
        meta: {
          currentPage: params?.page || 1,
          totalPages: 1,
          totalItems: filtered.length,
          itemsPerPage: params?.limit || 50,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
    const response = await apiClient.get<PaginatedResponse<any>>(`/events/${eventId}/attendees`, { params: params as Record<string, string | number | boolean | undefined> });
    return {
      ...response,
      data: (response.data || []).map(normalizeAttendee),
    };
  }

  async checkInAttendee(eventId: string, attendeeId: string): Promise<Attendee> {
    if (config.features.useMockData) {
      await delay(300);
      const attendee = mockAttendees.find(a => a.id === attendeeId);
      if (!attendee) throw new Error('Attendee not found');
      attendee.checkedIn = true;
      return attendee;
    }
    const response = await apiClient.patch<ApiResponse<any>>(`/events/${eventId}/attendees/${attendeeId}/check-in`);
    return normalizeAttendee(response.data);
  }

  async undoCheckIn(eventId: string, attendeeId: string): Promise<Attendee> {
    if (config.features.useMockData) {
      await delay(300);
      const attendee = mockAttendees.find(a => a.id === attendeeId);
      if (!attendee) throw new Error('Attendee not found');
      attendee.checkedIn = false;
      return attendee;
    }
    const response = await apiClient.patch<ApiResponse<any>>(`/events/${eventId}/attendees/${attendeeId}/undo-check-in`);
    return normalizeAttendee(response.data);
  }

  async exportAttendees(eventId: string, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    if (config.features.useMockData) {
      await delay(800);
      const headers = 'Name,Email,Ticket Type,Status,Checked In\n';
      const rows = mockAttendees.map(a =>
        `${a.name},${a.email},${a.ticketTypeName},${a.status},${a.checkedIn ? 'Yes' : 'No'}`
      ).join('\n');
      return new Blob([headers + rows], { type: 'text/csv' });
    }
    const response = await fetch(`${config.api.baseUrl}/events/${eventId}/attendees/export?format=${format}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem(config.auth.tokenKey)}` },
    });
    return response.blob();
  }

  // ══════════════════════════════════════════════════════════
  //  ANALYTICS
  // ══════════════════════════════════════════════════════════

  async getTicketAnalytics(eventId: string) {
    if (config.features.useMockData) {
      await delay(400);
      const totalSold = mockTickets.reduce((sum, t) => sum + t.quantitySold, 0);
      const totalAvailable = mockTickets.reduce((sum, t) => sum + t.quantityTotal, 0);
      const totalRevenue = mockTickets.reduce((sum, t) => sum + (t.price || 0) * t.quantitySold, 0);
      return { totalRevenue, totalSold, totalAvailable, totalAttendees: mockAttendees.length, totalCheckedIn: mockAttendees.filter(a => a.checkedIn).length, salesByTicketType: mockTickets.map(t => ({ ticketId: t.id, ticketName: t.name, sold: t.quantitySold, total: t.quantityTotal, revenue: (t.price || 0) * t.quantitySold })) };
    }
    const response = await apiClient.get<ApiResponse<any>>(`/events/${eventId}/tickets/analytics`);
    return response.data;
  }

  // ══════════════════════════════════════════════════════════
  //  CHECKOUT QUESTIONS
  // ══════════════════════════════════════════════════════════

  async getQuestions(eventId: string): Promise<TicketQuestion[]> {
    if (config.features.useMockData) {
      await delay(300);
      return [];
    }
    const response = await apiClient.get<ApiResponse<TicketQuestion[]>>(`/events/${eventId}/ticket-questions`);
    return response.data;
  }

  async createQuestion(eventId: string, data: CreateQuestionRequest): Promise<TicketQuestion> {
    if (config.features.useMockData) {
      await delay(400);
      return { id: generateId('q'), eventId, sortOrder: 0, ...data } as TicketQuestion;
    }
    const response = await apiClient.post<ApiResponse<TicketQuestion>>(`/events/${eventId}/ticket-questions`, data);
    return response.data;
  }

  async updateQuestion(eventId: string, questionId: string, data: Partial<CreateQuestionRequest>): Promise<TicketQuestion> {
    if (config.features.useMockData) {
      await delay(400);
      return { id: questionId, eventId, label: '', type: 'text', required: false, ticketIds: ['all'], sortOrder: 0, ...data } as TicketQuestion;
    }
    const response = await apiClient.put<ApiResponse<TicketQuestion>>(`/events/${eventId}/ticket-questions/${questionId}`, data);
    return response.data;
  }

  async deleteQuestion(eventId: string, questionId: string): Promise<void> {
    if (config.features.useMockData) {
      await delay(300);
      return;
    }
    await apiClient.delete(`/events/${eventId}/ticket-questions/${questionId}`);
  }

  // ══════════════════════════════════════════════════════════
  //  TICKET SETTINGS
  // ══════════════════════════════════════════════════════════

  async getSettings(eventId: string): Promise<TicketSettingsData> {
    if (config.features.useMockData) {
      await delay(300);
      return { enableTransfers: true, enableResale: false, resaleCap: 10, refundPolicy: 'flexible', supportEmail: '' };
    }
    const response = await apiClient.get<ApiResponse<TicketSettingsData>>(`/events/${eventId}/ticket-settings`);
    return response.data;
  }

  async updateSettings(eventId: string, data: TicketSettingsData): Promise<TicketSettingsData> {
    if (config.features.useMockData) {
      await delay(400);
      return data;
    }
    const response = await apiClient.put<ApiResponse<TicketSettingsData>>(`/events/${eventId}/ticket-settings`, data);
    return response.data;
  }

  // ══════════════════════════════════════════════════════════
  //  PUBLIC (No Auth)
  // ══════════════════════════════════════════════════════════

  async getPublicTickets(slug: string): Promise<PublicTicketsResponse> {
    if (config.features.useMockData) {
      await delay(500);
      return {
        event: { id: 'evt-1', name: 'Lagos Tech Summit 2026', slug, date: '2026-06-12', time: '09:00', type: 'Physical', currency: 'NGN', venueLocation: 'Eko Convention Centre, Lagos' },
        tickets: [
          { id: 't1', name: 'General Admission', description: 'Standard access', type: 'Single', isFree: false, price: 5000, available: 55, quantityTotal: 100, minPerOrder: 1, maxPerOrder: 5, requireAttendeeInfo: false },
          { id: 't2', name: 'VIP Access', description: 'VIP lounge + front row seating', type: 'Single', isFree: false, price: 25000, available: 18, quantityTotal: 20, minPerOrder: 1, maxPerOrder: 2, perks: [{ id: '1', name: 'VIP Lounge' }, { id: '2', name: 'Front Row' }], requireAttendeeInfo: true },
          { id: 't3', name: 'Student', description: 'For students with valid ID', type: 'Single', isFree: true, price: 0, available: 100, quantityTotal: 200, minPerOrder: 1, maxPerOrder: 1, requireAttendeeInfo: true },
        ],
        questions: [],
      };
    }
    const response = await apiClient.get<ApiResponse<PublicTicketsResponse>>(`/public/e/${slug}/tickets`);
    return response.data;
  }

  async publicCheckout(slug: string, data: CheckoutRequest): Promise<CheckoutResponse> {
    if (config.features.useMockData) {
      await delay(1000);
      return {
        order: { id: 'ord-1', orderReference: 'MNR-DEMO1234', buyerName: data.buyerName, buyerEmail: data.buyerEmail, totalAmount: 0, currency: 'NGN', status: 'completed', items: [], createdAt: new Date().toISOString() },
        attendees: [{ id: 'a-1', name: data.buyerName, email: data.buyerEmail, ticketName: 'General Admission', orderReference: 'MNR-DEMO1234', qrCode: '' }],
        event: { name: 'Lagos Tech Summit 2026', date: '2026-06-12', time: '09:00' },
      };
    }
    const response = await apiClient.post<ApiResponse<CheckoutResponse>>(`/public/e/${slug}/tickets/checkout`, data);
    return response.data;
  }

  async lookupOrder(orderRef: string) {
    if (config.features.useMockData) {
      await delay(500);
      return null;
    }
    const response = await apiClient.get<ApiResponse<any>>(`/public/orders/${orderRef}`);
    return response.data;
  }

  async validateTicketQR(attendeeId: string, eventId: string) {
    if (config.features.useMockData) {
      await delay(500);
      return { id: attendeeId, name: 'Test User', status: 'checked-in', alreadyCheckedIn: false };
    }
    const response = await apiClient.post<ApiResponse<any>>(`/public/tickets/validate`, { attendeeId, eventId });
    return response.data;
  }
}

export const ticketsService = new TicketsService();
