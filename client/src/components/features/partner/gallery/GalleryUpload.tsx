'use client';

import { useState, useRef } from 'react';
import { Button, Card, CardBody, Progress, Chip } from '@heroui/react';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon, ScissorsIcon } from '@heroicons/react/24/outline';
import { optimizeImage, validateImageFile, formatFileSize } from '@shared/lib/utils/imageOptimization';
import { createClient } from '@shared/lib/database/supabase/client';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { ImageCropperModal } from '@/components/shared/ImageCropperModal';
import type { CropResult } from '@shared/lib/utils/imageCropper';

interface GalleryUploadProps {
  hospitalId: string;
  onUploadComplete?: () => void;
  maxFiles?: number;
}

interface FileWithPreview {
  file: File;
  preview: string;
  optimized?: {
    size: number;
    width: number;
    height: number;
    compressionRatio: number;
  };
}

export function GalleryUpload({ hospitalId, onUploadComplete, maxFiles = 10 }: GalleryUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [optimizing, setOptimizing] = useState(false);
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const [cropperFileIndex, setCropperFileIndex] = useState<number | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} images`);
      return;
    }

    setOptimizing(true);

    try {
      const newFiles: FileWithPreview[] = [];

      for (const file of selectedFiles) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid file');
          continue;
        }

        // Optimize image
        const optimized = await optimizeImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          maxSizeMB: 2,
        });

        const preview = URL.createObjectURL(optimized.file);

        newFiles.push({
          file: optimized.file,
          preview,
          optimized: {
            size: optimized.optimizedSize,
            width: optimized.width,
            height: optimized.height,
            compressionRatio: optimized.compressionRatio,
          },
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} image(s) optimized and ready to upload`);
    } catch (error) {
      console.error('Error optimizing images:', error);
      toast.error('Failed to optimize images');
    } finally {
      setOptimizing(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleCropImage = (index: number) => {
    const fileWithPreview = files[index];
    setCropperFile(fileWithPreview.file);
    setCropperFileIndex(index);
    setIsCropperOpen(true);
  };

  const handleCropComplete = async (result: CropResult) => {
    if (cropperFileIndex === null) return;

    try {
      // Optimize the cropped image
      const optimized = await optimizeImage(result.file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        maxSizeMB: 2,
      });

      // Update the file in the list
      setFiles((prev) => {
        const newFiles = [...prev];
        // Revoke old preview
        URL.revokeObjectURL(newFiles[cropperFileIndex].preview);
        // Update with cropped version
        newFiles[cropperFileIndex] = {
          file: optimized.file,
          preview: URL.createObjectURL(optimized.file),
          optimized: {
            size: optimized.optimizedSize,
            width: optimized.width,
            height: optimized.height,
            compressionRatio: optimized.compressionRatio,
          },
        };
        return newFiles;
      });

      toast.success('Image cropped successfully');
    } catch (error) {
      console.error('Error processing cropped image:', error);
      toast.error('Failed to process cropped image');
    } finally {
      setIsCropperOpen(false);
      setCropperFile(null);
      setCropperFileIndex(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const fileWithPreview of files) {
        const { file, optimized } = fileWithPreview;
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('hospital-images')
          .upload(fileName, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('hospital-images')
          .getPublicUrl(fileName);

        // Save to gallery via API
        const response = await fetch('/api/partner/gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hospital_id: hospitalId,
            image_url: publicUrl,
            storage_path: fileName,
            file_size: optimized?.size || file.size,
            width: optimized?.width,
            height: optimized?.height,
            mime_type: file.type,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save image');
        }

        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      toast.success(`Successfully uploaded ${uploadedCount} image(s)`);
      
      // Clean up
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      
      // Callback
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-default-300 bg-default-50/50">
        <CardBody className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className=" bg-primary-100 p-4">
              <CloudArrowUpIcon className="h-8 w-8 text-primary-600" />
            </div>
            
            <div>
              <p className="font-semibold text-lg text-default-900">
                Upload Gallery Images
              </p>
              <p className="text-sm text-default-500">
                PNG, JPG, WebP up to 10MB (will be optimized automatically)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || optimizing}
            />

            <Button
              color="primary"
              variant="flat"
              size="lg"
              onPress={() => fileInputRef.current?.click()}
              isDisabled={uploading || optimizing || files.length >= maxFiles}
              startContent={<PhotoIcon className="h-5 w-5" />}
            >
              {optimizing ? 'Optimizing...' : 'Select Images'}
            </Button>

            <p className="text-xs text-default-400">
              {files.length} / {maxFiles} images selected
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-default-900">
              Selected Images ({files.length})
            </p>
            <Button
              color="danger"
              variant="light"
              size="sm"
              onPress={() => {
                files.forEach((f) => URL.revokeObjectURL(f.preview));
                setFiles([]);
              }}
              isDisabled={uploading}
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {files.map((fileWithPreview, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardBody className="p-0">
                  <div className="relative aspect-square">
                    <Image
                      src={fileWithPreview.preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Action buttons */}
                    <div className="absolute right-2 top-2 flex gap-2">
                      <button
                        onClick={() => handleCropImage(index)}
                        disabled={uploading}
                        className=" bg-primary-600/90 p-1.5 text-zinc-950 transition-colors hover:bg-primary-700 disabled:opacity-50"
                        title="Crop image"
                      >
                        <ScissorsIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                        className=" bg-black/60 p-1.5 text-zinc-950 transition-colors hover:bg-black/80 disabled:opacity-50"
                        title="Remove image"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Optimization info */}
                    {fileWithPreview.optimized && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                        <div className="flex items-center justify-between text-xs text-zinc-950">
                          <span>
                            {fileWithPreview.optimized.width}×{fileWithPreview.optimized.height}
                          </span>
                          <Chip
                            size="sm"
                            variant="flat"
                            color="success"
                            classNames={{
                              base: 'h-5 min-h-5',
                              content: 'text-xs px-1',
                            }}
                          >
                            -{Math.round(fileWithPreview.optimized.compressionRatio)}%
                          </Chip>
                        </div>
                        <p className="mt-1 text-xs text-zinc-950/80">
                          {formatFileSize(fileWithPreview.optimized.size)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-default-600">Uploading...</span>
                <span className="font-semibold text-default-900">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress
                value={uploadProgress}
                color="primary"
                size="sm"
                className="w-full"
              />
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="light"
              onPress={() => {
                files.forEach((f) => URL.revokeObjectURL(f.preview));
                setFiles([]);
              }}
              isDisabled={uploading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpload}
              isLoading={uploading}
              isDisabled={files.length === 0}
              startContent={!uploading && <CloudArrowUpIcon className="h-5 w-5" />}
            >
              Upload {files.length} Image{files.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropperFile && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setCropperFile(null);
            setCropperFileIndex(null);
          }}
          imageFile={cropperFile}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
        />
      )}
    </div>
  );
}

