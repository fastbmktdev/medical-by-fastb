"use client";

import Link from "next/link";
import { Product } from "@/types";
import { ProductCard } from "@/components/ui/cards";

interface LatestProductsProps {
  products: Product[];
}

export default function LatestProducts({ products }: LatestProductsProps) {
  return (
    <section className="py-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-white text-3xl md:text-4xl">
            Our Products
          </h2>
        </div>

        {/* Products Grid */}
        <div className="gap-6 grid grid-cols-2 md:grid-cols-4 mb-8">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showAddToCart={false}
            />
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href={"/shop"}
            className="inline-block bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 font-semibold text-white transition-colors"
            aria-label="View all products"
          >
            View all Products
          </Link>
        </div>
      </div>
    </section>
  );
}
