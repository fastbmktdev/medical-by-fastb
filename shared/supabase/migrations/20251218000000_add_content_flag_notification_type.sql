-- ---
-- Add content_flag notification type
-- Migration: 20251218000000_add_content_flag_notification_type.sql
-- Adds 'content_flag' to the notifications type CHECK constraint
-- ---

-- Drop the existing CHECK constraint
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new CHECK constraint with content_flag type
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'booking_confirmation',
  'booking_reminder',
  'booking_cancelled',
  'payment_received',
  'payment_failed',
  'badge_earned',
  'level_up',
  'points_awarded',
  'challenge_complete',
  'promotion',
  'system',
  'partner_message',
  'content_flag'
));

-- Add comment
COMMENT ON COLUMN notifications.type IS 'Notification type: booking_confirmation, booking_reminder, booking_cancelled, payment_received, payment_failed, badge_earned, level_up, points_awarded, challenge_complete, promotion, system, partner_message, content_flag';

