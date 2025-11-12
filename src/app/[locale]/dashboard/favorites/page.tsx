"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/database/supabase/client";
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

type Gym = {
  id: string;
  gym_name: string;
  gym_name_english?: string;
  location: string;
  images: string[];
  slug?: string;
};

type FavoriteItem = {
  id: string;
  item_type: "gym" | "product" | "event";
  item_id: string;
  created_at: string;
  gym?: Gym;
};

const GYM_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400";

interface GymCardProps {
  favorite: FavoriteItem;
  onRemove: (id: string) => void;
}

const GymCard = ({ favorite, onRemove }: GymCardProps) => {
  const gym = favorite.gym!;
  const gymImage =
    gym.images?.length ? gym.images[0] : GYM_FALLBACK_IMAGE;
  const gymSlug = gym.slug || gym.id;
  return (
    <Card className="bg-default-100/50 backdrop-blur-sm border-none">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={gymImage}
            alt={gym.gym_name}
            fill
            sizes="100%"
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = GYM_FALLBACK_IMAGE;
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
          onPress={() => onRemove(gym.id)}
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
  gymCount: number;
  productCount: number;
  allCount: number;
}

const FavoriteStats = ({
  isLoadingFavorites,
  gymCount,
  productCount,
  allCount,
}: FavoriteStatsProps) => {
  const stats = [
    {
      icon: <HeartSolidIcon className="w-6 h-6 text-white" />,
      bgColor: "bg-danger",
      label: "ยิมโปรด",
      count: gymCount,
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
          <Card key={idx} className="flex flex-row items-center justify-between border border-zinc-700 rounded-lg">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className={`${bgColor} p-3 rounded-lg`}>
                  {icon}
                </div>
                <div>
                  <p className="mb-1 text-default-400 text-sm">{label}</p>
                  <p className="font-bold text-2xl text-white">
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

const NoGymFavorites = () => (
  <Card className="bg-zinc-900 backdrop-blur-sm border border-zinc-700 rounded-lg">
    <CardBody className="py-16 text-center">
      <HeartIcon className="mx-auto mb-4 w-16 h-16 text-default-300" />
      <h3 className="mb-2 font-semibold text-xl text-white">ยังไม่มีรายการโปรด</h3>
      <p className="mb-6 text-default-400">
        เริ่มเพิ่มยิมที่คุณชื่นชอบเพื่อเข้าถึงได้ง่ายขึ้น
      </p>
      <Button
        as={Link}
        href="/gyms"
        className="bg-red-600 text-white hover:bg-red-800 rounded-lg w-fit mx-auto"
        startContent={<MapPinIcon className="w-5 h-5" />}
      >
        ค้นหายิม
      </Button>
    </CardBody>
  </Card>
);

interface GymFavoritesSectionProps {
  isLoadingFavorites: boolean;
  gymFavorites: FavoriteItem[];
  onRemove: (id: string) => void;
}

const GymFavoritesSection = ({
  isLoadingFavorites,
  gymFavorites,
  onRemove,
}: GymFavoritesSectionProps) => {
  if (isLoadingFavorites)
    return (
      <div className="flex justify-center items-center py-20">
        <Loading centered size="lg" />
      </div>
    );
  if (!gymFavorites.length) return <NoGymFavorites />;
  return (
    <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {gymFavorites.map((fav) => (
        <GymCard key={fav.id} favorite={fav} onRemove={onRemove} />
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
      toast.error("ไม่สามารถโหลดรายการโปรดได้");
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadFavorites();
  }, [user, loadFavorites]);

  const gymFavorites = useMemo(
    () => favorites.filter((fav) => fav.item_type === "gym" && fav.gym),
    [favorites]
  );
  const gymFavoritesCount = gymFavorites.length;
  const productFavoritesCount = useMemo(
    () => favorites.filter((fav) => fav.item_type === "product").length,
    [favorites]
  );

  const handleRemoveFavorite = useCallback(
    async (gymId: string) => {
      try {
        const response = await fetch(
          `/api/favorites?item_type=gym&item_id=${gymId}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (result.success) {
          setFavorites((prev) =>
            prev.filter(
              (fav) =>
                !(
                  fav.item_type === "gym" &&
                  fav.gym &&
                  fav.gym.id === gymId
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
        headerSubtitle="ยิมและสินค้าที่คุณบันทึกไว้"
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
      headerSubtitle="ยิมและสินค้าที่คุณบันทึกไว้"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton
    >
      <FavoriteStats
        isLoadingFavorites={isLoadingFavorites}
        gymCount={gymFavoritesCount}
        productCount={productFavoritesCount}
        allCount={favorites.length}
      />
      <section>
        <h2 className="mb-6 font-bold text-2xl">ยิมโปรด</h2>
        <GymFavoritesSection
          isLoadingFavorites={isLoadingFavorites}
          gymFavorites={gymFavorites}
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