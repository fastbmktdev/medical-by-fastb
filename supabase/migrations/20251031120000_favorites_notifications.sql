-- Favorites and Notifications Migration
-- Migration: 20251031120000_favorites_notifications.sql
-- Creates tables for user favorites and in-app notifications
-- ---
-- PART 1: FAVORITES TABLE
-- ---
-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('gym', 'product', 'event')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Prevent duplicate favorites
  CONSTRAINT unique_user_favorite UNIQUE (user_id, item_type, item_id)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_item ON user_favorites(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created ON user_favorites(created_at DESC);
-- ---
-- PART 2: NOTIFICATIONS TABLE
-- ---
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'booking_confirmation',
    'booking_reminder',
    'booking_cancelled',
    'payment_received',
    'payment_failed',
    'badge_earned',
    'level_up',
    'points_awarded',
    'promotion',
    'system',
    'partner_message'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT, -- Optional link to relevant page
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional data (e.g., booking_id, badge_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
-- ---
-- PART 3: ROW LEVEL SECURITY (RLS)
-- ---
-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Favorites Policies
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- System/user actions can create notifications
-- ---
-- PART 4: TRIGGERS
-- ---
-- Add updated_at trigger for favorites
CREATE TRIGGER update_user_favorites_updated_at
  BEFORE UPDATE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update read_at when notification is marked as read
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = TIMEZONE('utc', NOW());
  END IF;
  IF NEW.is_read = FALSE THEN
    NEW.read_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_read_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();
-- ---
-- PART 5: HELPER FUNCTIONS
-- ---
-- Function to get user favorites with gym details
CREATE OR REPLACE FUNCTION get_user_favorites_with_details(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
  favorite_id UUID,
  item_type TEXT,
  item_id UUID,
  gym_name TEXT,
  gym_name_english TEXT,
  gym_location TEXT,
  gym_image TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uf.id,
    uf.item_type,
    uf.item_id,
    g.gym_name,
    g.gym_name_english,
    g.location,
    COALESCE((g.images[1]), NULL),
    uf.created_at
  FROM user_favorites uf
  LEFT JOIN gyms g ON uf.item_type = 'gym' AND uf.item_id = g.id AND g.status = 'approved'
  WHERE uf.user_id = user_id_param
  ORDER BY uf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_user_favorites_with_details(UUID) TO authenticated;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id_param UUID DEFAULT auth.uid())
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = user_id_param AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
-- ---
-- PART 6: PERMISSIONS
-- ---
GRANT SELECT, INSERT, DELETE ON user_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
-- ---
-- PART 7: COMMENTS
-- ---
COMMENT ON TABLE user_favorites IS 'Stores user favorites (gyms, products, events)';
COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON COLUMN notifications.metadata IS 'JSON metadata for additional notification data';
COMMENT ON COLUMN user_favorites.item_type IS 'Type of favorited item: gym, product, or event';
COMMENT ON FUNCTION get_user_favorites_with_details IS 'Get user favorites with gym details';
COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user';
