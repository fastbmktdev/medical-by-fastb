import { Card, CardBody } from '@heroui/react';
import type { GymStatsCardsProps } from '.';
import { STATS_CARDS } from '.';

export default function GymStatsCards({ gyms }: GymStatsCardsProps) {
  // คำนวณจำนวนยิมแต่ละสถานะ
  const counts = {
    total: gyms.length,
    approved: gyms.filter((g) => g.status === 'approved').length,
    pending: gyms.filter((g) => g.status === 'pending').length,
    rejected: gyms.filter((g) => g.status === 'rejected').length,
  };

  const stats = STATS_CARDS.map((card, index) => ({
    ...card,
    value: [counts.total, counts.approved, counts.pending, counts.rejected][index],
  }));

  return (
    <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`${stat.bgColor} backdrop-blur-sm border-none`}
        >
          <CardBody>
            <p className="mb-2 text-default-400 text-sm">{stat.title}</p>
            <p className={`font-bold text-3xl ${stat.textColor}`}>
              {stat.value}
            </p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
