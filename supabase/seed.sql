-- ============================================================================
-- SEED DATA FOR TESTING & PRE-APPROVED GYMS
-- ============================================================================

-- Test user accounts are created using scripts/create-test-users.sh.
-- All test users use password: "password123"
-- Run after migrations: ./scripts/create-test-users.sh
-- For more info: see scripts/create-test-users.sh (creates auth.users with proper password hash)

-- Summary of test users (created via script):
--   Admin:          admin@muaythai.com        / password123
--   Regular User:   user@muaythai.com         / password123
--   Partner 1:      partner1@muaythai.com     / password123  (สมชาย มวยไทย - เจ้าของ Tiger Muay Thai)
--   Partner 2:      partner2@muaythai.com     / password123
-- After creation:
--   (1) Set admin role in the database for admin@muaythai.com
--   (2) Create gym applications for partners
--   (3) Partner1 will own Tiger Muay Thai gym automatically

-- ============================================================================
-- PRE-APPROVED GYMS DATA (as shown on /gyms page)
-- These use a dummy user (system@muaythai.com) for user_id linkage
-- In production, link to real partner accounts
-- ============================================================================

DO $$
DECLARE
  v_dummy_user_id CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
  v_partner1_user_id UUID;
BEGIN
  -- Get partner1 user_id (สมชาย มวยไทย)
  SELECT id INTO v_partner1_user_id FROM auth.users WHERE email = 'partner1@muaythai.com';
  
  -- Ensure dummy system user exists for gym ownership
  INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    encrypted_password,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    v_dummy_user_id,
    'system@muaythai.com',
    NOW(),
    '$2a$10$dummy.hash.for.system.user.only',
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Use a record type for clean gym data insertion
  WITH gyms_data AS (
    SELECT *
    FROM (VALUES
      (
        v_dummy_user_id,
        'สนามมวยลุมพินี',
        'Lumpinee Boxing Stadium',
        'Lumpinee Management',
        '+66 2 251 4303',
        'contact@lumpinee.com',
        'Bangkok',
        '6 Rama IV Road, Thung Maha Mek, Sathon, Bangkok 10120',
        'One of the most prestigious Muay Thai stadiums in Thailand. Training facility with world-class trainers.',
        13.7245,
        100.5386,
        'https://maps.google.com/?q=13.7245,100.5386',
        'facebook.com/lumpinee',
        'Professional',
        'lumpinee-boxing-stadium',
        'approved'
      ),
      (
        v_dummy_user_id,
        'ค่ายมวยแฟร์เท็กซ์',
        'Fairtex Training Center',
        'Fairtex Management',
        '+66 2 316 1818',
        'info@fairtex.com',
        'Samut Prakan',
        '221/12 Moo 1, Bang Pla, Bang Phli, Samut Prakan 10540',
        'World-renowned Muay Thai training camp. Fairtex has produced many champions.',
        13.5933,
        100.7031,
        'https://maps.google.com/?q=13.5933,100.7031',
        'facebook.com/fairtex',
        'Professional',
        'fairtex-training-center',
        'approved'
      ),
      (
        COALESCE(v_partner1_user_id, v_dummy_user_id),  -- Use partner1 if exists, otherwise dummy
        'ไทเกอร์ มวยไทย',
        'Tiger Muay Thai',
        'สมชาย มวยไทย',  -- Owner: Somchai (partner1)
        '+66 76 367 071',
        'partner1@muaythai.com',  -- Partner1's email
        'Phuket',
        '7/11 Moo 5, Soi Ta-iad, Chalong, Phuket 83130',
        'Located in Phuket, Tiger Muay Thai is one of the largest and most famous training camps in the world. เจ้าของค่าย: สมชาย มวยไทย',
        7.8804,
        98.3520,
        'https://maps.google.com/?q=7.8804,98.3520',
        'facebook.com/tigermuaythai',
        'Professional',
        'tiger-muay-thai',
        'approved'
      ),
      (
        v_dummy_user_id,
        'สถาบันเพชรยินดี',
        'Petchyindee Academy',
        'Petchyindee Management',
        '+66 2 123 4567',
        'info@petchyindee.com',
        'Bangkok',
        '123 Rama IV Road, Bangkok 10110',
        'Historic gym with a legacy of producing top fighters. Traditional training methods combined with modern facilities.',
        13.7563,
        100.5018,
        'https://maps.google.com/?q=13.7563,100.5018',
        'facebook.com/petchyindee',
        'Professional',
        'petchyindee-academy',
        'approved'
      )
    ) AS gym(
      user_id,
      gym_name,
      gym_name_english,
      contact_name,
      phone,
      email,
      location,
      address,
      gym_details,
      latitude,
      longitude,
      map_url,
      socials,
      gym_type,
      slug,
      status
    )
  )
  INSERT INTO gyms (
    user_id,
    gym_name,
    gym_name_english,
    contact_name,
    phone,
    email,
    location,
    address,
    gym_details,
    latitude,
    longitude,
    map_url,
    socials,
    gym_type,
    slug,
    status,
    created_at,
    updated_at
  )
  SELECT
    user_id,
    gym_name,
    gym_name_english,
    contact_name,
    phone,
    email,
    location,
    address,
    gym_details,
    latitude,
    longitude,
    map_url,
    socials,
    gym_type,
    slug,
    status,
    NOW(),
    NOW()
  FROM gyms_data
  ON CONFLICT (slug) DO NOTHING;

END $$;

-- ============================================================================
-- GYM PACKAGES FOR TIGER MUAY THAI (Partner 1's gym)
-- ============================================================================
DO $$
DECLARE
  v_tiger_gym_id UUID;
BEGIN
  -- Get Tiger Muay Thai gym_id
  SELECT id INTO v_tiger_gym_id FROM gyms WHERE slug = 'tiger-muay-thai';
  
  IF v_tiger_gym_id IS NOT NULL THEN
    -- Insert packages for Tiger Muay Thai
    INSERT INTO gym_packages (
      gym_id,
      name,
      name_english,
      package_type,
      duration_months,
      price,
      description,
      features,
      is_active
    ) VALUES
    -- One-time packages (ครั้งเดียว)
    (
      v_tiger_gym_id,
      'ทดลองเทรนนิ่ง 1 วัน',
      'Day Pass',
      'one_time',
      NULL,
      500.00,
      'ทดลองเทรนนิ่งมวยไทย 1 วัน พร้อมครูฝึกมืออาชีพ',
      ARRAY['เทรนนิ่งมวยไทย 1 วัน', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม'],
      true
    ),
    (
      v_tiger_gym_id,
      'ทดลองเทรนนิ่ง 1 สัปดาห์',
      'Week Pass',
      'one_time',
      NULL,
      2500.00,
      'เทรนนิ่งมวยไทย 1 สัปดาห์ เหมาะสำหรับนักท่องเที่ยว',
      ARRAY['เทรนนิ่งมวยไทย 7 วัน', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม', 'ผ้าเช็ดตัว'],
      true
    ),
    -- Monthly packages (รายเดือน)
    (
      v_tiger_gym_id,
      'แพ็คเกจ 1 เดือน',
      '1 Month Package',
      'package',
      1,
      8000.00,
      'เทรนนิ่งมวยไทย 1 เดือน เข้าได้ไม่จำกัด',
      ARRAY['เทรนนิ่งไม่จำกัด', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม', 'ผ้าเช็ดตัว', 'ฟิตเนส'],
      true
    ),
    (
      v_tiger_gym_id,
      'แพ็คเกจ 3 เดือน',
      '3 Months Package',
      'package',
      3,
      21000.00,
      'เทรนนิ่งมวยไทย 3 เดือน ประหยัดกว่า 12% (ราคาปกติ 24,000 บาท)',
      ARRAY['เทรนนิ่งไม่จำกัด', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม', 'ผ้าเช็ดตัว', 'ฟิตเนส', 'โปรแกรมอาหาร'],
      true
    ),
    (
      v_tiger_gym_id,
      'แพ็คเกจ 6 เดือน',
      '6 Months Package',
      'package',
      6,
      40000.00,
      'เทรนนิ่งมวยไทย 6 เดือน ประหยัดกว่า 17% (ราคาปกติ 48,000 บาท) คุ้มที่สุด!',
      ARRAY['เทรนนิ่งไม่จำกัด', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม', 'ผ้าเช็ดตัว', 'ฟิตเนส', 'โปรแกรมอาหาร', 'คลาส Yoga', 'นวดสปอร์ต 2 ครั้ง/เดือน'],
      true
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created packages for Tiger Muay Thai';
  ELSE
    RAISE NOTICE 'Tiger Muay Thai gym not found, skipping package creation';
  END IF;
END $$;
