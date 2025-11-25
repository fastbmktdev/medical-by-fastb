import { Skeleton, SkeletonCard } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for hospitals page
 */
export default function HospitalsLoading() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" variant="default" />
          <Skeleton className="h-10 w-40" variant="default" />
          <Skeleton className="h-10 w-40" variant="default" />
        </div>

        {/* Map placeholder */}
        <Skeleton className="w-full h-64 mb-6" variant="default" />

        {/* hospitals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`hospital-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

