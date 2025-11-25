"use client";

/**
 * Image Watermark Utility
 * Adds watermark to images for security purposes
 * 
 * NOTE: This utility uses browser-only APIs (Canvas, FileReader)
 * and should only be used in client-side code.
 */

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Add watermark to an image file
 * @param file - Original image file
 * @param watermarkText - Text to use as watermark (default: "Medical Platform - สำหรับการสมัครเท่านั้น")
 * @returns Promise<File> - New file with watermark
 */
export async function addWatermarkToImage(
  file: File,
  watermarkText: string = "Medical Platform - สำหรับการสมัครเท่านั้น"
): Promise<File> {
  // Guard: Only run in browser
  if (!isBrowser()) {
    throw new Error('addWatermarkToImage can only be used in browser environment');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Calculate font size based on image width (responsive)
          const baseFontSize = Math.max(img.width / 30, 20);
          
          // Add semi-transparent overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Configure watermark text style
          ctx.font = `bold ${baseFontSize}px Arial, sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Add watermark multiple times in a grid pattern
          const padding = baseFontSize * 3;
          const rotation = -30 * Math.PI / 180; // -30 degrees

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(rotation);

          // Draw watermark in grid pattern
          for (let y = -canvas.height; y < canvas.height; y += padding * 2) {
            for (let x = -canvas.width; x < canvas.width; x += padding * 3) {
              ctx.strokeText(watermarkText, x, y);
              ctx.fillText(watermarkText, x, y);
            }
          }

          ctx.restore();

          // Add timestamp watermark at bottom
          const timestamp = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const timestampText = `วันที่สมัคร: ${timestamp}`;
          
          ctx.font = `${baseFontSize * 0.6}px Arial`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.lineWidth = 1;
          ctx.textAlign = 'center';
          
          const bottomY = canvas.height - baseFontSize;
          ctx.strokeText(timestampText, canvas.width / 2, bottomY);
          ctx.fillText(timestampText, canvas.width / 2, bottomY);

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }

            // Create new file with watermark
            const watermarkedFile = new File(
              [blob],
              file.name.replace(/(\.[^.]+)$/, '_watermarked$1'),
              {
                type: file.type,
                lastModified: Date.now(),
              }
            );

            resolve(watermarkedFile);
          }, file.type, 0.95); // 95% quality

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate ID card image
 * @param file - Image file to validate
 * @returns Object with validation result
 */
export function validateIdCardImage(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น',
    };
  }

  // Check file size (max 10MB for ID card)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'ขนาดไฟล์ต้องไม่เกิน 10MB',
    };
  }

  // Check minimum file size (should not be too small)
  const minSize = 50 * 1024; // 50KB
  if (file.size < minSize) {
    return {
      isValid: false,
      error: 'ไฟล์มีขนาดเล็กเกินไป กรุณาใช้รูปภาพที่ชัดเจน',
    };
  }

  return { isValid: true };
}

