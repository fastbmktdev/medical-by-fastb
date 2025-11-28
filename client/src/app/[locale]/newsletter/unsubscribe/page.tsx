"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Card, CardBody, Button } from '@heroui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Loading } from '@/components/design-system/primitives/Loading';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('กำลังประมวลผล...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('ไม่พบ token สำหรับยกเลิกการสมัครสมาชิก');
      return;
    }

    async function unsubscribe() {
      try {
        const response = await fetch('/api/newsletter/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('ยกเลิกการสมัครสมาชิกจดหมายข่าวสำเร็จแล้ว');
        } else {
          setStatus('error');
          setMessage(data.error || 'เกิดข้อผิดพลาดในการยกเลิกการสมัครสมาชิก');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
    }

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      <Card className="max-w-md w-full bg-zinc-100/50 backdrop-blur-sm border border-zinc-700">
        <CardBody className="p-8 text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loading centered size="xl" />
              <p className="text-white">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-semibold text-white">ยกเลิกการสมัครสมาชิกสำเร็จ</h1>
              <p className="text-zinc-400">{message}</p>
              <Button
                color="primary"
                onPress={() => router.push(`/${locale}`)}
                className="w-full"
              >
                กลับสู่หน้าแรก
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />
              <h1 className="text-2xl font-semibold text-white">เกิดข้อผิดพลาด</h1>
              <p className="text-zinc-400">{message}</p>
              <Button
                variant="light"
                onPress={() => router.push(`/${locale}`)}
                className="w-full"
              >
                กลับสู่หน้าแรก
              </Button>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
        <Card className="max-w-md w-full bg-zinc-100/50 backdrop-blur-sm border border-zinc-700">
          <CardBody className="p-8 text-center space-y-4">
            <Loading centered size="xl" />
            <p className="text-white">กำลังโหลด...</p>
          </CardBody>
        </Card>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
