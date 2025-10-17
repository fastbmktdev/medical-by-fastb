// Database Types
// ประเภทข้อมูลสำหรับ Database Tables

export interface Todo {
  id: number;
  task: string;
  is_complete: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  user_id: string;
  title: string;
  content: string | null;
  published: boolean;
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
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  gym_details?: string;
  services: string[];
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Form Data Types
export interface CreateTodoInput {
  task: string;
}

export interface UpdateTodoInput {
  id: number;
  is_complete: boolean;
}

// Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

