import { Card, CardBody } from '@heroui/react';
import type { HospitalStatsCardsProps } from '.';
import { STATS_CARDS } from '.';

export default function HospitalStatsCards({ hospitals }: HospitalStatsCardsProps) {
  // คำนวณจำนวนโรงพยาบาลแต่ละสถานะ
  const counts = {
    total: hospitals.length,
    approved: hospitals.filter((g) => g.status === 'approved').length,
    pending: hospitals.filter((g) => g.status === 'pending').length,
    rejected: hospitals.filter((g) => g.status === 'rejected').length,
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
            <p className={`font-semibold text-3xl ${stat.textColor}`}>
              {stat.value}
            </p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
