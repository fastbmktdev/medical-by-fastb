"use client";

import { useState, useEffect } from 'react';
import { Input, Button, Chip } from '@heroui/react';
import { PencilIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Link } from '@/navigation';

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: '📘', color: 'primary' },
  { value: 'instagram', label: 'Instagram', icon: '📷', color: 'secondary' },
  { value: 'x', label: 'X', icon: '🐦', color: 'default' },
  { value: 'youtube', label: 'YouTube', icon: '📺', color: 'danger' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'default' },
];

interface SocialLink {
  platform: string;
  url: string;
}

export function SocialLinksEditor() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newLink, setNewLink] = useState({ platform: 'facebook', url: '' });

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const response = await fetch('/api/users/profile/social-links');
      const data = await response.json();
      
      if (data.success) {
        const normalizedLinks = (data.data || []).map((link: SocialLink) => ({
          ...link,
          platform: link.platform === 'twitter' ? 'x' : link.platform
        }));
        setLinks(normalizedLinks);
      }
    } catch (error) {
      console.error('Failed to load links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/profile/social-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error((data.error as string) || 'Failed to save');
      }

      toast.success('บันทึก Social Links สำเร็จ!');
      setIsEditing(false);
      setLinks(data.data || []);
    } catch (error: unknown) {
      console.error('Save error:', error);
      toast.error((error as Error).message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLink = () => {
    if (!newLink.url) {
      toast.error('กรุณากรอก URL');
      return;
    }

    if (!newLink.url.match(/^https?:\/\//)) {
      toast.error('URL ต้องขึ้นต้นด้วย http:// หรือ https://');
      return;
    }

    // Check if platform already exists
    if (links.some(link => link.platform === newLink.platform)) {
      toast.error(`คุณมี ${SOCIAL_PLATFORMS.find(p => p.value === newLink.platform)?.label} อยู่แล้ว`);
      return;
    }

    setLinks([...links, { ...newLink }]);
    setNewLink({ platform: 'facebook', url: '' });
  };

  const handleRemoveLink = (platform: string) => {
    setLinks(links.filter(link => link.platform !== platform));
  };

  const handleUpdateLink = (platform: string, url: string) => {
    setLinks(links.map(link => 
      link.platform === platform ? { ...link, url } : link
    ));
  };

  if (isLoading) {
    return <div className="animate-pulse bg-zinc-900/50 h-32 rounded-lg" />;
  }

  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    platform => !links.some(link => link.platform === platform.value)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block font-medium text-sm">Social Media Links</label>
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
        <div className="space-y-4">
          {/* Existing Links */}
          {links.map((link) => {
            const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
            return (
              <div key={link.platform} className="flex gap-2 items-center">
                <Chip size="sm" variant="flat">
                  {platform?.icon} {platform?.label}
                </Chip>
                <Input
                  value={link.url}
                  onValueChange={(value) => handleUpdateLink(link.platform, value)}
                  placeholder="https://..."
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-zinc-950/50 border-zinc-700",
                  }}
                />
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  onPress={() => handleRemoveLink(link.platform)}
                  startContent={<XMarkIcon className="w-4 h-4" />}
                >
                  ลบ
                </Button>
              </div>
            );
          })}

          {/* Add New Link */}
          {availablePlatforms.length > 0 && (
            <div className="flex gap-2 items-center p-4 bg-zinc-950/30 rounded-lg border border-zinc-700">
              <select
                value={newLink.platform}
                onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm"
              >
                {availablePlatforms.map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.icon} {platform.label}
                  </option>
                ))}
              </select>
              <Input
                value={newLink.url}
                onValueChange={(value) => setNewLink({ ...newLink, url: value })}
                placeholder="https://..."
                variant="bordered"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-zinc-950/50 border-zinc-700 flex-1",
                }}
              />
              <Button
                size="sm"
                color="primary"
                onPress={handleAddLink}
                startContent={<PlusIcon className="w-4 h-4" />}
              >
                เพิ่ม
              </Button>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="flat"
              onPress={() => {
                loadLinks();
                setIsEditing(false);
              }}
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
      ) : (
        <div className="space-y-2">
          {links.length > 0 ? (
            links.map((link) => {
              const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
              return (
                <Link
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-zinc-950/50 hover:bg-zinc-950/70 p-3 rounded-lg transition-colors"
                >
                  <span className="text-xl">{platform?.icon}</span>
                  <span className="text-white flex-1">{platform?.label}</span>
                  <span className="text-zinc-400 text-sm truncate max-w-[200px]">{link.url}</span>
                </Link>
              );
            })
          ) : (
            <div className="bg-zinc-950/50 p-4 rounded-lg text-center text-zinc-400">
              ยังไม่มีการเชื่อมต่อ Social Media
            </div>
          )}
        </div>
      )}
    </div>
  );
}

