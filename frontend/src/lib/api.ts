import axios from 'axios';
import type {
  SendRequest,
  SendResponse,
  HealthResponse,
  Contact,
  Template,
  CountryLimit,
  Campaign,
  UploadHistory
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthAPI = {
  check: async (): Promise<HealthResponse> => {
    const { data } = await api.get<HealthResponse>('/health');
    return data;
  },
};

export const campaignAPI = {
  send: async (request: SendRequest): Promise<SendResponse> => {
    const { data } = await api.post<SendResponse>('/send', request);
    return data;
  },
};

export const contactsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; countryCode?: string; optIn?: boolean }): Promise<{ contacts: Contact[]; pagination: any }> => {
    const { data } = await api.get('/contacts', { params });
    return data;
  },
  create: async (contact: Partial<Contact>): Promise<Contact> => {
    const { data } = await api.post('/contacts', contact);
    return data;
  },
  update: async (phone: string, contact: Partial<Contact>): Promise<Contact> => {
    const { data } = await api.put(`/contacts/${encodeURIComponent(phone)}`, contact);
    return data;
  },
  delete: async (phone: string): Promise<void> => {
    await api.delete(`/contacts/${encodeURIComponent(phone)}`);
  },
  bulkDelete: async (phones: string[], deleteAll?: boolean): Promise<{ message: string; count: number }> => {
    const { data } = await api.post('/contacts/bulk-delete', { phones, deleteAll });
    return data;
  },
  upload: async (file: File, mode: 'merge' | 'replace'): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    const { data } = await api.post('/contacts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  getUploadHistory: async (): Promise<UploadHistory[]> => {
    const { data } = await api.get('/contacts/uploads');
    return data;
  },
  export: async (): Promise<Blob> => {
    const { data } = await api.get('/contacts/export', { responseType: 'blob' });
    return data;
  },
};

export const templatesAPI = {
  getAll: async (): Promise<Template[]> => {
    const { data } = await api.get('/templates');
    return data;
  },
  create: async (template: Partial<Template>): Promise<Template> => {
    const { data } = await api.post('/templates', template);
    return data;
  },
  update: async (id: number, template: Partial<Template>): Promise<Template> => {
    const { data } = await api.put(`/templates/${id}`, template);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },
  syncFromWhatsApp: async (): Promise<any> => {
    const { data } = await api.get('/templates/sync/whatsapp');
    return data;
  },
};

export const countryLimitsAPI = {
  getAll: async (): Promise<CountryLimit[]> => {
    const { data } = await api.get('/country-limits');
    return data;
  },
  create: async (limit: Partial<CountryLimit>): Promise<CountryLimit> => {
    const { data } = await api.post('/country-limits', limit);
    return data;
  },
  update: async (code: string, limit: Partial<CountryLimit>): Promise<CountryLimit> => {
    const { data } = await api.put(`/country-limits/${encodeURIComponent(code)}`, limit);
    return data;
  },
  delete: async (code: string): Promise<void> => {
    await api.delete(`/country-limits/${encodeURIComponent(code)}`);
  },
};

export const analyticsAPI = {
  getOverview: async (): Promise<any> => {
    const { data } = await api.get('/analytics/overview');
    return data;
  },
  getCampaigns: async (params?: { page?: number; limit?: number }): Promise<{ campaigns: Campaign[]; pagination: any }> => {
    const { data } = await api.get('/analytics/campaigns', { params });
    return data;
  },
  getDeliveryRates: async (days?: number): Promise<any> => {
    const { data } = await api.get('/analytics/delivery-rates', { params: { days } });
    return data;
  },
  getCountryStats: async (days?: number): Promise<any> => {
    const { data } = await api.get('/analytics/country-stats', { params: { days } });
    return data;
  },
  getTimeline: async (days?: number): Promise<any> => {
    const { data } = await api.get('/analytics/timeline', { params: { days } });
    return data;
  },
};

export default api;
