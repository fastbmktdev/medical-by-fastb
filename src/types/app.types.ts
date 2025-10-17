export interface Gym {
  id: number;
  slug: string;
  gymNameThai: string;
  gymNameEnglish?: string;
  address: string;
  details?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  socials?: string;
  gymType?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  photos?: string[];
  packages?: TrainingPackage[];
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

