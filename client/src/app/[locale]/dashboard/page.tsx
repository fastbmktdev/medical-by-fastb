"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { createClient } from '@shared/lib/database/supabase/client';
import { RoleGuard } from "@/components/features/auth";
import { Loading } from "@/components/design-system/primitives/Loading";
import { getUserRole, ROLE_NAMES } from '@shared/lib/auth/client';
import { DashboardLayout, dashboardMenuItems, ResponsiveTable } from "@/components/shared";
import type { ResponsiveTableColumn } from "@/components/shared";
import GamificationWidget from "@/components/features/gamification/GamificationWidget";
import {
  Card,
  CardBody,
  Button,
  Chip,
} from "@heroui/react";
import {
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import type { UserRole } from '@shared/lib/auth/client';

// Types
interface HospitalApplication {
  id: string;
  hospital_name: string;
  status: string;
  created_at: string;
}

interface BookingWithHospital {
  id: string;
  booking_number: string;
  package_name: string;
  start_date: string;
  status: string;
  payment_status: string;
  price_paid: number;
  hospitals?: {
    hospital_name: string;
    slug: string;
  } | null;
}

// Helper Components

interface PartnerApplicationAlertProps {
  hospitalApplication: HospitalApplication | null;
  locale: string;
}

function PartnerApplicationAlert({
  hospitalApplication,
  locale,
}: PartnerApplicationAlertProps) {
  if (!hospitalApplication) return null;

  if (hospitalApplication.status === "pending") {
    return (
      <section className="mb-8">
        <Card className="bg-linear-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-yellow-500/30">
          <CardBody className="gap-4 p-8">
            <div className="flex sm:flex-row flex-col items-start gap-4">
              <div className="flex shrink-0 justify-center items-center bg-yellow-500/20  w-16 h-16">
                <ClockIcon className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2 mb-2">
                  <h2 className="font-bold text-2xl">
                    📋 รอการอนุมัติ Partner
                  </h2>
                  <Chip color="warning" variant="flat" size="lg">
                    กำลังตรวจสอบ
                  </Chip>
                </div>
                <p className="mb-4 text-zinc-300 text-lg">
                  คำขอสมัครของคุณสำหรับ{" "}
                  <strong className="text-yellow-400">
                    {hospitalApplication.hospital_name}
                  </strong>{" "}
                  กำลังรอการตรวจสอบจากทีมงาน
                </p>
                <div className="bg-zinc-100/50 mb-4 p-4 border border-zinc-700 ">
                  <p className="mb-2 text-sm">
                    📅 ส่งคำขอเมื่อ:{" "}
                    <span className="font-mono text-zinc-300">
                      {new Date(hospitalApplication.created_at).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </p>
                  <p className="text-zinc-400 text-sm">
                    ⏱️ ระยะเวลาการตรวจสอบโดยเฉลี่ย:{" "}
                    <strong className="text-white">3-5 วันทำการ</strong>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-sm">🔍 ขั้นตอนการตรวจสอบ:</p>
                  <ul className="space-y-1 ml-4 text-zinc-300 text-sm list-disc">
                    <li>ตรวจสอบความถูกต้องของข้อมูล</li>
                    <li>ตรวจสอบความครบถ้วนของเอกสาร</li>
                    <li>ยืนยันตัวตนและสถานที่</li>
                    <li>แอดมินอนุมัติและเปิดใช้งานบัญชี Partner</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>
    );
  }

  if (hospitalApplication.status === "approved") {
    return (
      <section className="mb-8">
        <Card className="bg-linear-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30">
          <CardBody className="gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 justify-center items-center bg-green-500/20  w-12 h-12">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="font-bold text-xl">
                  ✅ คำขอของคุณได้รับการอนุมัติแล้ว!
                </h2>
                <p className="text-green-300 text-sm">
                  ตอนนี้คุณสามารถเข้าใช้งาน Partner Dashboard ได้แล้ว
                </p>
              </div>
              <Button
                as={Link}
                href={`/${locale}/partner/dashboard`}
                color="success"
                variant="shadow"
                size="lg"
                endContent={<ArrowRightIcon className="w-5 h-5" />}
                className="ml-auto font-bold"
              >
                เข้าสู่ Partner Dashboard
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
    );
  }

  return null;
}

interface RecentBookingsSectionProps {
  recentBookings: BookingWithHospital[];
  locale: string;
}

function RecentBookingsSection({
  recentBookings,
  locale,
}: RecentBookingsSectionProps) {
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-xl">การจองล่าสุด</h2>
        <Button
          as={Link}
          href={`/${locale}/dashboard/appointments`}
          size="md"
          endContent={<ArrowRightIcon className="w-4 h-4" />}
          className="bg-red-600 text-white hover:bg-red-800  font-normal min-h-9"
        >
          ดูทั้งหมด
        </Button>
      </div>
      <Card className="bg-zinc-900 backdrop-blur-sm border border-zinc-700 ">
        <CardBody className="p-0">
          <ResponsiveTable
            columns={[
              {
                key: 'booking_number',
                label: 'เลขที่การจอง',
                render: (appointment) => (
                  <span className="font-mono text-sm">{appointment.booking_number}</span>
                ),
                showOnMobile: true,
              },
              {
                key: 'hospital_name',
                label: 'โรงพยาบาล',
                render: (appointment) => (
                  <span className="font-semibold text-white">
                    {appointment.hospitals?.hospital_name || "N/A"}
                  </span>
                ),
                showOnMobile: true,
              },
              {
                key: 'package_name',
                label: 'แพ็คเกจ',
                render: (appointment) => (
                  <span className="text-default-400">{appointment.package_name}</span>
                ),
                showOnMobile: false,
              },
              {
                key: 'start_date',
                label: 'วันที่',
                render: (appointment) => (
                  <span className="text-default-400">
                    {new Date(appointment.start_date).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ),
                showOnMobile: false,
              },
              {
                key: 'price_paid',
                label: 'ยอดเงิน',
                render: (appointment) => (
                  <span className="font-mono text-white">
                    ฿{Number(appointment.price_paid).toLocaleString()}
                  </span>
                ),
                showOnMobile: true,
              },
              {
                key: 'status',
                label: 'สถานะ',
                render: (appointment) => (
                  <Chip
                    size="sm"
                    color={
                      appointment.status === "pending"
                        ? "default"
                        : appointment.status === "confirmed"
                          ? "warning"
                          : appointment.status === "completed"
                            ? "success"
                            : "danger"
                    }
                    variant="flat"
                  >
                    {appointment.status === "pending"
                      ? "รอดำเนินการ"
                      : appointment.status === "confirmed"
                        ? "ยืนยันแล้ว"
                        : appointment.status === "completed"
                          ? "เสร็จสิ้น"
                          : "ยกเลิก"}
                  </Chip>
                ),
                showOnMobile: true,
              },
            ] as ResponsiveTableColumn<BookingWithHospital>[]}
            data={recentBookings}
            keyExtractor={(appointment) => appointment.id}
            emptyContent="ยังไม่มีการจอง"
            ariaLabel="Recent appointments table"
          />
        </CardBody>
      </Card>
    </section>
  );
}

// Main Content Component
function DashboardContent() {
  const supabase = createClient();
  const router = useRouter();
  const locale = useLocale();

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hospitalApplication, setHospitalApplication] = useState<HospitalApplication | null>(
    null
  );
  const [recentBookings, setRecentBookings] = useState<BookingWithHospital[]>([]);

  const loadUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      try {
        const role = await getUserRole(user.id);
        setUserRole(role);

        if (role === "admin") {
          router.push(`/${locale}/admin/dashboard`);
          return;
        }
        if (role === "partner") {
          router.push(`/${locale}/partner/dashboard`);
          return;
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole("authenticated");
      }

      // Fetch hospital application info
      const { data: hospitalData } = await supabase
        .from("hospitals")
        .select("id, hospital_name, status, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      setHospitalApplication(hospitalData);

      // Fetch recent appointments
      const { data: bookingsData } = await supabase
        .from("appointments")
        .select(
          `
          id,
          booking_number,
          package_name,
          start_date,
          status,
          payment_status,
          price_paid,
          hospitals:hospital_id (
            hospital_name,
            slug
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (bookingsData) {
        const mappedBookings = bookingsData.map((appointment: {
          id: string;
          booking_number: string;
          package_name: string;
          start_date: string;
          status: string;
          payment_status: string;
          price_paid: number;
          hospitals?: {
            hospital_name: string;
            slug: string;
          } | {
            hospital_name: string;
            slug: string;
          }[] | null;
        }) => ({
          ...appointment,
          hospitals: Array.isArray(appointment.hospitals) ? appointment.hospitals[0] : appointment.hospitals,
        })) as BookingWithHospital[];
        setRecentBookings(mappedBookings);
      }
    }

    setIsLoading(false);
  }, [supabase, router, locale]);

  useEffect(() => {
    void loadUser();  
  }, [loadUser]);

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={dashboardMenuItems}
        headerTitle="แดชบอร์ด"
        headerSubtitle="จัดการข้อมูลและกิจกรรมของคุณ"
        roleLabel={userRole ? ROLE_NAMES[userRole] : "ผู้ใช้ทั่วไป"}
        roleColor="primary"
        userEmail={user?.email}
        showPartnerButton={true}
      >
        <div className="flex justify-center items-center py-20">
          <Loading centered size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={dashboardMenuItems}
      headerTitle="แดชบอร์ด"
      headerSubtitle="จัดการข้อมูลและกิจกรรมของคุณ"
      roleLabel={userRole ? ROLE_NAMES[userRole] : "ผู้ใช้ทั่วไป"}
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={!hospitalApplication}
    >
      <PartnerApplicationAlert
        hospitalApplication={hospitalApplication}
        locale={locale}
      />

      {/* Gamification Widget */}
      <section className="mb-8">
        <GamificationWidget />
      </section>
      <RecentBookingsSection recentBookings={recentBookings} locale={locale} />
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <DashboardContent />
    </RoleGuard>
  );
}
