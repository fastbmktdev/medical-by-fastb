"use client";

import { useState, useEffect } from 'react';
import { Textarea, Button } from '@heroui/react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { sanitizeText } from '@shared/lib/utils/sanitize.client';

const MAX_BIO_LENGTH = 500;

export function BioEditor() {
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBio();
  }, []);

  const loadBio = async () => {
    try {
      const response = await fetch('/api/users/profile/bio');
      const data = await response.json();
      
      if (data.success && data.data.bio) {
        setBio(data.data.bio);
      }
    } catch (error) {
      console.error('Failed to load bio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const sanitizedBio = sanitizeText(bio);
      const response = await fetch('/api/users/profile/bio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: sanitizedBio }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      toast.success('บันทึก Bio สำเร็จ!');
      setIsEditing(false);
    } catch (error: unknown) {
      console.error('Save error:', error);
      toast.error((error as Error).message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    loadBio();
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-zinc-900/50 h-32 " />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-medium text-sm text-red-500">เกี่ยวกับฉัน</label>
        {!isEditing && (
          <Button
            size="sm"
            variant="flat"
            onPress={() => setIsEditing(true)}
            startContent={<PencilIcon className="w-4 h-4" />}
          >
            แก้ไข
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            placeholder="บอกเล่าเกี่ยวกับตัวคุณ..."
            value={bio}
            onValueChange={setBio}
            maxLength={MAX_BIO_LENGTH}
            minRows={4}
            variant="bordered"
            classNames={{
              input: "text-white",
              inputWrapper: "bg-zinc-100/50 border-zinc-700",
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-xs">
              {bio.length}/{MAX_BIO_LENGTH} ตัวอักษร
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                onPress={handleCancel}
                startContent={<XMarkIcon className="w-4 h-4" />}
                isDisabled={isSaving}
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                color="primary"
                onPress={handleSave}
                isLoading={isSaving}
                startContent={<CheckIcon className="w-4 h-4" />}
              >
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-100/50 p-4  min-h-[100px]">
          {bio ? (
            <div 
              className="text-white whitespace-pre-wrap prose prose-invert max-w-none"
            >
              {sanitizeText(bio)}
            </div>
          ) : (
            <p className="text-white">ยังไม่ได้เพิ่มข้อมูลเกี่ยวกับตัวคุณ</p>
          )}
        </div>
      )}
    </div>
  );
}