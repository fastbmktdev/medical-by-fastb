// Review Types
// ประเภทข้อมูลสำหรับ Reviews System

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden' | 'flagged';
export type ReviewSource = 'platform' | 'google' | 'facebook' | 'tripadvisor';
export type FlagReason = 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'irrelevant' | 'other';
export type FlagStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type GoogleSyncStatus = 'pending' | 'syncing' | 'success' | 'failed' | 'disabled';

// ============================================================================
// MAIN REVIEW INTERFACE
// ============================================================================

export interface HospitalReview {
  id: string;
  
  // Relationships
  hospital_id: string;
  user_id: string;
  booking_id?: string | null;
  
  // Review Content
  rating: number; // 1-5
  title?: string | null;
  comment: string;
  
  // Review Details
  visit_date?: string | null;
  recommend?: boolean;
  
  // Moderation
  status: ReviewStatus;
  moderation_reason?: string | null;
  moderated_by?: string | null;
  moderated_at?: string | null;
  
  // Flags and Reports
  is_verified_visit: boolean;
  is_featured: boolean;
  flag_count: number;
  
  // External Integration
  google_review_id?: string | null;
  source: ReviewSource;
  
  // Response
  has_response: boolean;
  
  // Engagement
  helpful_count: number;
  views_count: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REVIEW WITH USER DETAILS
// ============================================================================

export interface HospitalReviewWithUser extends HospitalReview {
  user_full_name?: string | null;
  user_avatar_url?: string | null;
}

// ============================================================================
// REVIEW WITH HOSPITAL DETAILS
// ============================================================================

export interface HospitalReviewWithHospital extends HospitalReview {
  hospital_name?: string;
  hospital_slug?: string;
  hospital_logo_url?: string | null;
}

// ============================================================================
// REVIEW WITH REPLY
// ============================================================================

export interface HospitalReviewWithReply extends HospitalReviewWithUser {
  reply?: ReviewReply | null;
}

// ============================================================================
// REVIEW REPLY INTERFACE
// ============================================================================

export interface ReviewReply {
  id: string;
  
  // Relationships
  review_id: string;
  user_id: string;
  
  // Reply Content
  message: string;
  
  // Status
  is_edited: boolean;
  edited_at?: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REVIEW FLAG INTERFACE
// ============================================================================

export interface ReviewFlag {
  id: string;
  
  // Relationships
  review_id: string;
  flagged_by: string;
  
  // Flag Details
  reason: FlagReason;
  description?: string | null;
  
  // Status
  status: FlagStatus;
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REVIEW HELPFUL VOTE INTERFACE
// ============================================================================

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
}

// ============================================================================
// REVIEW ANALYTICS INTERFACE
// ============================================================================

export interface ReviewAnalytics {
  id: string;
  hospital_id: string;
  
  // Rating Statistics
  total_reviews: number;
  average_rating: number;
  
  // Rating Distribution
  rating_5_count: number;
  rating_4_count: number;
  rating_3_count: number;
  rating_2_count: number;
  rating_1_count: number;
  
  // Response Statistics
  total_responses: number;
  response_rate: number; // Percentage
  avg_response_time_hours?: number | null;
  
  // Recommendation
  recommend_count: number;
  recommend_rate: number; // Percentage
  
  // Recent Activity
  reviews_last_30_days: number;
  reviews_last_7_days: number;
  
  // Metadata
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// GOOGLE REVIEWS SYNC INTERFACE
// ============================================================================

export interface GoogleReviewsSync {
  id: string;
  hospital_id: string;
  
  // Google Business Profile
  google_place_id?: string | null;
  google_account_id?: string | null;
  
  // Sync Status
  last_sync_at?: string | null;
  sync_status: GoogleSyncStatus;
  sync_error?: string | null;
  
  // Sync Configuration
  auto_sync_enabled: boolean;
  sync_frequency_hours: number;
  
  // Statistics
  total_synced: number;
  last_synced_review_date?: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Create Review Request
export interface CreateReviewRequest {
  hospital_id: string;
  rating: number;
  title?: string;
  comment: string;
  visit_date?: string;
  recommend?: boolean;
  booking_id?: string;
}

// Update Review Request
export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  visit_date?: string;
  recommend?: boolean;
}

// Reply to Review Request
export interface ReplyToReviewRequest {
  review_id: string;
  message: string;
}

// Update Reply Request
export interface UpdateReplyRequest {
  message: string;
}

// Flag Review Request
export interface FlagReviewRequest {
  review_id: string;
  reason: FlagReason;
  description?: string;
}

// Moderate Review Request (Admin)
export interface ModerateReviewRequest {
  status: ReviewStatus;
  moderation_reason?: string;
}

// Google Sync Configuration Request
export interface GoogleSyncConfigRequest {
  google_place_id?: string;
  google_account_id?: string;
  auto_sync_enabled?: boolean;
  sync_frequency_hours?: number;
}

// Review List Query Parameters
export interface ReviewListQuery {
  hospital_id?: string;
  user_id?: string;
  status?: ReviewStatus;
  rating?: number;
  source?: ReviewSource;
  has_response?: boolean;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'rating' | 'helpful_count' | 'views_count';
  sort_order?: 'asc' | 'desc';
}

// Review Analytics Summary
export interface ReviewAnalyticsSummary {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  response_rate: number;
  recommend_rate: number;
  recent_reviews: {
    last_7_days: number;
    last_30_days: number;
  };
  top_reviews: HospitalReviewWithUser[];
}

// Review Statistics
export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  with_response: number;
  average_rating: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ReviewApiResponse {
  success: boolean;
  data?: HospitalReview | HospitalReviewWithReply | HospitalReviewWithUser;
  error?: string;
}

export interface ReviewListApiResponse {
  success: boolean;
  data?: {
    reviews: HospitalReviewWithReply[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
  error?: string;
}

export interface ReviewAnalyticsApiResponse {
  success: boolean;
  data?: ReviewAnalyticsSummary;
  error?: string;
}

export interface ReviewStatsApiResponse {
  success: boolean;
  data?: ReviewStats;
  error?: string;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  visit_date?: string;
  recommend: boolean;
}

export interface ReplyFormData {
  message: string;
}

// ============================================================================
// FILTER AND SORT OPTIONS
// ============================================================================

export interface ReviewFilterOptions {
  status?: ReviewStatus[];
  rating?: number[];
  source?: ReviewSource[];
  has_response?: boolean;
  is_featured?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface ReviewSortOption {
  label: string;
  value: string;
  field: 'created_at' | 'rating' | 'helpful_count' | 'views_count';
  order: 'asc' | 'desc';
}

