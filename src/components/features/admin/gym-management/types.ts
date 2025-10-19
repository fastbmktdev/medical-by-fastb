import type { Gym } from '@/types';

export interface GymDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  gym: Gym | null;
  onApprove: (gymId: string) => Promise<void>;
  onReject: (gymId: string) => Promise<void>;
  onEdit: (gym: Gym) => void;
  onDelete: (gym: Gym) => void;
  isProcessing: boolean;
}

export interface GymEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  gym: Gym | null;
  onSave: (gymId: string, data: Partial<Gym>) => Promise<void>;
  isProcessing: boolean;
}

export interface GymDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gym: Gym | null;
  onConfirm: (gymId: string) => Promise<void>;
  isProcessing: boolean;
}

export interface GymStatsCardsProps {
  gyms: Gym[];
}

export interface GymFormData {
  gym_name: string;
  gym_name_english: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  gym_details: string;
  services: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface GymFormErrors {
  gym_name?: string;
  gym_name_english?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
}

export type GymStatus = 'pending' | 'approved' | 'rejected';

export interface StatusConfig {
  label: string;
  color: 'warning' | 'success' | 'danger';
}
