"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
} from '@heroui/react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  DocumentChartBarIcon,
  StarIcon,
  TrophyIcon,
  BellIcon,
  HeartIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import { toast, Toaster } from 'react-hot-toast';
import { CustomReportBuilder } from '@/components/features/admin/CustomReportBuilder';
import { ScheduledReportsManager } from '@/components/features/admin/ScheduledReportsManager';

function AdminReportsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState<Record<string, 'pdf' | 'csv' | null>>({});

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  const handleExport = async (table: string, format: 'pdf' | 'csv') => {
    const key = `${table}-${format}`;
    setExporting((prev) => ({ ...prev, [key]: format }));

    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table,
          format,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${table}-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`ดาวน์โหลด ${format.toUpperCase()} สำเร็จ`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการ export');
    } finally {
      setExporting((prev) => ({ ...prev, [key]: null }));
    }
  };

  const reports: Array<{
    table: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'primary' | 'success' | 'warning' | 'secondary' | 'danger';
  }> = [
    {
      table: 'profiles',
      title: 'รายงานผู้ใช้ (Profiles)',
      description: 'ข้อมูลโปรไฟล์ผู้ใช้ทั้งหมด',
      icon: UsersIcon,
      color: 'primary',
    },
    {
      table: 'user_roles',
      title: 'รายงานบทบาทผู้ใช้',
      description: 'ข้อมูลบทบาทและสิทธิ์ผู้ใช้',
      icon: UsersIcon,
      color: 'primary',
    },
    {
      table: 'gyms',
      title: 'รายงานยิมทั้งหมด',
      description: 'ข้อมูลยิมทั้งหมดในระบบ',
      icon: BuildingStorefrontIcon,
      color: 'success',
    },
    {
      table: 'gym_packages',
      title: 'รายงานแพ็คเกจ',
      description: 'ข้อมูลแพ็คเกจทั้งหมด',
      icon: DocumentChartBarIcon,
      color: 'success',
    },
    {
      table: 'bookings',
      title: 'รายงานการจอง',
      description: 'ข้อมูลการจองทั้งหมด',
      icon: DocumentChartBarIcon,
      color: 'warning',
    },
    {
      table: 'payments',
      title: 'รายงานการชำระเงิน',
      description: 'ข้อมูลการชำระเงินทั้งหมด',
      icon: ChartBarIcon,
      color: 'secondary',
    },
    {
      table: 'orders',
      title: 'รายงานคำสั่งซื้อ',
      description: 'ข้อมูลคำสั่งซื้อทั้งหมด',
      icon: ChartBarIcon,
      color: 'secondary',
    },
    {
      table: 'user_points',
      title: 'รายงานคะแนนผู้ใช้',
      description: 'ข้อมูลคะแนนและเลเวลผู้ใช้',
      icon: TrophyIcon,
      color: 'warning',
    },
    {
      table: 'points_history',
      title: 'รายงานประวัติคะแนน',
      description: 'ประวัติการได้รับคะแนน',
      icon: TrophyIcon,
      color: 'warning',
    },
    {
      table: 'badges',
      title: 'รายงานเหรียญ',
      description: 'ข้อมูลเหรียญทั้งหมด',
      icon: StarIcon,
      color: 'warning',
    },
    {
      table: 'user_badges',
      title: 'รายงานเหรียญผู้ใช้',
      description: 'เหรียญที่ผู้ใช้ได้รับ',
      icon: StarIcon,
      color: 'warning',
    },
    {
      table: 'challenges',
      title: 'รายงานความท้าทาย',
      description: 'ข้อมูลความท้าทายทั้งหมด',
      icon: TrophyIcon,
      color: 'warning',
    },
    {
      table: 'notifications',
      title: 'รายงานการแจ้งเตือน',
      description: 'ข้อมูลการแจ้งเตือนทั้งหมด',
      icon: BellIcon,
      color: 'secondary',
    },
    {
      table: 'user_favorites',
      title: 'รายงานรายการโปรด',
      description: 'ข้อมูลรายการโปรดของผู้ใช้',
      icon: HeartIcon,
      color: 'secondary',
    },
    {
      table: 'promotions',
      title: 'รายงานโปรโมชั่น',
      description: 'ข้อมูลโปรโมชั่นทั้งหมด',
      icon: GiftIcon,
      color: 'success',
    },
    {
      table: 'partner_applications',
      title: 'รายงานใบสมัคร Partner',
      description: 'ข้อมูลใบสมัคร Partner',
      icon: BuildingStorefrontIcon,
      color: 'success',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="รายงาน"
        headerSubtitle="ดาวน์โหลดรายงานต่างๆ ของระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="รายงาน"
        headerSubtitle="ดาวน์โหลดรายงานต่างๆ ของระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, index) => {
          const Icon = report.icon;
          const pdfKey = `${report.table}-pdf`;
          const csvKey = `${report.table}-csv`;
          const isExportingPDF = exporting[pdfKey] === 'pdf';
          const isExportingCSV = exporting[csvKey] === 'csv';
          
          return (
            <Card key={index} className="bg-default-100/50 backdrop-blur-sm border-none">
              <CardHeader className="flex items-center gap-4">
                <div className={`bg-${report.color} p-4 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-bold text-lg">{report.title}</h3>
                  <p className="text-default-400 text-sm">{report.description}</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex gap-2">
                  <Button
                    color={report.color}
                    variant="flat"
                    startContent={
                      isExportingPDF ? (
                        <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                      ) : (
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      )
                    }
                    className="flex-1"
                    onPress={() => handleExport(report.table, 'pdf')}
                    isDisabled={isExportingPDF || isExportingCSV}
                  >
                    {isExportingPDF ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด PDF'}
                  </Button>
                  <Button
                    color={report.color}
                    variant="bordered"
                    startContent={
                      isExportingCSV ? (
                        <div className="border-2 border-current border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                      ) : (
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      )
                    }
                    className="flex-1"
                    onPress={() => handleExport(report.table, 'csv')}
                    isDisabled={isExportingPDF || isExportingCSV}
                  >
                    {isExportingCSV ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด CSV'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 space-y-6">
        <CustomReportBuilder />
        <ScheduledReportsManager />
      </div>
      </DashboardLayout>
    </>
  );
}

export default function AdminReportsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminReportsContent />
    </RoleGuard>
  );
}
