"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from '@shared/lib/database/supabase/client';
import { RoleGuard } from "@/components/features/auth";
import {
  DashboardLayout,
  dashboardMenuItems,
  FavoriteButton,
} from "@/components/shared";
import { Link } from "@/navigation";
import Image from "next/image";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
} from "@heroui/react";
import {
  CalendarIcon,
  HeartIcon,
  MapPinIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { User } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";
import { Loading } from "@/components/design-system/primitives/Loading";

type hospital = {
  id: string;
  hospital_name: string;
  hospital_name_english?: string;
  location: string;
  images: string[];
  slug?: string;
};

type FavoriteItem = {
  id: string;
  item_type: "hospital" | "product" | "event";
  item_id: string;
  created_at: string;
  hospital?: hospital;
};

const hospital_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400";

interface HospitalCardProps {
  favorite: FavoriteItem;
  onRemove: (id: string) => void;
}

const HospitalCard = ({ favorite, onRemove }: HospitalCardProps) => {
  const hospital = favorite.hospital!;
  const hospitalImage =
    hospital.images?.length ? hospital.images[0] : hospital_FALLBACK_IMAGE;
  const hospitalSlug = hospital.slug || hospital.id;
  return (
    <Card className="bg-default-100/50 backdrop-blur-sm border-none">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={hospitalImage}
            alt={hospital.hospital_name}
            fill
            sizes="100%"
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = hospital_FALLBACK_IMAGE;
            }}
          />
          <div className="top-3 right-3 absolute">
            <FavoriteButton
              itemType="hospital"
              itemId={hospital.id}
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
          <h3 className="mb-1 font-semibold text-lg">{hospital.hospital_name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <MapPinIcon className="w-4 h-4 text-default-400" />
            <p className="text-default-400 text-sm">{hospital.location}</p>
          </div>
        </div>
      </CardBody>
      <CardFooter className="gap-2">
        <Button
          as={Link}
          href={`/hospitals/${hospitalSlug}`}
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
          onPress={() => onRemove(hospital.id)}
          aria-label="Remove from favorites"
        >
          <TrashIcon className="w-5 h-5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface FavoriteStatsProps {
  isLoadingFavorites: boolean;
  hospitalCount: number;
  productCount: number;
  allCount: number;
}

const FavoriteStats = ({
  isLoadingFavorites,
  hospitalCount,
  productCount,
  allCount,
}: FavoriteStatsProps) => {
  const stats = [
    {
      icon: <HeartSolidIcon className="w-6 h-6 text-white" />,
      bgColor: "bg-danger",
      label: "โรงพยาบาลโปรด",
      count: hospitalCount,
    },
    {
      icon: <StarIcon className="w-6 h-6 text-white" />,
      bgColor: "bg-secondary",
      label: "สินค้าโปรด",
      count: productCount,
    },
    {
      icon: <CalendarIcon className="w-6 h-6 text-white" />,
      bgColor: "bg-primary",
      label: "รายการโปรดทั้งหมด",
      count: allCount,
    },
  ];
  return (
    <section className="mb-8">
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
        {stats.map(({ icon, bgColor, label, count }, idx) => (
          <Card key={idx} className="flex flex-row items-center justify-between border border-zinc-700 ">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className={`${bgColor} p-3 `}>
                  {icon}
                </div>
                <div>
                  <p className="mb-1 text-default-400 text-sm">{label}</p>
                  <p className="font-semibold text-2xl text-violet-700">
                    {isLoadingFavorites ? "..." : count}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
};

const NoHospitalFavorites = () => (
  <Card className="bg-zinc-100 backdrop-blur-sm border border-zinc-700 ">
    <CardBody className="py-16 text-center">
      <HeartIcon className="mx-auto mb-4 w-16 h-16 text-default-300" />
      <h3 className="mb-2 font-semibold text-xl text-zinc-950">ยังไม่มีรายการโปรด</h3>
      <p className="mb-6 text-default-400">
        เริ่มเพิ่มโรงพยาบาลที่คุณชื่นชอบเพื่อเข้าถึงได้ง่ายขึ้น
      </p>
      <Button
        as={Link}
        href="/hospitals"
        className="bg-violet-700 text-white hover:bg-violet-800  w-fit mx-auto"
        startContent={<MapPinIcon className="w-5 h-5" />}
      >
        ค้นหาโรงพยาบาล
      </Button>
    </CardBody>
  </Card>
);

interface HospitalFavoritesSectionProps {
  isLoadingFavorites: boolean;
  hospitalFavorites: FavoriteItem[];
  onRemove: (id: string) => void;
}

const HospitalFavoritesSection = ({
  isLoadingFavorites,
  hospitalFavorites,
  onRemove,
}: HospitalFavoritesSectionProps) => {
  if (isLoadingFavorites)
    return (
      <div className="flex justify-center items-center py-20">
        <Loading centered size="lg" />
      </div>
    );
  if (!hospitalFavorites.length) return <NoHospitalFavorites />;
  return (
    <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {hospitalFavorites.map((fav) => (
        <HospitalCard key={fav.id} favorite={fav} onRemove={onRemove} />
      ))}
    </div>
  );
};

const FavoritesContent = () => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    })();
  }, [supabase]);

  const loadFavorites = useCallback(async () => {
    setIsLoadingFavorites(true);
    try {
      const response = await fetch("/api/favorites");
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Error loading favorites: Received non-JSON response', {
          status: response.status,
          contentType,
          preview: text.substring(0, 200)
        });
        setFavorites([]);
        toast.error("ไม่สามารถโหลดรายการโปรดได้ (Server error)");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setFavorites(result.data || []);
      } else {
        throw new Error(result.error || "Failed to load favorites");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      console.error("Error loading favorites:", errorMsg);
      setFavorites([]);
      toast.error("ไม่สามารถโหลดรายการโปรดได้");
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadFavorites();
  }, [user, loadFavorites]);

  const hospitalFavorites = useMemo(
    () => favorites.filter((fav) => fav.item_type === "hospital" && fav.hospital),
    [favorites]
  );
  const hospitalFavoritesCount = hospitalFavorites.length;
  const productFavoritesCount = useMemo(
    () => favorites.filter((fav) => fav.item_type === "product").length,
    [favorites]
  );

  const handleRemoveFavorite = useCallback(
    async (hospitalId: string) => {
      try {
        const response = await fetch(
          `/api/favorites?item_type=hospital&item_id=${hospitalId}`,
          { method: "DELETE" }
        );
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Error removing favorite: Received non-JSON response', {
            status: response.status,
            contentType,
            preview: text.substring(0, 200)
          });
          toast.error("เกิดข้อผิดพลาดในการลบรายการโปรด (Server error)");
          return;
        }

        const result = await response.json();

        if (result.success) {
          setFavorites((prev) =>
            prev.filter(
              (fav) =>
                !(
                  fav.item_type === "hospital" &&
                  fav.hospital &&
                  fav.hospital.id === hospitalId
                )
            )
          );
          toast.success("ลบออกจากรายการโปรดแล้ว");
        } else {
          throw new Error(result.error || "Failed to remove favorite");
        }
      } catch (error) {
        console.error("Error removing favorite:", error);
        toast.error("เกิดข้อผิดพลาดในการลบรายการโปรด");
      }
    },
    []
  );

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={dashboardMenuItems}
        headerTitle="รายการโปรด"
        headerSubtitle="โรงพยาบาลและสินค้าที่คุณบันทึกไว้"
        roleLabel="ผู้ใช้ทั่วไป"
        roleColor="primary"
        userEmail={user?.email}
        showPartnerButton
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
      headerTitle="รายการโปรด"
      headerSubtitle="โรงพยาบาลและสินค้าที่คุณบันทึกไว้"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton
    >
      <FavoriteStats
        isLoadingFavorites={isLoadingFavorites}
        hospitalCount={hospitalFavoritesCount}
        productCount={productFavoritesCount}
        allCount={favorites.length}
      />
      <section>
        <h2 className="mb-6 font-semibold text-2xl text-zinc-950">โรงพยาบาลโปรด</h2>
        <HospitalFavoritesSection
          isLoadingFavorites={isLoadingFavorites}
          hospitalFavorites={hospitalFavorites}
          onRemove={handleRemoveFavorite}
        />
      </section>
    </DashboardLayout>
  );
};

const FavoritesPage = () => (
  <RoleGuard allowedRole="authenticated">
    <FavoritesContent />
  </RoleGuard>
);

export default FavoritesPage;