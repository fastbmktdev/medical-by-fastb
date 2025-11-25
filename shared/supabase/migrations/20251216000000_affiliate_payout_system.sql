-- Affiliate Payout System and Commission Rate Configuration
-- Migration: 20251216000000_affiliate_payout_system.sql
-- Creates: affiliate_commission_rates and affiliate_payouts tables
-- ---
-- PART 1: AFFILIATE COMMISSION RATES TABLE
-- ---
-- Create affiliate_commission_rates table for configurable commission rates
CREATE TABLE IF NOT EXISTS affiliate_commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_type TEXT NOT NULL UNIQUE CHECK (conversion_type IN (
    'signup',
    'appointment',
    'product_purchase',
    'subscription',
    'referral'
  )),
  commission_rate DECIMAL(5, 2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for affiliate_commission_rates
CREATE INDEX IF NOT EXISTS idx_affiliate_commission_rates_type ON affiliate_commission_rates(conversion_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_commission_rates_active ON affiliate_commission_rates(is_active);

-- Insert default commission rates (matching current constants)
INSERT INTO affiliate_commission_rates (conversion_type, commission_rate, description) VALUES
  ('signup', 0, 'No commission for signup'),
  ('appointment', 10, '10% commission on appointments'),
  ('product_purchase', 5, '5% commission on product purchases'),
  ('subscription', 15, '15% commission on subscriptions'),
  ('referral', 0, 'Legacy referral (no commission, just points)')
ON CONFLICT (conversion_type) DO NOTHING;

-- ---
-- PART 2: AFFILIATE PAYOUTS TABLE
-- ---
-- Reuse existing payout_status and payout_method enums from partner_payouts
-- Create affiliate_payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payout details
  payout_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'thb',
  status payout_status NOT NULL DEFAULT 'pending',
  payout_method payout_method,
  
  -- Commission calculation
  total_commission DECIMAL(10, 2) NOT NULL CHECK (total_commission >= 0),
  platform_fee DECIMAL(10, 2) DEFAULT 0 CHECK (platform_fee >= 0),
  net_amount DECIMAL(10, 2) NOT NULL CHECK (net_amount >= 0),
  
  -- Payment information
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  promptpay_number TEXT,
  payment_reference TEXT,
  transaction_id TEXT,
  
  -- Period covered
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Related conversions (JSONB array of conversion IDs)
  related_conversion_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Additional information
  notes TEXT,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end_date >= period_start_date),
  CONSTRAINT valid_net_amount CHECK (net_amount <= total_commission)
);

-- Indexes for affiliate_payouts
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_payout_number ON affiliate_payouts(payout_number);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_period ON affiliate_payouts(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_created ON affiliate_payouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_requested ON affiliate_payouts(requested_at DESC);

-- ---
-- PART 3: ROW LEVEL SECURITY (RLS)
-- ---
-- Enable RLS on affiliate_commission_rates
ALTER TABLE affiliate_commission_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active commission rates
CREATE POLICY "Anyone can read active commission rates"
  ON affiliate_commission_rates FOR SELECT
  USING (is_active = true);

-- Policy: Only admins can manage commission rates
CREATE POLICY "Admins can manage commission rates"
  ON affiliate_commission_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Enable RLS on affiliate_payouts
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payouts
CREATE POLICY "Users can view their own payouts"
  ON affiliate_payouts FOR SELECT
  USING (affiliate_user_id = auth.uid());

-- Policy: Users can create their own payout requests
CREATE POLICY "Users can create their own payout requests"
  ON affiliate_payouts FOR INSERT
  WITH CHECK (affiliate_user_id = auth.uid());

-- Policy: Users can update their own pending payouts (e.g., cancel)
CREATE POLICY "Users can update their own pending payouts"
  ON affiliate_payouts FOR UPDATE
  USING (affiliate_user_id = auth.uid() AND status = 'pending');

-- Policy: Admins can manage all payouts
CREATE POLICY "Admins can manage all payouts"
  ON affiliate_payouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ---
-- PART 4: GRANTS
-- ---
GRANT SELECT ON affiliate_commission_rates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON affiliate_payouts TO authenticated;

-- ---
-- PART 5: TRIGGERS
-- ---
-- Update updated_at timestamp for affiliate_commission_rates
CREATE TRIGGER update_affiliate_commission_rates_updated_at
  BEFORE UPDATE ON affiliate_commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for affiliate_payouts
CREATE TRIGGER update_affiliate_payouts_updated_at
  BEFORE UPDATE ON affiliate_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate payout number
CREATE OR REPLACE FUNCTION generate_affiliate_payout_number()
RETURNS TEXT AS $$
DECLARE
  new_payout_number TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_payout_number := 'AFF-PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    -- Check if this payout number already exists
    IF NOT EXISTS (SELECT 1 FROM affiliate_payouts WHERE payout_number = new_payout_number) THEN
      RETURN new_payout_number;
    END IF;
    
    counter := counter + 1;
    
    -- Safety check to prevent infinite loop
    IF counter > 9999 THEN
      RAISE EXCEPTION 'Unable to generate unique payout number';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ---
-- PART 6: HELPER FUNCTIONS
-- ---
-- Function to get active commission rate for a conversion type
CREATE OR REPLACE FUNCTION get_affiliate_commission_rate(p_conversion_type TEXT)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  rate DECIMAL(5, 2);
BEGIN
  SELECT commission_rate INTO rate
  FROM affiliate_commission_rates
  WHERE conversion_type = p_conversion_type
    AND is_active = true
  LIMIT 1;
  
  RETURN COALESCE(rate, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate total pending commission for an affiliate
CREATE OR REPLACE FUNCTION get_affiliate_pending_commission(p_affiliate_user_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(commission_amount), 0) INTO total
  FROM affiliate_conversions
  WHERE affiliate_user_id = p_affiliate_user_id
    AND status = 'confirmed'
    AND id NOT IN (
      SELECT UNNEST(related_conversion_ids)
      FROM affiliate_payouts
      WHERE affiliate_user_id = p_affiliate_user_id
        AND status IN ('pending', 'processing', 'completed')
    );
  
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ---
-- PART 7: COMMENTS
-- ---
COMMENT ON TABLE affiliate_commission_rates IS 'Configurable commission rates for different affiliate conversion types';
COMMENT ON TABLE affiliate_payouts IS 'Tracks affiliate commission payouts';
COMMENT ON COLUMN affiliate_commission_rates.commission_rate IS 'Commission percentage (0-100)';
COMMENT ON COLUMN affiliate_payouts.total_commission IS 'Total commission amount from related conversions';
COMMENT ON COLUMN affiliate_payouts.net_amount IS 'Net amount after platform fees';
COMMENT ON COLUMN affiliate_payouts.related_conversion_ids IS 'Array of affiliate_conversions.id that are included in this payout';
COMMENT ON FUNCTION get_affiliate_commission_rate IS 'Get active commission rate for a conversion type';
COMMENT ON FUNCTION get_affiliate_pending_commission IS 'Calculate total pending commission for an affiliate user';
COMMENT ON FUNCTION generate_affiliate_payout_number IS 'Generate unique payout number for affiliate payouts';

