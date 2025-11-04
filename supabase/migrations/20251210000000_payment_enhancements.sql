-- Payment Enhancements Migration
-- Migration: 20251210000000_payment_enhancements.sql
-- Adds support for: Saved Payment Methods, Payment Disputes, Retry Failed Payments
-- ---
-- PART 1: SAVED PAYMENT METHODS TABLE
-- ---
-- Create enum for payment method type
CREATE TYPE payment_method_type AS ENUM (
  'card',
  'bank_account',
  'other'
);

-- Create enum for payment method status
CREATE TYPE payment_method_status AS ENUM (
  'active',
  'inactive',
  'expired',
  'deleted'
);

-- Create saved_payment_methods table
CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe information
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  
  -- Payment method details
  type payment_method_type NOT NULL DEFAULT 'card',
  status payment_method_status NOT NULL DEFAULT 'active',
  
  -- Card details (for display purposes)
  last4 TEXT,
  brand TEXT, -- visa, mastercard, etc.
  exp_month INTEGER,
  exp_year INTEGER,
  
  -- Billing details (optional)
  billing_name TEXT,
  billing_email TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for saved_payment_methods
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_status ON saved_payment_methods(user_id, status);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_stripe_pm_id ON saved_payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_stripe_customer_id ON saved_payment_methods(stripe_customer_id);
-- ---
-- PART 2: PAYMENT DISPUTES TABLE
-- ---
-- Create enum for dispute status
CREATE TYPE dispute_status AS ENUM (
  'warning_needs_response',
  'warning_under_review',
  'warning_closed',
  'needs_response',
  'under_review',
  'charge_refunded',
  'won',
  'lost'
);

-- Create enum for dispute reason
CREATE TYPE dispute_reason AS ENUM (
  'bank_cannot_process',
  'check_returned',
  'credit_not_processed',
  'customer_initiated',
  'debit_not_authorized',
  'duplicate',
  'fraudulent',
  'general',
  'incorrect_account_details',
  'insufficient_funds',
  'product_not_received',
  'product_unacceptable',
  'subscription_canceled',
  'unrecognized'
);

-- Create payment_disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe information
  stripe_dispute_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  
  -- Dispute details
  status dispute_status NOT NULL,
  reason dispute_reason,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'thb',
  
  -- Dispute information
  evidence_due_by TIMESTAMPTZ,
  evidence_submitted_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  
  -- Admin response
  admin_notes TEXT,
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes for payment_disputes
CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment_id ON payment_disputes(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_user_id ON payment_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_stripe_dispute_id ON payment_disputes(stripe_dispute_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON payment_disputes(created_at DESC);
-- ---
-- PART 3: UPDATE PAYMENTS TABLE
-- ---
-- Add columns to payments table for retry functionality
ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS is_saved_payment_method BOOLEAN DEFAULT FALSE;

-- Create index for retry functionality
CREATE INDEX IF NOT EXISTS idx_payments_retry ON payments(user_id, status, retry_count) 
  WHERE status = 'failed' AND retry_count < 3;
-- ---
-- PART 4: RLS POLICIES
-- ---
-- Enable RLS on saved_payment_methods
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved payment methods
CREATE POLICY "Users can view their own saved payment methods"
  ON saved_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved payment methods
CREATE POLICY "Users can insert their own saved payment methods"
  ON saved_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved payment methods
CREATE POLICY "Users can update their own saved payment methods"
  ON saved_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own saved payment methods
CREATE POLICY "Users can delete their own saved payment methods"
  ON saved_payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on payment_disputes
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

-- Users can view their own disputes
CREATE POLICY "Users can view their own disputes"
  ON payment_disputes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all disputes
CREATE POLICY "Admins can view all disputes"
  ON payment_disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update disputes
CREATE POLICY "Admins can update disputes"
  ON payment_disputes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
-- ---
-- PART 5: FUNCTIONS
-- ---
-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE saved_payment_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND status = 'active'
      AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single default payment method
CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_saved_payment_methods_updated_at
  BEFORE UPDATE ON saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_disputes_updated_at
  BEFORE UPDATE ON payment_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
