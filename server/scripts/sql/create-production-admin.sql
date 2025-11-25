-- ============================================
-- สร้าง ADMIN USER สำหรับ PRODUCTION
-- ============================================
-- ใช้สคริปต์นี้สำหรับสร้าง admin user ใน Supabase Production
-- ============================================

-- ============================================
-- ขั้นตอนที่ 1: ตรวจสอบว่าระบบพร้อมใช้งานแล้วหรือไม่
-- ============================================

-- ตรวจสอบว่าระบบพร้อมใช้งาน
DO $$
DECLARE
  table_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- ตรวจสอบ table profiles
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION '❌ ระบบยังไม่ได้ติดตั้ง กรุณารัน production-deploy.sql ก่อน';
  END IF;
  
  -- ตรวจสอบ function promote_to_admin
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'promote_to_admin'
  ) INTO function_exists;
  
  IF NOT function_exists THEN
    RAISE EXCEPTION '❌ ฟังก์ชัน promote_to_admin ไม่พบ กรุณารัน admin-management.sql ก่อน';
  END IF;
  
  RAISE NOTICE '✅ ระบบพร้อมใช้งานแล้ว';
END $$;

-- ============================================
-- ขั้นตอนที่ 2: สร้าง ADMIN USER
-- ============================================

-- ⚠️ สำคัญ: แก้ไข EMAIL และ PASSWORD ตามต้องการ
-- เปลี่ยน email และ password ที่ต้องการในบรรทัดต่อไปนี้:

DO $$
DECLARE
  -- ═══════════════════════════════════════════════════
  -- 🔧 แก้ไขค่าต่อไปนี้ตามต้องการ
  -- ═══════════════════════════════════════════════════
  admin_email TEXT := 'admin@yourcompany.com';  -- เปลี่ยน email ของ admin
  admin_password TEXT := 'YourSecurePassword123!@#';  -- เปลี่ยน password
  admin_full_name TEXT := 'Admin User';  -- เปลี่ยนชื่อ
  admin_username TEXT := 'admin';  -- เปลี่ยน username
  -- ═══════════════════════════════════════════════════
  
  admin_user_id UUID;
  result_message TEXT;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '🚀 เริ่มสร้าง ADMIN USER';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '📧 Email: %', admin_email;
  RAISE NOTICE '👤 Username: %', admin_username;
  RAISE NOTICE '';
  
  -- ตรวจสอบว่ามี email นี้อยู่ในระบบแล้วหรือไม่
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  พบผู้ใช้ที่มี email นี้อยู่แล้วในระบบ';
    RAISE NOTICE '🔄 กำลังอัพเดทเป็น admin...';
    
    -- อัพเดท role เป็น admin
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (admin_user_id, 'admin', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE 
      SET role = 'admin', updated_at = NOW();
    
    -- อัพเดท profile
    INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
    VALUES (admin_user_id, admin_username, admin_full_name, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE 
      SET username = EXCLUDED.username,
          full_name = EXCLUDED.full_name,
          updated_at = NOW();
    
    RAISE NOTICE '✅ SUCCESS: อัพเดท user เป็น admin สำเร็จ!';
  ELSE
    RAISE NOTICE '❌ ไม่พบ user ในระบบ auth.users';
    RAISE NOTICE '';
    RAISE NOTICE '📋 คำแนะนำ:';
    RAISE NOTICE '1. ไปที่ Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '2. คลิก "Add User" หรือ "Invite User"';
    RAISE NOTICE '3. ใส่ข้อมูล:';
    RAISE NOTICE '   📧 Email: %', admin_email;
    RAISE NOTICE '   🔐 Password: %', admin_password;
    RAISE NOTICE '   ✓ Confirm email: Yes';
    RAISE NOTICE '4. คลิก "Create User" หรือ "Send Invitation"';
    RAISE NOTICE '';
    RAISE NOTICE '5. หลังจากสร้าง user แล้ว รันคำสั่งต่อไปนี้:';
    RAISE NOTICE '';
    RAISE NOTICE '   SELECT promote_to_admin(''%'')', admin_email;
    RAISE NOTICE '';
    RAISE NOTICE '   หรือรันคำสั่งนี้เพื่อตั้งค่า profile แบบเต็ม:';
    RAISE NOTICE '';
    RAISE NOTICE '   SELECT complete_user_registration(';
    RAISE NOTICE '     ''%'',', admin_email;
    RAISE NOTICE '     ''admin'',';
    RAISE NOTICE '     ''%'',', admin_full_name;
    RAISE NOTICE '     ''%'',', admin_username;
    RAISE NOTICE '     NULL,';
    RAISE NOTICE '     NULL';
    RAISE NOTICE '   );';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
  END IF;
END $$;

-- ============================================
-- ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์
-- ============================================

-- ตรวจสอบ admin users ทั้งหมด
SELECT 
  '👑 ADMIN USERS' as title,
  COUNT(*) as total_admins
FROM public.user_roles 
WHERE role = 'admin';

-- แสดง admin users ทั้งหมด
SELECT 
  u.email,
  p.username,
  p.full_name,
  ur.role,
  ur.created_at,
  up.total_points as points,
  up.current_level as level
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_points up ON u.id = up.user_id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;

-- ============================================
-- 📝 ตัวอย่างการใช้งาน
-- ============================================

-- ถ้ามี user อยู่แล้วในระบบ และต้องการ promote เป็น admin:
-- SELECT promote_to_admin('admin@example.com');

-- ถ้า user ยังไม่มี role เลย ให้ใช้คำสั่งนี้:
-- 
-- UPDATE public.user_roles 
-- SET role = 'admin', updated_at = NOW()
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- ถ้า user ยังไม่มี role row เลย ให้ใช้คำสั่งนี้:
-- 
-- INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
-- SELECT id, 'admin', NOW(), NOW()
-- FROM auth.users
-- WHERE email = 'admin@example.com';

-- ============================================
-- ✅ เสร็จสิ้น
-- ============================================

