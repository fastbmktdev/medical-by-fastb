"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Slider,
  Select,
  SelectItem,
} from "@heroui/react";
import Image from "next/image";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from 'react-hot-toast';
import {
  cropImage,
  calculateCropArea,
  ASPECT_RATIOS,
  type CropArea,
  type CropResult,
} from '@shared/lib/utils/imageCropper';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  onCropComplete: (result: CropResult) => void;
  aspectRatio?: number;
}

function ImageCropperModalComponent({
  isOpen,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio = 16 / 9,
}: ImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [selectedRatio, setSelectedRatio] = useState(aspectRatio);
  const [isCropping, setIsCropping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    if (!imageFile || !isOpen) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);

      // Load image to get dimensions
      const img = document.createElement("img");
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

        // Calculate initial crop area
        const initialCrop = calculateCropArea(
          img.width,
          img.height,
          aspectRatio
        );
        setCrop(initialCrop);
      };
      img.src = result;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile, isOpen, aspectRatio]);

  // Update crop when aspect ratio changes
  useEffect(() => {
    if (imageSize.width === 0 || selectedRatio === 0) return;

    const newCrop = calculateCropArea(
      imageSize.width,
      imageSize.height,
      selectedRatio
    );
    setCrop(newCrop);
  }, [selectedRatio, imageSize]);

  // Draw crop overlay
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !imageSrc) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;

    // Set canvas size to match container
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Calculate scale to fit image in container
    const scaleX = containerWidth / imageSize.width;
    const scaleY = containerHeight / imageSize.height;
    const displayScale = Math.min(scaleX, scaleY) * scale;

    const displayWidth = imageSize.width * displayScale;
    const displayHeight = imageSize.height * displayScale;

    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);

    // Draw dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate crop rectangle on canvas
    const cropX = offsetX + (crop.x / imageSize.width) * displayWidth;
    const cropY = offsetY + (crop.y / imageSize.height) * displayHeight;
    const cropWidth = (crop.width / imageSize.width) * displayWidth;
    const cropHeight = (crop.height / imageSize.height) * displayHeight;

    // Clear crop area (show original image)
    ctx.clearRect(cropX, cropY, cropWidth, cropHeight);
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      cropX,
      cropY,
      cropWidth,
      cropHeight
    );

    // Draw crop border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    // Draw corner handles
    const handleSize = 12;
    ctx.fillStyle = "#ffffff";

    // Top-left
    ctx.fillRect(
      cropX - handleSize / 2,
      cropY - handleSize / 2,
      handleSize,
      handleSize
    );
    // Top-right
    ctx.fillRect(
      cropX + cropWidth - handleSize / 2,
      cropY - handleSize / 2,
      handleSize,
      handleSize
    );
    // Bottom-left
    ctx.fillRect(
      cropX - handleSize / 2,
      cropY + cropHeight - handleSize / 2,
      handleSize,
      handleSize
    );
    // Bottom-right
    ctx.fillRect(
      cropX + cropWidth - handleSize / 2,
      cropY + cropHeight - handleSize / 2,
      handleSize,
      handleSize
    );
  }, [imageSrc, crop, scale, imageSize]);

  const handleCrop = useCallback(async () => {
    if (isCropping) return;

    setIsCropping(true);
    try {
      const result = await cropImage(imageFile, crop, "image/jpeg", 0.9);
      onCropComplete(result);
      onClose();
      toast.success('ตัดรูปภาพสำเร็จ');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตัดรูปภาพ';
      toast.error(message);
    } finally {
      setIsCropping(false);
    }
  }, [isCropping, imageFile, crop, onCropComplete, onClose]);

  const aspectRatioOptions = useMemo(() => {
    return Object.entries(ASPECT_RATIOS).map(
      ([key, { label, value }]) => ({
        key,
        label,
        value: value.toString(),
      })
    );
  }, []);

  const handleRatioChange = useCallback((value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSelectedRatio(numValue);
    }
  }, []);

  const handleScaleChange = useCallback((value: number | number[]) => {
    setScale(Array.isArray(value) ? value[0] : value);
  }, []);

  return (
    <>
      <Image
        fill
        sizes="100%"
        ref={imageRef}
        src={imageSrc}
        alt="Source"
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        classNames={{
          body: "p-0",
          header: "border-b border-divider",
          footer: "border-t border-divider",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Crop Image</h3>
            <p className="text-sm text-default-500">
              Adjust the crop area and aspect ratio
            </p>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-4 p-6">
              {/* Canvas Container */}
              <div
                ref={containerRef}
                className="relative bg-zinc-900  overflow-hidden"
                style={{ height: "400px" }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{ imageRendering: "crisp-edges" }}
                />
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Aspect Ratio */}
                <Select
                  label="Aspect Ratio"
                  selectedKeys={[selectedRatio.toString()]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    if (selected) handleRatioChange(selected);
                  }}
                  classNames={{
                    trigger: "h-12",
                  }}
                >
                  {aspectRatioOptions.map((option) => (
                    <SelectItem key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>

                {/* Zoom */}
                <div>
                  <label className="block text-sm font-medium text-default-700 mb-2">
                    Zoom
                  </label>
                  <Slider
                    size="sm"
                    step={0.1}
                    minValue={0.5}
                    maxValue={3}
                    value={scale}
                    onChange={handleScaleChange}
                    classNames={{
                      track: "h-2",
                    }}
                  />
                  <div className="flex justify-between text-xs text-default-400 mt-1">
                    <span>0.5x</span>
                    <span>{scale.toFixed(1)}x</span>
                    <span>3.0x</span>
                  </div>
                </div>

                {/* Crop Info */}
                <div className="flex items-center justify-between text-sm text-default-500 bg-default-100 p-3 ">
                  <div>
                    <span className="font-medium">Crop Size:</span> {crop.width}{" "}
                    × {crop.height} px
                  </div>
                  <div>
                    <span className="font-medium">Original:</span>{" "}
                    {imageSize.width} × {imageSize.height} px
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
              startContent={<XMarkIcon className="h-5 w-5" />}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCrop}
              isLoading={isCropping}
              startContent={!isCropping && <CheckIcon className="h-5 w-5" />}
            >
              {isCropping ? "Cropping..." : "Apply Crop"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export const ImageCropperModal = memo(ImageCropperModalComponent);
