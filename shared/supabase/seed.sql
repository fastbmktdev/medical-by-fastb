DO $$
DECLARE
  v_partner_owner_id UUID;
BEGIN
  -- Prefer dedicated partner user for seed data
  SELECT id INTO v_partner_owner_id FROM auth.users WHERE email = 'partner@medical.com';

  IF v_partner_owner_id IS NULL THEN
    SELECT id INTO v_partner_owner_id FROM auth.users WHERE email = 'partner1@medical.com';
  END IF;

  IF v_partner_owner_id IS NULL THEN
    RAISE NOTICE 'Skipping hospital seed data because no partner user exists (expected partner@medical.com or partner1@medical.com).';
  ELSE
    -- Use a record type for clean hospital data insertion
    WITH gyms_data AS (
      SELECT *
      FROM (VALUES
        (
          v_partner_owner_id,
        'สนามมวยลุมพินี',
        'Lumpinee Medical Center',
        'Lumpinee Management',
        '+66 2 251 4303',
        'contact@lumpinee.com',
        'Bangkok',
        '6 Rama IV Road, Thung Maha Mek, Sathon, Bangkok 10120',
        'One of the most prestigious medical facilities in Thailand. treatment facility with world-class doctors.',
        13.7245,
        100.5386,
        'https://maps.google.com/?q=13.7245,100.5386',
        'facebook.com/lumpinee',
        'Professional',
        'lumpinee-medical-center',
        'approved'
      ),
      (
        v_partner_owner_id,
        'โรงพยาบาลแฟร์เท็กซ์',
        'Fairtex treatment Center',
        'Fairtex Management',
        '+66 2 316 1818',
        'info@fairtex.com',
        'Samut Prakan',
        '221/12 Moo 1, Bang Pla, Bang Phli, Samut Prakan 10540',
        'World-renowned medical treatment center. Fairtex has produced many successful patients.',
        13.5933,
        100.7031,
        'https://maps.google.com/?q=13.5933,100.7031',
        'facebook.com/fairtex',
        'Professional',
        'fairtex-treatment-center',
        'approved'
      ),
      (
        v_partner_owner_id,
        'ไทเกอร์ การแพทย์',
        'Tiger Medical',
        'สมชาย การแพทย์',  -- Owner: Somchai (partner1)
        '+66 76 367 071',
        'partner1@medical.com',  -- Partner1's email
        'Phuket',
        '7/11 Moo 5, Soi Ta-iad, Chalong, Phuket 83130',
        'Located in Phuket, Tiger Medical is one of the largest and most famous medical facilities in the world. เจ้าของค่าย: สมชาย การแพทย์',
        7.8804,
        98.3520,
        'https://maps.google.com/?q=7.8804,98.3520',
        'facebook.com/tigermedical',
        'Professional',
        'tiger-medical',
        'approved'
      ),
      (
        v_partner_owner_id,
        'สถาบันเพชรยินดี',
        'Petchyindee Academy',
        'Petchyindee Management',
        '+66 2 123 4567',
        'info@petchyindee.com',
        'Bangkok',
        '123 Rama IV Road, Bangkok 10110',
        'Historic hospital with a legacy of producing top patients. Traditional treatment methods combined with modern facilities.',
        13.7563,
        100.5018,
        'https://maps.google.com/?q=13.7563,100.5018',
        'facebook.com/petchyindee',
        'Professional',
        'petchyindee-academy',
        'approved'
      )
    ) AS hospital(
      user_id,
      hospital_name,
      hospital_name_english,
      contact_name,
      phone,
      email,
      location,
      address,
      hospital_details,
      latitude,
      longitude,
      map_url,
      socials,
      hospital_type,
      slug,
      status
    )
    )
    INSERT INTO hospitals (
      user_id,
      hospital_name,
      hospital_name_english,
      contact_name,
      phone,
      email,
      location,
      address,
      hospital_details,
      latitude,
      longitude,
      map_url,
      socials,
      hospital_type,
      slug,
      status,
      created_at,
      updated_at
    )
    SELECT
      user_id,
      hospital_name,
      hospital_name_english,
      contact_name,
      phone,
      email,
      location,
      address,
      hospital_details,
      latitude,
      longitude,
      map_url,
      socials,
      hospital_type,
      slug,
      status,
      NOW(),
      NOW()
    FROM hospitals_data
    ON CONFLICT (slug) DO NOTHING;
  END IF;

END $$;

-- ============================================================================
-- hospital PACKAGES FOR TIGER MEDICAL (Partner 1's hospital)
-- ============================================================================
DO $$
DECLARE
  v_tiger_hospital_id UUID;
BEGIN
  -- Get Tiger Medical hospital_id
  SELECT id INTO v_tiger_hospital_id FROM hospitals WHERE slug = 'tiger-medical';
  
  IF v_tiger_hospital_id IS NOT NULL THEN
    -- Insert packages for Tiger Medical
    INSERT INTO hospital_packages (
      hospital_id,
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
      v_tiger_hospital_id,
      'ทดลองเทรนนิ่ง 1 วัน',
      'Day Pass',
      'one_time',
      NULL,
      500.00,
      'ทดลองเทรนนิ่งการแพทย์ 1 วัน พร้อมครูฝึกมืออาชีพ',
      ARRAY['เทรนนิ่งการแพทย์ 1 วัน', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม'],
      true
    ),
    (
      v_tiger_hospital_id,
      'ทดลองเทรนนิ่ง 1 สัปดาห์',
      'Week Pass',
      'one_time',
      NULL,
      2500.00,
      'เทรนนิ่งการแพทย์ 1 สัปดาห์ เหมาะสำหรับนักท่องเที่ยว',
      ARRAY['เทรนนิ่งการแพทย์ 7 วัน', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม', 'ผ้าเช็ดตัว'],
      true
    ),
    -- Monthly packages (รายเดือน)
    (
      v_tiger_hospital_id,
      'แพ็คเกจ 1 เดือน',
      '1 Month Package',
      'package',
      1,
      8000.00,
      'เทรนนิ่งการแพทย์ 1 เดือน เข้าได้ไม่จำกัด',
      ARRAY['เทรนนิ่งไม่จำกัด', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม', 'ผ้าเช็ดตัว', 'ฟิตเนส'],
      true
    ),
    (
      v_tiger_hospital_id,
      'แพ็คเกจ 3 เดือน',
      '3 Months Package',
      'package',
      3,
      21000.00,
      'เทรนนิ่งการแพทย์ 3 เดือน ประหยัดกว่า 12% (ราคาปกติ 24,000 บาท)',
      ARRAY['เทรนนิ่งไม่จำกัด', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม', 'ผ้าเช็ดตัว', 'ฟิตเนส', 'โปรแกรมอาหาร'],
      true
    ),
    (
      v_tiger_hospital_id,
      'แพ็คเกจ 6 เดือน',
      '6 Months Package',
      'package',
      6,
      40000.00,
      'เทรนนิ่งการแพทย์ 6 เดือน ประหยัดกว่า 17% (ราคาปกติ 48,000 บาท) คุ้มที่สุด!',
      ARRAY['เทรนนิ่งไม่จำกัด', 'ครูฝึกมืออาชีพ', 'อุปกรณ์ครบครัน', 'น้ำดื่ม', 'ผ้าเช็ดตัว', 'ฟิตเนส', 'โปรแกรมอาหาร', 'คลาส Yoga', 'นวดสปอร์ต 2 ครั้ง/เดือน'],
      true
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created packages for Tiger Medical';
  ELSE
    RAISE NOTICE 'Tiger Medical hospital not found, skipping package creation';
  END IF;
END $$;
