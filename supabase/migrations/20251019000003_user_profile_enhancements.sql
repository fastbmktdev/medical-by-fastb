-- ---
-- User Profile Enhancements Migration
-- ---
-- This migration adds comprehensive user profile features:
-- - Social Media Links
-- - Fitness Goals Tracking
-- - Privacy Settings
-- - Notification Preferences
-- - Connected Accounts (OAuth)
-- - Account Deletion Support
-- ---
-- 1. ENHANCE PROFILES TABLE
-- ---
-- Bio field already exists, no need to add
-- But ensure it has proper constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bio_length' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles 
      ADD CONSTRAINT bio_length 
      CHECK (bio IS NULL OR char_length(bio) <= 500);
  END IF;
END $$;
-- ---
-- 2. SOCIAL MEDIA LINKS TABLE
-- ---
CREATE TABLE IF NOT EXISTS user_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_platform CHECK (platform IN ('facebook', 'instagram', 'twitter', 'youtube', 'tiktok')),
  CONSTRAINT valid_url CHECK (url ~ '^https?://'),
  CONSTRAINT unique_user_platform UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_user_social_links_user_id ON user_social_links(user_id);
-- ---
-- 3. FITNESS GOALS TABLE
-- ---
CREATE TABLE IF NOT EXISTS user_fitness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  target_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_goal_type CHECK (goal_type IN ('training_frequency', 'weight', 'skill', 'custom'))
);

CREATE INDEX IF NOT EXISTS idx_user_fitness_goals_user_id ON user_fitness_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fitness_goals_completed ON user_fitness_goals(is_completed);
-- ---
-- 4. PRIVACY SETTINGS TABLE
-- ---
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility TEXT DEFAULT 'public',
  show_email BOOLEAN DEFAULT FALSE,
  show_phone BOOLEAN DEFAULT FALSE,
  show_training_history BOOLEAN DEFAULT TRUE,
  show_achievements BOOLEAN DEFAULT TRUE,
  show_social_links BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_profile_visibility CHECK (profile_visibility IN ('public', 'private', 'friends_only'))
);
-- ---
-- 5. NOTIFICATION PREFERENCES TABLE
-- ---
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  booking_confirmation BOOLEAN DEFAULT TRUE,
  booking_reminder BOOLEAN DEFAULT TRUE,
  gamification_updates BOOLEAN DEFAULT TRUE,
  promotions_news BOOLEAN DEFAULT TRUE,
  partner_messages BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
-- ---
-- 6. CONNECTED ACCOUNTS TABLE
-- ---
CREATE TABLE IF NOT EXISTS user_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_provider CHECK (provider IN ('google', 'facebook', 'apple')),
  CONSTRAINT unique_provider_user UNIQUE (provider, provider_user_id),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_connected_accounts_user_id ON user_connected_accounts(user_id);
-- ---
-- 7. ACCOUNT DELETION TABLE
-- ---
CREATE TABLE IF NOT EXISTS deleted_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deletion_reason TEXT,
  grace_period_ends_at TIMESTAMP WITH TIME ZONE,
  restored_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT grace_period_ends CHECK (grace_period_ends_at > deleted_at)
);
-- ---
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ---
-- Enable RLS on all new tables
ALTER TABLE user_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fitness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Social Media Links Policies
CREATE POLICY "Users can view own social links"
  ON user_social_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view social links of public profiles"
  ON user_social_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_privacy_settings
      WHERE user_privacy_settings.user_id = user_social_links.user_id
      AND user_privacy_settings.profile_visibility = 'public'
      AND user_privacy_settings.show_social_links = TRUE
    )
  );

CREATE POLICY "Users can manage own social links"
  ON user_social_links FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fitness Goals Policies
CREATE POLICY "Users can view own fitness goals"
  ON user_fitness_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own fitness goals"
  ON user_fitness_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Privacy Settings Policies
CREATE POLICY "Users can view own privacy settings"
  ON user_privacy_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own privacy settings"
  ON user_privacy_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can view profile visibility (to check if profile is public)
CREATE POLICY "Public can check profile visibility"
  ON user_privacy_settings FOR SELECT
  TO authenticated, anon
  USING (profile_visibility = 'public');

-- Notification Preferences Policies
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences"
  ON user_notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Connected Accounts Policies
CREATE POLICY "Users can view own connected accounts"
  ON user_connected_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own connected accounts"
  ON user_connected_accounts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deleted Accounts Policies (only service role and the user themselves before deletion)
CREATE POLICY "Service role can manage deleted accounts"
  ON deleted_accounts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- ---
-- 9. TRIGGERS
-- ---
-- Update triggers for updated_at
CREATE TRIGGER update_user_social_links_updated_at
  BEFORE UPDATE ON user_social_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_fitness_goals_updated_at
  BEFORE UPDATE ON user_fitness_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_privacy_settings_updated_at
  BEFORE UPDATE ON user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create default privacy settings and notification preferences when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default privacy settings
  INSERT INTO public.user_privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default notification preferences
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_user_profile_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile_settings();
-- ---
-- 10. STORAGE BUCKET FOR AVATARS
-- ---
-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
-- ---
-- 11. GRANTS
-- ---
GRANT SELECT, INSERT, UPDATE, DELETE ON user_social_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_fitness_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_privacy_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_connected_accounts TO authenticated;

GRANT ALL ON user_social_links TO service_role;
GRANT ALL ON user_fitness_goals TO service_role;
GRANT ALL ON user_privacy_settings TO service_role;
GRANT ALL ON user_notification_preferences TO service_role;
GRANT ALL ON user_connected_accounts TO service_role;
GRANT ALL ON deleted_accounts TO service_role;
