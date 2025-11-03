"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { signInWithGoogle, linkGoogleAccount, unlinkGoogleAccount, getConnectedAccounts } from '@/services/auth.service';
import { toast } from 'react-hot-toast';

interface ConnectedIdentity {
  id: string;
  provider: string;
  identity_data: {
    email?: string;
    name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

export function ConnectedAccountsPanel() {
  const supabase = createClient();
  const [identities, setIdentities] = useState<ConnectedIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      setIsLoading(true);
      const accounts = await getConnectedAccounts();
      setIdentities(accounts as ConnectedIdentity[]);
    } catch (error: any) {
      console.error('Error loading connected accounts:', error);
      toast.error('ไม่สามารถโหลดบัญชีที่เชื่อมต่อได้', {
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setIsLinking(true);
      await linkGoogleAccount();
      // The redirect will happen automatically
    } catch (error: any) {
      console.error('Error linking Google account:', error);
      toast.error(error.message || 'ไม่สามารถเชื่อมต่อบัญชี Google ได้', {
        duration: 3000,
      });
      setIsLinking(false);
    }
  };

  const handleUnlinkGoogle = async (provider: string = 'google') => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการเชื่อมต่อบัญชี Google นี้?')) {
      return;
    }

    try {
      setIsUnlinking(provider);
      await unlinkGoogleAccount(provider);
      await loadConnectedAccounts();
      toast.success('ยกเลิกการเชื่อมต่อบัญชี Google สำเร็จ', {
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error unlinking Google account:', error);
      toast.error(error.message || 'ไม่สามารถยกเลิกการเชื่อมต่อได้', {
        duration: 3000,
      });
    } finally {
      setIsUnlinking(null);
    }
  };

  const hasGoogleAccount = identities.some((id) => id.provider === 'google');

  if (isLoading) {
    return (
      <Card className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-700">
        <CardBody>
          <div className="flex justify-center items-center py-8">
            <div className="border-4 border-red-600 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-700">
      <CardHeader className="border-zinc-700 border-b">
        <div>
          <h3 className="font-bold text-xl">บัญชีที่เชื่อมต่อ</h3>
          <p className="text-zinc-400 text-sm">
            จัดการบัญชีโซเชียลที่เชื่อมต่อกับบัญชีของคุณ
          </p>
        </div>
      </CardHeader>
      <CardBody className="gap-4">
        {/* Google Account */}
        <div className="flex justify-between items-center p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">Google</p>
                {hasGoogleAccount && (
                  <Chip
                    size="sm"
                    color="success"
                    variant="flat"
                    startContent={<CheckCircleIcon className="w-3 h-3" />}
                  >
                    เชื่อมต่อแล้ว
                  </Chip>
                )}
              </div>
              {hasGoogleAccount && (
                <p className="text-zinc-400 text-sm mt-1">
                  {identities.find((id) => id.provider === 'google')?.identity_data?.email ||
                    'บัญชี Google'}
                </p>
              )}
            </div>
          </div>
          {hasGoogleAccount ? (
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={
                isUnlinking === 'google' ? (
                  <div className="border-2 border-red-500 border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )
              }
              onPress={() => handleUnlinkGoogle('google')}
              isDisabled={isUnlinking !== null}
            >
              {isUnlinking === 'google' ? 'กำลังยกเลิก...' : 'ยกเลิกการเชื่อมต่อ'}
            </Button>
          ) : (
            <Button
              size="sm"
              color="primary"
              variant="solid"
              startContent={
                isLinking ? (
                  <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )
              }
              onPress={handleConnectGoogle}
              isDisabled={isLinking}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {isLinking ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Google'}
            </Button>
          )}
        </div>

        {/* Info message */}
        <div className="bg-blue-950/30 border border-blue-800/50 p-4 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>เคล็ดลับ:</strong> การเชื่อมต่อบัญชี Google ช่วยให้คุณเข้าสู่ระบบได้ง่ายขึ้น
            และไม่ต้องจำรหัสผ่าน
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

