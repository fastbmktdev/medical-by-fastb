/**
 * Hospital Gallery Types
 * Types for gallery management system
 */

export interface GalleryImage {
  id: string;
  hospital_id: string;
  image_url: string;
  storage_path: string;
  title?: string;
  description?: string;
  alt_text?: string;
  is_featured: boolean;
  display_order: number;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryImageWithHospital extends GalleryImage {
  hospital_name: string;
  slug: string;
  hospital_status: string;
}

export interface UploadGalleryImageRequest {
  hospital_id: string;
  title?: string;
  description?: string;
  alt_text?: string;
  is_featured?: boolean;
}

export interface UpdateGalleryImageRequest {
  title?: string;
  description?: string;
  alt_text?: string;
  is_featured?: boolean;
  display_order?: number;
}

export interface ReorderGalleryRequest {
  image_orders: Array<{
    id: string;
    display_order: number;
  }>;
}

export interface GalleryUploadResult {
  success: boolean;
  image?: GalleryImage;
  error?: string;
}

export interface GalleryStats {
  total_images: number;
  featured_image?: GalleryImage;
  total_size: number;
  latest_upload?: string;
}

