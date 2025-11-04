/**
 * Services Index
 * Optimized exports for better tree-shaking
 */

// Most commonly used service functions
export { 
  getGyms, 
  createGym, 
  getGymById, 
  updateGym, 
  deleteGym 
} from './gym.service';

export { 
  getBookings, 
  createBooking, 
  updateBookingStatus 
} from './booking.service';

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
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser 
} from './auth.service';

// For less common functions, import directly from specific service files
// e.g., import { specificFunction } from '@/services/gym.service';
