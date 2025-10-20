export interface Gym {
  id: string;
  slug: string;
  gym_name: string;
  gym_name_english?: string;
  address?: string;
  gym_details?: any;
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
  services?: string[];
  status?: string;
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

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

