"use client";

import { useState, useEffect } from "react";
import { Link } from '@/navigation';
import { ProductCard } from "@/components/shared";
import { Loading } from "@/components/design-system/primitives/Loading";

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
  } | null;
  image?: string | null;
}

export default function LatestProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const response = await fetch('/api/products?featured=true&active=true&limit=4');
        
        if (!response.ok) {
          // Handle HTTP errors (500, 404, etc.)
          console.error(`Error fetching products: ${response.status} ${response.statusText}`);
          setProducts([]);
          return;
        }
        
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          // Handle invalid response format
          console.warn('Invalid response format from products API:', data);
          setProducts([]);
        }
      } catch (err) {
        // Handle network errors (connection refused, timeout, etc.)
        console.error("Error fetching featured products:", err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFeaturedProducts();
  }, []);

  return (
    <section className="py-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">
            Our Products
          </h2>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading centered size="xl" />
          </div>
        ) : products.length > 0 ? (
          <div className="gap-6 grid grid-cols-2 md:grid-cols-4 mb-8">
            {products.map((product) => (
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
                showAddToCart={false}
              />
            ))}
          </div>
        ) : null}

        {/* View All Link */}
        <div className="text-center">
          <Link
            href={"/shop"}
            className="inline-block bg-brand-primary hover:bg-red-600 px-8 py-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 font-semibold transition-colors"
            aria-label="View all products"
          >
            View all Products
          </Link>
        </div>
      </div>
    </section>
  );
}
