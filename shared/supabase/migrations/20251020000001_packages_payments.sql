-- Consolidated Packages and Payments Migration
-- Migration: 20251020000001_packages_payments.sql
-- Consolidates: create_hospital_packages.sql, seed_hospital_packages.sql, create_payments_tables.sql, add_partner_booking_update_policy.sql
-- ---
-- PART 1: hospital PACKAGES AND appointments SYSTEM
-- ---
-- Create hospital_packages table
CREATE TABLE IF NOT EXISTS hospital_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  
  -- Package type: 'one_time' (รายครั้ง) หรือ 'package' (แพ็คเกจ)
  package_type TEXT NOT NULL CHECK (package_type IN ('one_time', 'package')),
  
  -- Package details
  name TEXT NOT NULL,
  name_english TEXT,
  description TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  
  -- Duration (NULL สำหรับ one_time, 1/3/6 สำหรับ package)
  duration_months INTEGER CHECK (duration_months IN (1, 3, 6)),
  
  -- Features (JSON array)
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT valid_package_duration CHECK (
    (package_type = 'one_time' AND duration_months IS NULL) OR
    (package_type = 'package' AND duration_months IS NOT NULL)
  )
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES hospital_packages(id) ON DELETE RESTRICT,
  
  -- appointment details
  booking_number TEXT UNIQUE NOT NULL,
  
  -- Contact info (snapshot at time of appointment)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- appointment dates
  start_date DATE NOT NULL,
  end_date DATE, -- NULL สำหรับ one_time
  
  -- Pricing snapshot
  price_paid DECIMAL(10,2) NOT NULL,
  package_name TEXT NOT NULL,
  package_type TEXT NOT NULL,
  duration_months INTEGER,
  
  -- Special requests
  special_requests TEXT,
  
  -- Payment
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'failed', 'refunded')
  ),
  payment_method TEXT,
  payment_id TEXT, -- Stripe payment intent ID
  
  -- appointment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
-- ---
-- PART 2: COMPREHENSIVE PAYMENTS SYSTEM
-- ---
-- Create enum for payment status
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'canceled',
  'refunded'
);

-- Create enum for payment type
CREATE TYPE payment_type AS ENUM (
  'product',
  'ticket',
  'hospital_booking'
);

-- Create enum for order status
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'completed',
  'canceled',
  'refunded'
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe information
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'thb',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_type payment_type NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Order details
  order_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'thb',
  status order_status NOT NULL DEFAULT 'pending',

  -- Order items (stored as JSONB for flexibility)
  items JSONB NOT NULL DEFAULT '[]',

  -- Customer information
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create product orders table (for shop purchases)
CREATE TABLE IF NOT EXISTS product_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product details (if you have a products table, you can reference it)
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_name_en TEXT,

  -- Order details
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,

  -- Shipping information
  shipping_address JSONB,
  tracking_number TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ticket appointments table
CREATE TABLE IF NOT EXISTS ticket_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_name_en TEXT,
  event_date TIMESTAMPTZ NOT NULL,

  -- Ticket details
  ticket_type TEXT,
  ticket_count INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,

  -- appointment information
  qr_code TEXT,
  booking_reference TEXT UNIQUE,
  seat_numbers TEXT[],

  -- Status
  is_checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create hospital appointments table
CREATE TABLE IF NOT EXISTS hospital_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,

  -- appointment details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,

  -- Package details
  package_type TEXT NOT NULL, -- e.g., 'daily', 'weekly', 'monthly'
  package_name TEXT NOT NULL,
  package_name_en TEXT,

  -- Pricing
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,

  -- appointment status
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,

  -- Check-in/out
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_out BOOLEAN DEFAULT FALSE,
  checked_out_at TIMESTAMPTZ,

  -- Additional information
  notes TEXT,
  special_requests TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ---
-- PART 3: INDEXES FOR PERFORMANCE
-- ---
-- Indexes for hospital_packages
CREATE INDEX IF NOT EXISTS idx_hospital_packages_hospital_id ON hospital_packages(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_packages_type ON hospital_packages(package_type);
CREATE INDEX IF NOT EXISTS idx_hospital_packages_active ON hospital_packages(is_active);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hospital_id ON appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON appointments(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON appointments(start_date);

-- Indexes for payments system
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_product_orders_order_id ON product_orders(order_id);
CREATE INDEX idx_product_orders_user_id ON product_orders(user_id);

CREATE INDEX idx_ticket_bookings_order_id ON ticket_bookings(order_id);
CREATE INDEX idx_ticket_bookings_user_id ON ticket_bookings(user_id);
CREATE INDEX idx_ticket_bookings_event_date ON ticket_bookings(event_date);
CREATE INDEX idx_ticket_bookings_booking_reference ON ticket_bookings(booking_reference);

CREATE INDEX idx_hospital_bookings_order_id ON hospital_bookings(order_id);
CREATE INDEX idx_hospital_bookings_user_id ON hospital_bookings(user_id);
CREATE INDEX idx_hospital_bookings_hospital_id ON hospital_bookings(hospital_id);
CREATE INDEX idx_hospital_bookings_start_date ON hospital_bookings(start_date);
CREATE INDEX idx_hospital_bookings_end_date ON hospital_bookings(end_date);
-- ---
-- PART 4: FUNCTIONS AND TRIGGERS
-- ---
-- Function to generate appointment number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  new_number := 'BK' || year_month || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Check if exists, regenerate if needed
  WHILE EXISTS (SELECT 1 FROM appointments WHERE booking_number = new_number) LOOP
    new_number := 'BK' || year_month || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  order_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate order number format: ORD-YYYYMMDD-XXXX
    new_order_number := 'ORD-' ||
                       TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                       LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Check if order number already exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_order_number) INTO order_exists;

    -- If it doesn't exist, exit loop
    EXIT WHEN NOT order_exists;
  END LOOP;

  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at columns
CREATE TRIGGER update_hospital_packages_updated_at
  BEFORE UPDATE ON hospital_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_orders_updated_at
  BEFORE UPDATE ON product_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_bookings_updated_at
  BEFORE UPDATE ON ticket_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospital_bookings_updated_at
  BEFORE UPDATE ON hospital_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ---
-- PART 5: ROW LEVEL SECURITY POLICIES
-- ---
-- Enable RLS on all tables
ALTER TABLE hospital_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hospital_packages
-- Anyone can view active packages
CREATE POLICY "anyone_can_view_active_packages"
  ON hospital_packages FOR SELECT
  TO public
  USING (is_active = true);

-- hospital owners can manage their packages
CREATE POLICY "hospital_owners_can_manage_packages"
  ON hospital_packages FOR ALL
  TO authenticated
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM hospitals WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all packages
CREATE POLICY "admins_can_manage_all_packages"
  ON hospital_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for appointments
-- Users can view their own appointments
CREATE POLICY "users_can_view_own_bookings"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create appointments
CREATE POLICY "users_can_create_bookings"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- hospital owners can view appointments for their hospitals
CREATE POLICY "hospital_owners_can_view_hospital_bookings"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE user_id = auth.uid()
    )
  );

-- Partners (hospital owners) can update appointments for their hospitals
CREATE POLICY "hospital_owners_can_update_hospital_bookings"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM hospitals WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all appointments
CREATE POLICY "admins_can_manage_all_bookings"
  ON appointments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policies for payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin policies for orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for product_orders
CREATE POLICY "Users can view their own product orders"
  ON product_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product orders"
  ON product_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ticket_bookings
CREATE POLICY "Users can view their own ticket appointments"
  ON ticket_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ticket appointments"
  ON ticket_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for hospital_bookings
CREATE POLICY "Users can view their own hospital appointments"
  ON hospital_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hospital appointments"
  ON hospital_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hospital appointments"
  ON hospital_bookings FOR UPDATE
  USING (auth.uid() = user_id);
-- ---
-- PART 6: PERMISSIONS AND GRANTS
-- ---
-- Grant permissions for hospital_packages and appointments
GRANT SELECT ON hospital_packages TO authenticated, anon;
GRANT INSERT, UPDATE ON hospital_packages TO authenticated;

GRANT SELECT, INSERT ON appointments TO authenticated;
GRANT UPDATE ON appointments TO authenticated;
-- ---
-- PART 7: SEED DATA FOR hospital PACKAGES
-- ---
-- Insert sample packages for existing hospitals
DO $$
DECLARE
  sample_hospital_id UUID;
BEGIN
  -- Get first approved hospital
  SELECT id INTO sample_hospital_id FROM hospitals WHERE status = 'approved' LIMIT 1;
  
  IF sample_hospital_id IS NOT NULL THEN
    -- Insert one-time package (รายครั้ง)
    INSERT INTO hospital_packages (
      hospital_id, package_type, name, name_english, description, price, duration_months, features, is_active
    ) VALUES
    (
      sample_hospital_id,
      'one_time',
      'ฝึกรายครั้ง',
      'Single Session',
      'เหมาะสำหรับผู้ที่ต้องการทดลองฝึก หรือฝึกเป็นครั้งคราว',
      500.00,
      NULL,
      ARRAY['เข้าฝึกได้ 1 ครั้ง', 'ใช้อุปกรณ์ฟรี', 'ฝึกกับครูมืออาชีพ'],
      true
    );

    -- Insert package subscriptions (แพ็คเกจรายเดือน)
    INSERT INTO hospital_packages (
      hospital_id, package_type, name, name_english, description, price, duration_months, features, is_active
    ) VALUES
    -- 1 เดือน
    (
      sample_hospital_id,
      'package',
      'แพ็คเกจ 1 เดือน',
      '1 Month Package',
      'ฝึกได้ไม่จำกัดตลอด 1 เดือน',
      3500.00,
      1,
      ARRAY['ฝึกได้ไม่จำกัด', 'ใช้อุปกรณ์ฟรี', 'ครูฝึกส่วนตัว', 'เข้าห้องอบไอน้ำ'],
      true
    ),
    -- 3 เดือน
    (
      sample_hospital_id,
      'package',
      'แพ็คเกจ 3 เดือน',
      '3 Months Package',
      'ฝึกได้ไม่จำกัดตลอด 3 เดือน ประหยัดกว่า 15%',
      9000.00,
      3,
      ARRAY['ฝึกได้ไม่จำกัด', 'ใช้อุปกรณ์ฟรี', 'ครูฝึกส่วนตัว', 'เข้าห้องอบไอน้ำ', 'โปรแกรมฝึกเฉพาะบุคคล'],
      true
    ),
    -- 6 เดือน
    (
      sample_hospital_id,
      'package',
      'แพ็คเกจ 6 เดือน',
      '6 Months Package',
      'ฝึกได้ไม่จำกัดตลอด 6 เดือน ประหยัดสุด 25%',
      16000.00,
      6,
      ARRAY['ฝึกได้ไม่จำกัด', 'ใช้อุปกรณ์ฟรี', 'ครูฝึกส่วนตัว', 'เข้าห้องอบไอน้ำ', 'โปรแกรมฝึกเฉพาะบุคคล', 'บริการนวดผ่อนคลาย'],
      true
    );
    
    RAISE NOTICE 'Sample packages created for hospital: %', sample_hospital_id;
  ELSE
    RAISE NOTICE 'No approved hospitals found. Please create hospital packages manually.';
  END IF;
END $$;
-- ---
-- PART 8: COMMENTS AND DOCUMENTATION
-- ---
-- Table comments
COMMENT ON TABLE hospital_packages IS 'Stores hospital pricing packages (one-time and subscription packages)';
COMMENT ON TABLE appointments IS 'Stores user appointments for hospital sessions and packages';
COMMENT ON TABLE payments IS 'Stores payment transactions for all order types';
COMMENT ON TABLE orders IS 'Stores order information for products, tickets, and hospital appointments';
COMMENT ON TABLE product_orders IS 'Stores product purchase details';
COMMENT ON TABLE ticket_bookings IS 'Stores event ticket appointment details';
COMMENT ON TABLE hospital_bookings IS 'Stores hospital appointment details linked to orders';

-- Column comments
COMMENT ON COLUMN hospital_packages.package_type IS 'Type: one_time (per session) or package (monthly subscription)';
COMMENT ON COLUMN hospital_packages.duration_months IS 'Package duration: 1, 3, or 6 months. NULL for one_time';
COMMENT ON COLUMN appointments.booking_number IS 'Unique appointment reference number (format: BKYYYYMMXXXX)';

-- Policy comments
COMMENT ON POLICY "hospital_owners_can_update_hospital_bookings" ON appointments 
  IS 'Allows hospital owners (partners) to update appointment status and other details for their hospital';
