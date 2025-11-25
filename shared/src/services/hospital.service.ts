/**
 * hospital Service
 * Business logic for hospital management operations
 */

import { getServiceClient, handleQueryResult, handleQueryError, ServiceValidationError, ServiceNotFoundError } from './service-utils';
import { VALIDATION_PATTERNS, VALIDATION_RULES, validateEmail, validatePhone, validateName, validateAddress } from '@shared/lib/utils/validation';
import type { hospital } from '@shared/types';

// Validation rules specific to hospital service
const HOSPITAL_VALIDATION_RULES = {
  hospital_NAME: { min: 3, max: 100 },
  CONTACT_NAME: { min: 2, max: 100 },
  LOCATION: { min: 10 },
} as const;

export interface CreateHospitalInput {
  user_id: string;
  hospital_name: string;
  hospital_name_english?: string;
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  hospital_details?: string;
  services?: string[];
  status?: 'pending' | 'approved' | 'rejected';
}

export interface UpdateHospitalInput {
  hospital_name?: string;
  hospital_name_english?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  hospital_details?: string;
  services?: string[];
  status?: 'pending' | 'approved' | 'rejected';
}

export interface HospitalFilters {
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate hospital data
 */
export function validateHospitalData(
  data: Partial<CreateHospitalInput | UpdateHospitalInput>,
  isUpdate = false
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate hospital_name
  if (data.hospital_name !== undefined) {
    if (!data.hospital_name || data.hospital_name.trim().length < HOSPITAL_VALIDATION_RULES.hospital_NAME.min) {
      errors.hospital_name = `ชื่อโรงพยาบาลต้องมีความยาว ${HOSPITAL_VALIDATION_RULES.hospital_NAME.min}-${HOSPITAL_VALIDATION_RULES.hospital_NAME.max} ตัวอักษร`;
    } else if (data.hospital_name.trim().length > HOSPITAL_VALIDATION_RULES.hospital_NAME.max) {
      errors.hospital_name = `ชื่อโรงพยาบาลต้องมีความยาว ${HOSPITAL_VALIDATION_RULES.hospital_NAME.min}-${HOSPITAL_VALIDATION_RULES.hospital_NAME.max} ตัวอักษร`;
    }
  } else if (!isUpdate) {
    errors.hospital_name = 'กรุณากรอกชื่อโรงพยาบาล';
  }

  // Validate hospital_name_english
  if (data.hospital_name_english !== undefined && data.hospital_name_english) {
    if (data.hospital_name_english.trim().length < HOSPITAL_VALIDATION_RULES.hospital_NAME.min) {
      errors.hospital_name_english = `ชื่อภาษาอังกฤษต้องมีความยาว ${HOSPITAL_VALIDATION_RULES.hospital_NAME.min}-${HOSPITAL_VALIDATION_RULES.hospital_NAME.max} ตัวอักษร`;
    } else if (data.hospital_name_english.trim().length > HOSPITAL_VALIDATION_RULES.hospital_NAME.max) {
      errors.hospital_name_english = `ชื่อภาษาอังกฤษต้องมีความยาว ${HOSPITAL_VALIDATION_RULES.hospital_NAME.min}-${HOSPITAL_VALIDATION_RULES.hospital_NAME.max} ตัวอักษร`;
    }
  }

  // Validate contact_name
  if (data.contact_name !== undefined) {
    if (!data.contact_name || data.contact_name.trim().length < HOSPITAL_VALIDATION_RULES.CONTACT_NAME.min) {
      errors.contact_name = `ชื่อผู้ติดต่อต้องมีความยาว ${HOSPITAL_VALIDATION_RULES.CONTACT_NAME.min}-${HOSPITAL_VALIDATION_RULES.CONTACT_NAME.max} ตัวอักษร`;
    } else if (data.contact_name.trim().length > HOSPITAL_VALIDATION_RULES.CONTACT_NAME.max) {
      errors.contact_name = `ชื่อผู้ติดต่อต้องมีความยาว ${HOSPITAL_VALIDATION_RULES.CONTACT_NAME.min}-${HOSPITAL_VALIDATION_RULES.CONTACT_NAME.max} ตัวอักษร`;
    }
  } else if (!isUpdate) {
    errors.contact_name = 'กรุณากรอกชื่อผู้ติดต่อ';
  }

  // Validate phone
  if (data.phone !== undefined) {
    if (!data.phone) {
      errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (validatePhone(data.phone)) {
      errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 02-123-4567 หรือ 0812345678)';
    }
  } else if (!isUpdate) {
    errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
  }

  // Validate email
  if (data.email !== undefined) {
    if (!data.email) {
      errors.email = 'กรุณากรอกอีเมล';
    } else if (validateEmail(data.email)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
  } else if (!isUpdate) {
    errors.email = 'กรุณากรอกอีเมล';
  }

  // Validate website
  if (data.website !== undefined && data.website) {
    try {
      new URL(data.website);
    } catch {
      errors.website = 'รูปแบบ URL ไม่ถูกต้อง';
    }
  }

  // Validate location
  if (data.location !== undefined) {
    if (!data.location || data.location.trim().length < HOSPITAL_VALIDATION_RULES.LOCATION.min) {
      errors.location = `ที่อยู่ต้องมีความยาวอย่างน้อย ${HOSPITAL_VALIDATION_RULES.LOCATION.min} ตัวอักษร`;
    }
  } else if (!isUpdate) {
    errors.location = 'กรุณากรอกที่อยู่';
  }

  // Validate status
  if (data.status !== undefined) {
    if (!['pending', 'approved', 'rejected'].includes(data.status)) {
      errors.status = 'สถานะไม่ถูกต้อง';
    }
  }

  return errors;
}

/**
 * Get all hospitals with optional filters (optimized - only select needed columns)
 */
export async function getHospitals(filters?: HospitalFilters) {
  const supabase = await getServiceClient();

  let query = supabase
    .from('hospitals')
    .select(`
      id,
      user_id,
      hospital_name,
      hospital_name_english,
      contact_name,
      phone,
      email,
      website,
      location,
      hospital_details,
      services,
      status,
      images,
      slug,
      created_at,
      updated_at,
      profiles:user_id (
        user_id,
        username,
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    const searchTerm = filters.search.trim();
    query = query.or(`hospital_name.ilike.%${searchTerm}%,hospital_name_english.ilike.%${searchTerm}%`);
  }

  const { data: hospitals, error } = await query;

  handleQueryError(error, 'Failed to fetch hospitals');

  return hospitals || [];
}

/**
 * Get hospital by ID (optimized - only select needed columns)
 */
export async function getHospitalById(id: string): Promise<hospital | null> {
  const supabase = await getServiceClient();

  const { data: hospital, error } = await supabase
    .from('hospitals')
    .select('id, user_id, hospital_name, hospital_name_english, contact_name, phone, email, website, location, hospital_details, services, status, images, slug, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  handleQueryError(error, 'Failed to fetch hospital');

  return hospital;
}

/**
 * Sanitize hospital data
 */
function sanitizeHospitalData(data: CreateHospitalInput | UpdateHospitalInput) {
  const sanitized: Record<string, unknown> = {};
  
  if ('hospital_name' in data && data.hospital_name !== undefined) {
    sanitized.hospital_name = data.hospital_name.trim();
  }
  if ('hospital_name_english' in data && data.hospital_name_english !== undefined) {
    sanitized.hospital_name_english = data.hospital_name_english?.trim() || null;
  }
  if ('contact_name' in data && data.contact_name !== undefined) {
    sanitized.contact_name = data.contact_name.trim();
  }
  if ('phone' in data && data.phone !== undefined) {
    sanitized.phone = data.phone.trim();
  }
  if ('email' in data && data.email !== undefined) {
    sanitized.email = data.email.trim().toLowerCase();
  }
  if ('website' in data && data.website !== undefined) {
    sanitized.website = data.website?.trim() || null;
  }
  if ('location' in data && data.location !== undefined) {
    sanitized.location = data.location.trim();
  }
  if ('hospital_details' in data && data.hospital_details !== undefined) {
    sanitized.hospital_details = data.hospital_details?.trim() || null;
  }
  if ('services' in data && data.services !== undefined) {
    sanitized.services = data.services || [];
  }
  if ('status' in data && data.status !== undefined) {
    sanitized.status = data.status;
  }
  
  return sanitized;
}

/**
 * Create new hospital with sanitized data
 */
export async function createHospital(data: CreateHospitalInput): Promise<hospital> {
  // Validate data
  const errors = validateHospitalData(data, false);
  if (Object.keys(errors).length > 0) {
    // Convert ValidationErrors to the format expected by ServiceValidationError
    const errorMessages: Record<string, string[]> = {};
    Object.entries(errors).forEach(([key, value]) => {
      errorMessages[key] = [value];
    });
    throw new ServiceValidationError('ข้อมูลไม่ถูกต้อง', errorMessages);
  }

  const supabase = await getServiceClient();
  const sanitizedData = sanitizeHospitalData(data);

  const newHospital = {
    user_id: data.user_id,
    ...sanitizedData,
    images: [],
    status: data.status || 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: createdHospital, error } = await supabase
    .from('hospitals')
    .insert([newHospital])
    .select()
    .single();

  return handleQueryResult(createdHospital, error, 'Failed to create hospital');
}

/**
 * Update hospital with optimized validation and sanitization
 */
export async function updateHospital(id: string, data: UpdateHospitalInput): Promise<hospital> {
  // Validate data
  const errors = validateHospitalData(data, true);
  if (Object.keys(errors).length > 0) {
    // Convert ValidationErrors to the format expected by ServiceValidationError
    const errorMessages: Record<string, string[]> = {};
    Object.entries(errors).forEach(([key, value]) => {
      errorMessages[key] = [value];
    });
    throw new ServiceValidationError('ข้อมูลไม่ถูกต้อง', errorMessages);
  }

  const supabase = await getServiceClient();

  // Check if hospital exists (optimized - only check id)
  const { data: existingHospital, error: checkError } = await supabase
    .from('hospitals')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  handleQueryError(checkError, 'Failed to check hospital existence');
  if (!existingHospital) {
    throw new ServiceNotFoundError('ไม่พบโรงพยาบาลที่ต้องการ');
  }

  // Sanitize and build update object
  const sanitizedData = sanitizeHospitalData(data);
  const updateData = {
    ...sanitizedData,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedHospital, error } = await supabase
    .from('hospitals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  return handleQueryResult(updatedHospital, error, 'Failed to update hospital');
}

/**
 * Delete hospital
 */
export async function deleteHospital(id: string): Promise<void> {
  const supabase = await getServiceClient();

  // Check if hospital exists (optimized - only check id)
  const { data: existingHospital, error: checkError } = await supabase
    .from('hospitals')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  handleQueryError(checkError, 'Failed to check hospital existence');
  if (!existingHospital) {
    throw new ServiceNotFoundError('ไม่พบโรงพยาบาลที่ต้องการ');
  }

  const { error } = await supabase
    .from('hospitals')
    .delete()
    .eq('id', id);

  handleQueryError(error, 'Failed to delete hospital');
}

/**
 * Update hospital status (consolidated function for approve/reject)
 */
export async function updateHospitalStatus(
  id: string, 
  status: 'pending' | 'approved' | 'rejected'
): Promise<hospital> {
  return updateHospital(id, { status });
}

/**
 * Approve hospital (convenience function)
 */
export async function approveHospital(id: string): Promise<hospital> {
  return updateHospitalStatus(id, 'approved');
}

/**
 * Reject hospital (convenience function)
 */
export async function rejectHospital(id: string): Promise<hospital> {
  return updateHospitalStatus(id, 'rejected');
}

/**
 * Backward compatibility aliases for gym terminology
 * @deprecated Use getHospitalById, createHospital, updateHospital, deleteHospital, getHospitals instead
 */
export const getGymById = getHospitalById;
export const createGym = createHospital;
export const updateGym = updateHospital;
export const deleteGym = deleteHospital;
export const getGyms = getHospitals;
