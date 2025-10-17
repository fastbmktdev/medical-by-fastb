import Link from "next/link";
import Image from "next/image";

import { Button } from "@heroui/react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Product } from "@/types/strapi";
import { getStrapiMedia } from "@/lib/strapi";
import { STATIC_TEXT } from "@/lib/constants";
import ProductCard from "../cards/ProductCard";

function ErrorPlaceholder() {
  return (
    <div
      className="p-6 bg-zinc-800 rounded-lg my-4 text-center text-yellow-300 max-w-7xl mx-auto min-h-96 flex justify-center items-center"
    >
      ⚠️ ข้อมูลไม่พร้อมแสดง ขณะนี้ไม่สามารถเชื่อมต่อฐานข้อมูลได้
    </div>
  );
}

export default function LatestProducts({
  products,
  error,
}: {
  products: Product[];
  error?: string | null;
}) {
  return (
    <section className="bg-zinc-800">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 pb-24 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-white text-center">
          Our Products
        </h2>
        {error ? (
          <ErrorPlaceholder />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
