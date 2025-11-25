import { SkeletonDashboard } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for partner dashboard
 */
export default function PartnerDashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <SkeletonDashboard />
    </div>
  );
}

