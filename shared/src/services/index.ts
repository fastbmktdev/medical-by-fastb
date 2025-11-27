/**
 * Services Index
 * Optimized exports for better tree-shaking
 */

// Most commonly used service functions
export { 
  getHospitals, 
  createHospital, 
  getHospitalById, 
  updateHospital, 
  deleteHospital,
  // Backward compatibility aliases
  getGymById,
  createGym,
  updateGym,
  deleteGym,
  getGyms
} from './hospital.service';

export { 
  getAppointments, 
  createAppointment, 
  updateAppointmentStatus 
} from './appointment.service';

export { 
  createPaymentIntent, 
  getUserPayments, 
  getPaymentById,
  retryFailedPayment,
  createSetupIntent,
  savePaymentMethod,
  getSavedPaymentMethods,
  deleteSavedPaymentMethod,
  setDefaultPaymentMethod,
  getUserDisputes,
  getAllDisputes,
  getDisputeById,
  respondToDispute
} from './payment.service';

export {
  validateCoupon,
  isFirstTimeUser,
  incrementPromotionUsage,
  getPromotionByCouponCode,
  type Promotion,
  type ValidateCouponInput,
  type ValidateCouponResult,
} from './promotion.service';

export { 
  signOut, 
  getCurrentUser,
  signInWithGoogle,
  signInWithFacebook,
  onAuthStateChange
} from './auth.service';

// For less common functions, import directly from specific service files
// e.g., import { specificFunction } from '@/services/hospital.service';
