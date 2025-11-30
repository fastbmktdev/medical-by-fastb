"use client";

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { PhotoIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

interface MediaFile {
  url: string;
  filename: string;
  path: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export default function MediaLibraryModal({ isOpen, onClose, onSelect }: MediaLibraryModalProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMediaFiles();
    }
  }, [isOpen]);

  async function loadMediaFiles() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/media/list?folder=articles');
      const result = await response.json();

      if (result.success && result.data) {
        setMediaFiles(result.data);
      } else {
        toast.error('โหลดไฟล์ไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error loading media files:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error('กรุณาเลือกไฟล์');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        toast.success('อัปโหลดสำเร็จ');
        setSelectedFile(null);
        loadMediaFiles(); // Reload media files
      } else {
        toast.error(result.error || 'อัปโหลดไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file);
  }

  function handleSelectMedia(media: MediaFile) {
    onSelect(media.url);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        body: 'py-6',
        backdrop: 'bg-[#292f46]/50 backdrop-opacity-40',
        base: 'border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]',
        header: 'border-b-[1px] border-[#292f46]',
        footer: 'border-t-[1px] border-[#292f46]',
        closeButton: 'hover:bg-white/5 active:bg-white/10',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Media Library</ModalHeader>
        <ModalBody>
          {/* Upload Section */}
          <div className="border border-zinc-700  p-4 mb-4">
            <label className="block text-sm font-medium mb-2">อัปโหลดรูปภาพใหม่</label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(file);
                  }
                }}
                classNames={{
                  input: 'text-sm',
                  inputWrapper: 'cursor-pointer',
                }}
              />
              {selectedFile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">{selectedFile.name}</span>
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={() => setSelectedFile(null)}
                    aria-label="ยกเลิกการเลือก"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button
                color="primary"
                onPress={handleUpload}
                isLoading={isUploading}
                isDisabled={!selectedFile || isUploading}
                startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
              >
                อัปโหลด
              </Button>
            </div>
          </div>

          {/* Media Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="border-4 border-red-600 border-t-transparent  w-12 h-12 animate-spin"></div>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 text-zinc-400">
              <PhotoIcon className="w-16 h-16 mb-4" />
              <p>ยังไม่มีรูปภาพ</p>
              <p className="text-sm mt-2">อัปโหลดรูปภาพแรกของคุณ</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mediaFiles.map((media) => (
                <div
                  key={media.url}
                  className="group relative aspect-square bg-zinc-800  overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
                  onClick={() => handleSelectMedia(media)}
                >
                  <Image
                    src={media.url}
                    alt={media.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-zinc-950 text-sm font-medium transition-opacity">
                      เลือก
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            ยกเลิก
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

