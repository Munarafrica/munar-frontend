// Tickets Service
import { config } from '../config';
import { apiClient } from '../lib/api-client';
import { 
  ApiResponse, 
  PaginatedResponse, 
  SearchParams, 
  CreateTicketRequest, 
  UpdateTicketRequest,
  MutationResponse 
} from '../types/api';
import { TicketType, Attendee } from '../components/event-dashboard/types';
import { delay, mockTickets, mockAttendees, generateId } from './mock/data';

class TicketsService {
  // Get all tickets for an event
  async getTickets(eventId: string, params?: SearchParams): Promise<TicketType[]> {
    if (config.features.useMockData) {
      await delay(400);
      return mockTickets;
    }

    const response = await apiClient.get<ApiResponse<TicketType[]>>(`/events/${eventId}/tickets`, { params: params as Record<string, string | number | boolean | undefined> });
    return response.data;
  }

  // Get single ticket
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

  // Create ticket
  async createTicket(eventId: string, data: Omit<CreateTicketRequest, 'eventId'>): Promise<TicketType> {
    if (config.features.useMockData) {
      await delay(600);
      
      const newTicket: TicketType = {
        id: generateId('t'),
        name: data.name,
        type: data.type,
        groupSize: data.groupSize,
        isFree: data.isFree,
        price: data.price,
        quantitySold: 0,
        quantityTotal: data.quantityTotal,
        status: 'Draft',
        salesStart: data.salesStart,
        salesEnd: data.salesEnd,
        minPerOrder: data.minPerOrder,
        maxPerOrder: data.maxPerOrder,
        visibility: data.visibility,
        description: data.description,
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

  // Update ticket
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

  // Delete ticket
  async deleteTicket(eventId: string, ticketId: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(400);
      
      const index = mockTickets.findIndex(t => t.id === ticketId);
      if (index !== -1) mockTickets.splice(index, 1);
      
      return { success: true, message: 'Ticket deleted successfully' };
    }

    return apiClient.delete<MutationResponse>(`/events/${eventId}/tickets/${ticketId}`);
  }

  // Duplicate ticket
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

  // Get attendees for an event
  async getAttendees(eventId: string, params?: SearchParams & { ticketTypeId?: string }): Promise<PaginatedResponse<Attendee>> {
    if (config.features.useMockData) {
      await delay(500);
      
      let filtered = [...mockAttendees];
      
      if (params?.ticketTypeId) {
        filtered = filtered.filter(a => a.ticketTypeId === params.ticketTypeId);
      }
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(a => 
          a.name.toLowerCase().includes(search) ||
          a.email.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filtered,
        meta: {
          currentPage: params?.page || 1,
          totalPages: 1,
          totalItems: filtered.length,
          itemsPerPage: params?.limit || 20,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    return apiClient.get<PaginatedResponse<Attendee>>(`/events/${eventId}/attendees`, { params: params as Record<string, string | number | boolean | undefined> });
  }

  // Check in attendee
  async checkInAttendee(eventId: string, attendeeId: string): Promise<Attendee> {
    if (config.features.useMockData) {
      await delay(300);
      
      const attendee = mockAttendees.find(a => a.id === attendeeId);
      if (!attendee) throw new Error('Attendee not found');
      
      attendee.checkedIn = true;
      return attendee;
    }

    const response = await apiClient.post<ApiResponse<Attendee>>(`/events/${eventId}/attendees/${attendeeId}/check-in`);
    return response.data;
  }

  // Undo check in
  async undoCheckIn(eventId: string, attendeeId: string): Promise<Attendee> {
    if (config.features.useMockData) {
      await delay(300);
      
      const attendee = mockAttendees.find(a => a.id === attendeeId);
      if (!attendee) throw new Error('Attendee not found');
      
      attendee.checkedIn = false;
      return attendee;
    }

    const response = await apiClient.post<ApiResponse<Attendee>>(`/events/${eventId}/attendees/${attendeeId}/undo-check-in`);
    return response.data;
  }

  // Export attendees to CSV
  async exportAttendees(eventId: string, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    if (config.features.useMockData) {
      await delay(800);
      
      // Create mock CSV
      const headers = 'Name,Email,Ticket Type,Status,Checked In\n';
      const rows = mockAttendees.map(a => 
        `${a.name},${a.email},${a.ticketTypeName},${a.status},${a.checkedIn ? 'Yes' : 'No'}`
      ).join('\n');
      
      return new Blob([headers + rows], { type: 'text/csv' });
    }

    const response = await fetch(`${config.api.baseUrl}/events/${eventId}/attendees/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem(config.auth.tokenKey)}`,
      },
    });
    
    return response.blob();
  }

  // Get ticket sales analytics
  async getTicketAnalytics(eventId: string): Promise<{
    totalRevenue: number;
    totalSold: number;
    totalAvailable: number;
    salesByTicketType: Array<{ ticketId: string; ticketName: string; sold: number; revenue: number }>;
  }> {
    if (config.features.useMockData) {
      await delay(400);
      
      const totalSold = mockTickets.reduce((sum, t) => sum + t.quantitySold, 0);
      const totalAvailable = mockTickets.reduce((sum, t) => sum + t.quantityTotal, 0);
      const totalRevenue = mockTickets.reduce((sum, t) => sum + (t.price || 0) * t.quantitySold, 0);
      
      return {
        totalRevenue,
        totalSold,
        totalAvailable,
        salesByTicketType: mockTickets.map(t => ({
          ticketId: t.id,
          ticketName: t.name,
          sold: t.quantitySold,
          revenue: (t.price || 0) * t.quantitySold,
        })),
      };
    }

    const response = await apiClient.get<ApiResponse<any>>(`/events/${eventId}/tickets/analytics`);
    return response.data;
  }
}

export const ticketsService = new TicketsService();
