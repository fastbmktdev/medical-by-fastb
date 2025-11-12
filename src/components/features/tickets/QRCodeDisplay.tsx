"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { generateQRCodeDataURL } from "@/lib/utils/qrcode";
import { Loading } from "@/components/design-system/primitives/Loading";

interface QRCodeDisplayProps {
  ticketId: string;
  bookingReference: string;
  className?: string;
}

export function QRCodeDisplay({ 
  ticketId, 
  bookingReference, 
  className = "" 
}: QRCodeDisplayProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateQR() {
      try {
        setIsLoading(true);
        const dataURL = await generateQRCodeDataURL(ticketId, bookingReference);
        setQrCodeDataURL(dataURL);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('ไม่สามารถสร้าง QR Code ได้');
      } finally {
        setIsLoading(false);
      }
    }

    if (ticketId && bookingReference) {
      generateQR();
    }
  }, [ticketId, bookingReference]);

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center bg-zinc-900 rounded-lg p-8 ${className}`}>
        <Loading centered size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-950/50 border border-red-500 rounded-lg p-4 text-center ${className}`}>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!qrCodeDataURL) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="bg-white p-4 rounded-lg">
        <Image
          src={qrCodeDataURL}
          alt={`QR Code for ticket ${bookingReference}`}
          width={300}
          height={300}
          className="w-full h-auto"
        />
      </div>
      <div className="text-center">
        <p className="text-zinc-400 text-xs mb-1">Booking Reference</p>
        <p className="font-mono font-bold text-lg">{bookingReference}</p>
      </div>
    </div>
  );
}

