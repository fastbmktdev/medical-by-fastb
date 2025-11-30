"use client";

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/navigation';
import { Button, Avatar, Chip } from '@heroui/react';
import {
  ArrowRightStartOnRectangleIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@shared/lib/database/supabase/client';
import type { MenuItem } from '../DashboardLayout';
import { cn } from '@shared/lib/utils/cn';

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

  // Handle when a navigation (menu/partner) link is clicked: call both callbacks if present
  const handleNavClick = useCallback(
    (extraFn?: () => void) => {
      if (onLinkClick) onLinkClick();
      if (onClose) onClose();
      if (extraFn) extraFn();
    },
    [onLinkClick, onClose]
  );

  // Handle logout and also call onClose
  const handleLogoutClick = useCallback(() => {
    handleLogout();
    if (onClose) onClose();
  }, [handleLogout, onClose]);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 border-white/5 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            size="md"
            classNames={{
              base: `bg-linear-to-br ${
                roleColor === 'danger' ? 'from-red-600 to-red-700' :
                roleColor === 'secondary' ? 'from-[#00ACC1] to-[#0097A7]' :
                'from-[#A78BFA] to-[#8B5CF6]'
              }`,
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {displayName || userEmail?.split('@')[0] || 'ผู้ใช้'}
            </p>
            <p className="text-default-400 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <Chip color={roleColor} variant="flat" size="sm" className="justify-center w-full">
          {roleLabel}
        </Chip>
      </div>

      <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto text-sm">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick()}
              className={cn(
                'flex items-center gap-3 px-4 py-2  transition-all',
                isActive
                  ? 'bg-violet-700 text-zinc-950 font-semibold shadow-lg shadow-violet-700/40'
                  : 'text-default-400 hover:bg-violet-700/10 hover:text-zinc-950'
              )}
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
            className="w-full font-medium"
            onPress={() => handleNavClick()}
          >
            สมัครพาร์ทเนอร์
          </Button>
        </div>
      )}

      <div className="p-4 border-white/5 border-t">
        <Button
          onPress={handleLogoutClick}
          variant="flat"
          color="danger"
          startContent={<ArrowRightStartOnRectangleIcon className="w-5 h-5" />}
          className="w-full font-medium  bg-red-600 hover:bg-red-700 text-zinc-950"
        >
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );
}
