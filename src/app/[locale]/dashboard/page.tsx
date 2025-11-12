"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/database/supabase/client";
import { RoleGuard } from "@/components/features/auth";
import { Loading } from "@/components/design-system/primitives/Loading";
import { getUserRole, ROLE_NAMES } from "@/lib/auth/client";
import { DashboardLayout, dashboardMenuItems } from "@/components/shared";
import GamificationWidget from "@/components/features/gamification/GamificationWidget";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/auth/client";

// Types
interface GymApplication {
  id: string;
  gym_name: string;
  status: string;
  created_at: string;
}

interface BookingWithGym {
  id: string;
  booking_number: string;
  package_name: string;
  start_date: string;
  status: string;
  payment_status: string;
  price_paid: number;
  gyms?: {
    gym_name: string;
    slug: string;
  } | null;
}

// Helper Components

interface PartnerApplicationAlertProps {
  gymApplication: GymApplication | null;
  locale: string;
}

function PartnerApplicationAlert({
  gymApplication,
  locale,
}: PartnerApplicationAlertProps) {
  if (!gymApplication) return null;

  if (gymApplication.status === "pending") {
    return (
      <section className="mb-8">
        <Card className="bg-linear-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-yellow-500/30">
          <CardBody className="gap-4 p-8">
            <div className="flex sm:flex-row flex-col items-start gap-4">
              <div className="flex shrink-0 justify-center items-center bg-yellow-500/20 rounded-full w-16 h-16">
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
                    {gymApplication.gym_name}
                  </strong>{" "}
                  กำลังรอการตรวจสอบจากทีมงาน
                </p>
                <div className="bg-zinc-950/50 mb-4 p-4 border border-zinc-700 rounded-lg">
                  <p className="mb-2 text-sm">
                    📅 ส่งคำขอเมื่อ:{" "}
                    <span className="font-mono text-zinc-300">
                      {new Date(gymApplication.created_at).toLocaleDateString(
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

  if (gymApplication.status === "approved") {
    return (
      <section className="mb-8">
        <Card className="bg-linear-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30">
          <CardBody className="gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 justify-center items-center bg-green-500/20 rounded-full w-12 h-12">
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
  recentBookings: BookingWithGym[];
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
          href={`/${locale}/dashboard/bookings`}
          size="md"
          endContent={<ArrowRightIcon className="w-4 h-4" />}
          className="bg-red-600 text-white hover:bg-red-800 rounded-lg font-normal min-h-9"
        >
          ดูทั้งหมด
        </Button>
      </div>
      <Card className="bg-zinc-900 backdrop-blur-sm border border-zinc-700 rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label="Recent bookings table"
            classNames={{
              wrapper: "bg-transparent",
              thead: "bg-transparent",
              th: "bg-transparent text-white border-b border-zinc-700 py-4 font-medium",
            }}
          >
            <TableHeader>
              <TableColumn>เลขที่การจอง</TableColumn>
              <TableColumn>ยิม</TableColumn>
              <TableColumn>แพ็คเกจ</TableColumn>
              <TableColumn>วันที่</TableColumn>
              <TableColumn>ยอดเงิน</TableColumn>
              <TableColumn>สถานะ</TableColumn>
            </TableHeader>
            <TableBody emptyContent="ยังไม่มีการจอง">
              {recentBookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-default-500"
                  >
                    ยังไม่มีการจอง
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((booking: BookingWithGym) => (
                  <TableRow key={booking.id} className="hover:bg-zinc-800/50">
                    <TableCell className="font-mono text-sm">
                      {booking.booking_number}
                    </TableCell>
                    <TableCell className="font-semibold text-white">
                      {booking.gyms?.gym_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {booking.package_name}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {new Date(booking.start_date).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-white">
                      ฿{Number(booking.price_paid).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          booking.status === "pending"
                            ? "default"
                            : booking.status === "confirmed"
                              ? "warning"
                              : booking.status === "completed"
                                ? "success"
                                : "danger"
                        }
                        variant="flat"
                      >
                        {booking.status === "pending"
                          ? "รอดำเนินการ"
                          : booking.status === "confirmed"
                            ? "ยืนยันแล้ว"
                            : booking.status === "completed"
                              ? "เสร็จสิ้น"
                              : "ยกเลิก"}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
  const [gymApplication, setGymApplication] = useState<GymApplication | null>(
    null
  );
  const [recentBookings, setRecentBookings] = useState<BookingWithGym[]>([]);

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

      // Fetch gym application info
      const { data: gymData } = await supabase
        .from("gyms")
        .select("id, gym_name, status, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      setGymApplication(gymData);

      // Fetch recent bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(
          `
          id,
          booking_number,
          package_name,
          start_date,
          status,
          payment_status,
          price_paid,
          gyms:gym_id (
            gym_name,
            slug
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (bookingsData) {
        const mappedBookings = bookingsData.map((booking) => ({
          ...booking,
          gyms: Array.isArray(booking.gyms) ? booking.gyms[0] : booking.gyms,
        })) as BookingWithGym[];
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
      showPartnerButton={!gymApplication}
    >
      <PartnerApplicationAlert
        gymApplication={gymApplication}
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
