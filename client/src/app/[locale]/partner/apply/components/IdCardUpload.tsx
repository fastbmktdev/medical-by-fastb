"use client";

import { useState } from "react";
import {
  IdentificationIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface IdCardUploadProps {
  onUploadComplete: (data: {
    originalUrl: string;
    watermarkedUrl: string;
    originalPath: string;
    watermarkedPath: string;
  }) => void;
  onUploadError: (error: string) => void;
  currentWatermarkedUrl?: string;
}

export const IdCardUpload = ({
  onUploadComplete,
  onUploadError,
  currentWatermarkedUrl,
}: IdCardUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentWatermarkedUrl || null
  );
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dynamic import to ensure browser-only code is only loaded client-side
    const { validateIdCardImage, addWatermarkToImage } =
      await import("@shared/lib/utils/image-watermark");

    // Validate file
    const validation = validateIdCardImage(file);
    if (!validation.isValid) {
      onUploadError(validation.error || "ไฟล์ไม่ถูกต้อง");
      toast.error(validation.error || "ไฟล์ไม่ถูกต้อง");
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress("กำลังประมวลผลภาพ...");

      // Add watermark
      const watermarkedFile = await addWatermarkToImage(file);

      setIsProcessing(false);
      setIsUploading(true);
      setUploadProgress("กำลังอัปโหลด...");

      // Create FormData and upload both files
      const formData = new FormData();
      formData.append("file", file);
      formData.append("watermarkedFile", watermarkedFile);

      const response = await fetch("/api/partner/id-card", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Check if response is JSON before trying to parse
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            const error = await response.json();
            throw new Error(error.error || "การอัปโหลดล้มเหลว");
          } catch (parseError) {
            throw new Error(
              `การอัปโหลดล้มเหลว (${response.status} ${response.statusText})`
            );
          }
        } else {
          // Response is not JSON (likely HTML error page)
          const text = await response.text();
          throw new Error(
            `การอัปโหลดล้มเหลว (${response.status} ${response.statusText})`
          );
        }
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("ได้รับข้อมูลที่ไม่ถูกต้องจากเซิร์ฟเวอร์");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPreviewUrl(result.data.watermarkedUrl);
        onUploadComplete(result.data);
        toast.success("อัปโหลดบัตรประชาชนสำเร็จ");
      } else {
        throw new Error("ไม่สามารถอัปโหลดได้");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลด";
      onUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress("");
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete({
      originalUrl: "",
      watermarkedUrl: "",
      originalPath: "",
      watermarkedPath: "",
    });
  };

  return (
    <div className="bg-zinc-100 shadow-xl p-6 md:p-8 ">
      <h2 className="flex items-center gap-3 mb-6 font-semibold text-zinc-950 text-2xl">
        <IdentificationIcon className="w-7 h-7 text-violet-700" />
        บัตรประชาชน (จำเป็น)
      </h2>

      {/* Information Box */}
      <div className="mb-6 p-4 border border-purple-500/30 bg-violet-300 ">
        <p className="text-violet-700 text-sm font-semibold mb-2">
          🔒 ข้อมูลความปลอดภัย:
        </p>
        <ul className="text-violet-700 text-sm space-y-1 ml-4 list-disc">
          <li>
            บัตรประชาชนจะถูก
            <strong className="text-violet-700">ใส่ลายน้ำ</strong>โดยอัตโนมัติ
          </li>
          <li>เก็บต้นฉบับไว้ในระบบอย่างปลอดภัย (เข้าถึงได้เฉพาะผู้ดูแลระบบ)</li>
          <li>ภาพที่แสดงให้เห็นจะมีลายน้ำเสมอเพื่อความปลอดภัย</li>
          <li>รองรับไฟล์: JPG, PNG (ไม่เกิน 10MB)</li>
        </ul>
      </div>

      {/* Upload Area */}
      {!previewUrl ? (
        <div>
          <label className="flex flex-col items-center gap-3 bg-zinc-100 hover:bg-violet-400 p-8 border border-zinc-600 border-dashed  transition-colors cursor-pointer">
            <IdentificationIcon className="w-16 h-16 text-violet-700" />
            <span className="text-zinc-950 text-base font-medium">
              คลิกเพื่ออัปโหลดบัตรประชาชน
            </span>
            <span className="text-zinc-400 text-sm">
              (จะมีการใส่ลายน้ำโดยอัตโนมัติ)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              disabled={isUploading || isProcessing}
              className="hidden"
            />
          </label>

          {/* Progress indicator */}
          {(isUploading || isProcessing) && (
            <div className="mt-4 p-4 bg-zinc-800 ">
              <div className="flex items-center gap-3">
                <div className="animate-spin  h-5 w-5 border-b-2 border-purple-500"></div>
                <span className="text-zinc-400 text-sm">{uploadProgress}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative bg-zinc-800 p-4 ">
            <div className="flex items-start gap-4">
              <PhotoIcon className="shrink-0 w-12 h-12 text-green-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">อัปโหลดสำเร็จ</span>
                </div>
                <p className="text-zinc-400 text-sm mb-3">
                  บัตรประชาชนของคุณถูกอัปโหลดและใส่ลายน้ำเรียบร้อยแล้ว
                </p>

                {/* Status message instead of image preview */}
                <div className="mt-3 p-4 bg-zinc-900/50 border border-green-500/30 ">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <p className="text-green-300 text-sm font-medium">
                        บัตรประชาชนพร้อมลายน้ำถูกอัปโหลดเรียบร้อยแล้ว
                      </p>
                      <p className="text-zinc-400 text-xs mt-1">
                        ไฟล์ถูกเก็บไว้อย่างปลอดภัยและพร้อมสำหรับการตรวจสอบ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500  text-red-400 transition-colors"
            >
              <XCircleIcon className="w-5 h-5" />
              ลบและอัปโหลดใหม่
            </button>
          </div>

          {/* Info message */}
          <div className="p-3 border border-green-500/30 bg-green-500/10 ">
            <p className="text-green-300 text-sm">
              ✓ บัตรประชาชนของคุณถูกเก็บไว้อย่างปลอดภัยแล้ว
              ภาพที่แสดงมีลายน้ำเพื่อป้องกันการนำไปใช้ในทางที่ผิด
            </p>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 p-3 border border-yellow-500/30 bg-yellow-500/10 ">
        <div className="flex items-start gap-2">
          <ExclamationTriangleIcon className="shrink-0 w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-yellow-400">
            <p className="text-sm font-medium">หมายเหตุ:</p>
            <p className="text-sm mt-1">
              กรุณาแน่ใจว่าบัตรประชาชนชัดเจน อ่านง่าย
              และข้อมูลตรงกับที่กรอกในแบบฟอร์ม
              การให้ข้อมูลเท็จอาจส่งผลให้คำขอถูกปฏิเสธ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
