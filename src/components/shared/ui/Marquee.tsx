"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/database/supabase/client";
import Link from "next/link";

interface Promotion {
  id: string;
  title: string;
  title_english?: string;
  link_url?: string;
}

export default function Marquee() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const supabase = createClient();
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("promotions")
          .select("id, title, title_english, link_url")
          .eq("is_active", true)
          .eq("show_in_marquee", true)
          .or(`start_date.is.null,start_date.lte.${now}`)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .order("priority", { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching promotions:', error);
          // Set empty array on error to show placeholder
          setPromotions([]);
          return;
        }

        setPromotions(data || []);
      } catch (error) {
        // Handle connection errors (ERR_CONNECTION_REFUSED, etc.)
        console.error('Failed to fetch promotions:', error);
        // Set empty array to show placeholder
        setPromotions([]);
      }
    }

    fetchPromotions();
  }, []);

  // Placeholder when no promotions
  const placeholderPromotions = Array(16).fill({ id: "placeholder", title: "Advertisement here" });
  const displayPromotions = promotions.length > 0 
    ? [...promotions, ...promotions] // Duplicate for seamless loop
    : placeholderPromotions;

  return (
    <div className="relative bg-gradient-to-r from-red-600 to-red-700 py-3 w-full overflow-hidden">
      <div className="flex gap-8 whitespace-nowrap animate-marquee">
        {displayPromotions.map((promo, i) => (
          <span key={`${promo.id}-${i}`} className="font-bold text-lg tracking-wider">
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
