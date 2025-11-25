/**
 * Reusable card image component with consistent styling
 */

import Image from "next/image";
import { memo } from "react";
import { cn } from '@shared/lib/utils/cn';

interface CardImageProps {
  /**
   * Image source URL
   */
  src: string;
  /**
   * Alt text for the image
   */
  alt: string;
  /**
   * Aspect ratio or fixed height
   * @default "h-48" (fixed height of 12rem)
   */
  aspectRatio?: "h-48" | "aspect-square" | "aspect-video" | string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Image sizes attribute for Next.js Image optimization
   * @default "100%"
   */
  sizes?: string;
  /**
   * Object fit class
   * @default "object-cover"
   */
  objectFit?: "object-cover" | "object-contain" | "object-fill" | "object-none" | "object-scale-down";
}

/**
 * Standardized image component for cards
 * Provides consistent image rendering across all card types
 */
function CardImageComponent({
  src,
  alt,
  aspectRatio = "h-48",
  className,
  sizes = "100%",
  objectFit = "object-cover",
}: CardImageProps) {
  return (
    <div className={cn("relative w-full", aspectRatio, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={objectFit}
      />
    </div>
  );
}

export const CardImage = memo(CardImageComponent);

