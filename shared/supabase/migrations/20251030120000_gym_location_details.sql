-- hospital Location Details Migration (coordinates + Google Place ID + diagnostics)

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS address_components JSONB,
ADD COLUMN IF NOT EXISTS verified_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS geocoding_status TEXT,
ADD COLUMN IF NOT EXISTS geocoding_error TEXT,
ADD COLUMN IF NOT EXISTS last_geocoded_at TIMESTAMPTZ;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_hospitals_google_place_id ON hospitals(google_place_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_coords ON hospitals(latitude, longitude);
-- Backward compatibility
CREATE INDEX IF NOT EXISTS idx_gyms_google_place_id ON hospitals(google_place_id);
CREATE INDEX IF NOT EXISTS idx_gyms_coords ON hospitals(latitude, longitude);

COMMENT ON COLUMN hospitals.google_place_id IS 'Google Place ID for precise location and reviews';
COMMENT ON COLUMN hospitals.address_components IS 'Structured address from geocoding (JSON)';
COMMENT ON COLUMN hospitals.verified_location IS 'Mark when an admin verified the location';
COMMENT ON COLUMN hospitals.geocoding_status IS 'Status of last geocoding attempt (ok, zero_results, denied, etc.)';
COMMENT ON COLUMN hospitals.geocoding_error IS 'Error message for last geocoding failure';
COMMENT ON COLUMN hospitals.last_geocoded_at IS 'Timestamp of the last geocoding attempt';
