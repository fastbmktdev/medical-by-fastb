'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@shared/lib/database/supabase/client';
import type { User } from '@supabase/supabase-js';
import { ConversationList, MessageThread, ComposeMessage } from '@/components/features/partner/messages';
import { PlusIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Conversation {
  id: string;
  customer_id: string;
  partner_id: string;
  customer_email: string | null;
  customer_profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  subject: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count_partner: number;
  status: 'active' | 'archived' | 'closed';
  conversation_type: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'partner' | 'customer' | 'admin';
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachments?: Array<{ url: string; name: string; size: number; type: string }>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface Customer {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  avatar_url: string | null;
}

export default function PartnerMessagesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }
      setUser(user);
    };

    loadUser();
  }, [router, supabase.auth]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    setError(null);

    try {
      const response = await fetch('/api/partner/conversations');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load conversations');
      }

      setConversations(result.data.conversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('ไม่สามารถโหลดการสนทนาได้');
      toast.error('ไม่สามารถโหลดการสนทนาได้');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/partner/messages?conversation_id=${conversationId}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load messages');
      }

      setMessages(result.data.messages);

      // Mark as read
      await fetch('/api/partner/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      });

      // Refresh conversations to update unread count
      loadConversations();
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('ไม่สามารถโหลดข้อความได้');
      toast.error('ไม่สามารถโหลดข้อความได้');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [loadConversations]);

  // Load customers (for compose)
  const loadCustomers = useCallback(async () => {
    if (!user) return;

    try {
      // Get hospital first
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!hospital) return;

      // Get customers who have appointments at this hospital
      const { data: appointments } = await supabase
        .from('appointments')
        .select('user_id')
        .eq('hospital_id', hospital.id);

      if (!appointments || appointments.length === 0) {
        setCustomers([]);
        return;
      }

      const userIds: string[] = Array.from(new Set<string>(appointments.map((b: { user_id: string }) => b.user_id)));

      // Get user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      // Get user emails
      const customersData: Customer[] = [];
      for (const userId of userIds) {
        const profile = profiles?.find((p: { user_id: string; full_name: string | null; username: string | null; avatar_url: string | null }) => p.user_id === userId);
        const { data: { user: userData } } = await supabase.auth.admin.getUserById(userId);

        if (userData) {
          customersData.push({
            id: userId,
            full_name: profile?.full_name || null,
            username: profile?.username || null,
            email: userData.email || '',
            avatar_url: profile?.avatar_url || null,
          });
        }
      }

      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }, [user, supabase]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadConversations();
      loadCustomers();
    }
  }, [user, loadConversations, loadCustomers]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadConversations();
      if (selectedConversationId) {
        loadMessages(selectedConversationId);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, selectedConversationId, loadConversations, loadMessages]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    loadMessages(conversationId);
  }, [loadMessages]);

  // Handle send message
  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedConversationId) return;

    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/partner/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversationId,
          message,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Reload messages
      await loadMessages(selectedConversationId);
      toast.success('ส่งข้อความสำเร็จ');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('ไม่สามารถส่งข้อความได้');
      throw err;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedConversationId, loadMessages]);

  // Handle compose message
  const handleComposeMessage = useCallback(async (
    customerId: string,
    subject: string,
    message: string
  ) => {
    try {
      const response = await fetch('/api/partner/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          subject,
          initial_message: message,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // If conversation exists, select it
        if (result.data?.conversation_id) {
          setSelectedConversationId(result.data.conversation_id);
          await loadMessages(result.data.conversation_id);
          toast('มีการสนทนากับลูกค้านี้อยู่แล้ว');
          return;
        }
        throw new Error(result.error || 'Failed to create conversation');
      }

      // Reload conversations and select new one
      await loadConversations();
      setSelectedConversationId(result.data.conversation.id);
      await loadMessages(result.data.conversation.id);
      toast.success('ส่งข้อความสำเร็จ');
    } catch (err) {
      console.error('Error composing message:', err);
      toast.error('ไม่สามารถส่งข้อความได้');
      throw err;
    }
  }, [loadConversations, loadMessages]);

  // Get selected conversation details
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const getCustomerDisplayName = (conv: Conversation | undefined) => {
    if (!conv) return '';
    return (
      conv.customer_profile?.full_name ||
      conv.customer_profile?.username ||
      conv.customer_email?.split('@')[0] ||
      'ลูกค้า'
    );
  };

  if (error && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-100 text-center p-8">
        <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">เกิดข้อผิดพลาด</h2>
        <p className="text-zinc-400 mb-6">{error}</p>
        <button
          onClick={() => loadConversations()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white  transition-colors flex items-center gap-2"
        >
          <ArrowPathIcon className="w-4 h-4" />
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-100">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white">ข้อความ</h1>
            <p className="text-sm text-zinc-400">จัดการข้อความกับลูกค้า</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadConversations()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800  transition-colors"
              aria-label="รีเฟรช"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white  transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">ส่งข้อความใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-[1800px] mx-auto w-full">
        {/* Sidebar - Conversations List */}
        <div className="w-full sm:w-80 lg:w-96 bg-zinc-900 border-r border-zinc-800 shrink-0">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Main - Message Thread */}
        <div className="flex-1 hidden sm:flex">
          <MessageThread
            conversation={selectedConversation || null}
            messages={messages}
            currentUserId={user?.id || ''}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingMessages}
            isSending={isSendingMessage}
            customerName={getCustomerDisplayName(selectedConversation)}
            customerAvatar={selectedConversation?.customer_profile?.avatar_url}
          />
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <ComposeMessage
          customers={customers}
          onSend={handleComposeMessage}
          onClose={() => setIsComposeOpen(false)}
        />
      )}
    </div>
  );
}

