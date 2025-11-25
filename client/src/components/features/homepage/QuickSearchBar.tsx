"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { trackSearch } from "@shared/lib/utils/analytics";

export default function QuickSearchBar() {
  const router = useRouter();
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState("hospitals");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "hospitals", label: "โรงพยาบาล" },
    { id: "shop", label: "ร้านค้า" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("q", searchQuery);

      // Track search event
      trackSearch(searchQuery.trim(), activeCategory);
    }
    const queryString = params.toString();

    let path = "";
    if (activeCategory === "hospitals") {
      path = "/hospitals";
    } else {
      path = "/shop";
    }

    router.push(`/${locale}${path}${queryString ? `?${queryString}` : ""}`);
  };

  const selectedCategory = categories.find((c) => c.id === activeCategory);

  return (
    <div className="z-20 relative -mt-1/2 mb-1/2 py-16">
      <div className="mx-auto px-4 max-w-4xl">
        <div className="bg-white shadow-2xl p-3 border border-gray-200 ">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative group">
              <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-3  transition-colors cursor-pointer">
                <span className="font-semibold text-gray-700">
                  {selectedCategory?.label}
                </span>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform group-hover:rotate-180" />
              </div>
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bg-white shadow-xl pt-2 border border-gray-200  w-full z-50 mt-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 w-full text-left transition-colors"
                  >
                    <span className="text-gray-700">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="top-1/2 left-4 absolute w-5 h-5 text-gray-400 -translate-y-1/2" />
              <input
                suppressHydrationWarning
                type="text"
                placeholder="ค้นหาโรงพยาบาล บริการทางการแพทย์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-200 py-3 pr-4 pl-12  focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full placeholder-gray-400 text-gray-700 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-primary hover:bg-[#8B5CF6] text-white px-8 py-3  font-semibold transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
              aria-label="ค้นหาโรงพยาบาลและบริการ"
            >
              ค้นหา
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
