"use client";

import { useState, ChangeEvent } from "react";
import { PRODUCTS } from "@/lib/data";
import { PageHeader } from "@/components/shared";
import { ProductCard } from "@/components/shared";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

const getUniqueCategories = () => [
  "all",
  ...Array.from(new Set(PRODUCTS.map(product => product.category).filter(Boolean))),
];

const filterProducts = (search: string, category: string) =>
  PRODUCTS.filter(product => {
    const keyword = search.toLowerCase();
    const matchesSearch =
      product.nameThai?.toLowerCase().includes(keyword) ||
      product.nameEnglish?.toLowerCase().includes(keyword) ||
      product.description?.toLowerCase().includes(keyword);

    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = getUniqueCategories();
  const filteredProducts = filterProducts(searchQuery, selectedCategory);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);
  const handleCategory = (e: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="bg-zinc-950 min-h-screen">
      <PageHeader
        title="ร้านค้า"
        description="อุปกรณ์และเครื่องแต่งกายมวยไทยคุณภาพสูง"
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchQuery}
                onChange={handleSearch}
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full placeholder-zinc-400"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2" />
              <select
                value={selectedCategory}
                onChange={handleCategory}
                className="bg-zinc-950 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full appearance-none cursor-pointer"
              >
                <option value="all">หมวดหมู่ทั้งหมด</option>
                {categories
                  .filter(cat => cat !== "all")
                  .map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-zinc-400">
          พบ {filteredProducts.length} สินค้า
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400 text-xl">
              ไม่พบสินค้าที่ตรงกับการค้นหา
            </p>
            <button
              onClick={handleReset}
              className="bg-brand-primary hover:bg-red-700 mt-4 px-6 py-2 rounded-lg transition-colors"
             aria-label="Button">
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
