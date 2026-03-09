// User Types
export interface User {
  id: number;
  email: string;
  password?: string;
  name: string;
  role: 'superadmin' | 'developer' | 'user';
  status: 'active' | 'inactive' | 'blocked';
  profile_image: string | null;
  google_id: string | null;
  email_verified: boolean;
  reset_token: string | null;
  reset_token_expiry: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'developer';
}

export interface UpdateUserInput {
  name?: string;
  profile_image?: string;
  status?: 'active' | 'inactive' | 'blocked';
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
  approved_by: number | null;
  approved_at: Date | null;
  rejection_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDeveloperInput {
  user_id: number;
  skills: string[];
  experience: number;
  hourly_rate: number;
  availability?: boolean;
  bio?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  job_title?: string;
  weekly_hours?: number;
  github_url?: string;
  linkedin_url?: string;
  other_urls?: string[];
  portfolio?: string;
}

export interface UpdateDeveloperInput {
  skills?: string[];
  experience?: number;
  hourly_rate?: number;
  availability?: boolean;
  bio?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  job_title?: string;
  weekly_hours?: number;
  github_url?: string;
  linkedin_url?: string;
  other_urls?: string[];
  portfolio?: string;
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
  deadline: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  cancelled_by: number | null;
  cancellation_reason: string | null;
  admin_notes: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  payment_status: 'pending' | 'paid' | 'refunded' | 'partial';
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookingInput {
  user_id: number;
  developer_id: number;
  project_title: string;
  project_description?: string;
  project_type?: string;
  budget: number;
  deadline?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateBookingInput {
  status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  admin_notes?: string;
  payment_status?: 'pending' | 'paid' | 'refunded' | 'partial';
}

// Milestone Types
export interface Milestone {
  id: number;
  booking_id: number;
  title: string;
  description: string | null;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  due_date: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface CreateMilestoneInput {
  booking_id: number;
  title: string;
  description?: string;
  amount: number;
  due_date?: Date;
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
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
  closed_at: Date | null;
}

export interface CreateTicketInput {
  user_id: number;
  user_role: 'user' | 'developer';
  subject: string;
  category: 'general' | 'booking_issue' | 'payment_issue' | 'dispute' | 'technical' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  related_booking_id?: number;
  message: string;
}

// Review Types
export interface Review {
  id: number;
  booking_id: number;
  user_id: number;
  developer_id: number;
  rating: number;
  review: string | null;
  created_at: Date;
}

export interface CreateReviewInput {
  booking_id: number;
  user_id: number;
  developer_id: number;
  rating: number;
  review?: string;
}

// Transaction Types
export interface Transaction {
  id: number;
  booking_id: number;
  user_id: number;
  developer_id: number;
  amount: number;
  platform_fee: number;
  status: 'pending' | 'completed' | 'refunded';
  payment_id: string | null;
  payment_gateway: string | null;
  created_at: Date;
}

// Message Types
export interface Message {
  id: number;
  booking_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  has_contact_info: boolean;
  is_flagged: boolean;
  created_at: Date;
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

// Express Request with User
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: User & {
    developer_id?: number;
    approval_status?: 'pending' | 'approved' | 'rejected';
  };
}
