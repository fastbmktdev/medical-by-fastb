'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, Chip, Spinner } from '@heroui/react';
import {
  EyeIcon,
  UserGroupIcon,
  PhotoIcon,
  ChartBarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface GalleryAnalyticsProps {
  gymId: string;
}

interface AnalyticsSummary {
  total_views: number;
  total_unique_views: number;
  total_images: number;
  recent_views_7d: number;
  average_views_per_image: number;
}

interface TopImage {
  image_id: string;
  image_url: string;
  title: string | null;
  view_count: number;
  unique_view_count: number;
  last_viewed_at: string;
}

export function GalleryAnalytics({ gymId }: GalleryAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topImages, setTopImages] = useState<TopImage[]>([]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partner/gallery/analytics?gym_id=${gymId}&limit=10`);
      const result = await response.json();

      if (result.success) {
        setSummary(result.data.summary);
        setTopImages(result.data.top_images || []);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!summary) {
    return (
      <Card className="border-2 border-dashed border-default-300">
        <CardBody className="py-12 text-center">
          <p className="text-default-500">No analytics data available yet</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Views */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Views</p>
                <p className="text-2xl font-bold text-default-900">
                  {summary.total_views.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-primary-100 p-3">
                <EyeIcon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Unique Views */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Unique Visitors</p>
                <p className="text-2xl font-bold text-default-900">
                  {summary.total_unique_views.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-success-100 p-3">
                <UserGroupIcon className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total Images */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Images</p>
                <p className="text-2xl font-bold text-default-900">
                  {summary.total_images}
                </p>
              </div>
              <div className="rounded-full bg-secondary-100 p-3">
                <PhotoIcon className="h-6 w-6 text-secondary-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Average Views */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Avg. Views/Image</p>
                <p className="text-2xl font-bold text-default-900">
                  {summary.average_views_per_image}
                </p>
              </div>
              <div className="rounded-full bg-warning-100 p-3">
                <ChartBarIcon className="h-6 w-6 text-warning-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-default-500">Views (Last 7 Days)</p>
              <p className="text-3xl font-bold text-default-900">
                {summary.recent_views_7d.toLocaleString()}
              </p>
            </div>
            {summary.recent_views_7d > 0 && (
              <Chip color="success" variant="flat" size="lg">
                Active
              </Chip>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Top Performing Images */}
      <Card>
        <CardBody className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-warning-500" />
            <h3 className="text-lg font-semibold text-default-900">
              Top Performing Images
            </h3>
          </div>

          {topImages.length === 0 ? (
            <p className="text-center text-sm text-default-500 py-8">
              No views yet. Share your gallery to start getting views!
            </p>
          ) : (
            <div className="space-y-3">
              {topImages.map((image, index) => (
                <div
                  key={image.image_id}
                  className="flex items-center gap-4 rounded-lg border border-default-200 p-3 transition-colors hover:bg-default-50"
                >
                  {/* Rank */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-default-100 font-bold text-default-700">
                    #{index + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={image.image_url}
                      alt={image.title || 'Gallery image'}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-default-900">
                      {image.title || 'Untitled Image'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-default-500">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="h-3 w-3" />
                        {image.view_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="h-3 w-3" />
                        {image.unique_view_count} unique
                      </span>
                    </div>
                  </div>

                  {/* Badge for top 3 */}
                  {index < 3 && (
                    <Chip
                      size="sm"
                      color={index === 0 ? 'warning' : index === 1 ? 'default' : 'default'}
                      variant="flat"
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Chip>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tips */}
      <Card className="border-l-4 border-primary-500 bg-primary-50/50">
        <CardBody className="p-4">
          <h4 className="mb-2 font-semibold text-primary-900">
            💡 Tips to Increase Views
          </h4>
          <ul className="space-y-1 text-sm text-primary-800">
            <li>• Upload high-quality, eye-catching images</li>
            <li>• Add descriptive titles and alt text for better SEO</li>
            <li>• Set your best image as the featured image</li>
            <li>• Share your gym page on social media</li>
            <li>• Update gallery regularly with fresh content</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

