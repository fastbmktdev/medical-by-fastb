import { SkeletonDashboard } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for admin dashboard
 */
export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <SkeletonDashboard />
    </div>
  );
}

