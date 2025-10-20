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
  'gym_booking'
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

-- Create ticket bookings table
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

  -- Booking information
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

-- Create gym bookings table
CREATE TABLE IF NOT EXISTS gym_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,

  -- Booking details
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

  -- Booking status
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

-- Create indexes for better performance
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

CREATE INDEX idx_gym_bookings_order_id ON gym_bookings(order_id);
CREATE INDEX idx_gym_bookings_user_id ON gym_bookings(user_id);
CREATE INDEX idx_gym_bookings_gym_id ON gym_bookings(gym_id);
CREATE INDEX idx_gym_bookings_start_date ON gym_bookings(start_date);
CREATE INDEX idx_gym_bookings_end_date ON gym_bookings(end_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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

CREATE TRIGGER update_gym_bookings_updated_at
  BEFORE UPDATE ON gym_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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

-- RLS Policies for product_orders
CREATE POLICY "Users can view their own product orders"
  ON product_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product orders"
  ON product_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ticket_bookings
CREATE POLICY "Users can view their own ticket bookings"
  ON ticket_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ticket bookings"
  ON ticket_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for gym_bookings
CREATE POLICY "Users can view their own gym bookings"
  ON gym_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gym bookings"
  ON gym_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gym bookings"
  ON gym_bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin policies (users with admin role can view all)
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
