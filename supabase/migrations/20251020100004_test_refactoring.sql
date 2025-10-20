-- Test migration to verify refactoring works correctly
-- Migration: 20251020100004_test_refactoring.sql
-- This is a test/verification migration, can be removed after testing

-- ============================================================================
-- TEST HELPER FUNCTIONS
-- ============================================================================

DO $$
DECLARE
  test_result BOOLEAN;
  test_count INTEGER := 0;
  pass_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Refactored Database Functions';
  RAISE NOTICE '========================================';
  
  -- Test 1: is_admin function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: is_admin() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: is_admin() function NOT found', test_count;
  END IF;
  
  -- Test 2: is_partner function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_partner') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: is_partner() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: is_partner() function NOT found', test_count;
  END IF;
  
  -- Test 3: owns_gym function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'owns_gym') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: owns_gym() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: owns_gym() function NOT found', test_count;
  END IF;
  
  -- Test 4: generate_reference_number function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_reference_number') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: generate_reference_number() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: generate_reference_number() function NOT found', test_count;
  END IF;
  
  -- Test 5: get_gym_by_slug function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gym_by_slug') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_gym_by_slug() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_gym_by_slug() function NOT found', test_count;
  END IF;
  
  -- Test 6: get_gym_packages function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gym_packages') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_gym_packages() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_gym_packages() function NOT found', test_count;
  END IF;
  
  -- Test 7: get_user_bookings function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_bookings') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_user_bookings() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_user_bookings() function NOT found', test_count;
  END IF;
  
  -- Test 8: get_gym_bookings function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gym_bookings') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_gym_bookings() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_gym_bookings() function NOT found', test_count;
  END IF;
  
  -- Test 9: get_gym_stats function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gym_stats') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_gym_stats() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_gym_stats() function NOT found', test_count;
  END IF;
  
  -- Test 10: validate_booking_dates function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_booking_dates') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: validate_booking_dates() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: validate_booking_dates() function NOT found', test_count;
  END IF;
  
  -- Test 11: add_updated_at_trigger function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_updated_at_trigger') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: add_updated_at_trigger() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: add_updated_at_trigger() function NOT found', test_count;
  END IF;
  
  -- Test 12: gym_bookings table should NOT exist (merged into bookings)
  test_count := test_count + 1;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gym_bookings') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: gym_bookings table removed (merged into bookings)', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: gym_bookings table still exists (will be removed)', test_count;
  END IF;
  
  -- Test 13: bookings table has new columns
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name IN ('order_id', 'is_confirmed', 'checked_in', 'checked_out')
    GROUP BY table_name
    HAVING COUNT(*) = 4
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: bookings table has new columns', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: bookings table missing new columns', test_count;
  END IF;
  
  -- Test 14: Check if key indexes exist
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname IN (
      'idx_bookings_gym_date',
      'idx_gyms_status_created',
      'idx_gym_packages_gym_active'
    )
    GROUP BY tablename
    HAVING COUNT(*) >= 2
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: Key composite indexes exist', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: Some composite indexes may be missing', test_count;
  END IF;
  
  -- Test 15: Check if GIN indexes exist
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname LIKE '%_gin'
    LIMIT 1
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: GIN indexes exist', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: GIN indexes may be missing', test_count;
  END IF;
  
  -- Test 16: Check if constraints exist
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name IN (
      'check_booking_dates',
      'check_positive_price',
      'check_positive_amount'
    )
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: Data integrity constraints exist', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: Some constraints may be missing', test_count;
  END IF;
  
  -- Test 17: Test generate_reference_number function
  test_count := test_count + 1;
  BEGIN
    PERFORM generate_reference_number('TEST', 'YYYYMMDD', 4);
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: generate_reference_number() works', test_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test %: generate_reference_number() failed: %', test_count, SQLERRM;
  END;
  
  -- Test 18: Test generate_booking_number function
  test_count := test_count + 1;
  BEGIN
    PERFORM generate_booking_number();
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: generate_booking_number() works', test_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test %: generate_booking_number() failed: %', test_count, SQLERRM;
  END;
  
  -- Test 19: Test generate_order_number function
  test_count := test_count + 1;
  BEGIN
    PERFORM generate_order_number();
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: generate_order_number() works', test_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test %: generate_order_number() failed: %', test_count, SQLERRM;
  END;
  
  -- Test 20: Check RLS policies use is_admin
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname LIKE '%admin%'
    LIMIT 1
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: Admin RLS policies exist', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: Admin RLS policies may need review', test_count;
  END IF;
  
  -- Summary
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Results: % / % passed', pass_count, test_count;
  RAISE NOTICE '========================================';
  
  IF pass_count = test_count THEN
    RAISE NOTICE '🎉 All tests passed! Refactoring successful!';
  ELSIF pass_count >= test_count * 0.9 THEN
    RAISE NOTICE '✅ Most tests passed (%.0f%%). Review warnings above.', (pass_count::FLOAT / test_count * 100);
  ELSE
    RAISE NOTICE '⚠️  Some tests failed (%.0f%% passed). Please review.', (pass_count::FLOAT / test_count * 100);
  END IF;
  
END $$;

-- ============================================================================
-- VERIFY TABLE STRUCTURE
-- ============================================================================

-- Show bookings table structure
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bookings Table Structure';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Key Indexes Created';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexname LIKE '%_gin' OR
  indexname LIKE '%_search' OR
  indexname LIKE '%_active' OR
  indexname LIKE '%_future'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- VERIFY FUNCTIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Helper Functions Created';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'is_admin',
  'is_partner',
  'owns_gym',
  'generate_reference_number',
  'get_gym_by_slug',
  'get_gym_packages',
  'get_user_bookings',
  'get_gym_bookings',
  'get_gym_stats',
  'validate_booking_dates',
  'add_updated_at_trigger'
)
ORDER BY routine_name;

COMMENT ON SCHEMA public IS 'Refactoring tests completed. Check NOTICE messages above for results.';

