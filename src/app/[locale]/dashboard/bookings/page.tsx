"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/database/supabase/client";
import { RoleGuard } from "@/components/features/auth";
import { DashboardLayout, dashboardMenuItems } from "@/components/shared";
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
  Tabs,
  Tab,
} from "@heroui/react";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import { Loading } from "@/components/design-system/primitives/Loading";
import type { Booking as BookingType } from "@/types/database.types";

interface BookingWithGym extends BookingType {
  gyms?: {
    id: string;
    gym_name: string;
    gym_name_english?: string;
    slug: string;
  };
}

function BookingsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingWithGym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user's bookings with gym information
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
            *,
            gyms:gym_id (
              id,
              gym_name,
              gym_name_english,
              slug
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setBookings(data as BookingWithGym[]);
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const getStatusChip = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        color: "warning" | "success" | "danger" | "default";
        icon: typeof ClockIcon;
      }
    > = {
      pending: {
        label: "รอดำเนินการ",
        color: "default" as const,
        icon: ClockIcon,
      },
      confirmed: {
        label: "ยืนยันแล้ว",
        color: "warning" as const,
        icon: ClockIcon,
      },
      completed: {
        label: "เสร็จสิ้น",
        color: "success" as const,
        icon: CheckCircleIcon,
      },
      cancelled: {
        label: "ยกเลิก",
        color: "danger" as const,
        icon: XCircleIcon,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Chip
        color={config.color}
        variant="flat"
        size="sm"
        startContent={<Icon className="w-3 h-3" />}
      >
        {config.label}
      </Chip>
    );
  };

  const getPaymentStatusChip = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: "warning" | "success" | "danger" | "default" }
    > = {
      pending: { label: "รอชำระ", color: "warning" as const },
      paid: { label: "ชำระแล้ว", color: "success" as const },
      failed: { label: "ล้มเหลว", color: "danger" as const },
      refunded: { label: "คืนเงินแล้ว", color: "default" as const },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip color={config.color} variant="flat" size="sm">
        {config.label}
      </Chip>
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    if (selectedTab === "all") return true;
    return booking.status === selectedTab;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={dashboardMenuItems}
        headerTitle="การจองของฉัน"
        headerSubtitle="จัดการและดูประวัติการจองทั้งหมด"
        roleLabel="ผู้ใช้ทั่วไป"
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
      headerTitle="การจองของฉัน"
      headerSubtitle="จัดการและดูประวัติการจองทั้งหมด"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={true}
    >
      {/* Booking Statistics */}
      <section className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "ทั้งหมด",
            value: stats.total,
            icon: CalendarIcon,
            color: "text-primary",
          },
          {
            label: "รอดำเนินการ",
            value: stats.pending,
            icon: ClockIcon,
            color: "text-warning",
          },
          {
            label: "ยืนยันแล้ว",
            value: stats.confirmed,
            icon: CheckCircleIcon,
            color: "text-success",
          },
          {
            label: "ยกเลิก",
            value: stats.cancelled,
            icon: XCircleIcon,
            color: "text-danger",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card
            key={label}
            className="bg-zinc-900 backdrop-blur-sm border-none rounded-lg"
          >
            <CardBody className="flex flex-row items-center justify-between border border-zinc-700 rounded-lg">
              <div>
                <p className="text-sm text-default-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {Math.max(0, value ?? 0)}
                </p>
              </div>
              <span className={`${color}`}>
                <Icon className="w-8 h-8" />
              </span>
            </CardBody>
          </Card>
        ))}
      </section>

      {/* Bookings Table */}
      <section>
        <Card className="backdrop-blur-sm border-none rounded-lg">
          <CardBody className="p-0">
            <Tabs
              aria-label="Bookings filter tabs"
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(String(key))}
              disableAnimation
              classNames={{
                base: "w-full",
                tabList:
                  "bg-zinc-900/60 border border-zinc-700 rounded-lg p-1 gap-1 overflow-x-auto !p-0.5",
                tab: "px-4 py-2 text-sm rounded-md text-default-400 transition-all data-[hover-unselected=true]:bg-zinc-800/60 data-[selected=true]:bg-red-600 data-[selected=true]:text-white",
                tabContent:
                  "font-normal group-data-[selected=true]:font-medium group-data-[selected=true]:text-white",
                cursor: "hidden",
              }}
            >
              <Tab key="all" title="ทั้งหมด" />
              <Tab key="pending" title="รอดำเนินการ" />
              <Tab key="confirmed" title="ยืนยันแล้ว" />
              <Tab key="completed" title="เสร็จสิ้น" />
              <Tab key="cancelled" title="ยกเลิก" />
            </Tabs>

            <Table
              aria-label="Bookings table"
              classNames={{
                wrapper:
                  "bg-zinc-900/60 border border-zinc-700 rounded-lg gap-1 overflow-x-auto text-sm mt-4",
                thead: "bg-transparent",
                th: "bg-transparent text-white border-b border-zinc-700 p-0 font-medium",
              }}
            >
              <TableHeader>
                <TableColumn>เลขที่การจอง</TableColumn>
                <TableColumn>ยิม</TableColumn>
                <TableColumn>แพ็คเกจ</TableColumn>
                <TableColumn>วันที่เริ่ม</TableColumn>
                <TableColumn>วันที่สิ้นสุด</TableColumn>
                <TableColumn>สถานะการจอง</TableColumn>
                <TableColumn>สถานะการชำระ</TableColumn>
                <TableColumn>ยอดเงิน</TableColumn>
                <TableColumn>การกระทำ</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="ไม่พบข้อมูลการจอง"
                className="text-white"
              >
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">
                      {booking.booking_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-white">
                          {booking.gyms?.gym_name || "N/A"}
                        </p>
                        {booking.gyms?.gym_name_english && (
                          <p className="text-default-400 text-xs">
                            {booking.gyms.gym_name_english}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white">{booking.package_name}</p>
                        <p className="text-default-400 text-xs">
                          {booking.package_type === "one_time"
                            ? "ครั้งเดียว"
                            : `${booking.duration_months} เดือน`}
                        </p>
                      </div>
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
                    <TableCell className="text-default-400">
                      {booking.end_date
                        ? new Date(booking.end_date).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusChip(booking.status)}</TableCell>
                    <TableCell>
                      {getPaymentStatusChip(booking.payment_status)}
                    </TableCell>
                    <TableCell className="font-mono text-white">
                      ฿{Number(booking.price_paid).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {(booking.status === "pending" ||
                        booking.status === "confirmed") && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={async () => {
                            if (confirm("คุณต้องการยกเลิกการจองนี้หรือไม่?")) {
                              const { error } = await supabase
                                .from("bookings")
                                .update({ status: "cancelled" })
                                .eq("id", booking.id);

                              if (!error) {
                                // Reload data
                                const { data } = await supabase
                                  .from("bookings")
                                  .select(
                                    `
                                    *,
                                    gyms:gym_id (
                                      id,
                                      gym_name,
                                      gym_name_english,
                                      slug
                                    )
                                  `
                                  )
                                  .eq("user_id", user?.id)
                                  .order("created_at", { ascending: false });

                                if (data) setBookings(data as BookingWithGym[]);
                              }
                            }
                          }}
                        >
                          ยกเลิก
                        </Button>
                      )}
                      {booking.status === "completed" && (
                        <Button size="sm" color="secondary" variant="flat">
                          รีวิว
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </section>
    </DashboardLayout>
  );
}

export default function BookingsPage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <BookingsContent />
    </RoleGuard>
  );
}
