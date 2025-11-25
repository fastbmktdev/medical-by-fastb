import { Skeleton, SkeletonCard } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for events page
 */
export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Filters */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={`filter-${i}`}
              className="h-10 w-24 shrink-0"
              variant="default"
            />
          ))}
        </div>

        {/* Featured Event */}
        <div className=" border border-zinc-800 bg-zinc-900/50 p-6">
          <Skeleton className="w-full h-96" variant="default" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`event-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

