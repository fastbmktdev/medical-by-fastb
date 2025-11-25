import type { hospital } from '@shared/types';

export interface HospitalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: hospital | null;
  onApprove: (hospitalId: string) => Promise<void>;
  onReject: (hospitalId: string) => Promise<void>;
  onEdit: (hospital: hospital) => void;
  onDelete: (hospital: hospital) => void;
  isProcessing: boolean;
}

export interface HospitalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: hospital | null;
  onSave: (hospitalId: string, data: Partial<hospital>) => Promise<void>;
  isProcessing: boolean;
}

export interface HospitalDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: hospital | null;
  onConfirm: (hospitalId: string) => Promise<void>;
  isProcessing: boolean;
}

export interface HospitalStatsCardsProps {
  hospitals: hospital[];
}

export interface HospitalFormData {
  hospital_name: string;
  hospital_name_english: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  hospital_details: string;
  services: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface HospitalFormErrors {
  hospital_name?: string;
  hospital_name_english?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
}

export type HospitalStatus = 'pending' | 'approved' | 'rejected';

export interface StatusConfig {
  label: string;
  color: 'warning' | 'success' | 'danger';
}
