// Database Types
// ประเภทข้อมูลสำหรับ Database Tables ของ MUAYTHAI Platform

export interface Profile {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// User Roles Table
export interface UserRole {
  user_id: string;
  role: 'authenticated' | 'partner' | 'admin';
  created_at: string;
  updated_at: string;
}

// Gyms Table (Partner Applications)
export interface Gym {
  id: string;
  user_id: string;
  gym_name: string;
  gym_name_english?: string;
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  address?: string;
  gym_details?: string;
  services: string[];
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  latitude?: number;
  longitude?: number;
  map_url?: string;
  socials?: string;
  gym_type?: string;
  slug?: string;
  created_at: string;
  updated_at: string;
}

// Gym Packages Table
export interface GymPackage {
  id: string;
  gym_id: string;
  package_type: 'one_time' | 'package';
  name: string;
  name_english?: string;
  description?: string;
  price: number;
  duration_months?: number | null; // NULL for one_time, 1/3/6 for package
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Bookings Table
export interface Booking {
  id: string;
  user_id: string;
  gym_id: string;
  package_id: string;
  booking_number: string;
  
  // Contact info snapshot
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  
  // Booking dates
  start_date: string;
  end_date?: string | null;
  
  // Pricing snapshot
  price_paid: number;
  package_name: string;
  package_type: 'one_time' | 'package';
  duration_months?: number | null;
  
  // Special requests
  special_requests?: string;
  
  // Payment
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_id?: string;
  
  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  
  created_at: string;
  updated_at: string;
}

// Partner Payouts Table
export interface PartnerPayout {
  id: string;
  partner_user_id: string;
  gym_id?: string | null;
  payout_number: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payout_method?: 'bank_transfer' | 'promptpay' | 'truewallet' | 'paypal' | 'other' | null;
  total_revenue: number;
  commission_rate: number;
  platform_fee: number;
  net_amount: number;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  payment_reference?: string | null;
  transaction_id?: string | null;
  period_start_date: string;
  period_end_date: string;
  related_booking_ids: string[];
  related_order_ids: string[];
  notes?: string | null;
  metadata: Record<string, unknown>;
  requested_at: string;
  processed_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Email Queue Table
export interface EmailQueue {
  id: string;
  user_id: string | null;
  to_email: string;
  from_email: string | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  email_type: 'verification' | 'booking_confirmation' | 'booking_reminder' | 'payment_receipt' | 'payment_failed' | 'partner_approval' | 'partner_rejection' | 'admin_alert' | 'contact_form' | 'welcome' | 'newsletter' | 'promotional' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  retry_count: number;
  max_retries: number;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  provider: string;
  provider_message_id: string | null;
  metadata: Record<string, unknown>;
  related_resource_type: string | null;
  related_resource_id: string | null;
  created_at: string;
  updated_at: string;
}

// Gym Availability Tables
export interface GymAvailability {
  id: string;
  gym_id: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  max_capacity: number | null;
  current_bookings: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GymSpecialAvailability {
  id: string;
  gym_id: string;
  date: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  max_capacity: number | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GymTimeSlot {
  id: string;
  gym_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number | null;
  current_bookings: number;
  is_available: boolean;
  price_multiplier: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Audit Logs Table
export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  session_id?: string | null;
  action_type: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'approve' | 'reject' | 'publish' | 'unpublish' | 'activate' | 'deactivate' | 'payment' | 'refund' | 'payout' | 'status_change' | 'permission_change' | 'role_change' | 'password_change' | 'email_change' | 'data_export' | 'data_import' | 'bulk_operation' | 'system_action';
  resource_type: 'user' | 'profile' | 'gym' | 'booking' | 'order' | 'payment' | 'product' | 'event' | 'article' | 'ticket' | 'package' | 'promotion' | 'affiliate_conversion' | 'partner_payout' | 'notification' | 'favorite' | 'review' | 'analytics' | 'admin_action' | 'system_config' | 'other';
  resource_id?: string | null;
  resource_name?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  changed_fields?: string[] | null;
  description: string;
  metadata: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  request_method?: string | null;
  request_path?: string | null;
  request_params?: Record<string, unknown> | null;
  success: boolean;
  error_message?: string | null;
  created_at: string;
}

// Custom Reports Table
export interface CustomReport {
  id: string;
  created_by: string;
  name: string;
  description?: string | null;
  table_name: string;
  columns: string[];
  column_headers?: string[] | null;
  filters: Record<string, unknown>;
  format: 'pdf' | 'csv' | 'excel';
  include_summary: boolean;
  include_charts: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Scheduled Reports Table
export interface ScheduledReport {
  id: string;
  created_by: string;
  custom_report_id?: string | null;
  name: string;
  description?: string | null;
  table_name: string;
  columns?: string[] | null;
  column_headers?: string[] | null;
  filters: Record<string, unknown>;
  format: 'pdf' | 'csv' | 'excel';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  schedule_config: Record<string, unknown>;
  next_run_at?: string | null;
  last_run_at?: string | null;
  recipients: string[];
  cc_recipients?: string[] | null;
  bcc_recipients?: string[] | null;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'deleted';
  is_active: boolean;
  run_count: number;
  success_count: number;
  failure_count: number;
  last_error_message?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// Scheduled Report Executions Table
export interface ScheduledReportExecution {
  id: string;
  scheduled_report_id: string;
  started_at: string;
  completed_at?: string | null;
  status: 'running' | 'completed' | 'failed';
  rows_processed?: number | null;
  file_url?: string | null;
  file_size_bytes?: number | null;
  error_message?: string | null;
  error_details?: Record<string, unknown> | null;
  email_sent: boolean;
  email_sent_at?: string | null;
  email_recipients?: string[] | null;
  email_queue_id?: string | null;
  created_at: string;
}

// Response Types
export interface DatabaseApiResponse<T> {
  data: T | null;
  error: string | null;
}

