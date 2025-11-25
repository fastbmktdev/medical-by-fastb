"use client";

import { use, useEffect, useState, useCallback, memo } from "react";
import { createClient } from '@shared/lib/database/supabase/client';
import type { hospital } from '@shared/types';
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
import { HospitalMap } from "@/components/shared/maps/HospitalMap";
import { Loading } from "@/components/design-system/primitives/Loading";
import { HospitalGallery } from "@/components/features/hospital";

const Breadcrumb = memo(function Breadcrumb({ hospitalName }: { hospitalName: string }) {
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
        href="/hospitals"
        className="text-zinc-400 hover:text-white transition-colors"
      >
        โรงพยาบาล
      </Link>
      <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
      <span className="font-medium text-white">{hospitalName}</span>
    </nav>
  );
});

const BackButton = memo(function BackButton() {
  return (
    <Link
      href="/hospitals"
      className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
    >
      <ArrowLeftIcon className="w-5 h-5" />
      <span>กลับไปหน้ารายการโรงพยาบาล</span>
    </Link>
  );
});

const HospitalHeader = memo(function HospitalHeader({ hospital }: { hospital: hospital }) {
  return (
    <div>
      <div className="flex justify-start items-end gap-3 mb-4">
        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-4">
          <h1 className="font-bold text-4xl sm:text-5xl tracking-tight">
            {hospital.hospital_name}
          </h1>
        </div>
        <p className="mt-2 text-zinc-300 text-lg">{hospital.hospital_name_english}</p>
      </div>
      {hospital.hospital_type && (
        <span className="inline-block bg-brand-primary px-3 py-1  font-semibold text-sm">
          {hospital.hospital_type}
        </span>
      )}
    </div>
  );
});

const AboutSection = memo(function AboutSection({ details }: { details?: string | null }) {
  return (
    <div className="bg-zinc-100 p-6 border border-zinc-700 ">
      <h2 className="mb-4 font-bold text-2xl">เกี่ยวกับโรงพยาบาล</h2>
      {details ? (
        <div 
          className="text-zinc-300 leading-relaxed prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ 
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            __html: require('@shared/lib/utils/sanitize').sanitizeHTML(details) 
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
    <div className="bg-zinc-100 p-6 border border-zinc-700 ">
      <h2 className="mb-4 font-bold text-2xl">ที่อยู่และแผนที่</h2>
      <div className="flex items-start gap-3 mb-4">
        <MapPinIcon className="shrink-0 w-6 h-6 text-red-500" />
        <p className="text-zinc-300">{location || "ไม่มีข้อมูลที่อยู่"}</p>
      </div>
      {mapUrl && (
        <Link
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2  transition-colors"
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
    <div className="bg-zinc-100 p-6 border border-zinc-700 ">
      <h2 className="mb-4 font-bold text-2xl">บริการ</h2>
      <div className="flex flex-wrap gap-2">
        {services.map((service, idx) => (
          <span
            key={service + idx}
            className="bg-zinc-700 px-3 py-1  text-zinc-300 text-sm"
          >
            {service}
          </span>
        ))}
      </div>
    </div>
  );
});

const ContactInfo = memo(function ContactInfo({ hospital }: { hospital: hospital }) {
  return (
    <div className="bg-zinc-100 p-6 border border-zinc-700 ">
      <h3 className="mb-4 font-bold text-xl">ข้อมูลติดต่อ</h3>
      <div className="space-y-4">
        {hospital.phone && (
          <div className="flex items-start gap-3">
            <PhoneIcon className="shrink-0 mt-0.5 w-5 h-5 text-green-500" />
            <div>
              <p className="mb-1 text-zinc-400 text-xs">โทรศัพท์</p>
              <Link
                href={`tel:${hospital.phone}`}
                className="text-zinc-300 hover:text-white transition-colors"
              >
                {hospital.phone}
              </Link>
            </div>
          </div>
        )}
        {hospital.email && (
          <div className="flex items-start gap-3">
            <EnvelopeIcon className="shrink-0 mt-0.5 w-5 h-5 text-blue-500" />
            <div>
              <p className="mb-1 text-zinc-400 text-xs">อีเมล</p>
              <Link
                href={`mailto:${hospital.email}`}
                className="text-zinc-300 hover:text-white break-all transition-colors"
              >
                {hospital.email}
              </Link>
            </div>
          </div>
        )}
        {hospital.website && (
          <div className="flex items-start gap-3">
            <GlobeAltIcon className="shrink-0 mt-0.5 w-5 h-5 text-purple-500" />
            <div>
              <p className="mb-1 text-zinc-400 text-xs">เว็บไซต์</p>
              <Link
                href={hospital.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white break-all transition-colors"
              >
                {hospital.website}
              </Link>
            </div>
          </div>
        )}
        {hospital.socials && (
          <div className="flex items-start gap-3">
            <GlobeAltIcon className="shrink-0 mt-0.5 w-5 h-5 text-purple-500" />
            <div>
              <p className="mb-1 text-zinc-400 text-xs">โซเชียลมีเดีย</p>
              <p className="text-zinc-300">{hospital.socials}</p>
            </div>
          </div>
        )}
        {hospital.contact_name && (
          <div className="pt-4 border-zinc-700 border-t">
            <p className="mb-1 text-zinc-400 text-xs">ผู้ติดต่อ</p>
            <p className="text-zinc-300">{hospital.contact_name}</p>
          </div>
        )}
      </div>
    </div>
  );
});

const QuickInfo = memo(function QuickInfo({ hospital }: { hospital: hospital }) {
  return (
    <div className="bg-zinc-100 p-6 border border-zinc-700 ">
      <h3 className="mb-4 font-bold text-xl">ข้อมูลทั่วไป</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-zinc-400 text-xs">เวลาทำการ</p>
            <p className="text-zinc-300">
              {/* ใช้ hospital.opening_hours หากมีข้อมูล ไม่งั้น fallback */}
              {hospital.opening_hours ?? "จันทร์-เสาร์: 06:00-20:00"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-zinc-400 text-xs">ราคา</p>
            <p className="font-semibold text-zinc-300">
              {/* ใช้ hospital.price หากมีข้อมูล ไม่งั้น fallback */}
              {hospital.price ? hospital.price : "ติดต่อสอบถาม"}
            </p>
          </div>
        </div>
        {/* ใช้ hospital.usage_details หากมีข้อมูล */}
        {hospital.usage_details && (
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-zinc-400 text-xs">การใช้บริการ</p>
              <p className="text-zinc-300">{hospital.usage_details}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const CTABooking = memo(function CTABooking({ hospitalSlug }: { hospitalSlug: string }) {
  return (
    <div className="bg-linear-to-r from-red-600 to-red-700 p-6  text-center">
      <h3 className="mb-2 font-bold text-xl">
        ต้องการใช้บริการโรงพยาบาล
      </h3>
      <Link
        href={`/hospitals/${hospitalSlug}/appointment`}
        className="block bg-white hover:bg-zinc-100 px-6 py-3  w-full font-semibold text-red-600 transition-colors"
      >
        จองโรงพยาบาล
      </Link>
    </div>
  );
});

export default function HospitalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [hospital, setHospital] = useState<hospital | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (error) {
        console.error("Error fetching hospital:", error);
      }
      setHospital(data);

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
      <div className="flex justify-center items-center bg-zinc-100 min-h-screen">
        <Loading centered size="xl" />
      </div>
    );
  }

  if (!hospital) {
    notFound();
    return null;
  }

  const showBookingCTA = userRole !== "admin" && userRole !== "partner";

  return (
    <div className="bg-zinc-100 min-h-screen">
      <div className="bg-zinc-100 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <Breadcrumb hospitalName={hospital.hospital_name} />
          <BackButton />
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <HospitalHeader hospital={hospital} />
            <HospitalGallery hospitalId={hospital.id} hospitalName={hospital.hospital_name} />
            <AboutSection details={hospital.hospital_details} />
            <LocationSection location={hospital.location} mapUrl={hospital.map_url} />
            <HospitalMap
              latitude={hospital.latitude ?? null}
              longitude={hospital.longitude ?? null}
              mapUrl={hospital.map_url ?? null}
              hospitalName={hospital.hospital_name}
            />
            <ServicesSection services={hospital.services || []} />
          </div>
          <div className="lg:col-span-1">
            <div className="top-4 sticky space-y-6">
              <ContactInfo hospital={hospital} />
              <QuickInfo hospital={hospital} />
              {showBookingCTA && <CTABooking hospitalSlug={hospital.slug ?? ""} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
