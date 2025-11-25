import { Skeleton, SkeletonCard } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for shop page
 */
export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" variant="default" />
          <Skeleton className="h-10 w-32" variant="default" />
          <Skeleton className="h-10 w-32" variant="default" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={`product-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

