"use client";

import { use, useState } from "react";
import { PRODUCTS } from "@/lib/data";
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  TruckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const product = PRODUCTS.find((p) => p.slug === slug);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    notFound();
  }

  const productName = product.nameThai || product.nameEnglish || "สินค้า";
  const isOutOfStock = product.stock <= 0;
  const totalPrice = product.price * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Back Button */}
      <div className="bg-zinc-800 border-zinc-700 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>กลับไปหน้าร้านค้า</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-12 grid grid-cols-1 lg:grid-cols-2">
          {/* Product Images */}
          <div>
            <div className="flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-900 mb-4 rounded-lg aspect-square">
              <div className="text-center">
                <div className="mb-4 text-zinc-600 text-9xl">🥊</div>
                <p className="text-zinc-400">ภาพสินค้าจะมาเร็วๆ นี้</p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Title and Category */}
            <div className="mb-6">
              {product.category && (
                <span className="inline-block bg-red-600 mb-3 px-3 py-1 rounded-full font-semibold text-white text-sm">
                  {product.category}
                </span>
              )}
              <h1 className="mb-2 font-bold text-white text-4xl">
                {productName}
              </h1>
              {product.nameEnglish && product.nameThai && (
                <p className="text-zinc-400 text-lg">
                  {product.nameEnglish}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className="fill-yellow-400 w-5 h-5 text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-zinc-400 text-sm">(รีวิว 127 รายการ)</span>
            </div>

            {/* Price */}
            <div className="mb-6 pb-6 border-zinc-700 border-b">
              <p className="mb-2 text-zinc-400 text-sm">ราคา</p>
              <p className="font-bold text-red-500 text-4xl">
                ฿{product.price.toLocaleString()}
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="mb-2 font-semibold text-white text-xl">
                  รายละเอียดสินค้า
                </h2>
                <p className="text-zinc-300 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-red-500">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-semibold">สินค้าหมด</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-semibold">
                    มีสินค้าในสต็อก ({product.stock} ชิ้น)
                  </span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-white">
                  จำนวน
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    className="bg-zinc-800 px-4 py-2 border border-zinc-700 rounded-lg w-20 font-semibold text-white text-center"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <div className="ml-auto text-right">
                    <p className="text-zinc-400 text-xs">ราคารวม</p>
                    <p className="font-bold text-white text-xl">
                      ฿{totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              disabled={isOutOfStock}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-lg transition-colors ${
                isOutOfStock
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              <ShoppingCartIcon className="w-6 h-6" />
              {isOutOfStock ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
            </button>

            {/* Features */}
            <div className="gap-4 grid grid-cols-1 sm:grid-cols-3 mt-8">
              <div className="bg-zinc-800 p-4 border border-zinc-700 rounded-lg text-center">
                <TruckIcon className="mx-auto mb-2 w-8 h-8 text-blue-500" />
                <p className="font-semibold text-white text-sm">จัดส่งฟรี</p>
                <p className="text-zinc-400 text-xs">สั่งซื้อขั้นต่ำ 1000฿</p>
              </div>
              <div className="bg-zinc-800 p-4 border border-zinc-700 rounded-lg text-center">
                <ShieldCheckIcon className="mx-auto mb-2 w-8 h-8 text-green-500" />
                <p className="font-semibold text-white text-sm">รับประกัน</p>
                <p className="text-zinc-400 text-xs">รับประกัน 30 วัน</p>
              </div>
              <div className="bg-zinc-800 p-4 border border-zinc-700 rounded-lg text-center">
                <CheckCircleIcon className="mx-auto mb-2 w-8 h-8 text-purple-500" />
                <p className="font-semibold text-white text-sm">ของแท้</p>
                <p className="text-zinc-400 text-xs">สินค้าแท้ 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-16">
          <h2 className="mb-6 font-bold text-white text-2xl">
            สินค้าที่เกี่ยวข้อง
          </h2>
          <div className="gap-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {PRODUCTS.filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/shop/${relatedProduct.slug}`}
                  className="group bg-zinc-800 hover:shadow-lg hover:shadow-red-500/20 border border-zinc-700 hover:border-red-500 rounded-lg overflow-hidden transition-all"
                >
                  <div className="flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-900 aspect-square">
                    <div className="text-zinc-600 text-5xl">🥊</div>
                  </div>
                  <div className="p-3">
                    <p className="mb-1 font-semibold text-white group-hover:text-red-400 text-sm line-clamp-2 transition-colors">
                      {relatedProduct.nameThai || relatedProduct.nameEnglish}
                    </p>
                    <p className="font-bold text-red-500">
                      ฿{relatedProduct.price.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

