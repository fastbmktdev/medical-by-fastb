-- Promotions table for marquee and banner displays
-- Migration: 20250122000000_promotions.sql

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Promotion details
  title TEXT NOT NULL,
  title_english TEXT,
  description TEXT,
  
  -- Display settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority shows first
  show_in_marquee BOOLEAN DEFAULT true,
  
  -- Dates
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Optional link
  link_url TEXT,
  link_text TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promotions_marquee ON promotions(show_in_marquee, priority DESC) WHERE is_active = true;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();

-- RLS Policies
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active promotions
CREATE POLICY "Anyone can view active promotions"
  ON promotions
  FOR SELECT
  USING (is_active = true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Only admins can manage promotions"
  ON promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert sample promotions
INSERT INTO promotions (title, title_english, is_active, show_in_marquee, priority, start_date, end_date) VALUES
  ('🎉 โปรโมชันพิเศษ! ลดราคา 20% สำหรับแพ็คเกจ 3 เดือน', '🎉 Special Promotion! 20% off on 3-month packages', true, true, 10, NOW(), NOW() + INTERVAL '30 days'),
  ('🥊 เปิดใหม่! ค่ายมวยยิมใหม่เข้าร่วมกับเราแล้ว', '🥊 New! Latest gyms just joined us', true, true, 5, NOW(), NOW() + INTERVAL '15 days'),
  ('⚡ สมัครวันนี้ รับส่วนลดเพิ่ม 10%', '⚡ Sign up today and get extra 10% discount', true, true, 3, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;
