"use client";

import { useState } from "react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
interface Customer {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  avatar_url: string | null;
}

interface ComposeMessageProps {
  customers: Customer[];
  onSend: (
    customerId: string,
    subject: string,
    message: string
  ) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function ComposeMessage({
  customers,
  onSend,
  onClose,
  isLoading = false,
}: ComposeMessageProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.full_name?.toLowerCase().includes(searchLower) ||
      customer.username?.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!selectedCustomer) {
      newErrors.customer = "กรุณาเลือกลูกค้า";
    }

    if (!subject.trim()) {
      newErrors.subject = "กรุณาระบุหัวข้อ";
    } else if (subject.length > 200) {
      newErrors.subject = "หัวข้อต้องไม่เกิน 200 ตัวอักษร";
    }

    if (!message.trim()) {
      newErrors.message = "กรุณาระบุเนื้อหาข้อความ";
    } else if (message.length > 5000) {
      newErrors.message = "เนื้อหาต้องไม่เกิน 5000 ตัวอักษร";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSending(true);

    try {
      await onSend(selectedCustomer!.id, subject.trim(), message.trim());
      // Reset form
      setSelectedCustomer(null);
      setSubject("");
      setMessage("");
      setSearchQuery("");
      onClose();
    } catch (error) {
      console.error("Failed to send message:", error);
      setErrors({ submit: "เกิดข้อผิดพลาดในการส่งข้อความ" });
    } finally {
      setIsSending(false);
    }
  };

  const getCustomerDisplayName = (customer: Customer) => {
    return (
      customer.full_name || customer.username || customer.email.split("@")[0]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900  shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white">ส่งข้อความใหม่</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="ปิด"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                เลือกลูกค้า <span className="text-red-500">*</span>
              </label>

              {!selectedCustomer ? (
                <div className="space-y-2">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาลูกค้า..."
                      className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700  text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Customer List */}
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-zinc-800  p-2">
                    {isLoading ? (
                      <div className="text-center py-8 text-zinc-500 text-sm">
                        <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto mb-2" />
                        กำลังโหลด...
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 text-sm">
                        {searchQuery ? "ไม่พบลูกค้า" : "ไม่มีลูกค้า"}
                      </div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className="w-full text-left p-3  hover:bg-zinc-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {customer.avatar_url ? (
                              <Image
                                fill
                                sizes="100%"
                                src={customer.avatar_url}
                                alt={getCustomerDisplayName(customer)}
                                className="w-10 h-10  object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10  bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {getCustomerDisplayName(
                                  customer
                                )[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">
                                {getCustomerDisplayName(customer)}
                              </p>
                              <p className="text-xs text-zinc-400 truncate">
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-zinc-800 ">
                  {selectedCustomer.avatar_url ? (
                    <Image
                      fill
                      sizes="100%"
                      src={selectedCustomer.avatar_url}
                      alt={getCustomerDisplayName(selectedCustomer)}
                      className="w-10 h-10  object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10  bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {getCustomerDisplayName(
                        selectedCustomer
                      )[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {getCustomerDisplayName(selectedCustomer)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-zinc-400 hover:text-white"
                    aria-label="เปลี่ยนลูกค้า"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {errors.customer && (
                <p className="text-red-500 text-sm mt-1">{errors.customer}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-zinc-400 mb-2"
              >
                หัวข้อ <span className="text-red-500">*</span>
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="เช่น: ยินดีต้อนรับสู่โรงพยาบาล"
                maxLength={200}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-600"
              />
              <div className="flex justify-between mt-1">
                {errors.subject ? (
                  <p className="text-red-500 text-sm">{errors.subject}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-zinc-500">
                  {subject.length}/200
                </span>
              </div>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-zinc-400 mb-2"
              >
                ข้อความ <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="พิมพ์ข้อความของคุณที่นี่..."
                maxLength={5000}
                rows={6}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 resize-none"
              />
              <div className="flex justify-between mt-1">
                {errors.message ? (
                  <p className="text-red-500 text-sm">{errors.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-zinc-500">
                  {message.length}/5000
                </span>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/50  p-3">
                <p className="text-red-500 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-100 disabled:cursor-not-allowed text-white  transition-colors flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  ส่งข้อความ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
