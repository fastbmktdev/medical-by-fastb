"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Avatar, Chip } from '@heroui/react';
import {
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/database/supabase/client';
import type { MenuItem } from './DashboardLayout';

interface SidebarContentProps {
  menuItems: MenuItem[];
  pathname: string;
  roleLabel: string;
  roleColor: "primary" | "secondary" | "success" | "warning" | "danger";
  userEmail?: string;
  showPartnerButton: boolean;
  handleLogout: () => void;
  onLinkClick?: () => void;
  onClose?: () => void;
}

export default function SidebarContent({
  menuItems,
  pathname,
  roleLabel,
  roleColor,
  userEmail,
  showPartnerButton,
  handleLogout,
  onLinkClick,
  onClose,
}: SidebarContentProps) {
  const [displayName, setDisplayName] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    async function loadUserName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Load name from profiles table first
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const name = profile?.full_name || 
                     user.user_metadata?.full_name || 
                     user.user_metadata?.display_name || 
                     user.email?.split('@')[0] || 
                     'ผู้ใช้';
        setDisplayName(name);
      }
    }
    loadUserName();
  }, [supabase]);
  return (
    <>
      <div className={`flex items-center p-6 border-white/5 border-b ${onClose ? 'justify-between' : 'justify-start'}`}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex justify-center items-center bg-red-600 rounded w-10 h-10 font-bold text-white">
            MT
          </div>
          <span className="font-semibold text-white text-lg">
            MUAYTHAI
          </span>
        </Link>
        {onClose && (
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </Button>
        )}
      </div>

      <div className="p-6 border-white/5 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            size="md"
            classNames={{
              base: `bg-gradient-to-br ${
                roleColor === 'danger' ? 'from-red-600 to-red-700' :
                roleColor === 'secondary' ? 'from-purple-600 to-purple-700' :
                'from-blue-600 to-blue-700'
              }`,
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">
              {displayName || userEmail?.split('@')[0] || 'ผู้ใช้'}
            </p>
            <p className="text-default-400 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <Chip color={roleColor} variant="flat" size="sm" className="justify-center w-full">
          {roleLabel}
        </Chip>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-danger text-white font-semibold'
                  : 'text-default-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showPartnerButton && (
        <div className="px-4 pb-4">
          <Button
            as={Link}
            href="/partner/apply"
            variant="flat"
            color="secondary"
            startContent={<BriefcaseIcon className="w-5 h-5" />}
            className="w-full font-semibold"
            onPress={onLinkClick}
          >
            สมัครพาร์ทเนอร์
          </Button>
        </div>
      )}

      <div className="p-4 border-white/5 border-t">
        <Button
          onPress={handleLogout}
          variant="flat"
          color="danger"
          startContent={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
          className="w-full font-semibold"
        >
          ออกจากระบบ
        </Button>
      </div>
    </>
  );
}
