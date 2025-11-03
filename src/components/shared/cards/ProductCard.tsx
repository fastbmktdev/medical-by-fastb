"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { BaseCard } from "./BaseCard";

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const productName = product.nameEnglish || product.nameThai;
  const isOutOfStock = product.stock <= 0;
  const imageUrl = product.images?.[0] || "/assets/images/fallback-img.jpg";

  return (
    <BaseCard>
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative w-full aspect-square">
          <Image
            src={imageUrl}
            alt={productName || "Product image"}
            fill
            className="object-cover"
          />
          {isOutOfStock && (
            <div className="top-2 right-2 absolute bg-brand-primary px-3 py-1 rounded-full">
              <span className="font-bold text-xs">หมด</span>
            </div>
          )}
          {product.category && (
            <div className="bottom-2 left-2 absolute bg-black/50 px-2 py-1 rounded-full">
              <span className=" text-xs">{product.category}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {/* Product Name */}
        <h3 className="mb-2 font-semibold group-hover:text-red-400 text-lg line-clamp-2 transition-colors">
          {productName}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="mb-3 text-zinc-400 text-sm line-clamp-2">
            {product.description}
          </p>
        )}

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
          {showAddToCart && (
            <button
              disabled={isOutOfStock}
              className={`p-2 rounded-lg transition-colors ${
                isOutOfStock
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-brand-primary hover:bg-red-700 text-white"
              }`}
             aria-label="Button">
              <ShoppingCartIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
