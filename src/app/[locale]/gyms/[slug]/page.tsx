"use client";

import { use, useEffect, useState, useCallback, memo } from "react";
import { createClient } from "@/lib/database/supabase/client";
import type { Gym } from "@/types";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { Link } from '@/navigation';
import { notFound } from "next/navigation";
import { GymMap } from "@/components/shared/maps/GymMap";

const Breadcrumb = memo(function Breadcrumb({ gymName }: { gymName: string }) {
  return (
    <nav className="flex items-center gap-2 mb-3 text-sm">
      <Link
        href="/"
        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
      >
        <HomeIcon className="w-4 h-4" />
        <span>หน้าแรก</span>
      </Link>
      <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
      <Link
        href="/gyms"
        className="text-zinc-400 hover:text-white transition-colors"
      >
        ค่ายมวย
      </Link>
      <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
      <span className="font-medium text-white">{gymName}</span>
    </nav>
  );
});

const BackButton = memo(function BackButton() {
  return (
    <Link
      href="/gyms"
      className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
    >
      <ArrowLeftIcon className="w-5 h-5" />
      <span>กลับไปหน้ารายการค่ายมวย</span>
    </Link>
  );
});

const GymHeader = memo(function GymHeader({ gym }: { gym: Gym }) {
  return (
    <div>
      <div className="flex justify-start items-end gap-3 mb-4">
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-4">
          <h1 className="font-bold text-4xl sm:text-5xl tracking-tight">
            {gym.gym_name}
          </h1>
        </div>
        <p className="mt-2 text-zinc-300 text-lg">{gym.gym_name_english}</p>
      </div>
      {gym.gym_type && (
        <span className="inline-block bg-brand-primary px-3 py-1 rounded-full font-semibold text-sm">
          {gym.gym_type}
        </span>
      )}
    </div>
  );
});

const GalleryPlaceholder = memo(function GalleryPlaceholder() {
  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-950 rounded-lg h-96">
      <div className="text-center">
        <div className="mb-4 text-zinc-600 text-9xl">🥊</div>
        <p className="text-zinc-400">ภาพประกอบจะมาเร็วๆ นี้</p>
      </div>
    </div>
  );
});

const AboutSection = memo(function AboutSection({ details }: { details?: string | null }) {
  return (
    <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
      <h2 className="mb-4 font-bold text-2xl">เกี่ยวกับค่ายมวย</h2>
      {details ? (
        <div 
          className="text-zinc-300 leading-relaxed prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ 
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            __html: require('@/lib/utils/sanitize').sanitizeHTML(details) 
          }}
        />
      ) : (
        <p className="text-zinc-300 leading-relaxed">ไม่มีรายละเอียดเพิ่มเติม</p>
      )}
    </div>
  );
});

const LocationSection = memo(function LocationSection({
  location,
  mapUrl,
}: {
  location?: string;
  mapUrl?: string | null;
}) {
  return (
    <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
      <h2 className="mb-4 font-bold text-2xl">ที่อยู่และแผนที่</h2>
      <div className="flex items-start gap-3 mb-4">
        <MapPinIcon className="flex-shrink-0 w-6 h-6 text-red-500" />
        <p className="text-zinc-300">{location || "ไม่มีข้อมูลที่อยู่"}</p>
      </div>
      {mapUrl && (
        <Link
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg transition-colors"
        >
          <GlobeAltIcon className="w-5 h-5" />
          <span>เปิดใน Google Maps</span>
        </Link>
      )}
    </div>
  );
});

const ServicesSection = memo(function ServicesSection({ services }: { services: string[] }) {
  if (!services?.length) return null;
  return (
    <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
      <h2 className="mb-4 font-bold text-2xl">บริการ</h2>
      <div className="flex flex-wrap gap-2">
        {services.map((service, idx) => (
          <span
            key={service + idx}
            className="bg-zinc-700 px-3 py-1 rounded-full text-zinc-300 text-sm"
          >
            {service}
          </span>
        ))}
      </div>
    </div>
  );
});

const ContactInfo = memo(function ContactInfo({ gym }: { gym: Gym }) {
  return (
    <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
      <h3 className="mb-4 font-bold text-xl">ข้อมูลติดต่อ</h3>
      <div className="space-y-4">
        {gym.phone && (
          <div className="flex items-start gap-3">
            <PhoneIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-green-500" />
            <div>
              <p className="mb-1 text-zinc-400 text-xs">โทรศัพท์</p>
              <Link
                href={`tel:${gym.phone}`}
                className="text-zinc-300 hover:text-white transition-colors"
              >
                {gym.phone}
              </Link>
            </div>
          </div>
        )}
        {gym.email && (
          <div className="flex items-start gap-3">
            <EnvelopeIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-500" />
            <div>
              <p className="mb-1 text-zinc-400 text-xs">อีเมล</p>
              <Link
                href={`mailto:${gym.email}`}
                className="text-zinc-300 hover:text-white break-all transition-colors"
              >
                {gym.email}
              </Link>
            </div>
          </div>
        )}
        {gym.website && (
          <div className="flex items-start gap-3">
            <GlobeAltIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-purple-500" />
            <div>
              <p className="mb-1 text-zinc-400 text-xs">เว็บไซต์</p>
              <Link
                href={gym.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white break-all transition-colors"
              >
                {gym.website}
              </Link>
            </div>
          </div>
        )}
        {gym.socials && (
          <div className="flex items-start gap-3">
            <GlobeAltIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-purple-500" />
            <div>
              <p className="mb-1 text-zinc-400 text-xs">โซเชียลมีเดีย</p>
              <p className="text-zinc-300">{gym.socials}</p>
            </div>
          </div>
        )}
        {gym.contact_name && (
          <div className="pt-4 border-zinc-700 border-t">
            <p className="mb-1 text-zinc-400 text-xs">ผู้ติดต่อ</p>
            <p className="text-zinc-300">{gym.contact_name}</p>
          </div>
        )}
      </div>
    </div>
  );
});

const QuickInfo = memo(function QuickInfo({ gym }: { gym: Gym }) {
  return (
    <div className="bg-zinc-950 p-6 border border-zinc-700 rounded-lg">
      <h3 className="mb-4 font-bold text-xl">ข้อมูลทั่วไป</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-zinc-400 text-xs">เวลาทำการ</p>
            <p className="text-zinc-300">จันทร์-เสาร์: 06:00-20:00</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-zinc-400 text-xs">ราคา</p>
            <p className="font-semibold text-zinc-300">ติดต่อสอบถาม</p>
          </div>
        </div>
      </div>
    </div>
  );
});

const CTABooking = memo(function CTABooking({ gymSlug }: { gymSlug: string }) {
  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-lg text-center">
      <h3 className="mb-2 font-bold text-xl">
        ต้องการใช้บริการค่ายมวย
      </h3>
      <Link
        href={`/gyms/${gymSlug}/booking`}
        className="block bg-white hover:bg-zinc-100 px-6 py-3 rounded-lg w-full font-semibold text-red-600 transition-colors"
      >
        จองค่ายมวย
      </Link>
    </div>
  );
});

export default function GymDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [gym, setGym] = useState<Gym | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("gyms")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (error) {
        console.error("Error fetching gym:", error);
      }
      setGym(data);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        setUserRole(roleData?.role || null);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [slug, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-zinc-950 min-h-screen">
        <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (!gym) {
    notFound();
    return null;
  }

  const showBookingCTA = userRole !== "admin" && userRole !== "partner";

  return (
    <div className="bg-zinc-950 min-h-screen">
      <div className="bg-zinc-950 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <Breadcrumb gymName={gym.gym_name} />
          <BackButton />
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <GymHeader gym={gym} />
            <GalleryPlaceholder />
            <AboutSection details={gym.gym_details} />
            <LocationSection location={gym.location} mapUrl={gym.map_url} />
            <GymMap
              latitude={gym.latitude ?? null}
              longitude={gym.longitude ?? null}
              mapUrl={gym.map_url ?? null}
              gymName={gym.gym_name}
            />
            <ServicesSection services={gym.services || []} />
          </div>
          <div className="lg:col-span-1">
            <div className="top-4 sticky space-y-6">
              <ContactInfo gym={gym} />
              <QuickInfo gym={gym} />
              {showBookingCTA && <CTABooking gymSlug={gym.slug ?? ""} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
