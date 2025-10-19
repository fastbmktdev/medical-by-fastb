/**
 * Gym Service
 * Business logic for gym management operations
 */

import { createClient } from '@/lib/database/supabase/server';
import type { Gym } from '@/types';

// Validation patterns
const PHONE_REGEX = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation rules
const VALIDATION_RULES = {
  GYM_NAME: { min: 3, max: 100 },
  CONTACT_NAME: { min: 2, max: 100 },
  LOCATION: { min: 10 },
} as const;

export interface CreateGymInput {
  user_id: string;
  gym_name: string;
  gym_name_english?: string;
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  gym_details?: string;
  services?: string[];
  status?: 'pending' | 'approved' | 'rejected';
}

export interface UpdateGymInput {
  gym_name?: string;
  gym_name_english?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  gym_details?: string;
  services?: string[];
  status?: 'pending' | 'approved' | 'rejected';
}

export interface GymFilters {
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate gym data
 */
export function validateGymData(
  data: Partial<CreateGymInput | UpdateGymInput>,
  isUpdate = false
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate gym_name
  if (data.gym_name !== undefined) {
    if (!data.gym_name || data.gym_name.trim().length < VALIDATION_RULES.GYM_NAME.min) {
      errors.gym_name = `ชื่อยิมต้องมีความยาว ${VALIDATION_RULES.GYM_NAME.min}-${VALIDATION_RULES.GYM_NAME.max} ตัวอักษร`;
    } else if (data.gym_name.trim().length > VALIDATION_RULES.GYM_NAME.max) {
      errors.gym_name = `ชื่อยิมต้องมีความยาว ${VALIDATION_RULES.GYM_NAME.min}-${VALIDATION_RULES.GYM_NAME.max} ตัวอักษร`;
    }
  } else if (!isUpdate) {
    errors.gym_name = 'กรุณากรอกชื่อยิม';
  }

  // Validate gym_name_english
  if (data.gym_name_english !== undefined && data.gym_name_english) {
    if (data.gym_name_english.trim().length < VALIDATION_RULES.GYM_NAME.min) {
      errors.gym_name_english = `ชื่อภาษาอังกฤษต้องมีความยาว ${VALIDATION_RULES.GYM_NAME.min}-${VALIDATION_RULES.GYM_NAME.max} ตัวอักษร`;
    } else if (data.gym_name_english.trim().length > VALIDATION_RULES.GYM_NAME.max) {
      errors.gym_name_english = `ชื่อภาษาอังกฤษต้องมีความยาว ${VALIDATION_RULES.GYM_NAME.min}-${VALIDATION_RULES.GYM_NAME.max} ตัวอักษร`;
    }
  }

  // Validate contact_name
  if (data.contact_name !== undefined) {
    if (!data.contact_name || data.contact_name.trim().length < VALIDATION_RULES.CONTACT_NAME.min) {
      errors.contact_name = `ชื่อผู้ติดต่อต้องมีความยาว ${VALIDATION_RULES.CONTACT_NAME.min}-${VALIDATION_RULES.CONTACT_NAME.max} ตัวอักษร`;
    } else if (data.contact_name.trim().length > VALIDATION_RULES.CONTACT_NAME.max) {
      errors.contact_name = `ชื่อผู้ติดต่อต้องมีความยาว ${VALIDATION_RULES.CONTACT_NAME.min}-${VALIDATION_RULES.CONTACT_NAME.max} ตัวอักษร`;
    }
  } else if (!isUpdate) {
    errors.contact_name = 'กรุณากรอกชื่อผู้ติดต่อ';
  }

  // Validate phone
  if (data.phone !== undefined) {
    if (!data.phone) {
      errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!PHONE_REGEX.test(data.phone.replace(/\s/g, ''))) {
      errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 02-123-4567 หรือ 0812345678)';
    }
  } else if (!isUpdate) {
    errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
  }

  // Validate email
  if (data.email !== undefined) {
    if (!data.email) {
      errors.email = 'กรุณากรอกอีเมล';
    } else if (!EMAIL_REGEX.test(data.email)) {
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
    if (!data.location || data.location.trim().length < VALIDATION_RULES.LOCATION.min) {
      errors.location = `ที่อยู่ต้องมีความยาวอย่างน้อย ${VALIDATION_RULES.LOCATION.min} ตัวอักษร`;
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
 * Get all gyms with optional filters
 */
export async function getGyms(filters?: GymFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('gyms')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(`gym_name.ilike.%${filters.search}%,gym_name_english.ilike.%${filters.search}%`);
  }

  const { data: gyms, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch gyms: ${error.message}`);
  }

  // Fetch profiles for all gym owners
  const userIds = [...new Set(gyms?.map(g => g.user_id) || [])];
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, full_name')
      .in('user_id', userIds);

    // Merge profiles with gyms
    const gymsWithProfiles = gyms?.map(gym => ({
      ...gym,
      profiles: profiles?.find(p => p.user_id === gym.user_id) || null
    })) || [];

    return gymsWithProfiles;
  }

  return gyms || [];
}

/**
 * Get gym by ID
 */
export async function getGymById(id: string): Promise<Gym | null> {
  const supabase = await createClient();

  const { data: gym, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch gym: ${error.message}`);
  }

  return gym;
}

/**
 * Create new gym
 */
export async function createGym(data: CreateGymInput): Promise<Gym> {
  // Validate data
  const errors = validateGymData(data, false);
  if (Object.keys(errors).length > 0) {
    const error = new Error('ข้อมูลไม่ถูกต้อง') as Error & { errors: ValidationErrors };
    error.errors = errors;
    throw error;
  }

  const supabase = await createClient();

  const newGym = {
    user_id: data.user_id,
    gym_name: data.gym_name.trim(),
    gym_name_english: data.gym_name_english?.trim() || null,
    contact_name: data.contact_name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    website: data.website?.trim() || null,
    location: data.location.trim(),
    gym_details: data.gym_details?.trim() || null,
    services: data.services || [],
    images: [],
    status: data.status || 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: createdGym, error } = await supabase
    .from('gyms')
    .insert([newGym])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create gym: ${error.message}`);
  }

  return createdGym;
}

/**
 * Update gym
 */
export async function updateGym(id: string, data: UpdateGymInput): Promise<Gym> {
  // Validate data
  const errors = validateGymData(data, true);
  if (Object.keys(errors).length > 0) {
    const error = new Error('ข้อมูลไม่ถูกต้อง') as Error & { errors: ValidationErrors };
    error.errors = errors;
    throw error;
  }

  const supabase = await createClient();

  // Check if gym exists
  const existingGym = await getGymById(id);
  if (!existingGym) {
    throw new Error('ไม่พบยิมที่ต้องการ');
  }

  // Build update object
  const updateData: Record<string, string | string[] | null> = {
    updated_at: new Date().toISOString(),
  };

  if (data.gym_name !== undefined) updateData.gym_name = data.gym_name.trim();
  if (data.gym_name_english !== undefined) updateData.gym_name_english = data.gym_name_english?.trim() || null;
  if (data.contact_name !== undefined) updateData.contact_name = data.contact_name.trim();
  if (data.phone !== undefined) updateData.phone = data.phone.trim();
  if (data.email !== undefined) updateData.email = data.email.trim();
  if (data.website !== undefined) updateData.website = data.website?.trim() || null;
  if (data.location !== undefined) updateData.location = data.location.trim();
  if (data.gym_details !== undefined) updateData.gym_details = data.gym_details?.trim() || null;
  if (data.services !== undefined) updateData.services = data.services;
  if (data.status !== undefined) updateData.status = data.status;

  const { data: updatedGym, error } = await supabase
    .from('gyms')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update gym: ${error.message}`);
  }

  return updatedGym;
}

/**
 * Delete gym
 */
export async function deleteGym(id: string): Promise<void> {
  const supabase = await createClient();

  // Check if gym exists
  const existingGym = await getGymById(id);
  if (!existingGym) {
    throw new Error('ไม่พบยิมที่ต้องการ');
  }

  const { error } = await supabase
    .from('gyms')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete gym: ${error.message}`);
  }
}

/**
 * Approve gym
 */
export async function approveGym(id: string): Promise<Gym> {
  return updateGym(id, { status: 'approved' });
}

/**
 * Reject gym
 */
export async function rejectGym(id: string): Promise<Gym> {
  return updateGym(id, { status: 'rejected' });
}
