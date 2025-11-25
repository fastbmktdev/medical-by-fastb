-- ============================================================================
-- Reviews System Migration
-- ============================================================================
-- Description: Complete review management system for hospitals including:
--   - Customer reviews and ratings
--   - Partner replies to reviews
--   - Review moderation and reporting
--   - Review analytics and statistics
--   - Google Reviews integration support
-- ============================================================================

-- UUID generation using built-in gen_random_uuid() function
-- No extension needed for gen_random_uuid() in PostgreSQL 13+

-- ============================================================================
-- 1. REVIEWS TABLE
-- ============================================================================
-- Main reviews table for customer hospital reviews
CREATE TABLE IF NOT EXISTS hospital_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES appointments(id) ON DELETE SET NULL, -- Optional: link to appointment
  
  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT NOT NULL,
  
  -- Review Details
  visit_date DATE, -- When they visited the hospital
  recommend BOOLEAN DEFAULT true, -- Would they recommend this hospital
  
  -- Moderation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'flagged')),
  moderation_reason TEXT, -- Reason for rejection/hiding
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  
  -- Flags and Reports
  is_verified_visit BOOLEAN DEFAULT false, -- Verified through appointment
  is_featured BOOLEAN DEFAULT false, -- Featured review
  flag_count INTEGER DEFAULT 0, -- Number of times flagged
  
  -- External Integration
  google_review_id VARCHAR(255) UNIQUE, -- If imported from Google
  source VARCHAR(50) DEFAULT 'platform' CHECK (source IN ('platform', 'google', 'facebook', 'tripadvisor')),
  
  -- Response
  has_response BOOLEAN DEFAULT false,
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0, -- Number of "helpful" votes
  views_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_user_hospital_review UNIQUE (user_id, hospital_id, google_review_id)
);

-- Add indexes for performance
CREATE INDEX idx_hospital_reviews_hospital_id ON hospital_reviews(hospital_id);
CREATE INDEX idx_hospital_reviews_user_id ON hospital_reviews(user_id);
CREATE INDEX idx_hospital_reviews_status ON hospital_reviews(status);
CREATE INDEX idx_hospital_reviews_rating ON hospital_reviews(rating);
CREATE INDEX idx_hospital_reviews_created_at ON hospital_reviews(created_at DESC);
CREATE INDEX idx_hospital_reviews_google_id ON hospital_reviews(google_review_id) WHERE google_review_id IS NOT NULL;

-- Add comment
COMMENT ON TABLE hospital_reviews IS 'Customer reviews and ratings for hospitals';

-- ============================================================================
-- 2. REVIEW REPLIES TABLE
-- ============================================================================
-- Partner responses to reviews
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  review_id UUID NOT NULL REFERENCES hospital_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Partner who replied
  
  -- Reply Content
  message TEXT NOT NULL,
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX idx_review_replies_user_id ON review_replies(user_id);

-- Add comment
COMMENT ON TABLE review_replies IS 'Partner replies to customer reviews';

-- ============================================================================
-- 3. REVIEW FLAGS TABLE
-- ============================================================================
-- Track review flags/reports
CREATE TABLE IF NOT EXISTS review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  review_id UUID NOT NULL REFERENCES hospital_reviews(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Flag Details
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'offensive', 'irrelevant', 'other')),
  description TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate flags
  CONSTRAINT unique_review_flag UNIQUE (review_id, flagged_by)
);

-- Add indexes
CREATE INDEX idx_review_flags_review_id ON review_flags(review_id);
CREATE INDEX idx_review_flags_status ON review_flags(status);

-- Add comment
COMMENT ON TABLE review_flags IS 'User reports/flags on reviews';

-- ============================================================================
-- 4. REVIEW HELPFUL VOTES TABLE
-- ============================================================================
-- Track "helpful" votes on reviews
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  review_id UUID NOT NULL REFERENCES hospital_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate votes
  CONSTRAINT unique_review_helpful_vote UNIQUE (review_id, user_id)
);

-- Add indexes
CREATE INDEX idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);

-- Add comment
COMMENT ON TABLE review_helpful_votes IS 'User votes on review helpfulness';

-- ============================================================================
-- 5. REVIEW ANALYTICS TABLE
-- ============================================================================
-- Aggregated review statistics per hospital
CREATE TABLE IF NOT EXISTS review_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE UNIQUE,
  
  -- Rating Statistics
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Rating Distribution
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  
  -- Response Statistics
  total_responses INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  avg_response_time_hours DECIMAL(10,2), -- Average time to respond in hours
  
  -- Recommendation
  recommend_count INTEGER DEFAULT 0,
  recommend_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  
  -- Recent Activity
  reviews_last_30_days INTEGER DEFAULT 0,
  reviews_last_7_days INTEGER DEFAULT 0,
  
  -- Metadata
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_review_analytics_hospital_id ON review_analytics(hospital_id);
CREATE INDEX idx_review_analytics_average_rating ON review_analytics(average_rating DESC);

-- Add comment
COMMENT ON TABLE review_analytics IS 'Aggregated review statistics for hospitals';

-- ============================================================================
-- 6. GOOGLE REVIEWS SYNC TABLE
-- ============================================================================
-- Track Google Reviews API sync status
CREATE TABLE IF NOT EXISTS google_reviews_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  
  -- Google Business Profile
  google_place_id VARCHAR(255),
  google_account_id VARCHAR(255),
  
  -- Sync Status
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'failed', 'disabled')),
  sync_error TEXT,
  
  -- Sync Configuration
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_frequency_hours INTEGER DEFAULT 24, -- How often to sync
  
  -- Statistics
  total_synced INTEGER DEFAULT 0,
  last_synced_review_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_hospital_google_sync UNIQUE (hospital_id)
);

-- Add indexes
CREATE INDEX idx_google_reviews_sync_hospital_id ON google_reviews_sync(hospital_id);
CREATE INDEX idx_google_reviews_sync_status ON google_reviews_sync(sync_status);

-- Add comment
COMMENT ON TABLE google_reviews_sync IS 'Google Reviews API synchronization tracking';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Update review analytics
CREATE OR REPLACE FUNCTION update_review_analytics(p_hospital_id UUID)
RETURNS void AS $$
DECLARE
  v_total_reviews INTEGER;
  v_average_rating DECIMAL(3,2);
  v_rating_counts INTEGER[];
  v_total_responses INTEGER;
  v_response_rate DECIMAL(5,2);
  v_recommend_count INTEGER;
  v_recommend_rate DECIMAL(5,2);
  v_reviews_30d INTEGER;
  v_reviews_7d INTEGER;
BEGIN
  -- Calculate statistics
  SELECT 
    COUNT(*),
    ROUND(AVG(rating), 2),
    ARRAY[
      COUNT(*) FILTER (WHERE rating = 5),
      COUNT(*) FILTER (WHERE rating = 4),
      COUNT(*) FILTER (WHERE rating = 3),
      COUNT(*) FILTER (WHERE rating = 2),
      COUNT(*) FILTER (WHERE rating = 1)
    ],
    COUNT(*) FILTER (WHERE has_response = true),
    COUNT(*) FILTER (WHERE recommend = true),
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')
  INTO 
    v_total_reviews,
    v_average_rating,
    v_rating_counts,
    v_total_responses,
    v_recommend_count,
    v_reviews_30d,
    v_reviews_7d
  FROM hospital_reviews
  WHERE hospital_id = p_hospital_id AND status = 'approved';
  
  -- Calculate rates
  IF v_total_reviews > 0 THEN
    v_response_rate := ROUND((v_total_responses::DECIMAL / v_total_reviews) * 100, 2);
    v_recommend_rate := ROUND((v_recommend_count::DECIMAL / v_total_reviews) * 100, 2);
  ELSE
    v_response_rate := 0;
    v_recommend_rate := 0;
  END IF;
  
  -- Insert or update analytics
  INSERT INTO review_analytics (
    hospital_id,
    total_reviews,
    average_rating,
    rating_5_count,
    rating_4_count,
    rating_3_count,
    rating_2_count,
    rating_1_count,
    total_responses,
    response_rate,
    recommend_count,
    recommend_rate,
    reviews_last_30_days,
    reviews_last_7_days,
    last_calculated_at,
    updated_at
  ) VALUES (
    p_hospital_id,
    v_total_reviews,
    COALESCE(v_average_rating, 0),
    v_rating_counts[1],
    v_rating_counts[2],
    v_rating_counts[3],
    v_rating_counts[4],
    v_rating_counts[5],
    v_total_responses,
    v_response_rate,
    v_recommend_count,
    v_recommend_rate,
    v_reviews_30d,
    v_reviews_7d,
    NOW(),
    NOW()
  )
  ON CONFLICT (hospital_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    rating_5_count = EXCLUDED.rating_5_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_1_count = EXCLUDED.rating_1_count,
    total_responses = EXCLUDED.total_responses,
    response_rate = EXCLUDED.response_rate,
    recommend_count = EXCLUDED.recommend_count,
    recommend_rate = EXCLUDED.recommend_rate,
    reviews_last_30_days = EXCLUDED.reviews_last_30_days,
    reviews_last_7_days = EXCLUDED.reviews_last_7_days,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function: Get hospital reviews with user details
CREATE OR REPLACE FUNCTION get_hospital_reviews_with_details(
  p_hospital_id UUID,
  p_status VARCHAR DEFAULT 'approved',
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  hospital_id UUID,
  user_id UUID,
  rating INTEGER,
  title VARCHAR,
  comment TEXT,
  visit_date DATE,
  recommend BOOLEAN,
  status VARCHAR,
  has_response BOOLEAN,
  helpful_count INTEGER,
  views_count INTEGER,
  created_at TIMESTAMPTZ,
  user_full_name TEXT,
  user_avatar_url TEXT,
  reply_message TEXT,
  reply_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.hospital_id,
    r.user_id,
    r.rating,
    r.title,
    r.comment,
    r.visit_date,
    r.recommend,
    r.status,
    r.has_response,
    r.helpful_count,
    r.views_count,
    r.created_at,
    p.full_name,
    p.avatar_url,
    rr.message AS reply_message,
    rr.created_at AS reply_created_at
  FROM hospital_reviews r
  LEFT JOIN profiles p ON r.user_id = p.user_id
  LEFT JOIN review_replies rr ON r.id = rr.review_id
  WHERE r.hospital_id = p_hospital_id
    AND (p_status IS NULL OR r.status = p_status)
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hospital_reviews_updated_at
  BEFORE UPDATE ON hospital_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_replies_updated_at
  BEFORE UPDATE ON review_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_flags_updated_at
  BEFORE UPDATE ON review_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_analytics_updated_at
  BEFORE UPDATE ON review_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_reviews_sync_updated_at
  BEFORE UPDATE ON google_reviews_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update has_response flag when reply is added
CREATE OR REPLACE FUNCTION update_review_has_response()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hospital_reviews
  SET has_response = true
  WHERE id = NEW.review_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_reply_insert
  AFTER INSERT ON review_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_review_has_response();

-- Trigger: Update flag_count when flag is added
CREATE OR REPLACE FUNCTION update_review_flag_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hospital_reviews
  SET flag_count = flag_count + 1
  WHERE id = NEW.review_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_flag_insert
  AFTER INSERT ON review_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_review_flag_count();

-- Trigger: Update helpful_count when vote is added/removed
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hospital_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hospital_reviews
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.review_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_helpful_vote_change
  AFTER INSERT OR DELETE ON review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Trigger: Update analytics when review is added/updated
CREATE OR REPLACE FUNCTION trigger_update_review_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics for the hospital
  PERFORM update_review_analytics(COALESCE(NEW.hospital_id, OLD.hospital_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_change
  AFTER INSERT OR UPDATE OR DELETE ON hospital_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_review_analytics();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE hospital_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_reviews_sync ENABLE ROW LEVEL SECURITY;

-- Policies for hospital_reviews
CREATE POLICY "Public can view approved reviews"
  ON hospital_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can create their own reviews"
  ON hospital_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending reviews"
  ON hospital_reviews FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can view reviews for their hospital"
  ON hospital_reviews FOR SELECT
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all reviews"
  ON hospital_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for review_replies
CREATE POLICY "Public can view all replies"
  ON review_replies FOR SELECT
  USING (true);

CREATE POLICY "Partners can reply to their hospital reviews"
  ON review_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM hospital_reviews r
      JOIN hospitals g ON r.hospital_id = g.id
      WHERE r.id = review_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update their own replies"
  ON review_replies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for review_flags
CREATE POLICY "Users can flag reviews"
  ON review_flags FOR INSERT
  WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "Users can view their own flags"
  ON review_flags FOR SELECT
  USING (auth.uid() = flagged_by);

CREATE POLICY "Admins can manage flags"
  ON review_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for review_helpful_votes
CREATE POLICY "Users can vote helpful"
  ON review_helpful_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes"
  ON review_helpful_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for review_analytics
CREATE POLICY "Public can view analytics"
  ON review_analytics FOR SELECT
  USING (true);

CREATE POLICY "System can update analytics"
  ON review_analytics FOR ALL
  USING (true);

-- Policies for google_reviews_sync
CREATE POLICY "Partners can view their hospital sync status"
  ON google_reviews_sync FOR SELECT
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can manage their hospital sync"
  ON google_reviews_sync FOR ALL
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all sync"
  ON google_reviews_sync FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- INITIAL DATA / SEED
-- ============================================================================

-- Initialize analytics for existing hospitals
INSERT INTO review_analytics (hospital_id)
SELECT id FROM hospitals
ON CONFLICT (hospital_id) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions
GRANT SELECT ON hospital_reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON hospital_reviews TO authenticated;
GRANT SELECT ON review_replies TO anon, authenticated;
GRANT INSERT, UPDATE ON review_replies TO authenticated;
GRANT SELECT, INSERT ON review_flags TO authenticated;
GRANT SELECT, INSERT, DELETE ON review_helpful_votes TO authenticated;
GRANT SELECT ON review_analytics TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON google_reviews_sync TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Add helpful comment
COMMENT ON SCHEMA public IS 'Reviews System - Complete review management with Google Reviews integration support';

