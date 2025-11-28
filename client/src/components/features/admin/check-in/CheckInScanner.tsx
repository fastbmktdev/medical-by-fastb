"use client";

import { useState, useRef } from "react";
import { Button, Input } from "@heroui/react";
import { QrCodeIcon, CameraIcon } from "@heroicons/react/24/outline";
import { TicketCheckIn } from "./TicketCheckIn";
import { toast } from "react-hot-toast";

export function CheckInScanner() {
  const [ticketId, setTicketId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualInput = () => {
    if (!ticketId.trim()) {
      toast.error("กรุณากรอก Ticket ID");
      return;
    }
    setIsScanning(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // QR code reading from file
    // TODO: Implement QR code decoding from image
    // Implementation plan:
    // 1. Install a QR code decoding library (e.g., 'jsqr' or 'qrcode-reader')
    // 2. Load the image file and create an Image element or canvas
    // 3. Use the library to decode the QR code from the image
    // 4. Extract ticket_id or booking_reference from the decoded JSON
    // 5. Set the ticketId state with the decoded value
    // 6. Call setIsScanning(true) to proceed with check-in
    // Example: const qrData = await decodeQRCodeFromImage(file);
    //          const parsed = JSON.parse(qrData);
    //          setTicketId(parsed.ticket_id || parsed.booking_reference);
    const reader = new FileReader();
    reader.onload = (e) => {
      toast("กำลังประมวลผล QR Code...");
      // QR code decoding not yet implemented - manual input required
      toast.error("กรุณาใช้การกรอก Ticket ID แทน (QR Code decoding ยังไม่พร้อมใช้งาน)");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900  p-6">
        <h2 className="mb-4 font-semibold text-xl">ระบบเช็คอินตั๋ว</h2>
        
        <div className="space-y-4">
          {/* Manual Input */}
          <div>
            <Input
              label="Ticket ID หรือ appointment Reference"
              placeholder="กรอก Ticket ID หรือ appointment Reference"
              value={ticketId}
              onValueChange={setTicketId}
              variant="bordered"
              endContent={
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => handleManualInput()}
                  isDisabled={!ticketId.trim()}
                  aria-label="เช็คอิน"
                >
                  <QrCodeIcon className="w-5 h-5" />
                </Button>
              }
            />
          </div>

          {/* File Upload */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="bordered"
              startContent={<CameraIcon className="w-5 h-5" />}
              onPress={() => fileInputRef.current?.click()}
            >
              อัปโหลด QR Code
            </Button>
          </div>
        </div>
      </div>

      {/* Check-in Component */}
      {isScanning && ticketId && (
        <TicketCheckIn
          ticketId={ticketId}
          onCheckInSuccess={() => {
            setTicketId("");
            setIsScanning(false);
          }}
        />
      )}
    </div>
  );
}

