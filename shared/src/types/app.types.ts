/**
 * Hospital status types
 */
export type HospitalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Hospital type categories
 */
export type HospitalType = 'general' | 'specialized' | 'clinic' | 'Professional' | string;

/**
 * Hospital interface
 * Represents a hospital/medical facility in the application
 */
export interface hospital {
  id: string;
  slug: string;
  hospital_name: string;
  hospital_name_english?: string | null;
  address?: string;
  hospital_details?: string;
  hospital_type?: HospitalType;
  images?: string[];
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
  opening_hours?: string | null;
  price?: string | null;
  usage_details?: string | null;
  status?: HospitalStatus | string;
  id_card_url?: string;
  id_card_original_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Product interface
 * Represents a product in the shop
 */
export interface Product {
  id: number | string;
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
  scheduled_publish_at?: string | null; // ISO timestamp for content scheduling
  views_count?: number;
  likes_count?: number;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
  // SEO fields
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  og_image?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_card?: string | null;
  canonical_url?: string | null;
  // Legacy/computed fields for backward compatibility
  author?: string; // Computed: author_name || 'Unknown'
  isNew?: boolean; // Alias for is_new
}

export interface ArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image?: string | null;
  tags?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  created_by?: string | null;
  created_at: string;
  change_summary?: string | null;
}

/**
 * Generic API Response interface
 * Standard response format for API calls
 * 
 * @template T - The type of data returned on success
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success?: boolean;
}

/**
 * TreatmentPackage interface (Legacy - for hardcoded data)
 * @deprecated Use HospitalPackage from database.types.ts instead
 * This type is only used for hardcoded mock data in data.ts
 */
export interface TreatmentPackage {
  id: number;
  name: string;
  duration_days: number;
  base_price: number;
  description: string;
  inclusions: string[];
}
