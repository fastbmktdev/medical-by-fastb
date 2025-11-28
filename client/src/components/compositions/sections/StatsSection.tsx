'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Container } from '@/components/design-system/primitives/Container';
import { Card } from '@/components/design-system/primitives/Card';
import { StatsSectionProps } from './types';

export function StatsSection({
  title,
  stats,
  columns = 3,
  className = '',
  testId = 'stats-section',
  ...props
}: StatsSectionProps) {
  const getGridColumns = () => {
    const colsMap = {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };
    return colsMap[columns];
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <section
      className={`py-12 ${className}`}
      data-testid={testId}
      {...props}
    >
      <Container>
        {/* Section Header */}
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white">
              {title}
            </h2>
          </div>
        )}

        {/* Stats Grid */}
        <div className={`grid ${getGridColumns()} gap-6`}>
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 text-center"
              data-testid={`${testId}-stat-${index}`}
            >
              {/* Icon */}
              {stat.icon && (
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
              )}

              {/* Value */}
              <div className="text-3xl font-semibold mb-2">
                {stat.value}
              </div>

              {/* Label */}
              <div className="text-zinc-400 text-sm font-medium mb-2">
                {stat.label}
              </div>

              {/* Change */}
              {stat.change && (
                <div className={`flex items-center justify-center gap-1 text-sm ${getTrendColor(stat.change.trend)}`}>
                  {getTrendIcon(stat.change.trend)}
                  <span>
                    {stat.change.value > 0 ? '+' : ''}{stat.change.value}%
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}