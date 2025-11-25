'use client';

import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { createClient } from '@shared/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { Card, CardBody, Tabs, Tab, Chip } from '@heroui/react';
import { User } from '@supabase/supabase-js';
import { ReviewList, ReviewAnalytics } from '@/components/features/partner/reviews';
import {
  PhotoIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  MegaphoneIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { hospital } from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';

interface ReviewStats {
  total: number;
  pending: number;
  without_response: number;
  average_rating: number;
}

function ReviewsPageContent() {
  const supabase = createClient();
  const locale = useLocale();
  const t = useTranslations('reviews');
  const [user, setUser] = useState<User | null>(null);
  const [hospital, setHospital] = useState<hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    without_response: 0,
    average_rating: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) return;

      // Get hospital
      const { data: hospitalData } = await supabase
        .from('hospitals')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      setHospital(hospitalData);

      // Get review stats
      if (hospitalData) {
        const response = await fetch(`/api/partner/reviews/stats?hospital_id=${hospitalData.id}`);
        const result = await response.json();

        if (result.success) {
          setStats(result.data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    loadData();
  };

  const handleReply = async (reviewId: string, message: string) => {
    try {
      const response = await fetch(`/api/partner/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('reply.successCreate'));
        handleRefresh();
      } else {
        toast.error(result.error || t('reply.errorCreate'));
      }
    } catch (error) {
      console.error('Error replying to review:', error);
      toast.error(t('reply.errorCreate'));
    }
  };

  const handleEditReply = async (reviewId: string, message: string) => {
    try {
      const response = await fetch(`/api/partner/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('reply.successUpdate'));
        handleRefresh();
      } else {
        toast.error(result.error || t('reply.errorUpdate'));
      }
    } catch (error) {
      console.error('Error editing reply:', error);
      toast.error(t('reply.errorUpdate'));
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/partner/reviews/${reviewId}/reply`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('reply.successDelete'));
        handleRefresh();
      } else {
        toast.error(result.error || t('reply.errorDelete'));
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error(t('reply.errorDelete'));
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: 'ข้อมูลโรงพยาบาล',
      href: '/partner/dashboard/hospital',
      icon: BuildingStorefrontIcon,
    },
    {
      label: 'แกลเลอรี่',
      href: '/partner/dashboard/gallery',
      icon: PhotoIcon,
    },
    {
      label: 'รีวิว',
      href: '/partner/dashboard/reviews',
      icon: StarIcon,
    },
    {
      label: 'โปรโมชั่น',
      href: '/partner/dashboard/promotions',
      icon: MegaphoneIcon,
    },
    {
      label: 'ประวัติการจอง',
      href: '/partner/dashboard/appointments',
      icon: CalendarIcon,
    },
    {
      label: 'รายการธุรกรรม',
      href: '/partner/dashboard/transactions',
      icon: BanknotesIcon,
    },
    {
      label: 'การจ่ายเงิน',
      href: '/partner/dashboard/payouts',
      icon: CurrencyDollarIcon,
    },
    {
      label: 'สถิติ',
      href: '/partner/dashboard/analytics',
      icon: ChartBarIcon,
    },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle={t('title')}
        headerSubtitle={t('subtitle')}
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin  border-4 border-secondary-600 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hospital) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle={t('title')}
        headerSubtitle={t('subtitle')}
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <Card className="border-l-4 border-warning-500 bg-warning-50">
          <CardBody>
            <p className="text-warning-900">
              Please complete your hospital registration first before managing reviews.
            </p>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle={t('title')}
      headerSubtitle={`${t('subtitle')} - ${hospital.hospital_name}`}
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="bg-linear-to-r from-primary-50 to-secondary-50">
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-default-900">
                  {t('title')}
                </h3>
                <p className="text-sm text-default-600">
                  Respond to customer reviews and build trust with potential members. 
                  Great reviews help attract more customers to your hospital.
                </p>
                <div className="mt-4 flex gap-2">
                  <Chip size="sm" variant="flat" color="primary">
                    Real-time updates
                  </Chip>
                  <Chip size="sm" variant="flat" color="success">
                    Professional responses
                  </Chip>
                </div>
              </div>
              <StarIcon className="h-12 w-12 text-primary-400" />
            </div>
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-primary-500">
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-600">{t('stats.totalReviews')}</p>
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-default-400" />
              </div>
              <p className="text-3xl font-bold text-default-900">{stats.total}</p>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-warning-500">
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-600">{t('stats.averageRating')}</p>
                <StarIcon className="h-5 w-5 text-default-400" />
              </div>
              <p className="text-3xl font-bold text-default-900">
                {stats.average_rating.toFixed(1)}
              </p>
              <p className="text-xs text-default-500">out of 5.0</p>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-secondary-500">
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-600">{t('stats.pendingReviews')}</p>
                <ClockIcon className="h-5 w-5 text-default-400" />
              </div>
              <p className="text-3xl font-bold text-default-900">{stats.pending}</p>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-danger-500">
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-600">{t('stats.needsResponse')}</p>
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-default-400" />
              </div>
              <p className="text-3xl font-bold text-default-900">
                {stats.without_response}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardBody>
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              color="primary"
              variant="underlined"
              classNames={{
                tabList: 'w-full',
                cursor: 'w-full',
                tab: 'max-w-fit',
              }}
            >
              <Tab
                key="all"
                title={
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    <span>{t('tabs.all')}</span>
                    {stats.total > 0 && (
                      <Chip size="sm" variant="flat">
                        {stats.total}
                      </Chip>
                    )}
                  </div>
                }
              >
                <div className="mt-6">
                  <ReviewList
                    key={`all-${refreshKey}`}
                    hospitalId={hospital.id}
                    onReply={handleReply}
                    onEditReply={handleEditReply}
                    onDeleteReply={handleDeleteReply}
                    onRefresh={handleRefresh}
                    locale={locale}
                  />
                </div>
              </Tab>

              <Tab
                key="pending"
                title={
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>{t('tabs.pending')}</span>
                    {stats.pending > 0 && (
                      <Chip size="sm" variant="flat" color="warning">
                        {stats.pending}
                      </Chip>
                    )}
                  </div>
                }
              >
                <div className="mt-6">
                  <ReviewList
                    key={`pending-${refreshKey}`}
                    hospitalId={hospital.id}
                    onReply={handleReply}
                    onEditReply={handleEditReply}
                    onDeleteReply={handleDeleteReply}
                    onRefresh={handleRefresh}
                    locale={locale}
                  />
                </div>
              </Tab>

              <Tab
                key="needsResponse"
                title={
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    <span>{t('tabs.needsResponse')}</span>
                    {stats.without_response > 0 && (
                      <Chip size="sm" variant="flat" color="danger">
                        {stats.without_response}
                      </Chip>
                    )}
                  </div>
                }
              >
                <div className="mt-6">
                  <ReviewList
                    key={`needs-response-${refreshKey}`}
                    hospitalId={hospital.id}
                    onReply={handleReply}
                    onEditReply={handleEditReply}
                    onDeleteReply={handleDeleteReply}
                    onRefresh={handleRefresh}
                    locale={locale}
                  />
                </div>
              </Tab>

              <Tab
                key="analytics"
                title={
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>{t('tabs.analytics')}</span>
                  </div>
                }
              >
                <div className="mt-6">
                  <ReviewAnalytics hospitalId={hospital.id} />
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        {/* Tips Card */}
        <Card className="border-l-4 border-primary-500 bg-primary-50/50">
          <CardBody>
            <h4 className="mb-2 font-semibold text-primary-900">
              💡 {t('reply.guidelines.title')}
            </h4>
            <ul className="space-y-1 text-sm text-primary-800">
              <li>• {t('reply.guidelines.tip1')}</li>
              <li>• {t('reply.guidelines.tip2')}</li>
              <li>• {t('reply.guidelines.tip3')}</li>
              <li>• {t('reply.guidelines.tip4')}</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function ReviewsPage() {
  return (
    <RoleGuard allowedRole="partner">
      <Toaster />
      <ReviewsPageContent />
    </RoleGuard>
  );
}

