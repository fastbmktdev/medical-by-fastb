"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Switch, Button } from '@heroui/react';
import { ShieldCheckIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export function PrivacySettingsPanel() {
  const [settings, setSettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    show_training_history: true,
    show_achievements: true,
    show_social_links: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/users/privacy-settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/privacy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      toast.success('บันทึกการตั้งค่าความเป็นส่วนตัวสำเร็จ!');
    } catch (error: unknown) {
      console.error('Save error:', error);
      toast.error((error as Error).message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-zinc-900/50 h-64 " />;
  }

  return (
    <Card className="bg-zinc-100/50 backdrop-blur-sm border border-zinc-700">
      <CardHeader className="flex items-center gap-3 border-zinc-700 border-b">
        <div className="bg-blue-600/20 p-2 ">
          <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-xl text-zinc-950">การตั้งค่าความเป็นส่วนตัว</h3>
          <p className="text-zinc-400 text-sm">ควบคุมข้อมูลที่ผู้ใช้คนอื่นสามารถเห็นได้</p>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="text-zinc-950 space-y-2">
          <Select
            label="ความโปร่งใสของโปรไฟล์"
            labelPlacement="outside"
            selectedKeys={[settings.profile_visibility]}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              setSettings({ ...settings, profile_visibility: value });
            }}
            variant="bordered"
            classNames={{
              trigger: "bg-zinc-100/50 border-zinc-700",
              label: "text-zinc-950/90 font-medium text-sm",
            }}
            aria-label="ความโปร่งใสของโปรไฟล์"
          >
            <SelectItem key="public">สาธารณะ - ทุกคนสามารถดูได้</SelectItem>
            <SelectItem key="private">ส่วนตัว - เฉพาะคุณเท่านั้น</SelectItem>
            <SelectItem key="friends_only">เพื่อนเท่านั้น</SelectItem>
          </Select>
        </div>

        <div className="space-y-4">
          <Switch
            isSelected={settings.show_email}
            onValueChange={(value) => setSettings({ ...settings, show_email: value })}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">แสดงอีเมล</span>
              <span className="text-zinc-400 text-xs">อนุญาตให้ผู้ใช้คนอื่นเห็นอีเมลของคุณ</span>
            </div>
          </Switch>

          <Switch
            isSelected={settings.show_phone}
            onValueChange={(value) => setSettings({ ...settings, show_phone: value })}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">แสดงเบอร์โทรศัพท์</span>
              <span className="text-zinc-400 text-xs">อนุญาตให้ผู้ใช้คนอื่นเห็นเบอร์โทรศัพท์ของคุณ</span>
            </div>
          </Switch>

          <Switch
            isSelected={settings.show_training_history}
            onValueChange={(value) => setSettings({ ...settings, show_training_history: value })}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">แสดงประวัติการรักษา</span>
              <span className="text-zinc-400 text-xs">อนุญาตให้ผู้ใช้คนอื่นเห็นประวัติการรักษาของคุณ</span>
            </div>
          </Switch>

          <Switch
            isSelected={settings.show_achievements}
            onValueChange={(value) => setSettings({ ...settings, show_achievements: value })}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">แสดง Achievements</span>
              <span className="text-zinc-400 text-xs">อนุญาตให้ผู้ใช้คนอื่นเห็น Badges และ Achievements ของคุณ</span>
            </div>
          </Switch>

          <Switch
            isSelected={settings.show_social_links}
            onValueChange={(value) => setSettings({ ...settings, show_social_links: value })}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">แสดง Social Media Links</span>
              <span className="text-zinc-400 text-xs">อนุญาตให้ผู้ใช้คนอื่นเห็น Social Media Links ของคุณ</span>
            </div>
          </Switch>
        </div>

        <Button
          color="primary"
          onPress={handleSave}
          isLoading={isSaving}
          startContent={<CheckIcon className="w-4 h-4" />}
          className="w-full"
        >
          บันทึกการตั้งค่า
        </Button>
      </CardBody>
    </Card>
  );
}

