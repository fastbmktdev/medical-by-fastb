"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { ProductCard } from "@/components/shared";
import { PageHeader } from "@/components/shared";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface Product {
  id: string;
  slug: string;
  nameThai?: string | null;
  nameEnglish?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  category?: {
    id: string;
    nameThai?: string | null;
    nameEnglish?: string | null;
    slug?: string | null;
  } | null;
  image?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
}

interface Category {
  id: string;
  nameThai?: string | null;
  nameEnglish?: string | null;
  slug?: string | null;
}

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories first
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/product-categories?active=true');
        const data = await response.json();
        
        if (data.success && data.data) {
          setCategories(data.data.map((cat: {
            id: string;
            nameThai?: string | null;
            nameEnglish?: string | null;
            slug?: string | null;
          }) => ({
            id: cat.id,
            nameThai: cat.nameThai,
            nameEnglish: cat.nameEnglish,
            slug: cat.slug,
          })));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const productsParams = new URLSearchParams();
        productsParams.append("active", "true");
        productsParams.append("limit", "100");
        
        if (selectedCategory !== "all") {
          productsParams.append("category", selectedCategory);
        }
        
        if (debouncedSearchQuery.trim()) {
          productsParams.append("search", debouncedSearchQuery.trim());
        }

        const productsResponse = await fetch(`/api/products?${productsParams.toString()}`);
        const productsData = await productsResponse.json();

        if (productsData.success) {
          setProducts(productsData.data || []);
        } else {
          setError(productsData.error || "Failed to load products");
        }

      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [debouncedSearchQuery, selectedCategory]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategory = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const filteredProducts = products;

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
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameThai || category.nameEnglish || "Unknown"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-zinc-400">
          {isLoading ? (
            "กำลังโหลด..."
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            `พบ ${filteredProducts.length} สินค้า`
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-20 text-center">
            <p className="text-red-500 text-xl mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-primary hover:bg-red-700 px-6 py-2 rounded-lg transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && (
          <>
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
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={{
                      id: product.id,
                      slug: product.slug,
                      nameThai: product.nameThai || undefined,
                      nameEnglish: product.nameEnglish || undefined,
                      description: product.description || undefined,
                      price: product.price,
                      stock: product.stock,
                      category: product.category?.nameThai || product.category?.nameEnglish || undefined,
                      image: product.image || undefined,
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
