'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Select,
  SelectItem,
  Button,
  Pagination,
  Spinner,
} from '@heroui/react';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { ReviewCard } from './ReviewCard';
import type { HospitalReviewWithReply } from '@shared/types/review.types';

interface ReviewListProps {
  hospitalId: string;
  initialReviews?: HospitalReviewWithReply[];
  onReply: (reviewId: string, message: string) => Promise<void>;
  onEditReply: (reviewId: string, message: string) => Promise<void>;
  onDeleteReply: (reviewId: string) => Promise<void>;
  onRefresh?: () => void;
  locale?: string;
}

export function ReviewList({
  hospitalId,
  initialReviews = [],
  onReply,
  onEditReply,
  onDeleteReply,
  onRefresh,
  locale = 'th',
}: ReviewListProps) {
  const t = useTranslations('reviews');
  const [reviews, setReviews] = useState<HospitalReviewWithReply[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const reviewsPerPage = 10;

  // Fetch reviews based on filters
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        hospital_id: hospitalId,
        limit: reviewsPerPage.toString(),
        offset: ((currentPage - 1) * reviewsPerPage).toString(),
      });

      if (filterRating !== 'all') {
        params.append('rating', filterRating);
      }

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      // Map sort option to API parameters
      const sortMap: Record<string, { sort_by: string; sort_order: string }> = {
        newest: { sort_by: 'created_at', sort_order: 'desc' },
        oldest: { sort_by: 'created_at', sort_order: 'asc' },
        highest: { sort_by: 'rating', sort_order: 'desc' },
        lowest: { sort_by: 'rating', sort_order: 'asc' },
        helpful: { sort_by: 'helpful_count', sort_order: 'desc' },
      };

      const sortConfig = sortMap[sortBy] || sortMap.newest;
      params.append('sort_by', sortConfig.sort_by);
      params.append('sort_order', sortConfig.sort_order);

      const response = await fetch(`/api/partner/reviews?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data.reviews || []);
        setTotalPages(Math.ceil(data.data.total / reviewsPerPage));
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId, currentPage, filterRating, filterStatus, sortBy]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleRefresh = () => {
    fetchReviews();
    onRefresh?.();
  };

  if (isLoading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (reviews.length === 0 && !isLoading) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <div className="mx-auto max-w-md space-y-3">
            <p className="text-2xl font-semibold text-default-900">
              {t('empty.title')}
            </p>
            <p className="text-default-600">{t('empty.description')}</p>
            <p className="text-sm text-default-500">{t('empty.tip')}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-default-400" />
              <span className="text-sm font-medium text-default-700">
                {t('filters.sortBy')}:
              </span>
            </div>

            <Select
              label={t('filters.allRatings')}
              size="sm"
              className="w-40"
              selectedKeys={[filterRating]}
              onChange={(e) => setFilterRating(e.target.value)}
            >
              <SelectItem key="all">{t('filters.allRatings')}</SelectItem>
              <SelectItem key="5">{t('filters.5stars')}</SelectItem>
              <SelectItem key="4">{t('filters.4stars')}</SelectItem>
              <SelectItem key="3">{t('filters.3stars')}</SelectItem>
              <SelectItem key="2">{t('filters.2stars')}</SelectItem>
              <SelectItem key="1">{t('filters.1star')}</SelectItem>
            </Select>

            <Select
              label={t('filters.allStatus')}
              size="sm"
              className="w-48"
              selectedKeys={[filterStatus]}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <SelectItem key="all">{t('filters.allStatus')}</SelectItem>
              <SelectItem key="approved">Approved</SelectItem>
              <SelectItem key="pending">Pending</SelectItem>
              <SelectItem key="rejected">Rejected</SelectItem>
            </Select>

            <Select
              label={t('filters.sortBy')}
              size="sm"
              className="w-48"
              selectedKeys={[sortBy]}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <SelectItem key="newest">{t('filters.newest')}</SelectItem>
              <SelectItem key="oldest">{t('filters.oldest')}</SelectItem>
              <SelectItem key="highest">{t('filters.highestRating')}</SelectItem>
              <SelectItem key="lowest">{t('filters.lowestRating')}</SelectItem>
              <SelectItem key="helpful">{t('filters.mostHelpful')}</SelectItem>
            </Select>

            <Button
              isIconOnly
              variant="flat"
              onPress={handleRefresh}
              isLoading={isLoading}
            >
              <ArrowPathIcon className="h-5 w-5" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onReply={onReply}
            onEditReply={onEditReply}
            onDeleteReply={onDeleteReply}
            isPartner={true}
            locale={locale}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            color="primary"
          />
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && reviews.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <Spinner size="lg" color="primary" />
        </div>
      )}
    </div>
  );
}

