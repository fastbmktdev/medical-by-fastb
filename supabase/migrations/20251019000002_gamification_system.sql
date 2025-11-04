-- ---
-- Gamification System Migration
-- ---
-- This migration creates a comprehensive gamification system for the Muay Thai platform
-- Features: Points, Badges, Levels, Achievements, Leaderboards, Streaks, Challenges
-- ---
-- USER POINTS AND LEVELS
-- ---
-- Create user_points table to track total points and level
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  points_to_next_level INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(user_id)
);

-- Create points_history table to track all point transactions
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT,
  reference_id UUID, -- Can reference bookings, articles, etc.
  reference_type TEXT, -- 'booking', 'article', 'review', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
-- ---
-- BADGES AND ACHIEVEMENTS
-- ---
-- Create badges table (achievement definitions)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_english TEXT,
  description TEXT NOT NULL,
  description_english TEXT,
  icon_url TEXT,
  points_required INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL, -- 'booking', 'loyalty', 'social', 'learning', 'special'
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_badges table (user's earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(user_id, badge_id)
);
-- ---
-- STREAKS SYSTEM
-- ---
-- Create user_streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL, -- 'booking', 'login', 'review', 'article_read'
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(user_id, streak_type)
);
-- ---
-- CHALLENGES SYSTEM
-- ---
-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_english TEXT,
  description TEXT NOT NULL,
  description_english TEXT,
  challenge_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'special'
  points_reward INTEGER NOT NULL DEFAULT 0,
  badge_reward_id UUID REFERENCES badges(id),
  requirements JSONB NOT NULL, -- Flexible requirements structure
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_challenges table (user participation in challenges)
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(user_id, challenge_id)
);
-- ---
-- LEADERBOARDS
-- ---
-- Create leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_english TEXT,
  description TEXT,
  leaderboard_type TEXT NOT NULL, -- 'points', 'bookings', 'streak', 'monthly', 'all_time'
  period TEXT NOT NULL DEFAULT 'all_time', -- 'daily', 'weekly', 'monthly', 'yearly', 'all_time'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create leaderboard_entries table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(leaderboard_id, user_id, period_start)
);
-- ---
-- GAMIFICATION RULES AND CONFIGURATION
-- ---
-- Create gamification_rules table
CREATE TABLE IF NOT EXISTS gamification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  action_type TEXT NOT NULL, -- 'booking', 'review', 'login', 'article_read', etc.
  points_awarded INTEGER NOT NULL DEFAULT 0,
  conditions JSONB, -- Flexible conditions for rule application
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
-- ---
-- INDEXES FOR PERFORMANCE
-- ---
-- User points indexes
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(current_level);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at);
CREATE INDEX IF NOT EXISTS idx_points_history_action_type ON points_history(action_type);

-- Badges indexes
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Streaks indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);

-- Leaderboards indexes
CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard_id ON leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);

-- Gamification rules indexes
CREATE INDEX IF NOT EXISTS idx_gamification_rules_action_type ON gamification_rules(action_type);
CREATE INDEX IF NOT EXISTS idx_gamification_rules_active ON gamification_rules(is_active);
-- ---
-- ROW LEVEL SECURITY POLICIES
-- ---
-- User points policies
CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON user_points
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Points history policies
CREATE POLICY "Users can view own points history" ON points_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- User badges policies
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Public badges view
CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT TO public
  USING (is_active = true);

-- User streaks policies
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON user_streaks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Anyone can view active challenges" ON challenges
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Users can view own challenge participation" ON user_challenges
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge participation" ON user_challenges
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Leaderboards policies
CREATE POLICY "Anyone can view leaderboards" ON leaderboards
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Anyone can view leaderboard entries" ON leaderboard_entries
  FOR SELECT TO public
  USING (true);
-- ---
-- GRANT PERMISSIONS
-- ---
-- Grant permissions for user_points
GRANT SELECT, INSERT, UPDATE ON user_points TO authenticated;
GRANT SELECT ON user_points TO anon, public;

-- Grant permissions for points_history
GRANT SELECT, INSERT ON points_history TO authenticated;
GRANT SELECT ON points_history TO anon, public;

-- Grant permissions for badges
GRANT SELECT ON badges TO authenticated, anon, public;

-- Grant permissions for user_badges
GRANT SELECT, INSERT ON user_badges TO authenticated;
GRANT SELECT ON user_badges TO anon, public;

-- Grant permissions for user_streaks
GRANT SELECT, INSERT, UPDATE ON user_streaks TO authenticated;
GRANT SELECT ON user_streaks TO anon, public;

-- Grant permissions for challenges
GRANT SELECT ON challenges TO authenticated, anon, public;

-- Grant permissions for user_challenges
GRANT SELECT, INSERT, UPDATE ON user_challenges TO authenticated;
GRANT SELECT ON user_challenges TO anon, public;

-- Grant permissions for leaderboards
GRANT SELECT ON leaderboards TO authenticated, anon, public;

-- Grant permissions for leaderboard_entries
GRANT SELECT ON leaderboard_entries TO authenticated, anon, public;

-- Grant permissions for gamification_rules
GRANT SELECT ON gamification_rules TO authenticated, anon, public;
-- ---
-- HELPER FUNCTIONS
-- ---
-- Function to calculate user level based on points
CREATE OR REPLACE FUNCTION calculate_user_level(total_points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Level calculation: Level 1 = 0-99 pts, Level 2 = 100-299 pts, Level 3 = 300-599 pts, etc.
  -- Formula: level = floor(sqrt(points / 100)) + 1
  RETURN FLOOR(SQRT(total_points / 100.0)) + 1;
END;
$$;

-- Function to calculate points needed for next level
CREATE OR REPLACE FUNCTION calculate_points_to_next_level(current_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Points needed for next level: (level^2 * 100) - current_points
  RETURN (current_level * current_level * 100);
END;
$$;

-- Function to award points to user
CREATE OR REPLACE FUNCTION award_points(
  target_user_id UUID,
  points_to_award INTEGER,
  action_type TEXT,
  action_description TEXT DEFAULT NULL,
  reference_id UUID DEFAULT NULL,
  reference_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_points INTEGER;
  new_total_points INTEGER;
  new_level INTEGER;
  points_to_next_level INTEGER;
BEGIN
  -- Insert points history record
  INSERT INTO points_history (
    user_id, points, action_type, action_description, reference_id, reference_type
  ) VALUES (
    target_user_id, points_to_award, action_type, action_description, reference_id, reference_type
  );

  -- Get current points or initialize
  SELECT COALESCE(total_points, 0) INTO current_points
  FROM user_points
  WHERE user_id = target_user_id;

  -- If user doesn't exist in user_points, create record
  IF current_points IS NULL THEN
    INSERT INTO user_points (user_id, total_points, current_level, points_to_next_level)
    VALUES (target_user_id, 0, 1, 100);
    current_points := 0;
  END IF;

  -- Calculate new total points
  new_total_points := current_points + points_to_award;
  
  -- Calculate new level
  new_level := calculate_user_level(new_total_points);
  points_to_next_level := calculate_points_to_next_level(new_level) - new_total_points;

  -- Update user points
  UPDATE user_points
  SET 
    total_points = new_total_points,
    current_level = new_level,
    points_to_next_level = points_to_next_level,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(target_user_id UUID)
RETURNS TABLE(badge_id UUID, badge_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_total_points INTEGER;
  badge_record RECORD;
BEGIN
  -- Get user's total points
  SELECT total_points INTO user_total_points
  FROM user_points
  WHERE user_id = target_user_id;

  IF user_total_points IS NULL THEN
    RETURN;
  END IF;

  -- Check for badges that user hasn't earned yet
  FOR badge_record IN
    SELECT b.id, b.name, b.points_required
    FROM badges b
    WHERE b.is_active = true
    AND b.points_required <= user_total_points
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = target_user_id
      AND ub.badge_id = b.id
    )
  LOOP
    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (target_user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;

    -- Return badge info
    badge_id := badge_record.id;
    badge_name := badge_record.name;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
  target_user_id UUID,
  streak_type TEXT,
  activity_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_streak RECORD;
  days_diff INTEGER;
BEGIN
  -- Get existing streak
  SELECT * INTO existing_streak
  FROM user_streaks
  WHERE user_id = target_user_id AND streak_type = update_user_streak.streak_type;

  IF existing_streak IS NULL THEN
    -- Create new streak
    INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
    VALUES (target_user_id, streak_type, 1, 1, activity_date);
  ELSE
    -- Calculate days difference
    days_diff := activity_date - existing_streak.last_activity_date;

    IF days_diff = 1 THEN
      -- Continue streak
      UPDATE user_streaks
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = activity_date,
        updated_at = NOW()
      WHERE user_id = target_user_id AND streak_type = update_user_streak.streak_type;
    ELSIF days_diff = 0 THEN
      -- Same day, no change needed
      RETURN TRUE;
    ELSE
      -- Streak broken, reset
      UPDATE user_streaks
      SET 
        current_streak = 1,
        last_activity_date = activity_date,
        updated_at = NOW()
      WHERE user_id = target_user_id AND streak_type = update_user_streak.streak_type;
    END IF;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
-- ---
-- TRIGGERS
-- ---
-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboards_updated_at
  BEFORE UPDATE ON leaderboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_entries_updated_at
  BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_rules_updated_at
  BEFORE UPDATE ON gamification_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ---
-- SEED DATA
-- ---
-- Insert default badges
INSERT INTO badges (name, name_english, description, description_english, points_required, category, rarity) VALUES
-- Booking badges
('นักชกหน้าใหม่', 'Rookie Fighter', 'จองค่ายมวยครั้งแรก', 'First gym booking', 0, 'booking', 'common'),
('นักชกประจำ', 'Regular Fighter', 'จองค่ายมวย 5 ครั้ง', 'Booked gym 5 times', 250, 'booking', 'common'),
('นักชกมืออาชีพ', 'Professional Fighter', 'จองค่ายมวย 20 ครั้ง', 'Booked gym 20 times', 1000, 'booking', 'rare'),
('นักชกแชมป์', 'Champion Fighter', 'จองค่ายมวย 50 ครั้ง', 'Booked gym 50 times', 2500, 'booking', 'epic'),

-- Loyalty badges
('ลูกค้าประจำ', 'Loyal Customer', 'ใช้บริการต่อเนื่อง 3 เดือน', 'Consecutive 3 months of service', 300, 'loyalty', 'common'),
('ลูกค้าตลอดกาล', 'Lifetime Customer', 'ใช้บริการต่อเนื่อง 12 เดือน', 'Consecutive 12 months of service', 1200, 'loyalty', 'epic'),

-- Social badges
('นักรีวิว', 'Reviewer', 'เขียนรีวิว 5 ครั้ง', 'Written 5 reviews', 125, 'social', 'common'),
('นักแชร์', 'Social Sharer', 'แชร์ค่ายมวย 10 ครั้ง', 'Shared gym 10 times', 100, 'social', 'common'),

-- Learning badges
('นักเรียนรู้', 'Knowledge Seeker', 'อ่านบทความ 10 บทความ', 'Read 10 articles', 100, 'learning', 'common'),
('ผู้เชี่ยวชาญ', 'Expert', 'อ่านบทความ 50 บทความ', 'Read 50 articles', 500, 'learning', 'rare'),

-- Special badges
('ผู้บุกเบิก', 'Pioneer', 'สมาชิกคนแรกของแพลตฟอร์ม', 'First platform member', 500, 'special', 'legendary'),
('นักชกแห่งปี', 'Fighter of the Year', 'ได้คะแนนสูงสุดในปี', 'Highest points in the year', 2000, 'special', 'legendary');

-- Insert default gamification rules
INSERT INTO gamification_rules (rule_name, action_type, points_awarded, conditions) VALUES
-- Booking rules
('first_booking', 'booking', 100, '{"is_first_booking": true}'),
('regular_booking', 'booking', 50, '{"package_type": "one_time"}'),
('package_booking', 'booking', 75, '{"package_type": "package"}'),
('long_term_package', 'booking', 150, '{"duration_months": {"gte": 6}}'),

-- Engagement rules
('profile_completion', 'profile_update', 50, '{"fields_completed": {"gte": 5}}'),
('review_submission', 'review', 25, '{}'),
('social_share', 'social_share', 10, '{}'),

-- Learning rules
('article_read', 'article_read', 10, '{}'),
('video_watched', 'video_watched', 15, '{}'),

-- Loyalty rules
('consecutive_month', 'loyalty', 100, '{"consecutive_months": {"gte": 1}}'),
('referral', 'referral', 200, '{}'),

-- Streak rules
('booking_streak_7', 'booking_streak', 50, '{"streak_days": 7}'),
('login_streak_30', 'login_streak', 100, '{"streak_days": 30}');

-- Insert default leaderboards
INSERT INTO leaderboards (name, name_english, description, leaderboard_type, period) VALUES
('คะแนนรวม', 'Total Points', 'ผู้เล่นที่มีคะแนนรวมสูงสุด', 'points', 'all_time'),
('คะแนนรายเดือน', 'Monthly Points', 'ผู้เล่นที่มีคะแนนสูงสุดในเดือนนี้', 'points', 'monthly'),
('การจองมากที่สุด', 'Most Bookings', 'ผู้เล่นที่จองค่ายมวยมากที่สุด', 'bookings', 'all_time'),
('สตรีคการจอง', 'Booking Streak', 'ผู้เล่นที่มีสตรีคการจองยาวนานที่สุด', 'streak', 'all_time');
-- ---
-- COMMENTS AND DOCUMENTATION
-- ---
COMMENT ON TABLE user_points IS 'User points and level tracking for gamification system';
COMMENT ON TABLE points_history IS 'History of all point transactions for users';
COMMENT ON TABLE badges IS 'Achievement badges that users can earn';
COMMENT ON TABLE user_badges IS 'Badges earned by users';
COMMENT ON TABLE user_streaks IS 'User activity streaks for various actions';
COMMENT ON TABLE challenges IS 'Special challenges and events';
COMMENT ON TABLE user_challenges IS 'User participation in challenges';
COMMENT ON TABLE leaderboards IS 'Leaderboard definitions';
COMMENT ON TABLE leaderboard_entries IS 'Leaderboard rankings and scores';
COMMENT ON TABLE gamification_rules IS 'Rules for awarding points based on user actions';
-- ---
-- Migration Complete!
-- ---
-- This migration provides:
-- 1. Complete gamification system with points, badges, levels
-- 2. Streak tracking for user engagement
-- 3. Challenge system for special events
-- 4. Leaderboards for competition
-- 5. Flexible rule system for point awarding
-- 6. Helper functions for gamification logic
-- 7. Proper RLS policies for security
-- 8. Seed data for immediate use
-- ---
