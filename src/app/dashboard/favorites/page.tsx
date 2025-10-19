"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Chip,
} from '@heroui/react';
import {
  HomeIcon,
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

interface FavoriteGym {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  services: string[];
  priceRange: string;
}

function FavoritesContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  const menuItems: MenuItem[] = [
    { label: 'การจองของฉัน', href: '/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการโปรด', href: '/dashboard/favorites', icon: HeartIcon },
    { label: 'ประวัติการเงิน', href: '/dashboard/transactions', icon: BanknotesIcon },
    { label: 'โปรไฟล์', href: '/dashboard/profile', icon: UserIcon },
  ];

  // Mock favorites data
  const mockFavorites: FavoriteGym[] = [
    {
      id: '1',
      name: 'Tiger Muay Thai Gym',
      location: 'ภูเก็ต',
      rating: 4.8,
      reviews: 256,
      image: '/placeholder-gym.jpg',
      services: ['Private Class', 'คลาสกลุ่ม', 'Fitness'],
      priceRange: '฿300-฿800',
    },
    {
      id: '2',
      name: 'Fairtex Training Center',
      location: 'กรุงเทพ',
      rating: 4.7,
      reviews: 189,
      image: '/placeholder-gym.jpg',
      services: ['Private Class', 'คลาสกลุ่ม'],
      priceRange: '฿400-฿1000',
    },
  ];

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
          <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
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
                  <p className="font-bold text-white text-2xl">{mockFavorites.length}</p>
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
                  <p className="font-bold text-white text-2xl">0</p>
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
                  <p className="mb-1 text-default-400 text-sm">การจองจากรายการโปรด</p>
                  <p className="font-bold text-white text-2xl">5</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Favorite Gyms */}
      <section>
        <h2 className="mb-6 font-bold text-white text-2xl">ยิมโปรด</h2>
        {mockFavorites.length === 0 ? (
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="py-16 text-center">
              <HeartIcon className="mx-auto mb-4 w-16 h-16 text-default-300" />
              <h3 className="mb-2 font-semibold text-white text-xl">ยังไม่มีรายการโปรด</h3>
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
            {mockFavorites.map((gym) => (
              <Card
                key={gym.id}
                className="bg-default-100/50 backdrop-blur-sm border-none"
              >
                <CardHeader className="p-0">
                  <div className="relative w-full h-48">
                    <Image
                      src={gym.image}
                      alt={gym.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400';
                      }}
                    />
                    <div className="top-3 right-3 absolute">
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        className="bg-danger/90 backdrop-blur-sm"
                      >
                        <HeartSolidIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="gap-3">
                  <div>
                    <h3 className="mb-1 font-bold text-white text-lg">{gym.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPinIcon className="w-4 h-4 text-default-400" />
                      <p className="text-default-400 text-sm">{gym.location}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <StarIcon className="fill-warning w-4 h-4 text-warning" />
                      <span className="font-semibold text-white">{gym.rating}</span>
                      <span className="text-default-400 text-sm">({gym.reviews} รีวิว)</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {gym.services.slice(0, 2).map((service, idx) => (
                      <Chip
                        key={idx}
                        size="sm"
                        variant="flat"
                        color="primary"
                      >
                        {service}
                      </Chip>
                    ))}
                    {gym.services.length > 2 && (
                      <Chip size="sm" variant="flat">
                        +{gym.services.length - 2}
                      </Chip>
                    )}
                  </div>
                  <p className="font-mono font-semibold text-success">{gym.priceRange}</p>
                </CardBody>
                <CardFooter className="gap-2">
                  <Button
                    as={Link}
                    href={`/gyms/${gym.id}`}
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
                  >
                    <TrashIcon className="w-5 h-5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
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
