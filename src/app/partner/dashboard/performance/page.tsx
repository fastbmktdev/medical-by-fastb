"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Chip,
  Spinner,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  HomeIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

interface PerformanceMetrics {
  period: {
    startDate: string;
    endDate: string;
    periodType: string;
  };
  overview: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    conversionRate: number;
    totalRevenue: number;
    averageBookingValue: number;
    uniqueCustomers: number;
    repeatCustomers: number;
    customerRetentionRate: number;
  };
  performance: {
    averageResponseTime: number;
    cancellationRate: number;
  };
  trends: Record<string, {
    bookings: number;
    revenue: number;
    customers: number;
  }>;
  packagePerformance: Array<{
    name: string;
    bookings: number;
    revenue: number;
    averagePrice: number;
  }>;
  peakHours: Array<{
    hour: number;
    bookings: number;
  }>;
}

function PartnerPerformanceContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await loadMetrics();
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [selectedPeriod]);

  const loadMetrics = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `/api/partner/performance-metrics?period=${selectedPeriod}`
      );
      const result = await response.json();

      if (result.success) {
        setMetrics(result.data);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsRefreshing(false);
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'แดชบอร์ด', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'Performance Metrics', href: '/partner/dashboard/performance', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <RoleGuard allowedRole="partner">
        <DashboardLayout
          menuItems={menuItems}
          headerTitle="Performance Metrics"
          headerSubtitle="ดูข้อมูลประสิทธิภาพของค่ายมวย"
          roleLabel="พาร์ทเนอร์"
          roleColor="primary"
          userEmail={user?.email}
        >
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  if (!metrics) {
    return (
      <RoleGuard allowedRole="partner">
        <DashboardLayout
          menuItems={menuItems}
          headerTitle="Performance Metrics"
          headerSubtitle="ดูข้อมูลประสิทธิภาพของค่ายมวย"
          roleLabel="พาร์ทเนอร์"
          roleColor="primary"
          userEmail={user?.email}
        >
          <div className="text-center py-20">
            <p className="text-default-500">ไม่พบข้อมูล</p>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRole="partner">
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="Performance Metrics"
        headerSubtitle="ดูข้อมูลประสิทธิภาพของค่ายมวย"
        roleLabel="พาร์ทเนอร์"
        roleColor="primary"
        userEmail={user?.email}
      >
        <Toaster />

        <div className="space-y-6">
          {/* Period Selector */}
          <Card>
            <CardBody>
              <Tabs
                selectedKey={selectedPeriod}
                onSelectionChange={(key) => setSelectedPeriod(key as 'day' | 'week' | 'month')}
                aria-label="Period selection"
              >
                <Tab key="day" title="รายวัน" />
                <Tab key="week" title="รายสัปดาห์" />
                <Tab key="month" title="รายเดือน" />
              </Tabs>
            </CardBody>
          </Card>

          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm">Total Bookings</p>
                    <p className="text-3xl font-bold">{metrics.overview.totalBookings}</p>
                  </div>
                  <CalendarIcon className="w-8 h-8 text-blue-200" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-sm">{metrics.overview.confirmedBookings} Confirmed</span>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-100 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold">
                      ฿{metrics.overview.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <CurrencyDollarIcon className="w-8 h-8 text-green-200" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm">
                    Avg: ฿{metrics.overview.averageBookingValue.toLocaleString()}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 text-sm">Customers</p>
                    <p className="text-3xl font-bold">{metrics.overview.uniqueCustomers}</p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-purple-200" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm">
                    {metrics.overview.repeatCustomers} Repeat ({metrics.overview.customerRetentionRate.toFixed(1)}%)
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-orange-100 text-sm">Conversion Rate</p>
                    <p className="text-3xl font-bold">{metrics.overview.conversionRate.toFixed(1)}%</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-orange-200" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm">
                    {metrics.overview.completedBookings} Completed
                  </span>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Performance Indicators</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-default-500" />
                    <span>Average Response Time</span>
                  </div>
                  <Chip color="primary" variant="flat">
                    {metrics.performance.averageResponseTime.toFixed(1)} hours
                  </Chip>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 text-danger" />
                    <span>Cancellation Rate</span>
                  </div>
                  <Chip color={metrics.performance.cancellationRate > 20 ? 'danger' : 'warning'} variant="flat">
                    {metrics.performance.cancellationRate.toFixed(1)}%
                  </Chip>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Top Packages</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {metrics.packagePerformance.slice(0, 5).map((pkg, index) => (
                  <div key={index} className="flex justify-between items-center pb-2 border-b border-default-200">
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-default-500">{pkg.bookings} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">฿{pkg.revenue.toLocaleString()}</p>
                      <p className="text-xs text-default-500">฿{pkg.averagePrice.toLocaleString()}/booking</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Peak Booking Hours</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-5 gap-4">
                {metrics.peakHours.map((peak, index) => (
                  <div key={index} className="text-center">
                    <p className="text-2xl font-bold text-primary">{peak.hour}:00</p>
                    <p className="text-sm text-default-500">{peak.bookings} bookings</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Trends Chart (Simple Bar Chart) */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Trends</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {Object.entries(metrics.trends).slice(-10).map(([period, data]) => (
                  <div key={period} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{period}</span>
                      <span className="text-sm text-default-500">
                        {data.bookings} bookings • ฿{data.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-default-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(data.bookings / Math.max(...Object.values(metrics.trends).map(t => t.bookings))) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}

export default PartnerPerformanceContent;

