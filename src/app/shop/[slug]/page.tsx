"use client";

import { use, useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  TruckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { trackProductView } from "@/lib/utils/analytics";

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
  images?: string[];
  image?: string | null;
  variants?: Array<{
    id: string;
    type: string;
    name: string;
    value: string;
    priceAdjustment: number;
    stock: number;
    isDefault: boolean;
  }>;
  weightKg?: number | null;
  dimensions?: string | null;
  viewsCount?: number;
  salesCount?: number;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true);
        
        // Find product by slug
        const productsResponse = await fetch(`/api/products?active=true&limit=1000`);
        const productsData = await productsResponse.json();
        
        if (!productsData.success) {
          notFound();
          return;
        }

        const foundProduct = productsData.data?.find((p: Product) => p.slug === slug);
        
        if (!foundProduct) {
          notFound();
          return;
        }

        // Fetch full product details
        const detailResponse = await fetch(`/api/products/${foundProduct.id}`);
        const detailData = await detailResponse.json();
        
        if (detailData.success) {
          setProduct(detailData.data);
          
          // Track product view
          try {
            const productName = detailData.data.nameThai || detailData.data.nameEnglish || 'Unknown';
            const category = detailData.data.category?.nameThai || detailData.data.category?.nameEnglish || undefined;
            trackProductView(
              detailData.data.id,
              productName,
              category,
              detailData.data.price
            );
          } catch (error) {
            console.warn('Analytics tracking error:', error);
          }
          
          // Set default variant if available
          if (detailData.data.variants && detailData.data.variants.length > 0) {
            const defaultVariant = detailData.data.variants.find((v: any) => v.isDefault);
            if (defaultVariant) {
              setSelectedVariant(defaultVariant.id);
            }
          }
        } else {
          notFound();
        }

        // Fetch related products (same category)
        if (detailData.data?.category?.id) {
          const relatedResponse = await fetch(
            `/api/products?category=${detailData.data.category.id}&active=true&limit=5`
          );
          const relatedData = await relatedResponse.json();
          
          if (relatedData.success) {
            const related = relatedData.data
              ?.filter((p: Product) => p.id !== foundProduct.id)
              .slice(0, 4) || [];
            setRelatedProducts(related);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="bg-zinc-950 min-h-screen flex justify-center items-center">
        <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const productName = product.nameThai || product.nameEnglish || "สินค้า";
  const currentVariant = product.variants?.find(v => v.id === selectedVariant);
  const finalPrice = currentVariant 
    ? product.price + currentVariant.priceAdjustment 
    : product.price;
  const availableStock = currentVariant 
    ? currentVariant.stock 
    : product.stock;
  const isOutOfStock = availableStock <= 0;
  const totalPrice = finalPrice * quantity;
  const primaryImage = product.image || product.images?.[0] || "/assets/images/fallback-img.jpg";

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Back Button */}
      <div className="bg-zinc-950 border-zinc-700 border-b">
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
            <div className="relative flex justify-center items-center bg-gradient-to-br from-zinc-700 to-zinc-950 mb-4 rounded-lg aspect-square overflow-hidden">
              <Image
                src={primaryImage}
                alt={productName}
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Additional images */}
            {product.images && product.images.length > 1 && (
              <div className="gap-2 grid grid-cols-4">
                {product.images.slice(0, 4).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={img}
                      alt={`${productName} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Title and Category */}
            <div className="mb-6">
              {product.category && (
                <span className="inline-block bg-brand-primary mb-3 px-3 py-1 rounded-full font-semibold text-sm">
                  {product.category.nameThai || product.category.nameEnglish}
                </span>
              )}
              <h1 className="mb-2 font-bold text-4xl">
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
              <span className="text-zinc-400 text-sm">
                ({product.viewsCount || 0} วิว)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6 pb-6 border-zinc-700 border-b">
              <p className="mb-2 text-zinc-400 text-sm">ราคา</p>
              <p className="font-bold text-red-500 text-4xl">
                ฿{finalPrice.toLocaleString()}
              </p>
              {currentVariant && currentVariant.priceAdjustment !== 0 && (
                <p className="text-zinc-400 text-sm mt-1">
                  ราคาพื้นฐาน: ฿{product.price.toLocaleString()}
                </p>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-white">
                  {product.variants[0].type || "ตัวเลือก"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedVariant === variant.id
                          ? "border-red-500 bg-red-500/10 text-red-500"
                          : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      {variant.name || variant.value}
                      {variant.stock <= 0 && " (หมด)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="mb-2 font-semibold text-xl">
                  รายละเอียดสินค้า
                </h2>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product Details */}
            {(product.weightKg || product.dimensions) && (
              <div className="mb-6">
                <h2 className="mb-2 font-semibold text-xl">
                  ข้อมูลสินค้า
                </h2>
                <div className="space-y-1 text-zinc-300">
                  {product.weightKg && (
                    <p>น้ำหนัก: {product.weightKg} กิโลกรัม</p>
                  )}
                  {product.dimensions && (
                    <p>ขนาด: {product.dimensions}</p>
                  )}
                </div>
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
                    มีสินค้าในสต็อก ({availableStock} ชิ้น)
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
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={availableStock}
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    className="bg-zinc-950 px-4 py-2 border border-zinc-700 rounded-lg w-20 font-semibold text-center"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= availableStock}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <div className="ml-auto text-right">
                    <p className="text-zinc-400 text-xs">ราคารวม</p>
                    <p className="font-bold text-xl">
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
                  : "bg-brand-primary hover:bg-red-700 text-white"
              }`}
             aria-label="Button">
              <ShoppingCartIcon className="w-6 h-6" />
              {isOutOfStock ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
            </button>

            {/* Features */}
            <div className="gap-4 grid grid-cols-1 sm:grid-cols-3 mt-8">
              <div className="bg-zinc-950 p-4 border border-zinc-700 rounded-lg text-center">
                <TruckIcon className="mx-auto mb-2 w-8 h-8 text-blue-500" />
                <p className="font-semibold text-sm">จัดส่งฟรี</p>
                <p className="text-zinc-400 text-xs">สั่งซื้อขั้นต่ำ 1000฿</p>
              </div>
              <div className="bg-zinc-950 p-4 border border-zinc-700 rounded-lg text-center">
                <ShieldCheckIcon className="mx-auto mb-2 w-8 h-8 text-green-500" />
                <p className="font-semibold text-sm">รับประกัน</p>
                <p className="text-zinc-400 text-xs">รับประกัน 30 วัน</p>
              </div>
              <div className="bg-zinc-950 p-4 border border-zinc-700 rounded-lg text-center">
                <CheckCircleIcon className="mx-auto mb-2 w-8 h-8 text-purple-500" />
                <p className="font-semibold text-sm">ของแท้</p>
                <p className="text-zinc-400 text-xs">สินค้าแท้ 100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 font-bold text-2xl">
              สินค้าที่เกี่ยวข้อง
            </h2>
            <div className="gap-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/shop/${relatedProduct.slug}`}
                  className="group bg-zinc-950 hover:shadow-lg hover:shadow-red-500/20 border border-zinc-700 hover:border-red-500 rounded-lg overflow-hidden transition-all"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-zinc-700 to-zinc-950">
                    <Image
                      src={relatedProduct.image || relatedProduct.images?.[0] || "/assets/images/fallback-img.jpg"}
                      alt={relatedProduct.nameThai || relatedProduct.nameEnglish || "Product"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="mb-1 font-semibold group-hover:text-red-400 text-sm line-clamp-2 transition-colors">
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
        )}
      </div>
    </div>
  );
}
