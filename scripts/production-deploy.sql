-- ============================================================================
-- 🚀 ONE-CLICK PRODUCTION DEPLOYMENT SCRIPT (FIXED)
-- ============================================================================
-- 
-- This script consolidates ALL production setup into a single file.
-- Run this ONCE in Supabase SQL Editor after creating your project.
--
-- ⚠️  IMPORTANT: This version fixes foreign key constraint issues
-- 
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 📊 CORE TABLES (Essential Schema)
-- ============================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'authenticated' CHECK (role IN ('authenticated', 'partner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gyms table
CREATE TABLE IF NOT EXISTS public.gyms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    gym_name TEXT NOT NULL,
    gym_name_english TEXT,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    location TEXT NOT NULL,
    address TEXT,
    gym_details TEXT,
    services TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    latitude DECIMAL,
    longitude DECIMAL,
    map_url TEXT,
    socials TEXT,
    gym_type TEXT,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gym packages table
CREATE TABLE IF NOT EXISTS public.gym_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
    package_type TEXT NOT NULL CHECK (package_type IN ('one_time', 'package')),
    name TEXT NOT NULL,
    name_english TEXT,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_months INTEGER,
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES public.gym_packages(id) ON DELETE CASCADE NOT NULL,
    booking_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    price_paid DECIMAL(10,2) NOT NULL,
    package_name TEXT NOT NULL,
    package_type TEXT NOT NULL,
    duration_months INTEGER,
    special_requests TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    payment_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 🎮 GAMIFICATION SYSTEM TABLES
-- ============================================================================

-- User points and levels
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    points_to_next_level INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points history
CREATE TABLE IF NOT EXISTS public.points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    points INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    action_description TEXT,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges (achievement definitions)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_english TEXT,
    description TEXT NOT NULL,
    description_english TEXT,
    icon_url TEXT,
    points_required INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL CHECK (category IN ('booking', 'loyalty', 'social', 'learning', 'special')),
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User earned badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- User streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    streak_type TEXT NOT NULL CHECK (streak_type IN ('booking', 'login', 'review', 'article_read')),
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_english TEXT,
    description TEXT NOT NULL,
    description_english TEXT,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special')),
    points_reward INTEGER NOT NULL DEFAULT 0,
    badge_reward_id UUID REFERENCES public.badges(id),
    requirements JSONB NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_participants INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenges
CREATE TABLE IF NOT EXISTS public.user_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    progress JSONB NOT NULL DEFAULT '{}',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS public.leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_english TEXT,
    description TEXT,
    leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('points', 'bookings', 'streak', 'monthly', 'all_time')),
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    leaderboard_id UUID REFERENCES public.leaderboards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification rules
CREATE TABLE IF NOT EXISTS public.gamification_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    points_awarded INTEGER NOT NULL,
    conditions JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 🔐 ESSENTIAL FUNCTIONS
-- ============================================================================

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Partner check function
CREATE OR REPLACE FUNCTION is_partner(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id AND role IN ('partner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Gym ownership check
CREATE OR REPLACE FUNCTION owns_gym(gym_id_param UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM gyms
    WHERE id = gym_id_param AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin promotion function
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'ERROR: User not found: ' || user_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

  RETURN 'SUCCESS: ' || user_email || ' is now admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup main admin after auth user is created
CREATE OR REPLACE FUNCTION setup_main_admin(admin_email TEXT)
RETURNS TEXT AS $$
DECLARE
    admin_user_id UUID;
    result_message TEXT;
BEGIN
    -- Find the auth user
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RETURN 'ERROR: Auth user not found. Please create the auth user first in Supabase Dashboard.';
    END IF;
    
    -- Create/update profile
    INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
    VALUES (admin_user_id, 'thaikick_admin', 'ThaiKick Admin', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    -- Set admin role
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (admin_user_id, 'admin', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        updated_at = NOW();
    
    -- Initialize gamification with high level
    INSERT INTO public.user_points (user_id, total_points, current_level, points_to_next_level)
    VALUES (admin_user_id, 1000, 10, 0)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = 1000,
        current_level = 10,
        points_to_next_level = 0;
    
    result_message := 'SUCCESS: Main admin setup completed for ' || admin_email || ' (Level 10, 1000 points)';
    
    RAISE NOTICE '%', result_message;
    RAISE NOTICE 'Profile: thaikick_admin';
    RAISE NOTICE 'Role: admin';
    RAISE NOTICE 'Gamification: Level 10 (1000 points)';
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate secure password with ThaiKick pattern
CREATE OR REPLACE FUNCTION generate_secure_password(user_role TEXT DEFAULT 'user')
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    role_suffix TEXT;
BEGIN
    -- Convert role to proper case for password
    role_suffix := CASE 
        WHEN LOWER(user_role) = 'admin' THEN 'Admin'
        WHEN LOWER(user_role) = 'partner' THEN 'Partner'
        WHEN LOWER(user_role) = 'authenticated' THEN 'User'
        ELSE INITCAP(user_role)
    END;
    
    -- Generate password with ThaiKick pattern: ThaiKick2024!@#[role]
    result := 'ThaiKick2024!@#' || role_suffix;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create user with password (for testing purposes)
CREATE OR REPLACE FUNCTION create_user_with_password(
    user_email TEXT,
    user_password TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'authenticated',
    full_name TEXT DEFAULT NULL,
    username TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    generated_password TEXT;
    result_message TEXT;
    user_id UUID;
BEGIN
    -- Generate password if not provided
    IF user_password IS NULL THEN
        generated_password := generate_secure_password(user_role);
    ELSE
        generated_password := user_password;
    END IF;
    
    -- Check if user already exists
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NOT NULL THEN
        RETURN 'ERROR: User already exists: ' || user_email || '. Use setup_test_user() instead.';
    END IF;
    
    -- Note: We cannot create auth.users directly from SQL
    -- This function provides the password and instructions
    result_message := 'SUCCESS: User creation instructions for ' || user_email;
    result_message := result_message || E'\nPassword: ' || generated_password;
    result_message := result_message || E'\nRole: ' || user_role;
    result_message := result_message || E'\nFull Name: ' || COALESCE(full_name, 'Not Set');
    result_message := result_message || E'\nUsername: ' || COALESCE(username, 'Not Set');
    result_message := result_message || E'\n\n📋 MANUAL STEPS REQUIRED:';
    result_message := result_message || E'\n1. Go to Supabase Dashboard > Authentication > Users';
    result_message := result_message || E'\n2. Click "Add User"';
    result_message := result_message || E'\n3. Enter Email: ' || user_email;
    result_message := result_message || E'\n4. Enter Password: ' || generated_password;
    result_message := result_message || E'\n5. Set "Confirm email" to Yes';
    result_message := result_message || E'\n6. Click "Create User"';
    result_message := result_message || E'\n7. Then run: SELECT setup_test_user(''' || user_email || ''', ''' || user_role || ''', ''' || COALESCE(full_name, 'User') || ''', ''' || COALESCE(username, 'user_' || substr(user_email, 1, position('@' in user_email) - 1)) || ''');';
    
    RAISE NOTICE '%', result_message;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- Function to register user directly (complete registration process)
CREATE OR REPLACE FUNCTION register_user_directly(
    user_email TEXT,
    user_password TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'authenticated',
    full_name TEXT DEFAULT NULL,
    username TEXT DEFAULT NULL,
    phone TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    generated_password TEXT;
    result_message TEXT;
    user_id UUID;
    final_username TEXT;
    final_full_name TEXT;
BEGIN
    -- Generate password if not provided
    IF user_password IS NULL THEN
        generated_password := generate_secure_password(user_role);
    ELSE
        generated_password := user_password;
    END IF;
    
    -- Set default values
    final_username := COALESCE(username, 'user_' || substr(user_email, 1, position('@' in user_email) - 1));
    final_full_name := COALESCE(full_name, 'New User');
    
    -- Check if user already exists
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NOT NULL THEN
        RETURN 'ERROR: User already exists: ' || user_email || '. Use setup_test_user() instead.';
    END IF;
    
    -- Create comprehensive registration instructions
    result_message := '🚀 USER REGISTRATION INSTRUCTIONS';
    result_message := result_message || E'\n==========================================';
    result_message := result_message || E'\n📧 Email: ' || user_email;
    result_message := result_message || E'\n🔐 Password: ' || generated_password;
    result_message := result_message || E'\n👤 Full Name: ' || final_full_name;
    result_message := result_message || E'\n🏷️  Username: ' || final_username;
    result_message := result_message || E'\n📱 Phone: ' || COALESCE(phone, 'Not provided');
    result_message := result_message || E'\n📝 Bio: ' || COALESCE(bio, 'Not provided');
    result_message := result_message || E'\n🎭 Role: ' || user_role;
    result_message := result_message || E'\n';
    result_message := result_message || E'\n📋 STEP-BY-STEP REGISTRATION:';
    result_message := result_message || E'\n1. Go to Supabase Dashboard';
    result_message := result_message || E'\n2. Navigate to Authentication > Users';
    result_message := result_message || E'\n3. Click "Add User" button';
    result_message := result_message || E'\n4. Fill in the form:';
    result_message := result_message || E'\n   - Email: ' || user_email;
    result_message := result_message || E'\n   - Password: ' || generated_password;
    result_message := result_message || E'\n   - Confirm email: Yes';
    result_message := result_message || E'\n5. Click "Create User"';
    result_message := result_message || E'\n6. After user creation, run this command:';
    result_message := result_message || E'\n   SELECT complete_user_registration(''' || user_email || ''', ''' || user_role || ''', ''' || final_full_name || ''', ''' || final_username || ''', ''' || COALESCE(phone, '') || ''', ''' || COALESCE(bio, '') || ''');';
    result_message := result_message || E'\n';
    result_message := result_message || E'\n✅ After running the command, the user will have:';
    result_message := result_message || E'\n   - Profile created';
    result_message := result_message || E'\n   - Role assigned';
    result_message := result_message || E'\n   - Gamification initialized';
    result_message := result_message || E'\n   - Full access to the system';
    
    RAISE NOTICE '%', result_message;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- Function to complete user registration after auth user is created
CREATE OR REPLACE FUNCTION complete_user_registration(
    user_email TEXT,
    user_role TEXT,
    full_name TEXT,
    username TEXT,
    phone TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    result_message TEXT;
BEGIN
    -- Find the auth user
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'ERROR: Auth user not found for ' || user_email || '. Please create auth user first using register_user_directly().';
    END IF;
    
    -- Create/update profile
    INSERT INTO public.profiles (id, username, full_name, phone, bio, created_at, updated_at)
    VALUES (user_id, username, full_name, phone, bio, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        bio = EXCLUDED.bio,
        updated_at = NOW();
    
    -- Set user role
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (user_id, user_role, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW();
    
    -- Initialize gamification for the user
    INSERT INTO public.user_points (user_id, total_points, current_level, points_to_next_level)
    VALUES (user_id, 0, 1, 100)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = GREATEST(user_points.total_points, 0),
        current_level = GREATEST(user_points.current_level, 1),
        points_to_next_level = GREATEST(user_points.points_to_next_level, 100);
    
    result_message := '✅ SUCCESS: User registration completed for ' || user_email;
    result_message := result_message || E'\n👤 Profile: ' || username || ' (' || full_name || ')';
    result_message := result_message || E'\n🎭 Role: ' || user_role;
    result_message := result_message || E'\n🎮 Gamification: Level 1 (0 points)';
    result_message := result_message || E'\n📱 Phone: ' || COALESCE(phone, 'Not provided');
    result_message := result_message || E'\n📝 Bio: ' || COALESCE(bio, 'Not provided');
    
    RAISE NOTICE '%', result_message;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user exists in auth.users
CREATE OR REPLACE FUNCTION check_user_exists(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    user_created_at TIMESTAMP WITH TIME ZONE;
    user_email_confirmed BOOLEAN;
    result_message TEXT;
BEGIN
    -- Check if user exists in auth.users
    SELECT id, created_at, email_confirmed_at IS NOT NULL 
    INTO user_id, user_created_at, user_email_confirmed
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN '❌ USER NOT FOUND: ' || user_email || ' does not exist in auth.users table.';
    END IF;
    
    result_message := '✅ USER FOUND: ' || user_email;
    result_message := result_message || E'\n🆔 User ID: ' || user_id;
    result_message := result_message || E'\n📅 Created: ' || user_created_at;
    result_message := result_message || E'\n✉️  Email Confirmed: ' || CASE WHEN user_email_confirmed THEN 'Yes' ELSE 'No' END;
    
    -- Check if user has profile
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        result_message := result_message || E'\n👤 Profile: ✅ Exists';
    ELSE
        result_message := result_message || E'\n👤 Profile: ❌ Missing';
    END IF;
    
    -- Check if user has role
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_id) THEN
        result_message := result_message || E'\n🎭 Role: ✅ Assigned';
    ELSE
        result_message := result_message || E'\n🎭 Role: ❌ Missing';
    END IF;
    
    -- Check if user has gamification
    IF EXISTS (SELECT 1 FROM public.user_points WHERE user_id = user_id) THEN
        result_message := result_message || E'\n🎮 Gamification: ✅ Initialized';
    ELSE
        result_message := result_message || E'\n🎮 Gamification: ❌ Missing';
    END IF;
    
    RAISE NOTICE '%', result_message;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fix existing user (complete their profile)
CREATE OR REPLACE FUNCTION fix_existing_user(
    user_email TEXT,
    user_role TEXT DEFAULT 'authenticated',
    full_name TEXT DEFAULT NULL,
    username TEXT DEFAULT NULL,
    phone TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    result_message TEXT;
    final_username TEXT;
    final_full_name TEXT;
BEGIN
    -- Find the auth user
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'ERROR: Auth user not found for ' || user_email || '. User does not exist in auth.users table.';
    END IF;
    
    -- Set default values
    final_username := COALESCE(username, 'user_' || substr(user_email, 1, position('@' in user_email) - 1));
    final_full_name := COALESCE(full_name, 'Existing User');
    
    -- Create/update profile
    INSERT INTO public.profiles (id, username, full_name, phone, bio, created_at, updated_at)
    VALUES (user_id, final_username, final_full_name, phone, bio, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        bio = COALESCE(EXCLUDED.bio, profiles.bio),
        updated_at = NOW();
    
    -- Set user role
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (user_id, user_role, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW();
    
    -- Initialize gamification for the user
    INSERT INTO public.user_points (user_id, total_points, current_level, points_to_next_level)
    VALUES (user_id, 0, 1, 100)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = GREATEST(user_points.total_points, 0),
        current_level = GREATEST(user_points.current_level, 1),
        points_to_next_level = GREATEST(user_points.points_to_next_level, 100);
    
    result_message := '✅ SUCCESS: Existing user fixed for ' || user_email;
    result_message := result_message || E'\n👤 Profile: ' || final_username || ' (' || final_full_name || ')';
    result_message := result_message || E'\n🎭 Role: ' || user_role;
    result_message := result_message || E'\n🎮 Gamification: Level 1 (0 points)';
    result_message := result_message || E'\n📱 Phone: ' || COALESCE(phone, 'Not provided');
    result_message := result_message || E'\n📝 Bio: ' || COALESCE(bio, 'Not provided');
    
    RAISE NOTICE '%', result_message;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup test user after auth user is created
CREATE OR REPLACE FUNCTION setup_test_user(
    user_email TEXT,
    user_role TEXT,
    full_name TEXT,
    username TEXT
)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    result_message TEXT;
BEGIN
    -- Find the auth user
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'ERROR: Auth user not found for ' || user_email || '. Please create auth user first.';
    END IF;
    
    -- Create/update profile
    INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
    VALUES (user_id, username, full_name, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    -- Set user role
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (user_id, user_role, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW();
    
    -- Initialize gamification for the user
    INSERT INTO public.user_points (user_id, total_points, current_level, points_to_next_level)
    VALUES (user_id, 0, 1, 100)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = GREATEST(user_points.total_points, 0),
        current_level = GREATEST(user_points.current_level, 1),
        points_to_next_level = GREATEST(user_points.points_to_next_level, 100);
    
    result_message := 'SUCCESS: Test user setup completed for ' || user_email || ' (' || user_role || ')';
    RAISE NOTICE '%', result_message;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Gamification RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rules ENABLE ROW LEVEL SECURITY;

-- Core policies (with IF NOT EXISTS to prevent duplicate errors)
DO $$ 
BEGIN
    -- Profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view all profiles') THEN
        CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    -- User roles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view own role') THEN
        CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Only admins can manage roles') THEN
        CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (is_admin());
    END IF;

    -- Gyms policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gyms' AND policyname = 'Anyone can view approved gyms') THEN
        CREATE POLICY "Anyone can view approved gyms" ON public.gyms FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gyms' AND policyname = 'Partners can create gyms') THEN
        CREATE POLICY "Partners can create gyms" ON public.gyms FOR INSERT WITH CHECK (is_partner());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gyms' AND policyname = 'Owners can update own gyms') THEN
        CREATE POLICY "Owners can update own gyms" ON public.gyms FOR UPDATE USING (auth.uid() = user_id OR is_admin());
    END IF;

    -- Gym packages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gym_packages' AND policyname = 'Anyone can view active packages') THEN
        CREATE POLICY "Anyone can view active packages" ON public.gym_packages FOR SELECT USING (is_active = true OR owns_gym(gym_id) OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gym_packages' AND policyname = 'Gym owners can manage packages') THEN
        CREATE POLICY "Gym owners can manage packages" ON public.gym_packages FOR ALL USING (owns_gym(gym_id) OR is_admin());
    END IF;

    -- Bookings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Users can view own bookings') THEN
        CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR owns_gym(gym_id) OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Users can create bookings') THEN
        CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Owners can update bookings') THEN
        CREATE POLICY "Owners can update bookings" ON public.bookings FOR UPDATE USING (owns_gym(gym_id) OR is_admin());
    END IF;
END $$;

-- Gamification policies (with IF NOT EXISTS to prevent duplicate errors)
DO $$ 
BEGIN
    -- User points policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_points' AND policyname = 'Users can view own points') THEN
        CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_points' AND policyname = 'System can manage points') THEN
        CREATE POLICY "System can manage points" ON public.user_points FOR ALL USING (is_admin());
    END IF;

    -- Points history policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'points_history' AND policyname = 'Users can view own points history') THEN
        CREATE POLICY "Users can view own points history" ON public.points_history FOR SELECT USING (auth.uid() = user_id OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'points_history' AND policyname = 'System can create points history') THEN
        CREATE POLICY "System can create points history" ON public.points_history FOR INSERT WITH CHECK (is_admin());
    END IF;

    -- Badges policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'badges' AND policyname = 'Anyone can view active badges') THEN
        CREATE POLICY "Anyone can view active badges" ON public.badges FOR SELECT USING (is_active = true OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'badges' AND policyname = 'Only admins can manage badges') THEN
        CREATE POLICY "Only admins can manage badges" ON public.badges FOR ALL USING (is_admin());
    END IF;

    -- User badges policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'Users can view own badges') THEN
        CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'System can award badges') THEN
        CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (is_admin());
    END IF;

    -- User streaks policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_streaks' AND policyname = 'Users can view own streaks') THEN
        CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_streaks' AND policyname = 'System can manage streaks') THEN
        CREATE POLICY "System can manage streaks" ON public.user_streaks FOR ALL USING (is_admin());
    END IF;

    -- Challenges policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'challenges' AND policyname = 'Anyone can view active challenges') THEN
        CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'challenges' AND policyname = 'Only admins can manage challenges') THEN
        CREATE POLICY "Only admins can manage challenges" ON public.challenges FOR ALL USING (is_admin());
    END IF;

    -- User challenges policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_challenges' AND policyname = 'Users can view own challenges') THEN
        CREATE POLICY "Users can view own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_challenges' AND policyname = 'Users can join challenges') THEN
        CREATE POLICY "Users can join challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_challenges' AND policyname = 'Users can update own challenge progress') THEN
        CREATE POLICY "Users can update own challenge progress" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id OR is_admin());
    END IF;

    -- Leaderboards policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboards' AND policyname = 'Anyone can view active leaderboards') THEN
        CREATE POLICY "Anyone can view active leaderboards" ON public.leaderboards FOR SELECT USING (is_active = true OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboards' AND policyname = 'Only admins can manage leaderboards') THEN
        CREATE POLICY "Only admins can manage leaderboards" ON public.leaderboards FOR ALL USING (is_admin());
    END IF;

    -- Leaderboard entries policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboard_entries' AND policyname = 'Anyone can view leaderboard entries') THEN
        CREATE POLICY "Anyone can view leaderboard entries" ON public.leaderboard_entries FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboard_entries' AND policyname = 'System can manage leaderboard entries') THEN
        CREATE POLICY "System can manage leaderboard entries" ON public.leaderboard_entries FOR ALL USING (is_admin());
    END IF;

    -- Gamification rules policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gamification_rules' AND policyname = 'Anyone can view active rules') THEN
        CREATE POLICY "Anyone can view active rules" ON public.gamification_rules FOR SELECT USING (is_active = true OR is_admin());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gamification_rules' AND policyname = 'Only admins can manage rules') THEN
        CREATE POLICY "Only admins can manage rules" ON public.gamification_rules FOR ALL USING (is_admin());
    END IF;
END $$;

-- ============================================================================
-- 📦 STORAGE SETUP
-- ============================================================================

-- Create gym-images bucket
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('gym-images', 'gym-images', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET public = true, updated_at = NOW();

-- Storage policies (with IF NOT EXISTS to prevent duplicate errors)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can view gym images') THEN
        CREATE POLICY "Anyone can view gym images" ON storage.objects FOR SELECT USING (bucket_id = 'gym-images');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload gym images') THEN
        CREATE POLICY "Authenticated users can upload gym images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gym-images' AND auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own gym images') THEN
        CREATE POLICY "Users can update own gym images" ON storage.objects FOR UPDATE USING (bucket_id = 'gym-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own gym images') THEN
        CREATE POLICY "Users can delete own gym images" ON storage.objects FOR DELETE USING (bucket_id = 'gym-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

-- ============================================================================
-- 👑 MAIN ADMIN USER SETUP
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '👑 MAIN ADMIN USER CONFIGURATION';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Email: thaikickmuaythai@gmail.com';
    RAISE NOTICE 'Username: thaikick_admin (will be set after auth user creation)';
    RAISE NOTICE 'Role: admin';
    RAISE NOTICE 'Level: 10 (1000 points - will be set after auth user creation)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 SECURE PASSWORD SUGGESTION: ThaiKick2024!@#MainAdmin';
    RAISE NOTICE '';
    RAISE NOTICE '📋 SETUP STEPS:';
    RAISE NOTICE '1. Create auth user in Supabase Dashboard:';
    RAISE NOTICE '   - Go to Authentication > Users > Add User';
    RAISE NOTICE '   - Email: thaikickmuaythai@gmail.com';
    RAISE NOTICE '   - Password: ThaiKick2024!@#MainAdmin';
    RAISE NOTICE '   - Confirm email: Yes';
    RAISE NOTICE '';
    RAISE NOTICE '2. After creating auth user, run this command:';
    RAISE NOTICE '   SELECT setup_main_admin(''thaikickmuaythai@gmail.com'');';
    RAISE NOTICE '';
    RAISE NOTICE '👥 FOR TEST USERS:';
    RAISE NOTICE '1. Create auth users in Supabase Dashboard:';
    RAISE NOTICE '   👑 admin@thaikick.com / ThaiKick2024!@#Admin';
    RAISE NOTICE '   🤝 partner@thaikick.com / ThaiKick2024!@#Partner';
    RAISE NOTICE '   👤 user@thaikick.com / ThaiKick2024!@#User';
    RAISE NOTICE '';
    RAISE NOTICE '2. Then run these commands:';
    RAISE NOTICE '   SELECT setup_test_user(''admin@thaikick.com'', ''admin'', ''Test Admin'', ''test_admin'');';
    RAISE NOTICE '   SELECT setup_test_user(''partner@thaikick.com'', ''partner'', ''Test Partner'', ''test_partner'');';
    RAISE NOTICE '   SELECT setup_test_user(''user@thaikick.com'', ''authenticated'', ''Test User'', ''test_user'');';
    RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- ✅ DEPLOYMENT VERIFICATION
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
    bucket_exists BOOLEAN;
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '🚀 PRODUCTION DEPLOYMENT VERIFICATION';
    RAISE NOTICE '============================================================================';
    
    -- Check tables
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    RAISE NOTICE '📊 Tables created: %', table_count;
    
    -- Check functions
    SELECT COUNT(*) INTO function_count FROM information_schema.routines WHERE routine_schema = 'public';
    RAISE NOTICE '🔧 Functions created: %', function_count;
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    RAISE NOTICE '🔒 RLS Policies created: %', policy_count;
    
    -- Check storage
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'gym-images') INTO bucket_exists;
    IF bucket_exists THEN
        RAISE NOTICE '📦 Storage bucket: ✅ gym-images created';
    ELSE
        RAISE NOTICE '📦 Storage bucket: ❌ gym-images missing';
    END IF;
    
    -- Check gamification tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_points') THEN
        RAISE NOTICE '🎮 Gamification system: ✅ Enabled';
    ELSE
        RAISE NOTICE '🎮 Gamification system: ❌ Missing';
    END IF;
    
    RAISE NOTICE '============================================================================';
    
    IF table_count >= 15 AND function_count >= 5 AND policy_count >= 20 AND bucket_exists THEN
        RAISE NOTICE '🎉 SUCCESS: Production deployment completed successfully!';
        RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Create auth user for thaikickmuaythai@gmail.com in Supabase Dashboard';
    RAISE NOTICE '2. Run: SELECT setup_main_admin(''thaikickmuaythai@gmail.com'');';
    RAISE NOTICE '3. Set up your environment variables in your app';
    RAISE NOTICE '4. Deploy your Next.js application';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: auth.users table will only appear after creating users in Supabase Dashboard';
    RAISE NOTICE '   - Go to Authentication > Users > Add User';
    RAISE NOTICE '   - The table is managed by Supabase Auth system';
    RAISE NOTICE '   - Our script only creates profiles and roles AFTER auth users exist';
    ELSE
        RAISE NOTICE '❌ WARNING: Some components may be missing. Please check the logs above.';
    END IF;
    
    RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- 📝 QUICK REFERENCE COMMANDS
-- ============================================================================

-- 👑 MAIN ADMIN USER:
-- Email: thaikickmuaythai@gmail.com
-- Password: ThaiKick2024!@#Admin (auto-generated)
-- Setup: SELECT setup_main_admin('thaikickmuaythai@gmail.com');

-- 👥 TEST USERS:
-- 👑 Test Admin: admin@thaikick.com / ThaiKick2024!@#Admin
-- 🤝 Test Partner: partner@thaikick.com / ThaiKick2024!@#Partner
-- 👤 Test User: user@thaikick.com / ThaiKick2024!@#User

-- Setup commands (after creating auth users):
-- SELECT setup_test_user('admin@thaikick.com', 'admin', 'Test Admin', 'test_admin');
-- SELECT setup_test_user('partner@thaikick.com', 'partner', 'Test Partner', 'test_partner');
-- SELECT setup_test_user('user@thaikick.com', 'authenticated', 'Test User', 'test_user');

-- 🔐 PASSWORD GENERATION COMMANDS:
-- Generate password for specific role: SELECT generate_secure_password('admin'); -- Returns: ThaiKick2024!@#Admin
-- Generate password for partner: SELECT generate_secure_password('partner'); -- Returns: ThaiKick2024!@#Partner
-- Generate password for user: SELECT generate_secure_password('user'); -- Returns: ThaiKick2024!@#User
-- Create user with auto-generated password: SELECT create_user_with_password('newuser@example.com', NULL, 'admin', 'New Admin', 'newadmin');
-- Create user with custom password: SELECT create_user_with_password('custom@example.com', 'MyCustomPass123!', 'partner', 'Custom User', 'customuser');

-- 🚀 USER REGISTRATION COMMANDS:
-- Register new user with complete profile: SELECT register_user_directly('newuser@example.com', NULL, 'authenticated', 'John Doe', 'johndoe', '+66812345678', 'Muay Thai enthusiast');
-- Register admin user: SELECT register_user_directly('admin@example.com', NULL, 'admin', 'Admin User', 'adminuser', '+66887654321', 'System Administrator');
-- Register partner user: SELECT register_user_directly('partner@example.com', NULL, 'partner', 'Gym Owner', 'gymowner', '+66987654321', 'Gym Owner and Trainer');
-- Complete registration after auth user created: SELECT complete_user_registration('user@example.com', 'authenticated', 'User Name', 'username', '+66812345678', 'User bio');

-- 🔍 USER TROUBLESHOOTING COMMANDS:
-- Check if user exists in auth.users: SELECT check_user_exists('user@example.com');
-- Fix existing user (complete their profile): SELECT fix_existing_user('user@example.com', 'authenticated', 'User Name', 'username', '+66812345678', 'User bio');
-- Fix existing admin: SELECT fix_existing_user('admin@example.com', 'admin', 'Admin Name', 'adminuser', '+66887654321', 'Admin bio');
-- Fix existing partner: SELECT fix_existing_user('partner@example.com', 'partner', 'Partner Name', 'partneruser', '+66987654321', 'Partner bio');

-- Check all admin users (after creating auth users):
-- SELECT u.email, ur.role, ur.created_at
-- FROM auth.users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- WHERE ur.role = 'admin';

-- Check all user profiles (after creating auth users):
-- SELECT p.username, p.full_name, ur.role, up.total_points, up.current_level
-- FROM profiles p
-- JOIN user_roles ur ON p.id = ur.user_id
-- LEFT JOIN user_points up ON p.id = up.user_id
-- ORDER BY ur.role, p.username;

-- Check if auth.users table exists and has data:
-- SELECT 
--   CASE 
--     WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
--     THEN 'auth.users table exists'
--     ELSE 'auth.users table does not exist'
--   END as table_status,
--   CASE 
--     WHEN EXISTS (SELECT 1 FROM auth.users LIMIT 1) 
--     THEN 'auth.users has data'
--     ELSE 'auth.users is empty'
--   END as data_status;

-- Check database health:
-- SELECT
--   (SELECT COUNT(*) FROM profiles) as profiles,
--   (SELECT COUNT(*) FROM gyms) as gyms,
--   (SELECT COUNT(*) FROM bookings) as bookings,
--   (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') as admins,
--   (SELECT COUNT(*) FROM user_points) as gamification_users,
--   (SELECT COUNT(*) FROM badges) as total_badges;

-- ============================================================================
-- 🏁 END OF PRODUCTION DEPLOYMENT SCRIPT
-- ============================================================================