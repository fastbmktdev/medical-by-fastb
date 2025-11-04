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
  id: string; // UUID from database
  slug: string;
  name: string;
  name_english?: string | null;
  description?: string | null;
  details?: string | null;
  event_date: string; // ISO timestamp
  end_date?: string | null; // ISO timestamp
  date?: string; // Legacy field for backward compatibility
  location: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category_id?: string | null;
  image?: string | null;
  images?: string[] | null;
  price_start?: number | null;
  price?: number; // Legacy field for backward compatibility
  max_attendees?: number | null;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_featured?: boolean;
  is_published?: boolean;
  published_at?: string | null;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  event_categories?: {
    id: string;
    name_thai?: string | null;
    name_english?: string | null;
    slug?: string;
  } | null;
  tickets?: EventTicket[];
}

export interface EventTicket {
  id: string;
  event_id: string;
  ticket_type: string;
  name: string;
  description?: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  max_per_person: number;
  sale_start_date?: string | null;
  sale_end_date?: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
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

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

