"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  UserIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "partner" | "customer" | "admin";
  message_text: string;
  message_type: "text" | "image" | "file" | "system";
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  subject: string | null;
  customer_id: string;
  partner_id: string;
  status: string;
}

interface MessageThreadProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
  isSending?: boolean;
  customerName?: string;
  customerAvatar?: string | null;
}

export function MessageThread({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  isLoading = false,
  isSending = false,
  customerName = "ลูกค้า",
  customerAvatar,
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageToSend = newMessage.trim();
    setNewMessage("");

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setNewMessage(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d MMM HH:mm", { locale: th });
  };

  const isOwnMessage = (message: Message) => {
    return (
      message.sender_role === "partner" && message.sender_id === currentUserId
    );
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-center p-8">
        <DocumentTextIcon className="w-16 h-16 text-zinc-600 mb-4" />
        <h3 className="text-lg font-semibold text-zinc-400 mb-2">
          เลือกการสนทนา
        </h3>
        <p className="text-sm text-zinc-500">
          เลือกการสนทนาจากรายการด้านซ้ายเพื่อดูข้อความ
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-zinc-900">
        {/* Header Skeleton */}
        <div className="bg-zinc-800 border-b border-zinc-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100  animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-100  w-1/4 animate-pulse" />
              <div className="h-3 bg-zinc-100  w-1/6 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Messages Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex gap-3">
              <div className="w-8 h-8 bg-zinc-100  animate-pulse" />
              <div className="flex-1">
                <div className="bg-zinc-800  p-3 max-w-md space-y-2">
                  <div className="h-3 bg-zinc-100  w-full animate-pulse" />
                  <div className="h-3 bg-zinc-100  w-3/4 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 p-4">
        <div className="flex items-center gap-3">
          {/* Customer Avatar */}
          {customerAvatar ? (
            <Image
              fill
              sizes="100%"
              src={customerAvatar}
              alt={customerName}
              className="w-10 h-10  object-cover"
            />
          ) : (
            <div className="w-10 h-10  bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-zinc-950" />
            </div>
          )}

          {/* Customer Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-950">{customerName}</h3>
            <p className="text-xs text-zinc-400">
              {conversation.subject || "การสนทนา"}
            </p>
          </div>

          {/* Status */}
          <div className="px-3 py-1 bg-green-600/20 text-green-400 text-xs ">
            {conversation.status === "active"
              ? "กำลังใช้งาน"
              : conversation.status}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500 text-sm">ยังไม่มีข้อความ</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = isOwnMessage(message);

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar (only for received messages) */}
                {!isOwn && (
                  <div className="shrink-0">
                    {customerAvatar ? (
                      <Image
                        fill
                        sizes="100%"
                        src={customerAvatar}
                        alt={customerName}
                        className="w-8 h-8  object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8  bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-zinc-950" />
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-md`}
                >
                  <div
                    className={` px-4 py-2 ${
                      isOwn
                        ? "bg-blue-600 text-zinc-950"
                        : "bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {/* System Message */}
                    {message.message_type === "system" ? (
                      <p className="text-sm italic text-zinc-400">
                        {message.message_text}
                      </p>
                    ) : (
                      <>
                        {/* Message Text */}
                        <p className="text-sm whitespace-pre-wrap wrap-break-words">
                          {message.message_text}
                        </p>

                        {/* Attachments */}
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment, idx) => (
                                <a
                                  key={idx}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs underline hover:no-underline"
                                >
                                  <DocumentTextIcon className="w-3 h-3" />
                                  {attachment.name}
                                </a>
                              ))}
                            </div>
                          )}
                      </>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-zinc-500 mt-1 px-2">
                    {formatMessageTime(message.created_at)}
                    {isOwn && message.is_read && " • อ่านแล้ว"}
                  </span>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-zinc-800 border-t border-zinc-700 p-4">
        <div className="flex items-end gap-3">
          {/* Textarea */}
          <div className="flex-1 bg-zinc-900  border border-zinc-700 focus-within:border-blue-600 transition-colors">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์ข้อความ... (กด Enter เพื่อส่ง)"
              disabled={isSending}
              className="w-full bg-transparent p-3 text-sm text-zinc-950 placeholder:text-zinc-500 focus:outline-none resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="shrink-0 w-11 h-11 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-100 disabled:cursor-not-allowed text-zinc-950  transition-colors"
            aria-label="ส่งข้อความ"
          >
            {isSending ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs text-zinc-500 mt-2">
          กด{" "}
          <kbd className="px-1 py-0.5 bg-zinc-100  text-[10px]">
            Enter
          </kbd>{" "}
          เพื่อส่ง,{" "}
          <kbd className="px-1 py-0.5 bg-zinc-100  text-[10px]">
            Shift+Enter
          </kbd>{" "}
          เพื่อขึ้นบรรทัดใหม่
        </p>
      </div>
    </div>
  );
}
