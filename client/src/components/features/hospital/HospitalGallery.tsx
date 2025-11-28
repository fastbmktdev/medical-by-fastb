"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from '@shared/lib/database/supabase/client';
import type { GalleryImage } from '@shared/types/gallery.types';
import {
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
  Button,
} from "@heroui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface HospitalGalleryProps {
  hospitalId: string;
  hospitalName: string;
}

export function HospitalGallery({ hospitalId, hospitalName }: HospitalGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const supabase = createClient();
  const [sessionId] = useState(
    `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hospital_gallery")
        .select("*")
        .eq("hospital_id", hospitalId)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setImages(data);
      }
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoading(false);
    }
  }, [hospitalId, supabase]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    onOpen();

    // Track view
    const image = images[index];
    if (image) {
      trackImageView(image.id);
    }
  };

  const trackImageView = async (imageId: string) => {
    try {
      await fetch("/api/gallery/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          hospital_id: hospitalId,
          session_id: sessionId,
        }),
      });
    } catch (error) {
      // Fail silently - don't break user experience
      console.debug("View tracking failed:", error);
    }
  };

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, goToNext, goToPrevious, onClose]);

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-linear-to-br from-zinc-800 to-zinc-950  animate-pulse h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-zinc-100  w-16 h-16"></div>
          <div className="bg-zinc-100  w-32 h-4"></div>
        </div>
      </div>
    );
  }

  // No images - show placeholder
  if (images.length === 0) {
    return (
      <div className="flex justify-center items-center bg-linear-to-br from-zinc-800 to-zinc-950  h-96">
        <div className="text-center">
          <PhotoIcon className="mx-auto mb-4 w-20 h-20 text-zinc-600" />
          <p className="text-zinc-400 text-lg">ยังไม่มีรูปภาพ</p>
          <p className="mt-2 text-zinc-500 text-sm">
            โรงพยาบาลยังไม่ได้อัปโหลดรูปภาพ
          </p>
        </div>
      </div>
    );
  }

  // Single image
  if (images.length === 1) {
    const image = images[0];
    return (
      <>
        <div
          className="relative bg-zinc-900  cursor-pointer overflow-hidden group h-96"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={image.image_url}
            alt={image.alt_text || image.title || `${hospitalName} gallery`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
          {image.title && (
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4">
              <p className="font-semibold text-white">{image.title}</p>
              {image.description && (
                <p className="mt-1 text-sm text-zinc-400">
                  {image.description}
                </p>
              )}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 group-hover:bg-black/20 group-hover:opacity-100 transition-all">
            <PhotoIcon className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Lightbox Modal */}
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="5xl"
          classNames={{
            body: "p-0",
            backdrop: "bg-black/90",
          }}
        >
          <ModalContent>
            <ModalBody>
              <div className="relative aspect-video w-full">
                <Image
                  src={image.image_url}
                  alt={image.alt_text || image.title || `${hospitalName} gallery`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>
              {image.title && (
                <div className="bg-zinc-900 p-4">
                  <p className="font-semibold text-white">{image.title}</p>
                  {image.description && (
                    <p className="mt-1 text-sm text-zinc-400">
                      {image.description}
                    </p>
                  )}
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  // Multiple images - Featured image + Grid
  const featuredImage = images.find((img) => img.is_featured) || images[0];
  const otherImages = images.filter((img) => img.id !== featuredImage.id);
  const displayImages = otherImages.slice(0, 3);
  const remainingCount = Math.max(0, otherImages.length - 3);

  return (
    <>
      <div className="space-y-4">
        {/* Featured Image */}
        <div
          className="relative bg-zinc-900  cursor-pointer overflow-hidden group h-96"
          onClick={() =>
            openLightbox(images.findIndex((img) => img.id === featuredImage.id))
          }
        >
          <Image
            src={featuredImage.image_url}
            alt={
              featuredImage.alt_text ||
              featuredImage.title ||
              `${hospitalName} featured`
            }
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
          {featuredImage.title && (
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4">
              <p className="font-semibold text-lg text-white">
                {featuredImage.title}
              </p>
              {featuredImage.description && (
                <p className="mt-1 text-sm text-zinc-400">
                  {featuredImage.description}
                </p>
              )}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 group-hover:bg-black/20 group-hover:opacity-100 transition-all">
            <PhotoIcon className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Grid of other images */}
        {displayImages.length > 0 && (
          <div className="gap-4 grid grid-cols-3">
            {displayImages.map((image, idx) => {
              const actualIndex = images.findIndex(
                (img) => img.id === image.id
              );
              const isLast = idx === 2 && remainingCount > 0;

              return (
                <div
                  key={image.id}
                  className="relative bg-zinc-900  cursor-pointer overflow-hidden group aspect-video"
                  onClick={() => openLightbox(actualIndex)}
                >
                  <Image
                    src={image.image_url}
                    alt={
                      image.alt_text || image.title || `${hospitalName} ${idx + 1}`
                    }
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 1024px) 33vw, 22vw"
                  />
                  {isLast && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 group-hover:bg-black/70 transition-colors">
                      <p className="font-semibold text-3xl text-white">
                        +{remainingCount}
                      </p>
                      <p className="text-sm text-zinc-200">รูปเพิ่มเติม</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 opacity-0 group-hover:bg-black/20 group-hover:opacity-100 transition-all"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal with Navigation */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        classNames={{
          wrapper: "items-center",
          base: "max-w-7xl",
          body: "p-0",
          backdrop: "bg-black/95",
        }}
      >
        <ModalContent>
          <ModalBody>
            <div className="relative">
              {/* Close Button */}
              <Button
                isIconOnly
                variant="light"
                className="top-4 right-4 z-50 absolute text-white"
                onPress={onClose}
              >
                <XMarkIcon className="w-6 h-6" />
              </Button>

              {/* Image */}
              <div className="relative mx-auto w-full max-w-5xl aspect-video">
                <Image
                  src={images[selectedIndex].image_url}
                  alt={
                    images[selectedIndex].alt_text ||
                    images[selectedIndex].title ||
                    `${hospitalName} ${selectedIndex + 1}`
                  }
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>

              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    isIconOnly
                    variant="flat"
                    className="top-1/2 left-4 absolute bg-black/50 text-white -translate-y-1/2"
                    onPress={goToPrevious}
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="flat"
                    className="top-1/2 right-4 absolute bg-black/50 text-white -translate-y-1/2"
                    onPress={goToNext}
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Image Info */}
              {(images[selectedIndex].title ||
                images[selectedIndex].description) && (
                <div className="bg-zinc-900/95 backdrop-blur-sm mt-4 p-6 ">
                  {images[selectedIndex].title && (
                    <h3 className="font-semibold text-lg text-white">
                      {images[selectedIndex].title}
                    </h3>
                  )}
                  {images[selectedIndex].description && (
                    <p className="mt-2 text-zinc-400">
                      {images[selectedIndex].description}
                    </p>
                  )}
                </div>
              )}

              {/* Image Counter */}
              <div className="mt-4 text-center">
                <p className="text-sm text-zinc-400">
                  {selectedIndex + 1} / {images.length}
                </p>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 justify-center mt-4 overflow-x-auto">
                  {images.map((image, idx) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`relative w-20 h-16  overflow-hidden shrink-0 transition-all ${
                        idx === selectedIndex
                          ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={image.image_url}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
