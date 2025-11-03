import { Metadata } from 'next';
import GamificationDashboard from '@/components/features/gamification/GamificationDashboard';

export const metadata: Metadata = {
  title: 'Gamification | MUAYTHAI Platform',
  description: 'ระบบ Gamification - สะสมคะแนน รับเหรียญ และแข่งขันกับเพื่อนๆ',
};

export default function GamificationPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GamificationDashboard />
      </div>
    </div>
  );
}
