/**
 * Types and interfaces for partner application form
 */

export interface FormData {
  hospitalName: string;
  hospitalNameEnglish: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  description: string;
  services: string[];
  termsAccepted: boolean;
  idCardUrl?: string;
  idCardOriginalUrl?: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface HospitalData {
  id?: string;
  user_id: string;
  hospital_name: string;
  hospital_name_english?: string;
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  hospital_details?: string;
  services: string[];
  images?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
  id_card_url?: string;
  id_card_original_url?: string;
}

export type ApplicationStatus = "pending" | "approved" | "denied" | "none";

export const SERVICE_OPTIONS = [
  "บริการแกนหลัก (Core Medical Services)",
  "บริการศัลยกรรม (Surgical Services)",
  "บริการเฉพาะทาง (Specialist Services)",
  "บริการเสริมสุขภาพ (Wellness & Support Services)",
  "บริการเสริมอื่นๆ (Ancillary Services)"
] as const;

