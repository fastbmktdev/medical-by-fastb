"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from '@shared/lib/database/supabase/client';
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
import type { appointment as BookingType } from '@shared/types/database.types';
import { ConfirmationModal } from "@/components/compositions/modals/ConfirmationModal";

interface BookingWithHospital extends BookingType {
  hospitals?: {
    id: string;
    hospital_name: string;
    hospital_name_english?: string;
    slug: string;
  };
}

function BookingsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setBookings] = useState<BookingWithHospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingWithHospital | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBookings = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        hospitals:hospital_id (
          id,
          hospital_name,
          hospital_name_english,
          slug
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data as BookingWithHospital[]);
    }
  }, [supabase]);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadBookings(user.id);
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase, loadBookings]);

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

  const handleCancelClick = (appointment: BookingWithHospital) => {
    setBookingToCancel(appointment);
    setIsCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel || !user) return;

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", bookingToCancel.id);

      if (!error) {
        await loadBookings(user.id);
        setIsCancelModalOpen(false);
        setBookingToCancel(null);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const cancelCancellation = () => {
    setIsCancelModalOpen(false);
    setBookingToCancel(null);
  };

  const filteredBookings = appointments.filter((appointment) => {
    if (selectedTab === "all") return true;
    return appointment.status === selectedTab;
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter((b) => b.status === "pending").length,
    confirmed: appointments.filter((b) => b.status === "confirmed").length,
    completed: appointments.filter((b) => b.status === "completed").length,
    cancelled: appointments.filter((b) => b.status === "cancelled").length,
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
      {/* appointment Statistics */}
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
            className="bg-zinc-100/60 backdrop-blur-sm border-none "
          >
            <CardBody className="flex flex-row items-center justify-between border border-zinc-700 ">
              <div>
                <p className="text-sm text-default-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-violet-700">
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

      {/* appointments Table */}
      <section>
        <Card className="backdrop-blur-sm border-none ">
          <CardBody className="p-0">
            <Tabs
              aria-label="appointments filter tabs"
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(String(key))}
              disableAnimation
              classNames={{
                base: "w-full",
                tabList:
                  "bg-zinc-100/60 border border-zinc-700 text-zinc-950 p-1 gap-1 overflow-x-auto !p-0.5",
                tab: "px-4 py-2 text-sm  text-default-400 transition-all data-[hover-unselected=true]:bg-zinc-800/60 data-[selected=true]:bg-red-600 data-[selected=true]:text-white",
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
              aria-label="appointments table"
              classNames={{
                wrapper:
                  "bg-zinc-100/60 border border-zinc-700 text-zinc-950 gap-1 overflow-x-auto text-sm mt-4",
                thead: "bg-transparent",
                th: "bg-transparent text-zinc-950 border-b border-zinc-700 p-0 font-medium",
              }}
            >
              <TableHeader>
                <TableColumn>เลขที่การจอง</TableColumn>
                <TableColumn>โรงพยาบาล</TableColumn>
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
                className="text-zinc-950"
              >
                {filteredBookings.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-mono text-sm">
                      {appointment.booking_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-zinc-950">
                          {appointment.hospitals?.hospital_name || "N/A"}
                        </p>
                        {appointment.hospitals?.hospital_name_english && (
                          <p className="text-default-400 text-xs">
                            {appointment.hospitals.hospital_name_english}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-zinc-950">{appointment.package_name}</p>
                        <p className="text-default-400 text-xs">
                          {appointment.package_type === "one_time"
                            ? "ครั้งเดียว"
                            : `${appointment.duration_months} เดือน`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-default-400">
                      {new Date(appointment.start_date).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {appointment.end_date
                        ? new Date(appointment.end_date).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusChip(appointment.status)}</TableCell>
                    <TableCell>
                      {getPaymentStatusChip(appointment.payment_status)}
                    </TableCell>
                    <TableCell className="font-mono text-zinc-950">
                      ฿{Number(appointment.price_paid).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {(appointment.status === "pending" ||
                        appointment.status === "confirmed") && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => handleCancelClick(appointment)}
                        >
                          ยกเลิก
                        </Button>
                      )}
                      {appointment.status === "completed" && (
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

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={cancelCancellation}
        title="ยืนยันการยกเลิกการจอง"
        message={`คุณต้องการยกเลิกการจอง "${bookingToCancel?.package_name}" ที่ ${bookingToCancel?.hospitals?.hospital_name} หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ยกเลิกการจอง"
        cancelText="ไม่ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmCancel}
        loading={isCancelling}
        testId="cancel-appointment-modal"
      />
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
