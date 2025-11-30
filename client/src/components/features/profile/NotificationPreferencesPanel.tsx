"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Switch, Button } from '@heroui/react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const switchClassNames = {
  base: 'group flex w-full items-center justify-between gap-4  border border-zinc-800/60 bg-zinc-100/60 px-4 py-3 transition hover:border-zinc-700 hover:bg-zinc-900/80',
  wrapper: 'flex h-7 w-12 shrink-0 items-center  border border-transparent bg-zinc-800 transition-all group-data-[selected=true]:bg-emerald-500',
  thumb: 'pointer-events-none h-5 w-5 shrink-0 translate-x-1  bg-white shadow-md transition-transform duration-200 group-data-[selected=true]:translate-x-6',
  label: 'flex flex-col text-left text-sm leading-tight',
};

export function NotificationPreferencesPanel() {
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    in_app_enabled: true,
    booking_confirmation: true,
    booking_reminder: true,
    gamification_updates: true,
    promotions_news: true,
    partner_messages: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/users/notification-preferences');
      const data = await response.json();
      
      if (data.success && data.data) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      toast.success('บันทึกการตั้งค่าแจ้งเตือนสำเร็จ!');
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
          <BellIcon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-xl text-zinc-950">การตั้งค่าการแจ้งเตือน</h3>
          <p className="text-zinc-400 text-sm">ควบคุมการแจ้งเตือนที่คุณต้องการรับ</p>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h4 className="font-semibold text-zinc-950">การตั้งค่าทั่วไป</h4>
          
          <Switch
            isSelected={preferences.email_enabled}
            onValueChange={(value) => setPreferences({ ...preferences, email_enabled: value })}
            classNames={switchClassNames}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">เปิดใช้งานอีเมล</span>
              <span className="text-zinc-400 text-xs">รับการแจ้งเตือนทางอีเมล</span>
            </div>
          </Switch>

          <Switch
            isSelected={preferences.in_app_enabled}
            onValueChange={(value) => setPreferences({ ...preferences, in_app_enabled: value })}
            classNames={switchClassNames}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">เปิดใช้งานในแอป</span>
              <span className="text-zinc-400 text-xs">รับการแจ้งเตือนในแอปพลิเคชัน</span>
            </div>
          </Switch>
        </div>

        {/* Specific Notifications */}
        <div className="space-y-4">
          <h4 className="font-semibold text-zinc-950">ประเภทการแจ้งเตือน</h4>
          
          <Switch
            isSelected={preferences.booking_confirmation}
            onValueChange={(value) => setPreferences({ ...preferences, booking_confirmation: value })}
            classNames={switchClassNames}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">ยืนยันการจอง</span>
              <span className="text-zinc-400 text-xs">แจ้งเตือนเมื่อจองสำเร็จ</span>
            </div>
          </Switch>

          <Switch
            isSelected={preferences.booking_reminder}
            onValueChange={(value) => setPreferences({ ...preferences, booking_reminder: value })}
            classNames={switchClassNames}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">เตือนก่อนเข้าชั้นเรียน</span>
              <span className="text-zinc-400 text-xs">แจ้งเตือนก่อนวันเข้าชั้นเรียน</span>
            </div>
          </Switch>

          <Switch
            isSelected={preferences.gamification_updates}
            onValueChange={(value) => setPreferences({ ...preferences, gamification_updates: value })}
            classNames={switchClassNames}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">อัปเดต Gamification</span>
              <span className="text-zinc-400 text-xs">แจ้งเตือนเมื่อได้รับ Points, Badges หรือ Achievements</span>
            </div>
          </Switch>

          <Switch
            isSelected={preferences.promotions_news}
            onValueChange={(value) => setPreferences({ ...preferences, promotions_news: value })}
            classNames={switchClassNames}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">โปรโมชั่นและข่าวสาร</span>
              <span className="text-zinc-400 text-xs">รับข่าวสารและโปรโมชั่นพิเศษ</span>
            </div>
          </Switch>

          <Switch
            isSelected={preferences.partner_messages}
            onValueChange={(value) => setPreferences({ ...preferences, partner_messages: value })}
            classNames={switchClassNames}
            className="privacy-switch"
          >
            <div className="flex flex-col">
              <span className="text-zinc-950">ข้อความจาก Partner</span>
              <span className="text-zinc-400 text-xs">รับข้อความและการอัปเดตจากโรงพยาบาล</span>
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

