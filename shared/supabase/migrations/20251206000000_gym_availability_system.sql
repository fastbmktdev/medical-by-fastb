-- ---
-- hospital AVAILABILITY SYSTEM MIGRATION
-- ---
-- This migration creates tables and functions for managing hospital availability,
-- opening hours, capacity, and time slot management
-- Create enum for day of week
CREATE TYPE day_of_week AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

-- Create hospital_availability table (opening hours per day)
CREATE TABLE IF NOT EXISTS hospital_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  is_open BOOLEAN DEFAULT TRUE,
  open_time TIME,
  close_time TIME,
  max_capacity INTEGER DEFAULT NULL, -- NULL = unlimited
  current_bookings INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_hospital_day UNIQUE (hospital_id, day_of_week),
  CONSTRAINT valid_time_range CHECK (close_time IS NULL OR open_time IS NULL OR close_time > open_time)
);

-- Create hospital_special_availability table (for holidays, special dates)
CREATE TABLE IF NOT EXISTS hospital_special_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_open BOOLEAN DEFAULT FALSE,
  open_time TIME,
  close_time TIME,
  max_capacity INTEGER DEFAULT NULL,
  reason TEXT, -- 'holiday', 'maintenance', 'special_event', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_hospital_date UNIQUE (hospital_id, date),
  CONSTRAINT valid_time_range CHECK (close_time IS NULL OR open_time IS NULL OR close_time > open_time)
);

-- Create hospital_time_slots table (for specific time slot management)
CREATE TABLE IF NOT EXISTS hospital_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER DEFAULT NULL,
  current_bookings INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  price_multiplier DECIMAL(5, 2) DEFAULT 1.0, -- Price multiplier for this slot (e.g., 1.5 for peak hours)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_price_multiplier CHECK (price_multiplier > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hospital_availability_hospital_id ON hospital_availability(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_availability_day ON hospital_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_hospital_special_availability_hospital_id ON hospital_special_availability(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_special_availability_date ON hospital_special_availability(date);
CREATE INDEX IF NOT EXISTS idx_hospital_time_slots_hospital_id ON hospital_time_slots(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_time_slots_date ON hospital_time_slots(date);
CREATE INDEX IF NOT EXISTS idx_hospital_time_slots_available ON hospital_time_slots(is_available, date) WHERE is_available = TRUE;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_hospital_availability_updated_at
  BEFORE UPDATE ON hospital_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospital_special_availability_updated_at
  BEFORE UPDATE ON hospital_special_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospital_time_slots_updated_at
  BEFORE UPDATE ON hospital_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if hospital is available on a specific date/time
CREATE OR REPLACE FUNCTION check_hospital_availability(
  p_hospital_id UUID,
  p_date DATE,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week day_of_week;
  v_special_availability hospital_special_availability%ROWTYPE;
  v_regular_availability hospital_availability%ROWTYPE;
  v_is_available BOOLEAN := FALSE;
BEGIN
  -- Get day of week
  v_day_of_week := CASE EXTRACT(DOW FROM p_date)
    WHEN 1 THEN 'monday'::day_of_week
    WHEN 2 THEN 'tuesday'::day_of_week
    WHEN 3 THEN 'wednesday'::day_of_week
    WHEN 4 THEN 'thursday'::day_of_week
    WHEN 5 THEN 'friday'::day_of_week
    WHEN 6 THEN 'saturday'::day_of_week
    WHEN 0 THEN 'sunday'::day_of_week
  END;

  -- Check special availability first (holidays, special dates)
  SELECT * INTO v_special_availability
  FROM hospital_special_availability
  WHERE hospital_id = p_hospital_id AND date = p_date;

  IF FOUND THEN
    -- Special availability exists, use it
    v_is_available := v_special_availability.is_open;
    
    -- Check time range if provided
    IF v_is_available AND p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
      IF v_special_availability.open_time IS NOT NULL AND v_special_availability.close_time IS NOT NULL THEN
        v_is_available := p_start_time >= v_special_availability.open_time 
          AND p_end_time <= v_special_availability.close_time;
      END IF;
    END IF;
  ELSE
    -- No special availability, check regular availability
    SELECT * INTO v_regular_availability
    FROM hospital_availability
    WHERE hospital_id = p_hospital_id AND day_of_week = v_day_of_week;

    IF FOUND THEN
      v_is_available := v_regular_availability.is_open;
      
      -- Check time range if provided
      IF v_is_available AND p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
        IF v_regular_availability.open_time IS NOT NULL AND v_regular_availability.close_time IS NOT NULL THEN
          v_is_available := p_start_time >= v_regular_availability.open_time 
            AND p_end_time <= v_regular_availability.close_time;
        END IF;
      END IF;
    ELSE
      -- No availability record found, default to closed
      v_is_available := FALSE;
    END IF;
  END IF;

  RETURN v_is_available;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get available capacity for a date/time
CREATE OR REPLACE FUNCTION get_available_capacity(
  p_hospital_id UUID,
  p_date DATE,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_day_of_week day_of_week;
  v_max_capacity INTEGER;
  v_current_bookings INTEGER;
  v_available_capacity INTEGER;
BEGIN
  -- Get day of week
  v_day_of_week := CASE EXTRACT(DOW FROM p_date)
    WHEN 1 THEN 'monday'::day_of_week
    WHEN 2 THEN 'tuesday'::day_of_week
    WHEN 3 THEN 'wednesday'::day_of_week
    WHEN 4 THEN 'thursday'::day_of_week
    WHEN 5 THEN 'friday'::day_of_week
    WHEN 6 THEN 'saturday'::day_of_week
    WHEN 0 THEN 'sunday'::day_of_week
  END;

  -- Check if there's a specific time slot
  IF p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
    SELECT max_capacity, current_bookings INTO v_max_capacity, v_current_bookings
    FROM hospital_time_slots
    WHERE hospital_id = p_hospital_id 
      AND date = p_date
      AND start_time <= p_start_time
      AND end_time >= p_end_time
      AND is_available = TRUE
    LIMIT 1;

    IF FOUND AND v_max_capacity IS NOT NULL THEN
      v_available_capacity := GREATEST(0, v_max_capacity - v_current_bookings);
      RETURN v_available_capacity;
    END IF;
  END IF;

  -- Check special availability
  SELECT max_capacity, 0 INTO v_max_capacity, v_current_bookings
  FROM hospital_special_availability
  WHERE hospital_id = p_hospital_id AND date = p_date;

  IF NOT FOUND THEN
    -- Check regular availability
    SELECT max_capacity, current_bookings INTO v_max_capacity, v_current_bookings
    FROM hospital_availability
    WHERE hospital_id = p_hospital_id AND day_of_week = v_day_of_week;
  END IF;

  IF v_max_capacity IS NULL THEN
    -- Unlimited capacity
    RETURN NULL;
  END IF;

  -- Count current appointments for this date/time
  SELECT COUNT(*) INTO v_current_bookings
  FROM appointments
  WHERE hospital_id = p_hospital_id
    AND start_date = p_date
    AND status IN ('confirmed', 'completed')
    AND (p_start_time IS NULL OR (
      (start_time IS NULL) OR
      (start_time <= p_end_time AND end_time >= p_start_time)
    ));

  v_available_capacity := GREATEST(0, v_max_capacity - v_current_bookings);
  RETURN v_available_capacity;
END;
$$ LANGUAGE plpgsql STABLE;
-- ---
-- ROW LEVEL SECURITY POLICIES
-- ---
ALTER TABLE hospital_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_special_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_time_slots ENABLE ROW LEVEL SECURITY;

-- Partners can view and manage their own hospital's availability
CREATE POLICY "partners_can_manage_own_hospital_availability"
  ON hospital_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = hospital_availability.hospital_id
        AND hospitals.user_id = auth.uid()
    )
  );

CREATE POLICY "partners_can_manage_own_hospital_special_availability"
  ON hospital_special_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = hospital_special_availability.hospital_id
        AND hospitals.user_id = auth.uid()
    )
  );

CREATE POLICY "partners_can_manage_own_hospital_time_slots"
  ON hospital_time_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = hospital_time_slots.hospital_id
        AND hospitals.user_id = auth.uid()
    )
  );

-- Public can view availability (for appointment purposes)
CREATE POLICY "public_can_view_hospital_availability"
  ON hospital_availability FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "public_can_view_hospital_special_availability"
  ON hospital_special_availability FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "public_can_view_hospital_time_slots"
  ON hospital_time_slots FOR SELECT
  TO authenticated
  USING (TRUE);

-- Service role has full access (implicit)
-- ---
-- PERMISSIONS AND GRANTS
-- ---
GRANT SELECT ON hospital_availability TO authenticated;
GRANT INSERT, UPDATE, DELETE ON hospital_availability TO authenticated;

GRANT SELECT ON hospital_special_availability TO authenticated;
GRANT INSERT, UPDATE, DELETE ON hospital_special_availability TO authenticated;

GRANT SELECT ON hospital_time_slots TO authenticated;
GRANT INSERT, UPDATE, DELETE ON hospital_time_slots TO authenticated;
-- ---
-- COMMENTS AND DOCUMENTATION
-- ---
COMMENT ON TABLE hospital_availability IS 'Regular weekly availability schedule for hospitals';
COMMENT ON TABLE hospital_special_availability IS 'Special availability for holidays, maintenance, or events';
COMMENT ON TABLE hospital_time_slots IS 'Specific time slots with capacity management';
COMMENT ON FUNCTION check_hospital_availability IS 'Checks if a hospital is available on a specific date/time';
COMMENT ON FUNCTION get_available_capacity IS 'Returns available capacity for a date/time slot';
