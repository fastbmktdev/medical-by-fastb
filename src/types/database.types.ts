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
  rating?: number;
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

// Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

