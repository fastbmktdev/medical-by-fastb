"use client";

import Link from "next/link";
import { Product } from "@/types";
import { StarIcon } from "@heroicons/react/24/solid";

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
        <div className="gap-6 grid grid-cols-2 md:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const productName = product.nameThai || product.nameEnglish || "สินค้า";

  return (
    <Link href={`/shop/${product.slug}`}>
      <div className="group bg-zinc-950 hover:shadow-2xl hover:shadow-red-500/20 rounded-lg overflow-hidden transition-all">
        {/* Image */}
        <div className="relative flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-800 aspect-square">
          <span className="text-5xl md:text-6xl">🥊</span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-2 font-semibold text-white group-hover:text-red-400 text-sm md:text-base line-clamp-2 transition-colors">
            {productName}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className="fill-yellow-400 w-3 h-3 text-yellow-400" />
            ))}
          </div>

          <p className="font-bold text-red-500 text-lg">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  );
}

