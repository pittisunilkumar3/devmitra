// User Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'superadmin' | 'developer' | 'user';
  status: 'active' | 'inactive' | 'blocked';
  profile_image: string | null;
  email_verified: boolean;
  created_at: string;
}

// Developer Types
export interface Developer {
  id: number;
  user_id: number;
  skills: string[];
  experience: number;
  hourly_rate: number;
  availability: boolean;
  portfolio: string | null;
  rating: number;
  total_projects: number;
  bio: string | null;
  phone: string | null;
  country: string | null;
  timezone: string | null;
  job_title: string | null;
  weekly_hours: number;
  github_url: string | null;
  linkedin_url: string | null;
  other_urls: string[] | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejected_reason: string | null;
  user_name: string;
  user_email: string;
  profile_image: string | null;
}

// Booking Types
export interface Booking {
  id: number;
  booking_id: string;
  user_id: number;
  developer_id: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  project_title: string;
  project_description: string | null;
  project_type: string | null;
  budget: number;
  platform_fee: number;
  developer_earnings: number;
  deadline: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: number | null;
  cancellation_reason: string | null;
  admin_notes: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  payment_status: 'pending' | 'paid' | 'refunded' | 'partial';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  developer_name?: string;
  developer_email?: string;
}

// Milestone Types
export interface Milestone {
  id: number;
  booking_id: number;
  title: string;
  description: string | null;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

// Support Ticket Types
export interface SupportTicket {
  id: number;
  ticket_id: string;
  user_id: number;
  user_role: 'user' | 'developer';
  subject: string;
  category: 'general' | 'booking_issue' | 'payment_issue' | 'dispute' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_reply' | 'resolved' | 'closed';
  assigned_to: number | null;
  related_booking_id: number | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_role: 'user' | 'developer' | 'superadmin';
  sender_name: string;
  message: string;
  attachments: string[] | null;
  is_internal: boolean;
  created_at: string;
}

// Review Types
export interface Review {
  id: number;
  booking_id: number;
  user_id: number;
  developer_id: number;
  rating: number;
  review: string | null;
  user_name?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Stats Types
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
}

export interface DeveloperStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface BookingStats {
  total: number;
  pending: number;
  accepted: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}
