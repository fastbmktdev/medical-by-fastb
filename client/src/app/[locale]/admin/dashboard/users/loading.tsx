import {
  Skeleton,
  SkeletonTable,
} from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for admin users page
 */
export default function AdminUsersLoading() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" variant="default" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`stat-${i}`}
              className=" border border-gray-300 bg-white text-zinc-950 p-4 space-y-2"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" variant="default" />
          <Skeleton className="h-10 w-32" variant="default" />
          <Skeleton className="h-10 w-32" variant="default" />
        </div>

        {/* Users Table */}
        <div className=" border border-gray-300 bg-white text-zinc-950 p-6">
          <SkeletonTable rows={12} columns={6} />
        </div>
      </div>
    </div>
  );
}
