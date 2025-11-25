"use client";

import { Link } from '@/navigation';
import { useEffect, useState } from "react";
import { createClient } from '@shared/lib/database/supabase/client';
import { getUserRole, UserRole, getDashboardPath } from '@shared/lib/auth';
import { ShieldExclamationIcon, ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, Button, Chip } from "@heroui/react";

/**
 * 403 Forbidden Page
 * 
 * Shows when user tries to access a page they don't have permission for
 * Provides contextual links based on their role
 */
export default function ForbiddenPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const role = await getUserRole(user.id);
        setUserRole(role);
      }
      
      setIsLoading(false);
    }

    checkUser();
  }, [supabase]);

  return (
    <div className="flex flex-col justify-center items-center bg-linear-to-br from-zinc-950 to-zinc-950 px-4 min-h-screen text-white">
      <Card className="bg-default-100/50 backdrop-blur-sm border-none w-full max-w-2xl">
        <CardBody className="p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex justify-center items-center bg-danger/20  w-20 h-20">
              <ShieldExclamationIcon className="w-12 h-12 text-danger" />
            </div>
          </div>

          {/* Error Code */}
          <h1 className="mb-4 font-bold text-danger text-6xl text-center">403</h1>
          
          {/* Title */}
          <h2 className="mb-4 font-semibold text-3xl text-center tracking-tight">
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          
          {/* Description */}
          <p className="mx-auto mb-2 max-w-lg text-default-700 text-xl text-center">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
          <p className="mx-auto mb-8 max-w-lg text-default-400 text-center">
            หน้านี้สงวนไว้สำหรับผู้ใช้ที่มีสิทธิ์เฉพาะเท่านั้น
            กรุณาตรวจสอบว่าคุณเข้าสู่ระบบด้วยบัญชีที่ถูกต้องหรือไม่
          </p>

          {/* Action Buttons */}
          <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
            {!isLoading && userRole ? (
              <>
                <Button
                  as={Link}
                  href={getDashboardPath(userRole)}
                  color="danger"
                  size="lg"
                  startContent={<HomeIcon className="w-5 h-5" />}
                  className="font-semibold"
                >
                  ไปที่แดshบอร์ด
                </Button>

                <Button
                  onPress={() => window.history.back()}
                  variant="bordered"
                  size="lg"
                  startContent={<ArrowLeftIcon className="w-5 h-5" />}
                  className="font-semibold"
                >
                  ย้อนกลับ
                </Button>
              </>
            ) : (
              <>
                <Button
                  as={Link}
                  href="/"
                  color="danger"
                  size="lg"
                  startContent={<HomeIcon className="w-5 h-5" />}
                  className="font-semibold"
                >
                  กลับหน้าหลัก
                </Button>

                <Button
                  as={Link}
                  href="/login"
                  variant="bordered"
                  size="lg"
                  className="font-semibold"
                >
                  เข้าสู่ระบบ
                </Button>
              </>
            )}
          </div>

          {/* Additional Info */}
          {!isLoading && userRole && (
            <div className="bg-default-200/50 mt-8 p-4 ">
              <p className="text-default-600 text-sm text-center">
                คุณกำลังเข้าสู่ระบบในฐานะ:{" "}
                <Chip
                  color="danger"
                  variant="flat"
                  size="sm"
                  className="ml-2"
                >
                  {userRole === 'authenticated' && 'ผู้ใช้ทั่วไป'}
                  {userRole === 'partner' && 'พาร์ทเนอร์'}
                  {userRole === 'admin' && 'ผู้ดูแลระบบ'}
                </Chip>
              </p>
              <p className="mt-2 text-default-400 text-xs text-center">
                หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 pt-6 border-default-200 border-t text-center">
            <p className="text-default-400 text-sm">
              ต้องการความช่วยเหลือ?{" "}
              <Link href="/contact" className="text-danger hover:text-danger-400 underline">
                ติดต่อเรา
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
