import { SkeletonDashboard } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for dashboard page
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <SkeletonDashboard />
    </div>
  );
}

