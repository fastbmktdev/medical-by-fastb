-- Migration: Leaderboard Calculation and Challenge Completion Functions
-- Date: 2025-12-15
-- Description: Add functions to calculate/update leaderboard entries and check challenge completion

-- ============================================
-- LEADERBOARD CALCULATION FUNCTIONS
-- ============================================

-- Function to update leaderboard entries for a specific leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_entries(
  target_leaderboard_id UUID,
  period_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  leaderboard_record RECORD;
  period_start TIMESTAMP WITH TIME ZONE;
  period_end TIMESTAMP WITH TIME ZONE;
  user_score INTEGER;
  user_rank INTEGER;
  user_record RECORD;
BEGIN
  -- Get leaderboard info
  SELECT * INTO leaderboard_record
  FROM leaderboards
  WHERE id = target_leaderboard_id AND is_active = true;

  IF leaderboard_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate period dates based on leaderboard period
  IF period_start_date IS NULL THEN
    period_start_date := CURRENT_TIMESTAMP;
  END IF;

  CASE leaderboard_record.period
    WHEN 'daily' THEN
      period_start := DATE_TRUNC('day', period_start_date);
      period_end := period_start + INTERVAL '1 day';
    WHEN 'weekly' THEN
      period_start := DATE_TRUNC('week', period_start_date);
      period_end := period_start + INTERVAL '1 week';
    WHEN 'monthly' THEN
      period_start := DATE_TRUNC('month', period_start_date);
      period_end := period_start + INTERVAL '1 month';
    WHEN 'yearly' THEN
      period_start := DATE_TRUNC('year', period_start_date);
      period_end := period_start + INTERVAL '1 year';
    ELSE -- 'all_time'
      period_start := NULL;
      period_end := NULL;
  END CASE;

  -- Delete existing entries for this period
  DELETE FROM leaderboard_entries
  WHERE leaderboard_id = target_leaderboard_id
  AND (period_start IS NULL OR period_start = update_leaderboard_entries.period_start);

  -- Calculate scores based on leaderboard type
  CASE leaderboard_record.leaderboard_type
    WHEN 'points' THEN
      -- Points leaderboard: use total_points from user_points
      -- Reset rank counter for points
      user_rank := 0;
      FOR user_record IN
        SELECT 
          up.user_id,
          COALESCE(up.total_points, 0) as score
        FROM user_points up
        WHERE (period_start IS NULL OR up.updated_at >= period_start)
        ORDER BY score DESC
      LOOP
        user_rank := user_rank + 1;
        INSERT INTO leaderboard_entries (
          leaderboard_id,
          user_id,
          rank,
          score,
          period_start,
          period_end
        ) VALUES (
          target_leaderboard_id,
          user_record.user_id,
          user_rank,
          user_record.score,
          period_start,
          period_end
        );
      END LOOP;

    WHEN 'appointments' THEN
      -- appointments leaderboard: count appointments
      -- Reset rank counter for appointments
      user_rank := 0;
      FOR user_record IN
        SELECT 
          b.user_id,
          COUNT(*)::INTEGER as score
        FROM appointments b
        WHERE b.status = 'confirmed'
        AND (period_start IS NULL OR b.created_at >= period_start)
        GROUP BY b.user_id
        ORDER BY score DESC
      LOOP
        user_rank := user_rank + 1;
        INSERT INTO leaderboard_entries (
          leaderboard_id,
          user_id,
          rank,
          score,
          period_start,
          period_end
        ) VALUES (
          target_leaderboard_id,
          user_record.user_id,
          user_rank,
          user_record.score,
          period_start,
          period_end
        );
      END LOOP;

    WHEN 'streak' THEN
      -- Streak leaderboard: use longest_streak from user_streaks
      -- Reset rank counter for streak
      user_rank := 0;
      FOR user_record IN
        SELECT 
          us.user_id,
          MAX(us.longest_streak)::INTEGER as score
        FROM user_streaks us
        WHERE (period_start IS NULL OR us.updated_at >= period_start)
        GROUP BY us.user_id
        ORDER BY score DESC
      LOOP
        user_rank := user_rank + 1;
        INSERT INTO leaderboard_entries (
          leaderboard_id,
          user_id,
          rank,
          score,
          period_start,
          period_end
        ) VALUES (
          target_leaderboard_id,
          user_record.user_id,
          user_rank,
          user_record.score,
          period_start,
          period_end
        );
      END LOOP;

    ELSE
      -- Default: use points
      -- Reset rank counter for default
      user_rank := 0;
      FOR user_record IN
        SELECT 
          up.user_id,
          COALESCE(up.total_points, 0) as score
        FROM user_points up
        WHERE (period_start IS NULL OR up.updated_at >= period_start)
        ORDER BY score DESC
      LOOP
        user_rank := user_rank + 1;
        INSERT INTO leaderboard_entries (
          leaderboard_id,
          user_id,
          rank,
          score,
          period_start,
          period_end
        ) VALUES (
          target_leaderboard_id,
          user_record.user_id,
          user_rank,
          user_record.score,
          period_start,
          period_end
        );
      END LOOP;
  END CASE;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to update all active leaderboards
CREATE OR REPLACE FUNCTION update_all_leaderboards()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  leaderboard_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  FOR leaderboard_record IN
    SELECT id FROM leaderboards WHERE is_active = true
  LOOP
    IF update_leaderboard_entries(leaderboard_record.id) THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RETURN updated_count;
END;
$$;

-- ============================================
-- CHALLENGE COMPLETION FUNCTIONS
-- ============================================

-- Function to check and complete a challenge
CREATE OR REPLACE FUNCTION check_and_complete_challenge(
  target_user_challenge_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_challenge_record RECORD;
  challenge_record RECORD;
  requirements_met BOOLEAN := true;
  requirement_key TEXT;
  requirement_value JSONB;
  progress_value JSONB;
BEGIN
  -- Get user challenge and challenge details
  SELECT 
    uc.*,
    c.*
  INTO user_challenge_record
  FROM user_challenges uc
  JOIN challenges c ON uc.challenge_id = c.id
  WHERE uc.id = target_user_challenge_id
  AND uc.is_completed = false
  AND c.is_active = true;

  IF user_challenge_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if challenge is still active (within date range)
  IF user_challenge_record.start_date IS NOT NULL AND 
     CURRENT_TIMESTAMP < user_challenge_record.start_date THEN
    RETURN FALSE;
  END IF;

  IF user_challenge_record.end_date IS NOT NULL AND 
     CURRENT_TIMESTAMP > user_challenge_record.end_date THEN
    RETURN FALSE;
  END IF;

  -- Check if all requirements are met
  IF user_challenge_record.requirements IS NOT NULL THEN
    FOR requirement_key, requirement_value IN 
      SELECT * FROM jsonb_each(user_challenge_record.requirements)
    LOOP
      progress_value := (user_challenge_record.progress -> requirement_key);

      -- Simple requirement checking: progress value should be >= requirement value
      IF progress_value IS NULL OR 
         (progress_value::text::numeric < requirement_value::text::numeric) THEN
        requirements_met := false;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- If all requirements are met, mark challenge as completed
  IF requirements_met THEN
    UPDATE user_challenges
    SET 
      is_completed = true,
      completed_at = CURRENT_TIMESTAMP,
      points_earned = user_challenge_record.points_reward,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = target_user_challenge_id;

    -- Award points for completing the challenge
    PERFORM award_points(
      user_challenge_record.user_id,
      user_challenge_record.points_reward,
      'challenge_complete',
      'Complete challenge: ' || user_challenge_record.title,
      user_challenge_record.challenge_id,
      'challenge'
    );

    RETURN TRUE;
  END IF;

  RETURN FALSE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to check all active challenges for a user
CREATE OR REPLACE FUNCTION check_user_challenges(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_challenge_record RECORD;
  completed_count INTEGER := 0;
BEGIN
  FOR user_challenge_record IN
    SELECT id
    FROM user_challenges
    WHERE user_id = target_user_id
    AND is_completed = false
  LOOP
    IF check_and_complete_challenge(user_challenge_record.id) THEN
      completed_count := completed_count + 1;
    END IF;
  END LOOP;

  RETURN completed_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION update_leaderboard_entries IS 'Updates leaderboard entries for a specific leaderboard based on its type and period';
COMMENT ON FUNCTION update_all_leaderboards IS 'Updates all active leaderboards';
COMMENT ON FUNCTION check_and_complete_challenge IS 'Checks if a user challenge meets all requirements and marks it as completed';
COMMENT ON FUNCTION check_user_challenges IS 'Checks all active challenges for a user and completes those that meet requirements';

