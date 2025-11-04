-- Content Tables Migration
-- Migration: 20251201000000_content_tables.sql
-- Creates tables for articles, products, events, analytics, and affiliate conversions
-- ---
-- PART 1: ARTICLES TABLE
-- ---
-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT, -- Store author name as fallback if user is deleted
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  image TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_new BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT valid_article_category CHECK (category IN (
    'ประวัติศาสตร์',
    'เทคนิค',
    'สุขภาพ',
    'บุคคล',
    'อุปกรณ์',
    'โภชนาการ',
    'ข่าวสาร',
    'อื่นๆ'
  ))
);

-- Indexes for articles
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_tags_gin ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles 
  USING GIN(to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(excerpt, '') || ' ' || COALESCE(content, '')));
-- ---
-- PART 2: PRODUCTS TABLES
-- ---
-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_thai TEXT NOT NULL,
  name_english TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_thai TEXT NOT NULL,
  name_english TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  sku TEXT UNIQUE, -- Stock Keeping Unit
  weight_kg DECIMAL(8, 2),
  dimensions TEXT, -- e.g., "30x20x10 cm"
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create product_variants table (for sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL, -- 'size', 'color', 'material', etc.
  variant_name TEXT NOT NULL, -- 'S', 'M', 'L', 'Red', 'Blue', etc.
  variant_value TEXT NOT NULL, -- Full value for display
  price_adjustment DECIMAL(10, 2) DEFAULT 0, -- Price difference from base price
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  sku TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT unique_product_variant UNIQUE (product_id, variant_type, variant_name)
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_search ON products 
  USING GIN(to_tsvector('simple', COALESCE(name_thai, '') || ' ' || COALESCE(name_english, '') || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active) WHERE is_active = TRUE;
-- ---
-- PART 3: EVENTS TABLES
-- ---
-- Create event_categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_thai TEXT NOT NULL,
  name_english TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_english TEXT,
  description TEXT,
  details TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  image TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  price_start DECIMAL(10, 2), -- Starting price
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0 CHECK (current_attendees >= 0),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT check_attendees CHECK (max_attendees IS NULL OR current_attendees <= max_attendees),
  CONSTRAINT check_event_dates CHECK (end_date IS NULL OR end_date >= event_date)
);

-- Create event_tickets table
CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type TEXT NOT NULL, -- 'general', 'vip', 'premium', etc.
  name TEXT NOT NULL, -- 'General Admission', 'VIP', etc.
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity_available INTEGER DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_sold INTEGER DEFAULT 0 CHECK (quantity_sold >= 0),
  max_per_person INTEGER DEFAULT 10 CHECK (max_per_person > 0),
  sale_start_date TIMESTAMP WITH TIME ZONE,
  sale_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT check_ticket_quantity CHECK (quantity_sold <= quantity_available),
  CONSTRAINT check_ticket_sale_dates CHECK (
    sale_start_date IS NULL OR 
    sale_end_date IS NULL OR 
    sale_end_date >= sale_start_date
  )
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published, event_date) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location);
CREATE INDEX IF NOT EXISTS idx_events_images_gin ON events USING GIN(images);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_active ON event_tickets(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_event_tickets_type ON event_tickets(event_id, ticket_type);

CREATE INDEX IF NOT EXISTS idx_event_categories_slug ON event_categories(slug);
CREATE INDEX IF NOT EXISTS idx_event_categories_active ON event_categories(is_active) WHERE is_active = TRUE;
-- ---
-- PART 4: ANALYTICS EVENTS TABLE
-- ---
-- Create analytics_events table for tracking user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- Track sessions for anonymous users
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view',
    'article_view',
    'article_like',
    'product_view',
    'product_add_to_cart',
    'product_purchase',
    'event_view',
    'event_ticket_purchase',
    'gym_view',
    'gym_booking',
    'search',
    'filter',
    'click',
    'video_play',
    'video_complete',
    'download',
    'share',
    'signup',
    'login',
    'logout',
    'profile_update'
  )),
  event_name TEXT NOT NULL, -- Human-readable event name
  page_url TEXT,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  metadata JSONB, -- Additional event data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_metadata_gin ON analytics_events USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_analytics_user_type_date ON analytics_events(user_id, event_type, created_at DESC);

-- Partition by date for better performance (optional, for large datasets)
-- CREATE TABLE analytics_events_2025_01 PARTITION OF analytics_events
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- ---
-- PART 5: AFFILIATE CONVERSIONS TABLE
-- ---
-- Create affiliate_conversions table for tracking affiliate conversions
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN (
    'signup',
    'booking',
    'product_purchase',
    'event_ticket_purchase',
    'subscription',
    'referral'
  )),
  conversion_value DECIMAL(10, 2) DEFAULT 0 CHECK (conversion_value >= 0),
  commission_amount DECIMAL(10, 2) DEFAULT 0 CHECK (commission_amount >= 0),
  commission_rate DECIMAL(5, 2) DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  reference_id UUID, -- Reference to booking, order, etc.
  reference_type TEXT, -- 'booking', 'order', 'ticket_booking', etc.
  affiliate_code TEXT,
  referral_source TEXT, -- 'direct', 'email', 'social', etc.
  metadata JSONB, -- Additional conversion data
  confirmed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for affiliate conversions
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate ON affiliate_conversions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_referred ON affiliate_conversions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_type ON affiliate_conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_status ON affiliate_conversions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_created ON affiliate_conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_code ON affiliate_conversions(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_reference ON affiliate_conversions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_metadata_gin ON affiliate_conversions USING GIN(metadata);
-- ---
-- PART 6: ROW LEVEL SECURITY (RLS)
-- ---
-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

-- Articles Policies
CREATE POLICY "Anyone can view published articles"
  ON articles FOR SELECT
  TO authenticated, anon
  USING (is_published = TRUE);

CREATE POLICY "Users can view own articles"
  ON articles FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert own articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can manage all articles"
  ON articles FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Product Categories Policies
CREATE POLICY "Anyone can view active product categories"
  ON product_categories FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage product categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Products Policies
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Product Variants Policies
CREATE POLICY "Anyone can view product variants"
  ON product_variants FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage product variants"
  ON product_variants FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Product Images Policies
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage product images"
  ON product_images FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Event Categories Policies
CREATE POLICY "Anyone can view active event categories"
  ON event_categories FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage event categories"
  ON event_categories FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Events Policies
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  TO authenticated, anon
  USING (is_published = TRUE);

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Partners can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (is_partner() OR auth.uid() = created_by);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all events"
  ON events FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Event Tickets Policies
CREATE POLICY "Anyone can view active event tickets"
  ON event_tickets FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage event tickets"
  ON event_tickets FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Analytics Events Policies
CREATE POLICY "Users can insert own analytics events"
  ON analytics_events FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (is_admin());

-- Affiliate Conversions Policies
CREATE POLICY "Users can view own affiliate conversions"
  ON affiliate_conversions FOR SELECT
  TO authenticated
  USING (auth.uid() = affiliate_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert affiliate conversions"
  ON affiliate_conversions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage affiliate conversions"
  ON affiliate_conversions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
-- ---
-- PART 7: TRIGGERS
-- ---
-- Add updated_at triggers
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_categories_updated_at
  BEFORE UPDATE ON event_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_tickets_updated_at
  BEFORE UPDATE ON event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_conversions_updated_at
  BEFORE UPDATE ON affiliate_conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-set published_at when article is published
CREATE OR REPLACE FUNCTION set_article_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = TRUE AND OLD.is_published = FALSE THEN
    NEW.published_at = TIMEZONE('utc', NOW());
  END IF;
  IF NEW.is_published = FALSE THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_article_published_at_trigger
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION set_article_published_at();

-- Auto-set published_at when event is published
CREATE OR REPLACE FUNCTION set_event_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = TRUE AND OLD.is_published = FALSE THEN
    NEW.published_at = TIMEZONE('utc', NOW());
  END IF;
  IF NEW.is_published = FALSE THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_published_at_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_event_published_at();

-- Auto-update event status based on dates
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_date > NOW() THEN
    NEW.status = 'upcoming';
  ELSIF NEW.event_date <= NOW() AND (NEW.end_date IS NULL OR NEW.end_date >= NOW()) THEN
    NEW.status = 'ongoing';
  ELSIF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() THEN
    NEW.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_status_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_status();

-- Ensure only one primary image per product
CREATE OR REPLACE FUNCTION ensure_single_primary_product_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE product_images
    SET is_primary = FALSE
    WHERE product_id = NEW.product_id
    AND id != NEW.id
    AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_product_image_trigger
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_product_image();
-- ---
-- PART 8: HELPER FUNCTIONS
-- ---
-- Function to get product with variants and images
CREATE OR REPLACE FUNCTION get_product_with_details(product_slug_param TEXT)
RETURNS TABLE (
  product_id UUID,
  slug TEXT,
  name_thai TEXT,
  name_english TEXT,
  description TEXT,
  price DECIMAL,
  stock INTEGER,
  category_id UUID,
  category_name TEXT,
  variants JSONB,
  images JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.name_thai,
    p.name_english,
    p.description,
    p.price,
    p.stock,
    p.category_id,
    pc.name_english,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', pv.id,
          'type', pv.variant_type,
          'name', pv.variant_name,
          'value', pv.variant_value,
          'price_adjustment', pv.price_adjustment,
          'stock', pv.stock,
          'is_default', pv.is_default
        )
      ) FILTER (WHERE pv.id IS NOT NULL),
      '[]'::jsonb
    ),
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', pi.id,
          'url', pi.image_url,
          'alt', pi.alt_text,
          'is_primary', pi.is_primary
        ) ORDER BY pi.display_order
      ) FILTER (WHERE pi.id IS NOT NULL),
      '[]'::jsonb
    )
  FROM products p
  LEFT JOIN product_categories pc ON pc.id = p.category_id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  LEFT JOIN product_images pi ON pi.product_id = p.id
  WHERE p.slug = product_slug_param AND p.is_active = TRUE
  GROUP BY p.id, p.slug, p.name_thai, p.name_english, p.description, p.price, p.stock, p.category_id, pc.name_english;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_product_with_details(TEXT) TO authenticated, anon;

-- Function to get event with tickets
CREATE OR REPLACE FUNCTION get_event_with_tickets(event_slug_param TEXT)
RETURNS TABLE (
  event_id UUID,
  slug TEXT,
  name TEXT,
  name_english TEXT,
  description TEXT,
  details TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  price_start DECIMAL,
  status TEXT,
  tickets JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.slug,
    e.name,
    e.name_english,
    e.description,
    e.details,
    e.event_date,
    e.location,
    e.price_start,
    e.status,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', et.id,
          'type', et.ticket_type,
          'name', et.name,
          'description', et.description,
          'price', et.price,
          'quantity_available', et.quantity_available,
          'quantity_sold', et.quantity_sold,
          'max_per_person', et.max_per_person
        ) ORDER BY et.display_order
      ) FILTER (WHERE et.id IS NOT NULL AND et.is_active = TRUE),
      '[]'::jsonb
    )
  FROM events e
  LEFT JOIN event_tickets et ON et.event_id = e.id
  WHERE e.slug = event_slug_param AND e.is_published = TRUE
  GROUP BY e.id, e.slug, e.name, e.name_english, e.description, e.details, e.event_date, e.location, e.price_start, e.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_event_with_tickets(TEXT) TO authenticated, anon;
-- ---
-- PART 9: PERMISSIONS
-- ---
GRANT SELECT ON articles TO authenticated, anon;
GRANT INSERT, UPDATE ON articles TO authenticated;
GRANT SELECT ON products TO authenticated, anon;
GRANT SELECT ON product_categories TO authenticated, anon;
GRANT SELECT ON product_variants TO authenticated, anon;
GRANT SELECT ON product_images TO authenticated, anon;
GRANT SELECT ON events TO authenticated, anon;
GRANT INSERT, UPDATE ON events TO authenticated;
GRANT SELECT ON event_categories TO authenticated, anon;
GRANT SELECT ON event_tickets TO authenticated, anon;
GRANT INSERT ON analytics_events TO authenticated, anon;
GRANT SELECT ON analytics_events TO authenticated;
GRANT SELECT ON affiliate_conversions TO authenticated;
GRANT INSERT ON affiliate_conversions TO authenticated;
-- ---
-- PART 10: COMMENTS
-- ---
COMMENT ON TABLE articles IS 'Stores articles and blog posts';
COMMENT ON TABLE products IS 'Stores product information';
COMMENT ON TABLE product_categories IS 'Product categories';
COMMENT ON TABLE product_variants IS 'Product variants (sizes, colors, etc.)';
COMMENT ON TABLE product_images IS 'Product images';
COMMENT ON TABLE events IS 'Stores event information';
COMMENT ON TABLE event_categories IS 'Event categories';
COMMENT ON TABLE event_tickets IS 'Event ticket types and pricing';
COMMENT ON TABLE analytics_events IS 'Tracks user behavior and analytics events';
COMMENT ON TABLE affiliate_conversions IS 'Tracks affiliate program conversions';

COMMENT ON COLUMN articles.author_id IS 'Reference to user who created the article';
COMMENT ON COLUMN articles.author_name IS 'Fallback author name if user is deleted';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit for inventory management';
COMMENT ON COLUMN product_variants.price_adjustment IS 'Price difference from base product price';
COMMENT ON COLUMN analytics_events.metadata IS 'JSON metadata for additional event data';
COMMENT ON COLUMN affiliate_conversions.metadata IS 'JSON metadata for additional conversion data';
COMMENT ON COLUMN affiliate_conversions.commission_rate IS 'Commission percentage (0-100)';

COMMENT ON FUNCTION get_product_with_details IS 'Get product with all variants and images';
COMMENT ON FUNCTION get_event_with_tickets IS 'Get event with all available tickets';
