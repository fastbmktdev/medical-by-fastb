"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem, FavoriteButton } from '@/components/shared';
import { Link } from '@/navigation';
import Image from 'next/image';
import { Card, CardBody, CardHeader, CardFooter, Button, Chip } from '@heroui/react';
import {
  UserIcon,
  CalendarIcon,
  HeartIcon,
  BanknotesIcon,
  MapPinIcon,
  StarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { User } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

interface FavoriteItem {
  id: string;
  item_type: 'gym' | 'product' | 'event';
  item_id: string;
  created_at: string;
  gym?: {
    id: string;
    gym_name: string;
    gym_name_english?: string;
    location: string;
    images: string[];
    slug?: string;
  };
}

function FavoritesContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [gymFavoritesCount, setGymFavoritesCount] = useState(0);
  const [productFavoritesCount, setProductFavoritesCount] = useState(0);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    setIsLoadingFavorites(true);
    try {
      const response = await fetch('/api/favorites');
      const result = await response.json();

      if (result.success) {
        const favoritesData = result.data || [];
        setFavorites(favoritesData);
        
        // Count by type
        const gyms = favoritesData.filter((f: FavoriteItem) => f.item_type === 'gym');
        const products = favoritesData.filter((f: FavoriteItem) => f.item_type === 'product');
        setGymFavoritesCount(gyms.length);
        setProductFavoritesCount(products.length);
      } else {
        throw new Error(result.error || 'Failed to load favorites');
      }
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      toast.error('ไม่สามารถโหลดรายการโปรดได้');
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const handleRemoveFavorite = async (itemType: string, itemId: string) => {
    try {
      const response = await fetch(
        `/api/favorites?item_type=${itemType}&item_id=${itemId}`,
        { method: 'DELETE' }
      );
      const result = await response.json();

      if (result.success) {
        setFavorites(prev => prev.filter(
          fav => !(fav.item_type === itemType && fav.item_id === itemId)
        ));
        
        // Update counts
        if (itemType === 'gym') {
          setGymFavoritesCount(prev => Math.max(0, prev - 1));
        } else if (itemType === 'product') {
          setProductFavoritesCount(prev => Math.max(0, prev - 1));
        }
        
        toast.success('ลบออกจากรายการโปรดแล้ว');
      } else {
        throw new Error(result.error || 'Failed to remove favorite');
      }
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast.error('เกิดข้อผิดพลาดในการลบรายการโปรด');
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'การจองของฉัน', href: '/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการโปรด', href: '/dashboard/favorites', icon: HeartIcon },
    { label: 'ประวัติการเงิน', href: '/dashboard/transactions', icon: BanknotesIcon },
    { label: 'โปรไฟล์', href: '/dashboard/profile', icon: UserIcon },
  ];

  const gymFavorites = favorites.filter(fav => fav.item_type === 'gym' && fav.gym);

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="รายการโปรด"
        headerSubtitle="ยิมและสินค้าที่คุณบันทึกไว้"
        roleLabel="ผู้ใช้ทั่วไป"
        roleColor="primary"
        userEmail={user?.email}
        showPartnerButton={true}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="รายการโปรด"
      headerSubtitle="ยิมและสินค้าที่คุณบันทึกไว้"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={true}
    >
      {/* Stats */}
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="bg-danger p-3 rounded-lg">
                  <HeartSolidIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="mb-1 text-default-400 text-sm">ยิมโปรด</p>
                  <p className="font-bold text-2xl">
                    {isLoadingFavorites ? '...' : gymFavoritesCount}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="bg-secondary p-3 rounded-lg">
                  <StarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="mb-1 text-default-400 text-sm">สินค้าโปรด</p>
                  <p className="font-bold text-2xl">
                    {isLoadingFavorites ? '...' : productFavoritesCount}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="bg-primary p-3 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="mb-1 text-default-400 text-sm">รายการโปรดทั้งหมด</p>
                  <p className="font-bold text-2xl">
                    {isLoadingFavorites ? '...' : favorites.length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Favorite Gyms */}
      <section>
        <h2 className="mb-6 font-bold text-2xl">ยิมโปรด</h2>
        {isLoadingFavorites ? (
          <div className="flex justify-center items-center py-20">
            <div className="border-4 border-primary border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : gymFavorites.length === 0 ? (
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="py-16 text-center">
              <HeartIcon className="mx-auto mb-4 w-16 h-16 text-default-300" />
              <h3 className="mb-2 font-semibold text-xl">ยังไม่มีรายการโปรด</h3>
              <p className="mb-6 text-default-400">
                เริ่มเพิ่มยิมที่คุณชื่นชอบเพื่อเข้าถึงได้ง่ายขึ้น
              </p>
              <Button
                as={Link}
                href="/gyms"
                color="danger"
                startContent={<MapPinIcon className="w-5 h-5" />}
              >
                ค้นหายิม
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {gymFavorites.map((favorite) => {
              const gym = favorite.gym!;
              const gymImage = gym.images && gym.images.length > 0 
                ? gym.images[0] 
                : 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400';
              const gymSlug = gym.slug || gym.id;
              
              return (
                <Card
                  key={favorite.id}
                  className="bg-default-100/50 backdrop-blur-sm border-none"
                >
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48">
                      <Image
                        src={gymImage}
                        alt={gym.gym_name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400';
                        }}
                      />
                      <div className="top-3 right-3 absolute">
                        <FavoriteButton
                          itemType="gym"
                          itemId={gym.id}
                          size="sm"
                          variant="solid"
                          color="danger"
                          className="bg-danger/90 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="gap-3">
                    <div>
                      <h3 className="mb-1 font-bold text-lg">{gym.gym_name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPinIcon className="w-4 h-4 text-default-400" />
                        <p className="text-default-400 text-sm">{gym.location}</p>
                      </div>
                    </div>
                  </CardBody>
                  <CardFooter className="gap-2">
                    <Button
                      as={Link}
                      href={`/gyms/${gymSlug}`}
                      color="primary"
                      variant="flat"
                      className="flex-1"
                    >
                      ดูรายละเอียด
                    </Button>
                    <Button
                      isIconOnly
                      color="danger"
                      variant="bordered"
                      onPress={() => handleRemoveFavorite('gym', gym.id)}
                      aria-label="Remove from favorites"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default function FavoritesPage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <FavoritesContent />
    </RoleGuard>
  );
}
