"use client";

import { useState } from "react";
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { QrCodeIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { Loading } from "@/components/design-system/primitives/Loading";

interface TicketCheckInProps {
  ticketId: string;
  onCheckInSuccess?: () => void;
}

interface TicketData {
  id: string;
  booking_reference: string;
  event_name: string;
  event_name_en?: string;
  event_date: string;
  ticket_count: number;
  ticket_type?: string;
  is_checked_in: boolean;
  checked_in_at?: string;
  customer_name?: string;
  customer_email?: string;
}

export function TicketCheckIn({ ticketId, onCheckInSuccess }: TicketCheckInProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [isCheckingTicket, setIsCheckingTicket] = useState(false);

  const handleCheckIn = async () => {
    if (!ticketId) {
      toast.error("ไม่พบ Ticket ID");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qr_code: qrCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to check in ticket");
      }

      toast.success("เช็คอินสำเร็จ!");
      setTicketData(data.data);
      onCheckInSuccess?.();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการเช็คอิน");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTicket = async () => {
    if (!ticketId) return;

    setIsCheckingTicket(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setTicketData(data.data);
        if (data.data.is_checked_in) {
          toast("ตั๋วนี้ถูกเช็คอินแล้ว");
        }
      } else {
        toast.error("ไม่พบตั๋ว");
      }
    } catch (error) {
      console.error("Error loading ticket:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลตั๋ว");
    } finally {
      setIsCheckingTicket(false);
    }
  };

  return (
    <>
      <Button
        onPress={() => {
          setIsOpen(true);
          handleLoadTicket();
        }}
        color="primary"
        startContent={<QrCodeIcon className="w-5 h-5" />}
      >
        เช็คอินตั๋ว
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>เช็คอินตั๋วอีเวนต์</ModalHeader>
          <ModalBody>
            {isCheckingTicket ? (
              <div className="flex justify-center items-center py-8">
                <Loading centered size="lg" />
              </div>
            ) : ticketData ? (
              <div className="space-y-4">
                {/* Ticket Info */}
                <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-zinc-400 text-sm">Booking Reference</p>
                      <p className="font-mono font-bold text-lg">{ticketData.booking_reference}</p>
                    </div>
                    {ticketData.is_checked_in ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">เช็คอินแล้ว</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <XCircleIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">ยังไม่เช็คอิน</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-700">
                    <p className="text-zinc-400 text-sm">อีเวนต์</p>
                    <p className="font-semibold">{ticketData.event_name}</p>
                    {ticketData.event_name_en && (
                      <p className="text-zinc-400 text-sm">{ticketData.event_name_en}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-700">
                    <div>
                      <p className="text-zinc-400 text-sm">จำนวนตั๋ว</p>
                      <p className="font-semibold">{ticketData.ticket_count}</p>
                    </div>
                    {ticketData.ticket_type && (
                      <div>
                        <p className="text-zinc-400 text-sm">ประเภท</p>
                        <p className="font-semibold">{ticketData.ticket_type}</p>
                      </div>
                    )}
                  </div>

                  {ticketData.checked_in_at && (
                    <div className="pt-2 border-t border-zinc-700">
                      <p className="text-zinc-400 text-sm">เช็คอินเมื่อ</p>
                      <p className="font-semibold">
                        {new Date(ticketData.checked_in_at).toLocaleString("th-TH")}
                      </p>
                    </div>
                  )}
                </div>

                {/* QR Code Input (Optional) */}
                {!ticketData.is_checked_in && (
                  <div>
                    <Input
                      label="QR Code (ถ้ามี)"
                      placeholder="สแกนหรือพิมพ์ QR Code"
                      value={qrCode}
                      onValueChange={setQrCode}
                      variant="bordered"
                    />
                    <p className="text-zinc-400 text-xs mt-1">
                      ถ้าไม่ระบุ QR Code จะเช็คอินโดยอัตโนมัติ
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                ไม่พบข้อมูลตั๋ว
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsOpen(false)}>
              ยกเลิก
            </Button>
            {ticketData && !ticketData.is_checked_in && (
              <Button
                color="primary"
                onPress={handleCheckIn}
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                เช็คอิน
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

