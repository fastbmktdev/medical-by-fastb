"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { createClient } from '@shared/lib/database/supabase/client';
import Link from "next/link";

interface Promotion {
  id: string;
  title: string;
  title_english?: string | null;
  link_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: number | null;
}

function MarqueeComponent() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPromotions() {
      try {
        const supabase = createClient();
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("promotions")
          .select("id, title, title_english, link_url, start_date, end_date, priority")
          .eq("is_active", true)
          .eq("show_in_marquee", true)
          .order("priority", { ascending: false })
          .limit(20);

        if (error) {
          // Silently fail - show placeholder instead
          if (isMounted) setPromotions([]);
          return;
        }

        if (!isMounted) return;

        const nowDate = new Date(now);
        const filteredPromotions =
          (data ?? []).filter((promo: Promotion) => {
            const startsBeforeNow =
              !promo.start_date || new Date(promo.start_date) <= nowDate;
            const endsAfterNow =
              !promo.end_date || new Date(promo.end_date) >= nowDate;

            return startsBeforeNow && endsAfterNow;
          });

        setPromotions(filteredPromotions.slice(0, 5));
      } catch (error) {
        // Handle connection errors silently - show placeholder
        if (isMounted) setPromotions([]);
      }
    }

    fetchPromotions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Placeholder when no promotions
  const placeholderPromotions = useMemo(
    () => Array(16).fill({ id: "placeholder", title: "Advertisement here" }),
    []
  );

  const displayPromotions = useMemo(() => {
    return promotions.length > 0 
      ? [...promotions, ...promotions] // Duplicate for seamless loop
      : placeholderPromotions;
  }, [promotions, placeholderPromotions]);

  return (
    <div className="relative bg-linear-to-r from-violet-700 to-violet-900 text-zinc-100 py-3 w-full overflow-hidden">
      <div className="flex gap-8 whitespace-nowrap animate-marquee">
        {displayPromotions.map((promo, i) => (
          <span key={`${promo.id}-${i}`} className="font-semibold text-lg tracking-wider">
            {promo.link_url ? (
              <Link
                href={promo.link_url}
                className="hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {promo.title}
              </Link>
            ) : (
              promo.title
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default memo(MarqueeComponent);
