"use client";

import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
interface Conversation {
  id: string;
  customer_id: string;
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
  status: "active" | "archived" | "closed";
  conversation_type: string;
  created_at: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading = false,
}: ConversationListProps) {
  const [filter, setFilter] = useState<"active" | "archived" | "all">("active");

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "all") return true;
    return conv.status === filter;
  });

  const getCustomerDisplayName = (conv: Conversation) => {
    if (conv.customer_profile?.full_name) {
      return conv.customer_profile.full_name;
    }
    if (conv.customer_profile?.username) {
      return conv.customer_profile.username;
    }
    if (conv.customer_email) {
      return conv.customer_email.split("@")[0];
    }
    return "ลูกค้า";
  };

  const formatMessageTime = (dateString: string | null) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, "HH:mm", { locale: th });
    } else if (diffInHours < 48) {
      return "เมื่อวาน";
    } else if (diffInHours < 168) {
      // 7 days
      return format(date, "EEEE", { locale: th });
    } else {
      return format(date, "d MMM", { locale: th });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="bg-zinc-800  p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-zinc-100 " />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-100  w-1/3" />
                <div className="h-3 bg-zinc-100  w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <ChatBubbleLeftRightIcon className="w-12 h-12 text-zinc-600 mb-3" />
        <p className="text-zinc-400 text-sm">ยังไม่มีการสนทนา</p>
        <p className="text-zinc-500 text-xs mt-1">
          เมื่อลูกค้าส่งข้อความมาจะแสดงที่นี่
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="flex gap-2 p-4 border-b border-zinc-700">
        <button
          onClick={() => setFilter("active")}
          className={`px-3 py-1.5 text-sm  transition-colors ${
            filter === "active"
              ? "bg-blue-600 text-zinc-950"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-100"
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilter("archived")}
          className={`px-3 py-1.5 text-sm  transition-colors ${
            filter === "archived"
              ? "bg-blue-600 text-zinc-950"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-100"
          }`}
        >
          เก็บถาวร
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-zinc-500 text-sm">
              {filter === "archived"
                ? "ไม่มีการสนทนาที่เก็บถาวร"
                : "ไม่มีการสนทนา"}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              const hasUnread = conversation.unread_count_partner > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left p-3  transition-colors ${
                    isSelected
                      ? "bg-blue-600/20 border border-blue-600/50"
                      : "hover:bg-zinc-800 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {conversation.customer_profile?.avatar_url ? (
                        <Image
                          fill
                          sizes="100%"
                          src={conversation.customer_profile.avatar_url}
                          alt={getCustomerDisplayName(conversation)}
                          className="w-10 h-10  object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10  bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-zinc-950" />
                        </div>
                      )}
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500  flex items-center justify-center text-[10px] font-semibold text-zinc-950">
                          {conversation.unread_count_partner > 9
                            ? "9+"
                            : conversation.unread_count_partner}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 w-full">
                      {/* Name & Time */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span
                          className={`text-sm font-medium truncate ${
                            hasUnread ? "text-zinc-950" : "text-zinc-200"
                          }`}
                        >
                          {getCustomerDisplayName(conversation)}
                        </span>
                        <span className="text-xs text-zinc-500 shrink-0 flex items-center gap-1">
                          {conversation.last_message_at ? (
                            <>
                              <ClockIcon className="w-3 h-3" />
                              {formatMessageTime(conversation.last_message_at)}
                            </>
                          ) : (
                            formatMessageTime(conversation.created_at)
                          )}
                        </span>
                      </div>

                      {/* Subject or Last Message */}
                      <p
                        className={`text-xs truncate ${
                          hasUnread
                            ? "text-zinc-400 font-medium"
                            : "text-zinc-500"
                        }`}
                      >
                        {conversation.last_message_preview ||
                          conversation.subject ||
                          "ยังไม่มีข้อความ"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
