"use client";

import { useState } from "react";
import { PRODUCTS } from "@/lib/data";
import { Product } from "@/types";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract unique categories
  const categories = [
    "all",
    ...new Set(PRODUCTS.map((p) => p.category).filter(Boolean)),
  ];

  // Filter products
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesSearch =
      product.nameThai?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Header */}
      <div className="bg-zinc-800 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
          <div className="text-center">
            <h1 className="mb-4 font-bold text-white text-4xl">ร้านค้า</h1>
            <p className="mx-auto max-w-3xl text-zinc-300 text-xl">
              อุปกรณ์และเครื่องแต่งกายมวยไทยคุณภาพสูง
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-400"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2 transform" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-zinc-800 py-3 pr-4 pl-10 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-white appearance-none cursor-pointer"
              >
                <option value="all">หมวดหมู่ทั้งหมด</option>
                {categories
                  .filter((cat) => cat !== "all")
                  .map((category) => (
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
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="bg-red-600 hover:bg-red-700 mt-4 px-6 py-2 rounded-lg text-white transition-colors"
            >
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const productName = product.nameThai || product.nameEnglish || "สินค้า";
  const isOutOfStock = product.stock <= 0;

  return (
    <Link href={`/shop/${product.slug}`}>
      <div className="group bg-zinc-800 hover:shadow-2xl hover:shadow-red-500/30 border border-zinc-700 hover:border-red-500 rounded-lg overflow-hidden transition-all duration-300">
        {/* Image Placeholder */}
        <div className="relative flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-900 aspect-square">
          <div className="text-zinc-600 text-7xl">🥊</div>
          {isOutOfStock && (
            <div className="top-2 right-2 absolute bg-red-600 px-3 py-1 rounded-full">
              <span className="font-bold text-white text-xs">หมด</span>
            </div>
          )}
          {product.category && (
            <div className="bottom-2 left-2 absolute bg-black/50 px-2 py-1 rounded-full">
              <span className="text-white text-xs">{product.category}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Product Name */}
          <h3 className="mb-2 font-semibold text-white group-hover:text-red-400 text-lg line-clamp-2 transition-colors">
            {productName}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="mb-3 text-zinc-400 text-sm line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className="fill-yellow-400 w-4 h-4 text-yellow-400"
              />
            ))}
          </div>

          {/* Price and Stock */}
          <div className="flex justify-between items-center pt-3 border-zinc-700 border-t">
            <div>
              <p className="font-bold text-red-500 text-xl">
                ฿{product.price.toLocaleString()}
              </p>
              <p className="text-zinc-400 text-xs">
                {isOutOfStock ? "สินค้าหมด" : `มีสินค้า ${product.stock} ชิ้น`}
              </p>
            </div>
            <button
              disabled={isOutOfStock}
              className={`p-2 rounded-lg transition-colors ${
                isOutOfStock
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              <ShoppingCartIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

