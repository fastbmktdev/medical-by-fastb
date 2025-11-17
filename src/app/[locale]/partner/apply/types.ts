/**
 * Types and interfaces for partner application form
 */

export interface FormData {
  gymName: string;
  gymNameEnglish: string;
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

export interface GymData {
  id?: string;
  user_id: string;
  gym_name: string;
  gym_name_english?: string;
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  gym_details?: string;
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
  "มวยไทย",
  "ฟิตเนส",
  "เทรนนิ่งเด็ก",
  "Private Class",
  "คลาสกลุ่ม",
  "เทรนนิ่งมืออาชีพ",
  "คอร์สลดน้ำหนัก",
  "โยคะ/พิลาทิส"
] as const;

