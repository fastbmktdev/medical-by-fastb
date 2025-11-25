"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, Button } from "@heroui/react";
import { LoadingSpinner } from "@/components/design-system/primitives/Loading";
import { CameraIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { validateFileClient } from '@shared/lib/utils/file-validation';
import { ConfirmationModal } from "@/components/compositions/modals/ConfirmationModal";

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess: (newUrl: string) => void;
}

export function ProfilePictureUpload({
  currentAvatarUrl,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const appendCacheBuster = (url: string) => {
    if (!url) return url;
    if (url.startsWith("data:")) return url;

    try {
      const parsed = new URL(url);
      parsed.searchParams.set("_ts", Date.now().toString());
      return parsed.toString();
    } catch {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}_ts=${Date.now()}`;
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatarUrl ? appendCacheBuster(currentAvatarUrl) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!currentAvatarUrl) {
      setPreviewUrl(null);
      return;
    }

    if (currentAvatarUrl.startsWith("data:")) {
      setPreviewUrl(currentAvatarUrl);
      return;
    }

    setPreviewUrl(appendCacheBuster(currentAvatarUrl));
  }, [currentAvatarUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation with security checks
    const validation = validateFileClient(file, [
      "image_jpeg",
      "image_png",
      "image_webp",
    ]);

    if (!validation.isValid) {
      // Show first error
      toast.error(validation.errors[0] || "ไฟล์ไม่ถูกต้อง");
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast(warning, { icon: "⚠️" });
      });
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file (server-side will do comprehensive validation)
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/users/profile/picture", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Show detailed error messages from server validation
        if (
          data.details &&
          Array.isArray(data.details) &&
          data.details.length > 0
        ) {
          throw new Error(data.details[0] || data.error || "Failed to upload");
        }
        throw new Error(data.error || "Failed to upload");
      }

      const updatedUrl = appendCacheBuster(data.data.avatar_url);
      toast.success("อัปโหลดรูปโปรไฟล์สำเร็จ!");
      onUploadSuccess(updatedUrl);
      setPreviewUrl(updatedUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลด"
      );
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/users/profile/picture", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("ลบรูปโปรไฟล์สำเร็จ!");
      setPreviewUrl(null);
      onUploadSuccess("");
      setIsDeleteModalOpen(false);
    } catch (error: unknown) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบ"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="group relative">
        <Avatar
          src={previewUrl || undefined}
          size="lg"
          classNames={{
            base: "bg-linear-to-br from-blue-600 to-blue-700 w-32 h-32 ring-4 ring-zinc-700 ring-offset-2 ring-offset-zinc-900",
          }}
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm ">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {!isUploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 backdrop-blur-sm  transition-opacity"
            aria-label="อัปโหลดรูปโปรไฟล์"
            type="button"
          >
            <CameraIcon className="w-8 h-8 text-white" aria-hidden="true" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        {previewUrl && (
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onPress={handleDeleteClick}
            startContent={<XMarkIcon className="w-5 h-5 text-white" />}
            className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 "
            aria-label="ลบรูปโปรไฟล์"
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="ยืนยันการลบรูปโปรไฟล์"
        message="คุณต้องการลบรูปโปรไฟล์หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบรูปภาพ"
        cancelText="ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        loading={isDeleting}
        testId="delete-profile-picture-modal"
      />
    </div>
  );
}
