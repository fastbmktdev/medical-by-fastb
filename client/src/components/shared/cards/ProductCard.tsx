"use client";

import { memo, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from '@/navigation';
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import type { Product } from "@shared/types/app.types";
import { BaseCard } from "./BaseCard";
import { extractImageUrl } from "./utils/imageUtils";

/**
 * ProductCard Component Props
 * 
 * @interface ProductCardProps
 * @property {Product} product - The product data to display
 * @property {boolean} [showAddToCart=true] - Whether to show the add to cart button
 * @property {onAddToCart} [onAddToCart] - Callback function when add to cart is clicked
 * @property {string} [className] - Additional CSS classes for the card
 * @property {string} [testId] - Test ID for testing purposes
 */
export interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  onAddToCart?: (product: Product) => void | Promise<void>;
  className?: string;
  testId?: string;
}

/**
 * ProductCard Component
 * 
 * A reusable product card component that displays product information
 * with support for internationalization, accessibility, and error handling.
 * 
 * Features:
 * - Type-safe with shared Product type
 * - Internationalization support
 * - Image error handling with fallback
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Loading states for add to cart action
 * - Optimized performance with memoization
 * 
 * @param {ProductCardProps} props - Component props
 * @returns {JSX.Element} Product card component
 */
function ProductCardComponent({
  product,
  showAddToCart = true,
  onAddToCart,
  className = "",
  testId,
}: ProductCardProps) {
  const t = useTranslations("product");
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Memoized computed values
  const productName = useMemo(
    () => product.nameEnglish || product.nameThai || t("nameFallback"),
    [product.nameEnglish, product.nameThai, t]
  );

  const isOutOfStock = useMemo(
    () => (product.stock || 0) <= 0,
    [product.stock]
  );

  const imageUrl = useMemo(
    () => extractImageUrl(product),
    [product]
  );

  const formattedPrice = useMemo(
    () => (product.price || 0).toLocaleString("th-TH"),
    [product.price]
  );

  const stockText = useMemo(
    () =>
      isOutOfStock
        ? t("outOfStock")
        : t("inStock", { count: product.stock || 0 }),
    [isOutOfStock, product.stock, t]
  );

  // Event handlers
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (isOutOfStock || isAddingToCart || !onAddToCart) {
        return;
      }

      setIsAddingToCart(true);
      try {
        await onAddToCart(product);
      } catch (error) {
        console.error("Error adding product to cart:", error);
        // Error handling can be extended with toast notifications
      } finally {
        setIsAddingToCart(false);
      }
    },
    [product, isOutOfStock, isAddingToCart, onAddToCart]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleAddToCart(e as unknown as React.MouseEvent<HTMLButtonElement>);
      }
    },
    [handleAddToCart]
  );

  return (
    <BaseCard className={className} data-testid={testId}>
      <Link
        href={`/shop/${product.slug}`}
        className="block "
        aria-label={`${t("viewProduct")}: ${productName}`}
      >
        <div className="relative w-full aspect-square overflow-hidden ">
          <Image
            src={imageError ? "/assets/images/fallback-img.jpg" : imageUrl}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            priority={false}
          />
          
          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div
              className="absolute top-2 right-2 bg-brand-primary px-3 py-1  shadow-lg"
              role="status"
              aria-label={t("outOfStock")}
            >
              <span className="font-semibold text-xs text-white">
                {t("outOfStockBadge")}
              </span>
            </div>
          )}

          {/* Category Badge */}
          {product.category && (
            <div
              className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 "
              aria-label={t("category")}
            >
              <span className="text-xs text-white">{product.category}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {/* Product Name */}
        <h3 className="mb-2 font-semibold group-hover:text-purple-400 text-lg line-clamp-2 transition-colors">
          <Link
            href={`/shop/${product.slug}`}
            className=""
          >
            {productName}
          </Link>
        </h3>

        {/* Description */}
        {product.description && (
          <p
            className="mb-3 text-zinc-400 text-sm line-clamp-2"
            aria-label={t("description")}
          >
            {product.description}
          </p>
        )}

        {/* Price and Stock */}
        <div className="flex justify-between items-center pt-3 border-zinc-700 border-t">
          <div>
            <p
              className="font-semibold text-purple-500 text-xl"
              aria-label={t("price", { amount: formattedPrice })}
            >
              ฿{formattedPrice}
            </p>
            <p
              className="text-zinc-400 text-xs"
              aria-label={stockText}
            >
              {stockText}
            </p>
          </div>

          {/* Add to Cart Button */}
          {showAddToCart && (
            <button
              type="button"
              onClick={handleAddToCart}
              onKeyDown={handleKeyDown}
              disabled={isOutOfStock || isAddingToCart}
              aria-label={
                isOutOfStock
                  ? t("addToCartDisabled")
                  : t("addToCart", { productName })
              }
              aria-disabled={isOutOfStock || isAddingToCart}
              className={`
                p-2 transition-all duration-200
                disabled:cursor-not-allowed disabled:opacity-60
                ${
                  isOutOfStock || isAddingToCart
                    ? "bg-zinc-100 text-zinc-500"
                    : "bg-brand-primary hover:bg-[#8B5CF6] active:scale-95 text-white"
                }
              `}
              data-testid={testId ? `${testId}-add-to-cart` : undefined}
            >
              <ShoppingCartIcon
                className={`w-5 h-5 ${isAddingToCart ? "animate-pulse" : ""}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export const ProductCard = memo(ProductCardComponent);
