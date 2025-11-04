export interface Gym {
  id: string;
  slug: string;
  gym_name: string;
  gym_name_english?: string | null;
  address?: string;
  gym_details?: string;
  gym_type?: string;
  images?: string[];
  packages?: TrainingPackage[];
  phone?: string;
  email?: string;
  website?: string;
  socials?: string;
  contact_name?: string;
  location?: string;
  map_url?: string;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
  services?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingPackage {
  id: number;
  name: string;
  duration_days: number;
  base_price: number;
  description?: string;
  inclusions?: string[];
}

export interface Event {
  id: number;
  slug: string;
  name: string;
  date: string;
  location: string;
  details?: string;
  price?: number;
  image?: string;
}

export interface Product {
  id: number;
  slug: string;
  nameThai?: string;
  nameEnglish?: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  image?: string;
  images?: string[];
}

export interface Article {
  id: string; // UUID
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author_id?: string | null; // UUID reference to auth.users
  author_name?: string | null; // Fallback author name
  date: string; // ISO date string
  category: string;
  image?: string | null;
  tags?: string[];
  is_new?: boolean;
  is_published?: boolean;
  published_at?: string | null; // ISO timestamp
  views_count?: number;
  likes_count?: number;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
  // Legacy/computed fields for backward compatibility
  author?: string; // Computed: author_name || 'Unknown'
  isNew?: boolean; // Alias for is_new
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

