const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

// Helper function to safely format numbers
export function safeToFixed(value: number | string | undefined | null, decimals: number = 2): string {
  if (value === null || value === undefined) return '0'.padEnd(decimals + 2, '0').slice(0, decimals + 2);
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0'.padEnd(decimals + 2, '0').slice(0, decimals + 2);
  return num.toFixed(decimals);
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setAuthToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  setToken(token: string | null): void {
    this.setAuthToken(token);
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = this.getAuthToken();
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  }

  // Auth endpoints
  async register(data: { name: string; email: string; password: string; role: string }) {
    const response = await this.request<{ success: boolean; data: { userId: number; token: string } }>('/auth/register', {
      method: 'POST',
      body: data,
    });
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ success: boolean; data: { user: User; token: string } }>('/auth/login', {
      method: 'POST',
      body: data,
    });
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getMe() {
    return this.request<{ success: boolean; data: User }>('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    });
  }

  // Users endpoints
  async getUsers(params?: { page?: number; limit?: number; role?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return this.request<{ success: boolean; data: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/users${query ? `?${query}` : ''}`);
  }

  async getUser(id: number) {
    return this.request<{ success: boolean; data: User }>(`/users/${id}`);
  }

  async updateUser(id: number, data: Partial<User>) {
    return this.request(`/users/${id}`, { method: 'PUT', body: data });
  }

  async blockUser(id: number) {
    return this.request(`/users/${id}/block`, { method: 'PUT' });
  }

  async unblockUser(id: number) {
    return this.request(`/users/${id}/unblock`, { method: 'PUT' });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  async getUserStats() {
    return this.request<{ success: boolean; data: { total: number; active: number; inactive: number; blocked: number } }>('/users/stats');
  }

  // Developers endpoints
  async getDevelopers(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return this.request<{ success: boolean; data: Developer[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/developers${query ? `?${query}` : ''}`);
  }

  async browseDevelopers(params?: { page?: number; limit?: number; skills?: string; minRate?: number; maxRate?: number; availability?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skills) searchParams.set('skills', params.skills);
    if (params?.minRate) searchParams.set('minRate', params.minRate.toString());
    if (params?.maxRate) searchParams.set('maxRate', params.maxRate.toString());
    if (params?.availability) searchParams.set('availability', 'true');
    const query = searchParams.toString();
    return this.request<{ success: boolean; data: Developer[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/developers/browse${query ? `?${query}` : ''}`);
  }

  async getDeveloper(id: number) {
    return this.request<{ success: boolean; data: Developer }>(`/developers/${id}`);
  }

  async getMyDeveloperProfile() {
    return this.request<{ success: boolean; data: Developer }>('/developers/me');
  }

  async createDeveloperProfile(data: Partial<Developer>) {
    return this.request('/developers', { method: 'POST', body: data });
  }

  async updateDeveloper(id: number, data: Partial<Developer>) {
    return this.request(`/developers/${id}`, { method: 'PUT', body: data });
  }

  async approveDeveloper(id: number) {
    return this.request(`/developers/${id}/approve`, { method: 'PUT' });
  }

  async rejectDeveloper(id: number, reason: string) {
    return this.request(`/developers/${id}/reject`, { method: 'PUT', body: { reason } });
  }

  async deleteDeveloper(id: number) {
    return this.request(`/developers/${id}`, { method: 'DELETE' });
  }

  async getDeveloperStats() {
    return this.request<{ success: boolean; data: { total: number; pending: number; approved: number; rejected: number } }>('/developers/stats');
  }

  // Bookings endpoints
  async getBookings(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return this.request<{ success: boolean; data: Booking[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/bookings${query ? `?${query}` : ''}`);
  }

  async getMyBookings(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return this.request<{ success: boolean; data: Booking[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/bookings/my${query ? `?${query}` : ''}`);
  }

  async getBooking(id: number) {
    return this.request<{ success: boolean; data: Booking }>(`/bookings/${id}`);
  }

  async createBooking(data: Partial<Booking>) {
    return this.request<{ success: boolean; data: { booking_id: string } }>('/bookings', { method: 'POST', body: data });
  }

  async updateBooking(id: number, data: Partial<Booking>) {
    return this.request(`/bookings/${id}`, { method: 'PUT', body: data });
  }

  async acceptBooking(id: number) {
    return this.request(`/bookings/${id}/accept`, { method: 'PUT' });
  }

  async declineBooking(id: number) {
    return this.request(`/bookings/${id}/decline`, { method: 'PUT' });
  }

  async completeBooking(id: number) {
    return this.request(`/bookings/${id}/complete`, { method: 'PUT' });
  }

  async getBookingStats() {
    return this.request<{ success: boolean; data: { total: number; pending: number; accepted: number; in_progress: number; completed: number; cancelled: number; revenue: number } }>('/bookings/stats');
  }

  // Milestones
  async getMilestones(bookingId: number) {
    return this.request<{ success: boolean; data: Milestone[] }>(`/bookings/${bookingId}/milestones`);
  }

  async createMilestone(bookingId: number, data: Partial<Milestone>) {
    return this.request(`/bookings/${bookingId}/milestones`, { method: 'POST', body: data });
  }

  async updateMilestoneStatus(bookingId: number, milestoneId: number, status: string) {
    return this.request(`/bookings/${bookingId}/milestones/${milestoneId}`, { method: 'PUT', body: { status } });
  }

  // Support Tickets endpoints
  async getTickets(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return this.request<{ success: boolean; data: SupportTicket[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/tickets${query ? `?${query}` : ''}`);
  }

  async getMyTickets(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return this.request<{ success: boolean; data: SupportTicket[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/tickets/my${query ? `?${query}` : ''}`);
  }

  async getTicket(id: number) {
    return this.request<{ success: boolean; data: SupportTicket }>(`/tickets/${id}`);
  }

  async createTicket(data: Partial<SupportTicket> & { message: string }) {
    return this.request<{ success: boolean; data: { ticket_id: string } }>('/tickets', { method: 'POST', body: data });
  }

  async updateTicketStatus(id: number, status: string) {
    return this.request(`/tickets/${id}/status`, { method: 'PUT', body: { status } });
  }

  async updateTicketPriority(id: number, priority: string) {
    return this.request(`/tickets/${id}/priority`, { method: 'PUT', body: { priority } });
  }

  async assignTicket(id: number, assignedTo: number) {
    return this.request(`/tickets/${id}/assign`, { method: 'PUT', body: { assigned_to: assignedTo } });
  }

  async addTicketMessage(id: number, message: string, attachments?: string[]) {
    return this.request(`/tickets/${id}/messages`, { method: 'POST', body: { message, attachments } });
  }

  async getTicketStats() {
    return this.request<{ success: boolean; data: { total: number; open: number; inProgress: number; resolved: number } }>('/tickets/stats');
  }
}

export const api = new ApiClient(API_URL);
export default api;
