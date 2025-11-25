-- Messages and Conversations System Migration
-- Migration: 20251214000000_messages_system.sql
-- Description: Creates messaging system for Partner-Customer and Partner-Admin communication
-- Features: Conversations, Messages, Read receipts, Typing indicators

-- ---
-- CONVERSATIONS TABLE
-- ---
-- Create conversations table to group messages
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  
  -- Conversation type: 'partner_customer' or 'partner_admin'
  conversation_type TEXT NOT NULL DEFAULT 'partner_customer',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived', 'closed'
  
  -- Last message info (for quick access)
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  last_message_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  subject TEXT,
  booking_id UUID REFERENCES appointments(id) ON DELETE SET NULL, -- Optional: link to appointment
  
  -- Unread counts (denormalized for performance)
  unread_count_partner INTEGER DEFAULT 0,
  unread_count_customer INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT valid_conversation_type CHECK (conversation_type IN ('partner_customer', 'partner_admin')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'archived', 'closed'))
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_partner ON conversations(partner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_hospital ON conversations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_conversations_gym ON conversations(hospital_id); -- Backward compatibility
CREATE INDEX IF NOT EXISTS idx_conversations_booking ON conversations(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- ---
-- MESSAGES TABLE
-- ---
-- Create messages table to store individual messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conversation reference
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Sender info
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL, -- 'partner', 'customer', 'admin'
  
  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file', 'system'
  
  -- File attachments (optional)
  attachments JSONB DEFAULT '[]'::JSONB, -- Array of {url, name, size, type}
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  is_system_message BOOLEAN DEFAULT FALSE, -- System-generated messages
  reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- For threaded replies
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  
  -- Constraints
  CONSTRAINT valid_sender_role CHECK (sender_role IN ('partner', 'customer', 'admin')),
  CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'file', 'system')),
  CONSTRAINT non_empty_message CHECK (LENGTH(TRIM(message_text)) > 0)
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NOT NULL;

-- ---
-- CONVERSATION PARTICIPANTS TABLE (for multi-party conversations in the future)
-- ---
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'partner', 'customer', 'admin'
  
  -- Participant status
  is_active BOOLEAN DEFAULT TRUE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  left_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(conversation_id, user_id),
  CONSTRAINT valid_participant_role CHECK (role IN ('partner', 'customer', 'admin'))
);

-- Indexes for conversation_participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

-- ---
-- FUNCTIONS
-- ---

-- Function to update conversation's last_message info
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.message_text, 100),
    last_message_sender_id = NEW.sender_id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment unread count
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  conv_record conversations%ROWTYPE;
BEGIN
  -- Get conversation details
  SELECT * INTO conv_record FROM conversations WHERE id = NEW.conversation_id;
  
  -- Increment unread count for the recipient
  IF NEW.sender_role = 'partner' THEN
    UPDATE conversations
    SET unread_count_customer = unread_count_customer + 1
    WHERE id = NEW.conversation_id;
  ELSIF NEW.sender_role = 'customer' THEN
    UPDATE conversations
    SET unread_count_partner = unread_count_partner + 1
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID,
  p_user_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Mark all unread messages as read
  UPDATE messages
  SET
    is_read = TRUE,
    read_at = NOW(),
    read_by = p_user_id
  WHERE
    conversation_id = p_conversation_id
    AND is_read = FALSE
    AND sender_role != p_user_role;
  
  -- Reset unread count
  IF p_user_role = 'partner' THEN
    UPDATE conversations
    SET unread_count_partner = 0
    WHERE id = p_conversation_id;
  ELSIF p_user_role = 'customer' THEN
    UPDATE conversations
    SET unread_count_customer = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---
-- TRIGGERS
-- ---

-- Trigger to update conversation when new message is added
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Trigger to increment unread count
DROP TRIGGER IF EXISTS trigger_increment_unread_count ON messages;
CREATE TRIGGER trigger_increment_unread_count
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.is_system_message = FALSE)
  EXECUTE FUNCTION increment_unread_count();

-- ---
-- ROW LEVEL SECURITY (RLS)
-- ---

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Conversations policies
-- Partners can view their own conversations
CREATE POLICY "Partners can view their conversations"
  ON conversations FOR SELECT
  USING (
    partner_id = auth.uid()
    OR (conversation_type = 'partner_admin' AND partner_id = auth.uid())
  );

-- Customers can view their conversations
CREATE POLICY "Customers can view their conversations"
  ON conversations FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Partners can create conversations
CREATE POLICY "Partners can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (partner_id = auth.uid());

-- Customers can create conversations
CREATE POLICY "Customers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Partners can update their conversations
CREATE POLICY "Partners can update their conversations"
  ON conversations FOR UPDATE
  USING (partner_id = auth.uid());

-- Messages policies
-- Users can view messages in their conversations
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (
        c.partner_id = auth.uid()
        OR c.customer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' = 'admin'
        )
      )
    )
  );

-- Users can create messages in their conversations
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (
        c.partner_id = auth.uid()
        OR c.customer_id = auth.uid()
      )
    )
  );

-- Users can update their own messages (for read receipts)
CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (
        c.partner_id = auth.uid()
        OR c.customer_id = auth.uid()
      )
    )
  );

-- Conversation participants policies
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND (c.partner_id = auth.uid() OR c.customer_id = auth.uid())
    )
  );

-- ---
-- COMMENTS
-- ---

COMMENT ON TABLE conversations IS 'Stores conversation threads between partners, customers, and admins';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE conversation_participants IS 'Tracks participants in conversations (for future multi-party support)';
COMMENT ON FUNCTION update_conversation_last_message() IS 'Updates conversation metadata when new message is added';
COMMENT ON FUNCTION increment_unread_count() IS 'Increments unread count for the recipient';
COMMENT ON FUNCTION mark_conversation_as_read(UUID, UUID, TEXT) IS 'Marks all messages in a conversation as read for a specific user';

