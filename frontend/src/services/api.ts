import { User, ScanResult, TrustedContact, WardPerson, AlertItem, SafetyTipItem } from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('cybersaarthi_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => request<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  login: (payload: { identifier: string; password: string }) => request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getMe: () => request<{ user: User }>('/auth/me'),

  updatePreferences: (payload: Partial<User> & Record<string, any>) => request<{ user: User }>('/auth/me/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Scan
  performScan: (content: string, user_mode?: string, language?: string) => request<ScanResult>('/scan', {
    method: 'POST',
    body: JSON.stringify({ content, user_mode, language })
  }),

  getScanHistory: (limit: number = 20) => request<{ history: any[] }>(`/scan/history?limit=${limit}`),

  getScanById: (id: string) => request<{ scan: any }>(`/scan/${id}`),

  // Caretaker
  getSupportedPeople: () => request<{ people: WardPerson[] }>('/caretaker/people'),

  getMyCaretakers: () => request<{ caretakers: any[] }>('/caretaker/my-caretakers'),

  requestRelationship: (payload: { identifier: string; alert_scope?: string; notes?: string }) => request<any>('/caretaker/request', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateConsent: (payload: { relationship_id: string; status: string; alert_scope?: string }) => request<any>('/caretaker/consent', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  revokeRelationship: (relationship_id: string) => request<any>('/caretaker/revoke', {
    method: 'POST',
    body: JSON.stringify({ relationship_id })
  }),

  getWardScans: (wardId: string) => request<{ scans: any[] }>(`/caretaker/ward/${wardId}/scans`),

  // Alerts
  getAlerts: () => request<{ alerts: AlertItem[] }>('/alerts'),

  markAlertRead: (id: string) => request<any>(`/alerts/${id}/read`, { method: 'PUT' }),

  resolveAlert: (id: string) => request<any>(`/alerts/${id}/resolve`, { method: 'PUT' }),

  // Contacts
  getContacts: () => request<{ contacts: TrustedContact[] }>('/contacts'),

  addContact: (payload: Omit<TrustedContact, 'id' | 'user_id' | 'created_at'>) => request<{ contact: TrustedContact }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  deleteContact: (id: string) => request<any>(`/contacts/${id}`, { method: 'DELETE' }),

  // Tips
  getTips: (lang: string = 'en', mode: string = 'all') => request<{ tips: SafetyTipItem[] }>(`/safety-tips?lang=${lang}&mode=${mode}`)
};
