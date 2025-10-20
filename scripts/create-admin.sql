-- ============================================
-- สคริปต์ตั้งผู้ใช้ที่มีอยู่ให้เป็นผู้ดูแล (Admin) บน Supabase
-- ============================================
-- วิธีใช้:
-- 1. ลงทะเบียนผู้ใช้ผ่านแอปของคุณ หากยังไม่มีผู้ใช้นี้ในระบบ
-- 2. แก้ไขค่า 'admin@example.com' ที่ตัวแปร admin_email ด้านล่าง ให้เป็นอีเมลของผู้ใช้ที่ต้องการตั้งเป็นแอดมิน
-- 3. รันสคริปต์นี้ใน Supabase SQL Editor
-- ============================================

-- ตั้งค่าอีเมลแอดมินที่นี่
DO $$
DECLARE
  admin_email TEXT := 'admin@example.com'; -- <-- แก้ไขที่นี่เป็นอีเมลของผู้ใช้ที่จะเป็นแอดมิน
  admin_user_id UUID;
BEGIN
  -- ค้นหา user id ตามอีเมล
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'ไม่พบผู้ใช้ที่ใช้อีเมล % กรุณาสร้างผู้ใช้นี้ก่อน.', admin_email;
  END IF;

  -- เพิ่มหรืออัปเดตบทบาทเป็นแอดมิน (upsert)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'admin',
        updated_at = NOW();

  RAISE NOTICE 'มอบสิทธิ์แอดมินให้ผู้ใช้ % เรียบร้อยแล้ว', admin_email;
END $$;

-- ============================================
-- คำสั่งตรวจสอบว่าตั้งแอดมินสำเร็จหรือไม่
-- ============================================
-- ใช้คำสั่งนี้เพื่อตรวจสอบสถานะแอดมิน:
-- SELECT u.email, ur.role, ur.created_at
-- FROM auth.users u
-- JOIN public.user_roles ur ON u.id = ur.user_id
-- WHERE u.email = 'admin@example.com';

-- ============================================
