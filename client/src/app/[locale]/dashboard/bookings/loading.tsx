import { Skeleton, SkeletonTable } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for appointments page
 */
export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" variant="default" />
          <Skeleton className="h-10 w-32" variant="default" />
          <Skeleton className="h-10 w-32" variant="default" />
        </div>

        {/* appointments Table */}
        <div className=" border border-zinc-800 bg-zinc-100 text-zinc-950 p-6">
          <SkeletonTable rows={8} columns={6} />
        </div>
      </div>
    </div>
  );
}

