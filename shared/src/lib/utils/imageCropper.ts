/**
 * Image Cropper Utility
 * Provides client-side image cropping functionality
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropResult {
  file: File;
  preview: string;
  width: number;
  height: number;
}

/**
 * Crop an image file using canvas
 */
export async function cropImage(
  file: File,
  cropArea: CropArea,
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality: number = 0.9
): Promise<CropResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create canvas for cropping
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Set canvas size to crop dimensions
          canvas.width = cropArea.width;
          canvas.height = cropArea.height;

          // Draw cropped portion
          ctx.drawImage(
            img,
            cropArea.x,
            cropArea.y,
            cropArea.width,
            cropArea.height,
            0,
            0,
            cropArea.width,
            cropArea.height
          );

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              // Create file from blob
              const croppedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, `.cropped${file.name.match(/\.[^.]+$/)?.[0] || '.jpg'}`),
                { type: outputFormat }
              );

              // Create preview URL
              const preview = URL.createObjectURL(blob);

              resolve({
                file: croppedFile,
                preview,
                width: cropArea.width,
                height: cropArea.height,
              });
            },
            outputFormat,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculate crop area to maintain aspect ratio
 */
export function calculateCropArea(
  imageWidth: number,
  imageHeight: number,
  targetAspectRatio: number
): CropArea {
  const imageAspectRatio = imageWidth / imageHeight;

  let cropWidth: number;
  let cropHeight: number;
  let x: number;
  let y: number;

  if (imageAspectRatio > targetAspectRatio) {
    // Image is wider than target ratio
    cropHeight = imageHeight;
    cropWidth = imageHeight * targetAspectRatio;
    x = (imageWidth - cropWidth) / 2;
    y = 0;
  } else {
    // Image is taller than target ratio
    cropWidth = imageWidth;
    cropHeight = imageWidth / targetAspectRatio;
    x = 0;
    y = (imageHeight - cropHeight) / 2;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}

/**
 * Get aspect ratio from string (e.g., "16:9" -> 16/9)
 */
export function parseAspectRatio(ratio: string): number {
  const [width, height] = ratio.split(':').map(Number);
  return width / height;
}

/**
 * Common aspect ratios
 */
export const ASPECT_RATIOS = {
  SQUARE: { label: '1:1 (Square)', value: 1 },
  LANDSCAPE_16_9: { label: '16:9 (Landscape)', value: 16 / 9 },
  LANDSCAPE_4_3: { label: '4:3 (Standard)', value: 4 / 3 },
  PORTRAIT_9_16: { label: '9:16 (Portrait)', value: 9 / 16 },
  PORTRAIT_3_4: { label: '3:4 (Portrait)', value: 3 / 4 },
  FREE: { label: 'Free Form', value: 0 },
} as const;

