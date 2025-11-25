'use client';

import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@shared/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { Card, CardBody, Tabs, Tab, Chip } from '@heroui/react';
import { User } from '@supabase/supabase-js';
import { GalleryUpload, GalleryManagerBulk, GalleryAnalytics } from '@/components/features/partner/gallery';
import {
  PhotoIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  MegaphoneIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import type { hospital } from '@shared/types';

function GalleryPageContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [hospital, setHospital] = useState<hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('manage');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) return;

      // Get hospital
      const { data: hospitalData } = await supabase
        .from('hospitals')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      setHospital(hospitalData);
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

  const menuItems: MenuItem[] = [
    { label: 'ข้อมูลโรงพยาบาล', href: '/partner/dashboard/hospital', icon: BuildingStorefrontIcon },
    { label: 'แกลเลอรี่', href: '/partner/dashboard/gallery', icon: PhotoIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/appointments', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="Gallery Management"
        headerSubtitle="Upload and organize your hospital images"
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
        headerTitle="Gallery Management"
        headerSubtitle="Upload and organize your hospital images"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <Card className="border-l-4 border-warning-500 bg-warning-50">
          <CardBody>
            <p className="text-warning-900">
              Please complete your hospital registration first before managing the gallery.
            </p>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="Gallery Management"
      headerSubtitle={`Manage images for ${hospital.hospital_name}`}
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
                  Professional Gallery Management
                </h3>
                <p className="text-sm text-default-600">
                  Upload high-quality images of your hospital, equipment, and treatment sessions. 
                  Set a featured image and organize them in the order you want them displayed.
                </p>
                <div className="mt-4 flex gap-2">
                  <Chip size="sm" variant="flat" color="primary">
                    Auto-optimization enabled
                  </Chip>
                  <Chip size="sm" variant="flat" color="success">
                    CDN delivery
                  </Chip>
                </div>
              </div>
              <PhotoIcon className="h-12 w-12 text-primary-400" />
            </div>
          </CardBody>
        </Card>

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
                key="manage"
                title={
                  <div className="flex items-center gap-2">
                    <Cog6ToothIcon className="h-4 w-4" />
                    <span>Manage Gallery</span>
                  </div>
                }
              >
                <div className="mt-6">
                  <GalleryManagerBulk
                    key={refreshKey}
                    hospitalId={hospital.id}
                    onRefresh={handleRefresh}
                  />
                </div>
              </Tab>

              <Tab
                key="upload"
                title={
                  <div className="flex items-center gap-2">
                    <PhotoIcon className="h-4 w-4" />
                    <span>Upload Images</span>
                  </div>
                }
              >
                <div className="mt-6">
                  <GalleryUpload
                    hospitalId={hospital.id}
                    onUploadComplete={() => {
                      setSelectedTab('manage');
                      handleRefresh();
                    }}
                    maxFiles={20}
                  />
                </div>
              </Tab>

              <Tab
                key="analytics"
                title={
                  <div className="flex items-center gap-2">
                    <ChartPieIcon className="h-4 w-4" />
                    <span>Analytics</span>
                  </div>
                }
              >
                <div className="mt-6">
                  <GalleryAnalytics hospitalId={hospital.id} />
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        {/* Tips Card */}
        <Card className="border-l-4 border-primary-500 bg-primary-50/50">
          <CardBody>
            <h4 className="mb-2 font-semibold text-primary-900">
              💡 Tips for Great Gallery Images
            </h4>
            <ul className="space-y-1 text-sm text-primary-800">
              <li>• Use high-resolution images (1920x1080 or higher recommended)</li>
              <li>• Show your hospital&apos;s unique features and treatment equipment</li>
              <li>• Include action shots of treatment sessions</li>
              <li>• Set your best image as the featured image</li>
              <li>• Keep image file names descriptive</li>
              <li>• Images are automatically optimized for web performance</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function GalleryPage() {
  return (
    <RoleGuard allowedRole="partner">
      <Toaster />
      <GalleryPageContent />
    </RoleGuard>
  );
}

