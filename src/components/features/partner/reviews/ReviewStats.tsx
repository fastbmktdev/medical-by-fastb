'use client';

import { Card, CardBody, Progress } from '@heroui/react';
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import type { ReviewAnalyticsSummary } from '@/types/review.types';

interface ReviewStatsProps {
  data: ReviewAnalyticsSummary;
  isLoading?: boolean;
}

export function ReviewStats({ data, isLoading = false }: ReviewStatsProps) {
  const t = useTranslations('reviews.stats');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardBody className="gap-2">
              <div className="h-4 w-20 rounded bg-default-200"></div>
              <div className="h-8 w-16 rounded bg-default-300"></div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: t('totalReviews'),
      value: data.total_reviews || 0,
      icon: ChatBubbleLeftRightIcon,
      color: 'primary',
    },
    {
      label: t('averageRating'),
      value: (data.average_rating || 0).toFixed(1),
      icon: StarIcon,
      color: 'warning',
      subtitle: 'out of 5.0',
    },
    {
      label: t('responseRate'),
      value: `${(data.response_rate || 0).toFixed(0)}%`,
      icon: ChatBubbleLeftRightIcon,
      color: 'success',
    },
    {
      label: t('recommendRate'),
      value: `${(data.recommend_rate || 0).toFixed(0)}%`,
      icon: HandThumbUpIcon,
      color: 'secondary',
    },
  ];

  const getRatingPercentage = (count: number) => {
    if (data.total_reviews === 0) return 0;
    return Math.round((count / data.total_reviews) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-l-4" style={{ borderColor: `hsl(var(--heroui-${stat.color}))` }}>
            <CardBody className="gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-600">{stat.label}</p>
                <stat.icon className="h-5 w-5 text-default-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-default-900">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-default-500">{stat.subtitle}</p>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardBody className="gap-4">
          <h3 className="font-semibold text-default-900">
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = data.rating_distribution[rating as keyof typeof data.rating_distribution] || 0;
              const percentage = getRatingPercentage(count);

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex w-20 items-center gap-1">
                    <span className="text-sm font-medium text-default-700">
                      {rating}
                    </span>
                    <StarIconSolid className="h-4 w-4 text-warning-500" />
                  </div>
                  <div className="flex-1">
                    <Progress
                      value={percentage}
                      color="warning"
                      size="sm"
                      className="max-w-full"
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-default-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Recent Activity & Response Time */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Recent Reviews */}
        <Card>
          <CardBody className="gap-3">
            <h3 className="font-semibold text-default-900">
              {t('recentReviews')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-default-600">{t('last7Days')}</span>
                <span className="text-2xl font-bold text-primary-600">
                  {data.recent_reviews.last_7_days || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-default-600">{t('last30Days')}</span>
                <span className="text-2xl font-bold text-secondary-600">
                  {data.recent_reviews.last_30_days || 0}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}

