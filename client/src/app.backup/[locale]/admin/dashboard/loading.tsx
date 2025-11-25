import { SkeletonDashboard } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for admin dashboard
 */
export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 p-6">
      <SkeletonDashboard />
    </div>
  );
}

