-- ---
-- SHIPPING SYSTEM MIGRATION
-- ---
-- This migration adds shipping methods, shipping status tracking, and
-- enhanced shipping management for product orders
-- Create shipping methods table
CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_thai TEXT NOT NULL,
  name_english TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_per_kg DECIMAL(10, 2) DEFAULT 0,
  estimated_days_min INTEGER DEFAULT 1,
  estimated_days_max INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create shipping status enum
CREATE TYPE shipping_status AS ENUM (
  'pending',
  'preparing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed',
  'returned'
);

-- Add shipping columns to product_orders table
ALTER TABLE product_orders
  ADD COLUMN IF NOT EXISTS shipping_method_id UUID REFERENCES shipping_methods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_status shipping_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS carrier_name TEXT,
  ADD COLUMN IF NOT EXISTS carrier_phone TEXT,
  ADD COLUMN IF NOT EXISTS carrier_website TEXT;

-- Create shipping history table for tracking updates
CREATE TABLE IF NOT EXISTS shipping_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_order_id UUID NOT NULL REFERENCES product_orders(order_id) ON DELETE CASCADE,
  status shipping_status NOT NULL,
  location TEXT,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_orders_shipping_status ON product_orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_product_orders_tracking_number ON product_orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipping_history_order ON shipping_history(product_order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_active ON shipping_methods(is_active) WHERE is_active = TRUE;

-- Insert default shipping methods
INSERT INTO shipping_methods (name_thai, name_english, description, base_price, price_per_kg, estimated_days_min, estimated_days_max, display_order) VALUES
  ('ไปรษณีย์ไทย (EMS)', 'Thailand Post (EMS)', 'บริการส่งด่วนไปรษณีย์ 1-3 วัน', 50.00, 10.00, 1, 3, 1),
  ('ไปรษณีย์ไทย (พัสดุ)', 'Thailand Post (Parcel)', 'บริการส่งพัสดุธรรมดา 3-7 วัน', 30.00, 5.00, 3, 7, 2),
  ('Kerry Express', 'Kerry Express', 'บริการส่งด่วน Kerry Express 1-3 วัน', 60.00, 12.00, 1, 3, 3),
  ('J&T Express', 'J&T Express', 'บริการส่งด่วน J&T Express 1-3 วัน', 55.00, 10.00, 1, 3, 4),
  ('Flash Express', 'Flash Express', 'บริการส่งด่วน Flash Express 1-2 วัน', 65.00, 15.00, 1, 2, 5),
  ('รับสินค้าเอง (Pickup)', 'Self Pickup', 'รับสินค้าด้วยตนเอง', 0.00, 0.00, 0, 0, 6)
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_shipping_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shipping_methods_updated_at
  BEFORE UPDATE ON shipping_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_methods_updated_at();

-- Enable RLS
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipping_methods (public read, admin write)
CREATE POLICY "Anyone can view active shipping methods"
  ON shipping_methods FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all shipping methods"
  ON shipping_methods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage shipping methods"
  ON shipping_methods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for shipping_history
CREATE POLICY "Users can view their own shipping history"
  ON shipping_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_orders
      WHERE product_orders.order_id = shipping_history.product_order_id
      AND product_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all shipping history"
  ON shipping_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert shipping history"
  ON shipping_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE shipping_methods IS 'Shipping methods available for product orders';
COMMENT ON TABLE shipping_history IS 'History of shipping status updates for tracking';
COMMENT ON COLUMN product_orders.shipping_status IS 'Current shipping status of the order';
COMMENT ON COLUMN product_orders.tracking_number IS 'Tracking number for the shipment';
