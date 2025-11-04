-- ============================================================================
-- NEWSLETTER AND PROMOTIONAL EMAIL SYSTEM MIGRATION
-- Migration: 20251209000000_newsletter_system.sql
-- ============================================================================

-- Add new email types to existing enum
ALTER TYPE email_type ADD VALUE IF NOT EXISTS 'newsletter';
ALTER TYPE email_type ADD VALUE IF NOT EXISTS 'promotional';

-- ============================================================================
-- NEWSLETTER SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token TEXT UNIQUE, -- For unsubscribe links
  preferences JSONB DEFAULT '{
    "weekly_digest": true,
    "promotions": true,
    "events": true,
    "articles": true,
    "tips": true
  }'::jsonb,
  source TEXT, -- 'signup', 'manual', 'import', etc.
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT unique_email_subscription UNIQUE (email),
  CONSTRAINT valid_unsubscribe_token CHECK (unsubscribe_token IS NOT NULL OR is_active = FALSE)
);

-- Indexes for newsletter_subscriptions
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_user_id ON newsletter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_active ON newsletter_subscriptions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_unsubscribe_token ON newsletter_subscriptions(unsubscribe_token) WHERE unsubscribe_token IS NOT NULL;

-- ============================================================================
-- NEWSLETTER CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  preferences_filter JSONB, -- Filter recipients by preferences
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for newsletter_campaigns
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled_at ON newsletter_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_by ON newsletter_campaigns(created_by);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_newsletter_subscriptions_updated_at
  BEFORE UPDATE ON newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();

CREATE TRIGGER update_newsletter_campaigns_updated_at
  BEFORE UPDATE ON newsletter_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();

-- Function to generate unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Newsletter Subscriptions Policies
CREATE POLICY "Users can view own subscription"
  ON newsletter_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own subscription"
  ON newsletter_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'))
  WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Newsletter Campaigns Policies (Admin only)
CREATE POLICY "Admins can manage campaigns"
  ON newsletter_campaigns FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE newsletter_subscriptions IS 'Newsletter email subscriptions';
COMMENT ON TABLE newsletter_campaigns IS 'Newsletter campaign management';
COMMENT ON COLUMN newsletter_subscriptions.unsubscribe_token IS 'Unique token for unsubscribe links';
COMMENT ON COLUMN newsletter_subscriptions.preferences IS 'User preferences for newsletter content types';
