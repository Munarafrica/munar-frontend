// Forms Service
import { config } from '../config';
import { apiClient } from '../lib/api-client';
import { ApiResponse, PaginatedResponse, SearchParams, MutationResponse } from '../types/api';
import { Form, FormField, FormResponse, FormSettings } from '../components/event-dashboard/types';
import { delay, mockForms, mockFormResponses, generateId } from './mock/data';

export interface CreateFormRequest {
  title: string;
  description?: string;
  type: 'registration' | 'survey' | 'custom';
  fields: FormField[];
  settings?: Partial<FormSettings>;
}

export interface UpdateFormRequest extends Partial<CreateFormRequest> {
  status?: 'draft' | 'published' | 'closed' | 'scheduled';
}

class FormsService {
  // Get all forms for an event
  async getForms(eventId: string, params?: SearchParams): Promise<Form[]> {
    if (config.features.useMockData) {
      await delay(400);
      return mockForms;
    }

    const response = await apiClient.get<ApiResponse<Form[]>>(`/events/${eventId}/forms`, { params });
    return response.data;
  }

  // Get single form
  async getForm(eventId: string, formId: string): Promise<Form> {
    if (config.features.useMockData) {
      await delay(300);
      const form = mockForms.find(f => f.id === formId);
      if (!form) throw new Error('Form not found');
      return form;
    }

    const response = await apiClient.get<ApiResponse<Form>>(`/events/${eventId}/forms/${formId}`);
    return response.data;
  }

  // Create form
  async createForm(eventId: string, data: CreateFormRequest): Promise<Form> {
    if (config.features.useMockData) {
      await delay(600);
      
      const newForm: Form = {
        id: generateId('form'),
        title: data.title,
        description: data.description || '',
        type: data.type,
        status: 'draft',
        fields: data.fields,
        settings: {
          isPaid: false,
          allowAnonymous: false,
          oneResponsePerUser: true,
          ...data.settings,
        },
        responseCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockForms.push(newForm);
      return newForm;
    }

    const response = await apiClient.post<ApiResponse<Form>>(`/events/${eventId}/forms`, data);
    return response.data;
  }

  // Update form
  async updateForm(eventId: string, formId: string, data: UpdateFormRequest): Promise<Form> {
    if (config.features.useMockData) {
      await delay(400);
      
      const index = mockForms.findIndex(f => f.id === formId);
      if (index === -1) throw new Error('Form not found');
      
      mockForms[index] = { 
        ...mockForms[index], 
        ...data,
        updatedAt: new Date().toISOString(),
      } as Form;
      return mockForms[index];
    }

    const response = await apiClient.patch<ApiResponse<Form>>(`/events/${eventId}/forms/${formId}`, data);
    return response.data;
  }

  // Delete form
  async deleteForm(eventId: string, formId: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(400);
      
      const index = mockForms.findIndex(f => f.id === formId);
      if (index !== -1) mockForms.splice(index, 1);
      
      return { success: true, message: 'Form deleted successfully' };
    }

    return apiClient.delete<MutationResponse>(`/events/${eventId}/forms/${formId}`);
  }

  // Duplicate form
  async duplicateForm(eventId: string, formId: string): Promise<Form> {
    if (config.features.useMockData) {
      await delay(500);
      
      const original = mockForms.find(f => f.id === formId);
      if (!original) throw new Error('Form not found');
      
      const duplicated: Form = {
        ...original,
        id: generateId('form'),
        title: `${original.title} (Copy)`,
        status: 'draft',
        responseCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockForms.push(duplicated);
      return duplicated;
    }

    const response = await apiClient.post<ApiResponse<Form>>(`/events/${eventId}/forms/${formId}/duplicate`);
    return response.data;
  }

  // Publish form
  async publishForm(eventId: string, formId: string): Promise<Form> {
    return this.updateForm(eventId, formId, { status: 'published' });
  }

  // Close form
  async closeForm(eventId: string, formId: string): Promise<Form> {
    return this.updateForm(eventId, formId, { status: 'closed' });
  }

  // ========== RESPONSES ==========

  // Get form responses
  async getResponses(eventId: string, formId: string, params?: SearchParams): Promise<PaginatedResponse<FormResponse>> {
    if (config.features.useMockData) {
      await delay(500);
      
      const responses = mockFormResponses.filter(r => r.formId === formId);
      
      return {
        data: responses,
        meta: {
          currentPage: params?.page || 1,
          totalPages: 1,
          totalItems: responses.length,
          itemsPerPage: params?.limit || 20,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    return apiClient.get<PaginatedResponse<FormResponse>>(`/events/${eventId}/forms/${formId}/responses`, { params });
  }

  // Get single response
  async getResponse(eventId: string, formId: string, responseId: string): Promise<FormResponse> {
    if (config.features.useMockData) {
      await delay(300);
      const response = mockFormResponses.find(r => r.id === responseId);
      if (!response) throw new Error('Response not found');
      return response;
    }

    const response = await apiClient.get<ApiResponse<FormResponse>>(`/events/${eventId}/forms/${formId}/responses/${responseId}`);
    return response.data;
  }

  // Delete response
  async deleteResponse(eventId: string, formId: string, responseId: string): Promise<MutationResponse> {
    if (config.features.useMockData) {
      await delay(300);
      
      const index = mockFormResponses.findIndex(r => r.id === responseId);
      if (index !== -1) mockFormResponses.splice(index, 1);
      
      return { success: true, message: 'Response deleted successfully' };
    }

    return apiClient.delete<MutationResponse>(`/events/${eventId}/forms/${formId}/responses/${responseId}`);
  }

  // Export responses
  async exportResponses(eventId: string, formId: string, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    if (config.features.useMockData) {
      await delay(800);
      
      const form = mockForms.find(f => f.id === formId);
      const responses = mockFormResponses.filter(r => r.formId === formId);
      
      // Create mock CSV
      const headers = ['Submitted At', 'Name', 'Email', ...(form?.fields.map(f => f.label) || [])].join(',');
      const rows = responses.map(r => {
        const answers = form?.fields.map(f => r.answers[f.id] || '').join(',') || '';
        return `${r.submittedAt},${r.respondentName || ''},${r.respondentEmail || ''},${answers}`;
      }).join('\n');
      
      return new Blob([headers + '\n' + rows], { type: 'text/csv' });
    }

    const response = await fetch(`${config.api.baseUrl}/events/${eventId}/forms/${formId}/responses/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem(config.auth.tokenKey)}`,
      },
    });
    
    return response.blob();
  }

  // Get form analytics
  async getFormAnalytics(eventId: string, formId: string): Promise<{
    totalResponses: number;
    completionRate: number;
    averageTimeToComplete: number;
    responsesByDay: Array<{ date: string; count: number }>;
  }> {
    if (config.features.useMockData) {
      await delay(400);
      
      const form = mockForms.find(f => f.id === formId);
      
      return {
        totalResponses: form?.responseCount || 0,
        completionRate: 87.5,
        averageTimeToComplete: 180, // seconds
        responsesByDay: [
          { date: '2026-01-20', count: 45 },
          { date: '2026-01-21', count: 32 },
          { date: '2026-01-22', count: 28 },
          { date: '2026-01-23', count: 51 },
        ],
      };
    }

    const response = await apiClient.get<ApiResponse<any>>(`/events/${eventId}/forms/${formId}/analytics`);
    return response.data;
  }
}

export const formsService = new FormsService();
