-- Gym Location Details Migration (coordinates + Google Place ID + diagnostics)

ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS address_components JSONB,
ADD COLUMN IF NOT EXISTS verified_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS geocoding_status TEXT,
ADD COLUMN IF NOT EXISTS geocoding_error TEXT,
ADD COLUMN IF NOT EXISTS last_geocoded_at TIMESTAMPTZ;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_gyms_google_place_id ON gyms(google_place_id);
CREATE INDEX IF NOT EXISTS idx_gyms_coords ON gyms(latitude, longitude);

COMMENT ON COLUMN gyms.google_place_id IS 'Google Place ID for precise location and reviews';
COMMENT ON COLUMN gyms.address_components IS 'Structured address from geocoding (JSON)';
COMMENT ON COLUMN gyms.verified_location IS 'Mark when an admin verified the location';
COMMENT ON COLUMN gyms.geocoding_status IS 'Status of last geocoding attempt (ok, zero_results, denied, etc.)';
COMMENT ON COLUMN gyms.geocoding_error IS 'Error message for last geocoding failure';
COMMENT ON COLUMN gyms.last_geocoded_at IS 'Timestamp of the last geocoding attempt';
