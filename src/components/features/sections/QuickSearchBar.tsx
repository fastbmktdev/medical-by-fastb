"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function QuickSearchBar() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("gyms");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "gyms", label: "Gyms/Classes", icon: "🥊" },
    { id: "events", label: "Stadiums/Watch", icon: "🏟️" },
    { id: "shop", label: "Special Events", icon: "⭐" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCategory === "gyms") {
      router.push("/gyms");
    } else if (activeCategory === "events") {
      router.push("/events");
    } else {
      router.push("/shop");
    }
  };

  return (
    <div className="z-20 relative mt-8">
      <div className="mx-auto px-4 max-w-5xl">
        <div className="bg-zinc-950 shadow-2xl p-6 border border-zinc-800 rounded-2xl">
          {/* Categories */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? "bg-red-600 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <MagnifyingGlassIcon className="top-1/2 left-4 absolute w-6 h-6 text-zinc-400 -translate-y-1/2 transform" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-700 py-4 pr-4 pl-14 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-400"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

