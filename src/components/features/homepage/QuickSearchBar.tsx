"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { MagnifyingGlassIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { trackSearch } from "@/lib/utils/analytics";

export default function QuickSearchBar() {
  const router = useRouter();
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState("gyms");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "gyms", label: "Gyms/Classes", icon: "🥊" },
    { id: "events", label: "Stadiums/Watch", icon: "🏟️" },
    { id: "shop", label: "Special Events", icon: "⭐" },
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
    if (activeCategory === "gyms") {
      path = "/gyms";
    } else if (activeCategory === "events") {
      path = "/events";
    } else {
      path = "/shop";
    }

    router.push(`/${locale}${path}${queryString ? `?${queryString}` : ""}`);
  };

  
  const selectedCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="z-20 relative mt-8">
      <div className="mx-auto px-4 max-w-3xl">
        <div className="bg-zinc-950 shadow-2xl p-2 border border-zinc-800 rounded-2xl">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div 
              className="relative group" 
            >
              <div className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-lg transition-colors cursor-pointer">
                <span className="text-xl">{selectedCategory?.icon}</span>
                <span className="font-semibold">{selectedCategory?.label}</span>
                <ChevronDownIcon className="h-5 w-5 text-zinc-400 transition-transform group-hover:rotate-180" />
              </div>
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bg-zinc-800 shadow-lg pt-2 border border-zinc-700 rounded-lg w-full z-50">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className="flex items-center gap-2 hover:bg-zinc-700 px-4 py-2 w-full text-left"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex-grow">
              <MagnifyingGlassIcon className="top-1/2 left-4 absolute w-6 h-6 text-zinc-400 -translate-y-1/2" />
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Search for your next fight or gym..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 py-3 pr-4 pl-14 border border-transparent focus:border-red-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 w-full placeholder-zinc-400"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-primary hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
             aria-label="Button">
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

