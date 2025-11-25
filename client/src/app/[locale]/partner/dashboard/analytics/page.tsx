"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@shared/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { Loading } from '@/components/design-system/primitives/Loading';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  // HomeIcon,
  UsersIcon,
  StarIcon,
  TrophyIcon,
  // ArrowTrendingUpIcon,
  // ArrowTrendingDownIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

interface AnalyticsData {
  hospital: {
    id: string;
    name: string;
    location: string;
  };
  totalCustomers: number;
  appointments: {
    monthly: number;
    total: number;
  };
  rating: {
    average: number | null;
    totalRatings: number;
  };
  areaRanking: {
    rank: number | null;
    totalHospitals: number;
    position: string;
  };
  revenue: {
    monthly: number;
    total: number;
  };
  charts: {
    byDate: Record<string, number>;
    byMonth: Record<string, number>;
    byWeek: Record<string, number>;
  };
  popularServices: Array<{
    package_id: string | null;
    package_name: string;
    package_type: string;
    bookings_count: number;
    revenue: number;
  }>;
}

function PartnerAnalyticsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chartType, setChartType] = useState<'month' | 'week'>('month');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadAnalytics();
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/partner/analytics');
      const result = await response.json();

      if (result.success) {
        setAnalyticsData(result.data);
        setError(null);
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        toast.error(result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'ข้อมูลโรงพยาบาล', href: '/partner/dashboard/hospital', icon: BuildingStorefrontIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/appointments', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  // Prepare chart data
  const getChartData = () => {
    if (!analyticsData) return [];

    const chartData = chartType === 'month' 
      ? analyticsData.charts.byMonth 
      : analyticsData.charts.byWeek;

    const sortedEntries = Object.entries(chartData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12); // Last 12 months/weeks

    const maxValue = Math.max(...sortedEntries.map(([, value]) => value), 1);

    return sortedEntries.map(([key, value]) => ({
      label: chartType === 'month' 
        ? `${key.split('-')[1]}/${key.split('-')[0].slice(-2)}`
        : new Date(key).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
      value,
      percentage: (value / maxValue) * 100,
    }));
  };

  const chartData = getChartData();

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="สถิติและการวิเคราะห์"
        headerSubtitle="ดูสถิติและประสิทธิภาพของโรงพยาบาล"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <Loading centered size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !analyticsData) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="สถิติและการวิเคราะห์"
        headerSubtitle="ดูสถิติและประสิทธิภาพของโรงพยาบาล"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody className="py-16 text-center">
            <p className="text-danger">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-secondary text-white  hover:opacity-80"
            >
              โหลดใหม่
            </button>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="สถิติและการวิเคราะห์"
      headerSubtitle="ดูสถิติและประสิทธิภาพของโรงพยาบาล"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <Toaster />
      
      {/* Stats Cards */}
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-4">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-primary p-3 ">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-2xl">
                  {analyticsData?.totalCustomers || 0}
                </h3>
                <p className="text-default-400 text-sm">ลูกค้าทั้งหมด</p>
              </div>
            </CardBody>
          </Card>
          
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-success p-3 ">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-2xl">
                  {analyticsData?.appointments.monthly || 0}
                </h3>
                <p className="text-default-400 text-sm">การจองเดือนนี้</p>
                {analyticsData && (
                  <p className="text-default-500 text-xs mt-1">
                    ทั้งหมด {analyticsData.appointments.total} รายการ
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
          
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-warning p-3 ">
                  <StarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-2xl">
                  {analyticsData?.rating.average 
                    ? analyticsData.rating.average.toFixed(1)
                    : 'N/A'}
                </h3>
                <p className="text-default-400 text-sm">คะแนนเฉลี่ย</p>
                {analyticsData?.rating.totalRatings ? (
                  <p className="text-default-500 text-xs mt-1">
                    จาก {analyticsData.rating.totalRatings} รีวิว
                  </p>
                ) : (
                  <p className="text-default-500 text-xs mt-1">
                    ยังไม่มีรีวิว
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
          
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-secondary p-3 ">
                  <TrophyIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-2xl">
                  {analyticsData?.areaRanking.rank || 'N/A'}
                </h3>
                <p className="text-default-400 text-sm">อันดับในพื้นที่</p>
                {analyticsData?.areaRanking.rank && (
                  <p className="text-default-500 text-xs mt-1">
                    {analyticsData.areaRanking.position}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Revenue Card */}
      <section className="mb-8">
        <Card className="bg-linear-to-br from-success-500 to-success-700 border-none">
          <CardBody>
            <div className="flex justify-between items-center">
              <div>
                <p className="mb-2 text-white/80 text-sm">รายได้เดือนนี้</p>
                <p className="font-mono font-bold text-white text-3xl">
                  ฿{Number(analyticsData?.revenue.monthly || 0).toLocaleString()}
                </p>
                {analyticsData && (
                  <p className="mt-2 text-white/70 text-sm">
                    รายได้ทั้งหมด: ฿{Number(analyticsData.revenue.total || 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 ">
                <CurrencyDollarIcon className="w-12 h-12 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Charts and Popular Services */}
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-bold text-xl">กราฟรายได้</h3>
            <Tabs
              selectedKey={chartType}
              onSelectionChange={(key) => setChartType(key as 'month' | 'week')}
              size="sm"
            >
              <Tab key="month" title="รายเดือน" />
              <Tab key="week" title="รายสัปดาห์" />
            </Tabs>
          </CardHeader>
          <CardBody>
            {chartData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-2 items-end h-64">
                  {chartData.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div className="relative w-full h-full flex items-end">
                        <div
                          className="w-full bg-linear-to-t from-success-500 to-success-400  transition-all duration-300 hover:opacity-80"
                          style={{ height: `${item.percentage}%` }}
                          title={`${item.label}: ฿${item.value.toLocaleString()}`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-default-400 text-xs font-mono">
                          ฿{item.value.toLocaleString()}
                        </p>
                        <p className="text-default-500 text-[10px] mt-1 rotate-45 origin-left whitespace-nowrap">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 pt-4 border-t border-default-200">
                  <div className="text-center">
                    <p className="text-default-400 text-xs">ยอดรวม</p>
                    <p className="font-mono font-bold text-success">
                      ฿{chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-default-400 text-xs">เฉลี่ย</p>
                    <p className="font-mono font-bold text-default-600">
                      ฿{Math.round(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center min-h-[300px]">
                <ChartBarIcon className="mb-4 w-16 h-16 text-default-300" />
                <p className="text-default-400 text-center">กราฟจะแสดงเมื่อมีข้อมูล</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Popular Services */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader>
            <h3 className="font-bold text-xl">บริการยอดนิยม</h3>
          </CardHeader>
          <CardBody>
            {analyticsData && analyticsData.popularServices.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.popularServices.slice(0, 10).map((service, index) => (
                  <div
                    key={service.package_id || index}
                    className="flex justify-between items-center p-4 bg-default-200/50 "
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex justify-center items-center bg-secondary w-6 h-6  text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-white">{service.package_name}</h4>
                        <Chip
                          size="sm"
                          color={service.package_type === 'package' ? 'secondary' : 'default'}
                          variant="flat"
                        >
                          {service.package_type === 'package' ? 'แพ็คเกจ' : 'รายครั้ง'}
                        </Chip>
                      </div>
                      <div className="flex gap-4 ml-8 text-default-400 text-sm">
                        <span>{service.bookings_count} การจอง</span>
                        <span className="font-mono">
                          ฿{Number(service.revenue).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center min-h-[300px]">
                <TrophyIcon className="mb-4 w-16 h-16 text-default-300" />
                <p className="text-default-400 text-center">ข้อมูลจะแสดงเมื่อมีการจอง</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function PartnerAnalyticsPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerAnalyticsContent />
    </RoleGuard>
  );
}
