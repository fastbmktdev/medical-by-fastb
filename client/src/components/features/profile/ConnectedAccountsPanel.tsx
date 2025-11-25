"use client";

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Button, Chip } from '@heroui/react';
import {
  CheckCircleIcon,
  LinkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  linkGoogleAccount,
  linkFacebookAccount,
  unlinkOAuthAccount,
  getConnectedAccounts,
} from '@shared/services/auth.service';
import { toast } from 'react-hot-toast';
import { Loading, LoadingSpinner } from '@/components/design-system/primitives/Loading';
import { ConfirmationModal } from '@/components/compositions/modals/ConfirmationModal';

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
  const [identities, setIdentities] = useState<ConnectedIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [providerToUnlink, setProviderToUnlink] = useState<'google' | 'facebook' | null>(null);

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      setIsLoading(true);
      const accounts = await getConnectedAccounts();
      setIdentities(accounts as ConnectedIdentity[]);
    } catch (error) {
      console.error('Error loading connected accounts:', error);
      toast.error('ไม่สามารถโหลดบัญชีที่เชื่อมต่อได้', {
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectProvider = async (provider: 'google' | 'facebook') => {
    const providerName = provider === 'google' ? 'Google' : 'Facebook';
    const linkHandler = provider === 'google' ? linkGoogleAccount : linkFacebookAccount;

    try {
      setLinkingProvider(provider);
      await linkHandler();
      // The redirect will happen automatically
    } catch (error) {
      console.error(`Error linking ${provider} account:`, error);
      const message = error instanceof Error ? error.message : `ไม่สามารถเชื่อมต่อบัญชี ${providerName} ได้`;
      toast.error(message, {
        duration: 3000,
      });
      setLinkingProvider(null);
    }
  };

  const handleUnlinkClick = (provider: 'google' | 'facebook') => {
    setProviderToUnlink(provider);
    setIsUnlinkModalOpen(true);
  };

  const confirmUnlink = async () => {
    if (!providerToUnlink) return;

    const providerName = providerToUnlink === 'google' ? 'Google' : 'Facebook';

    try {
      setIsUnlinking(providerToUnlink);
      await unlinkOAuthAccount(providerToUnlink);
      await loadConnectedAccounts();
      toast.success(`ยกเลิกการเชื่อมต่อบัญชี ${providerName} สำเร็จ`, {
        duration: 3000,
      });
      setIsUnlinkModalOpen(false);
      setProviderToUnlink(null);
    } catch (error) {
      console.error(`Error unlinking ${providerToUnlink} account:`, error);
      const message = error instanceof Error ? error.message : `ไม่สามารถยกเลิกการเชื่อมต่อบัญชี ${providerName} ได้`;
      toast.error(message, {
        duration: 3000,
      });
    } finally {
      setIsUnlinking(null);
    }
  };

  const cancelUnlink = () => {
    setIsUnlinkModalOpen(false);
    setProviderToUnlink(null);
  };

  const hasGoogleAccount = identities.some((id) => id.provider === 'google');
  const hasFacebookAccount = identities.some((id) => id.provider === 'facebook');

  if (isLoading) {
    return (
      <Card className="bg-zinc-100/50 backdrop-blur-sm border border-zinc-700">
        <CardBody>
          <div className="flex justify-center items-center py-8">
            <Loading size="lg" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-100/50 backdrop-blur-sm border border-zinc-700">
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
        <div className="flex justify-between items-center p-4 bg-zinc-900/50 border border-zinc-700 ">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-10 h-10 bg-linear-to-br from-red-500 to-yellow-500  flex items-center justify-center">
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
                  <LoadingSpinner size="xs" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )
              }
              onPress={() => handleUnlinkClick('google')}
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
                linkingProvider === 'google' ? (
                  <LoadingSpinner size="xs" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )
              }
              onPress={() => handleConnectProvider('google')}
              isDisabled={linkingProvider !== null}
              className="bg-linear-to-r from-blue-600 to-blue-700"
            >
              {linkingProvider === 'google' ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Google'}
            </Button>
          )}
        </div>

        {/* Facebook Account */}
        <div className="flex justify-between items-center p-4 bg-zinc-900/50 border border-zinc-700 ">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-10 h-10 bg-linear-to-br from-blue-600 to-blue-800  flex items-center justify-center">
              <span className="text-white font-bold text-lg">f</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">Facebook</p>
                {hasFacebookAccount && (
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
              {hasFacebookAccount && (
                <p className="text-zinc-400 text-sm mt-1">
                  {identities.find((id) => id.provider === 'facebook')?.identity_data?.email ||
                    'บัญชี Facebook'}
                </p>
              )}
            </div>
          </div>
          {hasFacebookAccount ? (
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={
                isUnlinking === 'facebook' ? (
                  <LoadingSpinner size="xs" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )
              }
              onPress={() => handleUnlinkClick('facebook')}
              isDisabled={isUnlinking !== null}
            >
              {isUnlinking === 'facebook' ? 'กำลังยกเลิก...' : 'ยกเลิกการเชื่อมต่อ'}
            </Button>
          ) : (
            <Button
              size="sm"
              color="primary"
              variant="solid"
              startContent={
                linkingProvider === 'facebook' ? (
                  <LoadingSpinner size="xs" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )
              }
              onPress={() => handleConnectProvider('facebook')}
              isDisabled={linkingProvider !== null}
              className="bg-linear-to-r from-blue-700 to-blue-900"
            >
              {linkingProvider === 'facebook' ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Facebook'}
            </Button>
          )}
        </div>

        {/* Info message */}
        <div className="bg-blue-950/30 border border-blue-800/50 p-4 ">
          <p className="text-blue-300 text-sm">
            💡 <strong>เคล็ดลับ:</strong> การเชื่อมต่อบัญชี Google หรือ Facebook ช่วยให้คุณเข้าสู่ระบบได้ง่ายขึ้น
            และไม่ต้องจำรหัสผ่าน
          </p>
        </div>
      </CardBody>

      <ConfirmationModal
        isOpen={isUnlinkModalOpen}
        onClose={cancelUnlink}
        title="ยืนยันการยกเลิกการเชื่อมต่อ"
        message={`คุณต้องการยกเลิกการเชื่อมต่อบัญชี ${providerToUnlink === 'google' ? 'Google' : 'Facebook'} หรือไม่? คุณยังสามารถเชื่อมต่อใหม่ได้ในภายหลัง`}
        confirmText="ยกเลิกการเชื่อมต่อ"
        cancelText="ไม่ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmUnlink}
        loading={!!isUnlinking}
        testId="unlink-account-modal"
      />
    </Card>
  );
}

