'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, Spinner, Chip } from '@heroui/react';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { ReviewStats } from './ReviewStats';
import type { ReviewAnalyticsSummary, HospitalReviewWithUser } from '@shared/types/review.types';

interface ReviewAnalyticsProps {
  hospitalId: string;
}

export function ReviewAnalytics({ hospitalId }: ReviewAnalyticsProps) {
  const t = useTranslations('reviews.analytics');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ReviewAnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/partner/reviews/analytics?hospital_id=${hospitalId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <p className="text-danger-600">{error || t('noData')}</p>
        </CardBody>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <ReviewStats data={data} />

      {/* Top Reviews */}
      {data.top_reviews && data.top_reviews.length > 0 && (
        <Card>
          <CardBody className="gap-4">
            <h3 className="text-lg font-semibold text-default-900">
              {t('topReviews')}
            </h3>
            <div className="space-y-4">
              {data.top_reviews.map((review: HospitalReviewWithUser) => (
                <div
                  key={review.id}
                  className=" border border-default-200 p-4 transition-colors hover:bg-default-50"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-default-900">
                        {review.user_full_name || 'Anonymous'}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIconSolid
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'text-warning-500'
                                : 'text-default-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <Chip size="sm" variant="flat" color="primary">
                      {review.helpful_count} {t('chart.reviews')}
                    </Chip>
                  </div>
                  {review.title && (
                    <p className="mb-1 font-medium text-default-800">
                      {review.title}
                    </p>
                  )}
                  <p className="line-clamp-2 text-sm text-default-600">
                    {review.comment}
                  </p>
                  <p className="mt-2 text-xs text-default-400">
                    {formatDate(review.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Activity */}
      {data.top_reviews && data.top_reviews.length > 0 && (
        <Card>
          <CardBody className="gap-4">
            <h3 className="text-lg font-semibold text-default-900">
              {t('recentActivity')}
            </h3>
            <div className="space-y-3">
              {data.top_reviews.slice(0, 5).map((review: HospitalReviewWithUser) => (
                <div
                  key={review.id}
                  className="flex items-start gap-3  border-l-4 border-primary-500 bg-default-50 p-3"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-default-900">
                        {review.user_full_name || 'Anonymous'}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIconSolid
                            key={star}
                            className={`h-3 w-3 ${
                              star <= review.rating
                                ? 'text-warning-500'
                                : 'text-default-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="line-clamp-1 text-sm text-default-600">
                      {review.comment}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-default-400">
                      {formatDate(review.created_at)}
                    </span>
                    {review.has_response && (
                      <Chip size="sm" variant="flat" color="success">
                        Replied
                      </Chip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

    </div>
  );
}

