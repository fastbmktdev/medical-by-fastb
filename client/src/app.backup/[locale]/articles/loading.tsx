import { Skeleton, SkeletonCard } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for articles page
 */
export default function ArticlesLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Search */}
        <Skeleton className="h-10 w-full max-w-md" variant="default" />

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={`category-${i}`}
              className="h-8 w-24 shrink-0"
              variant="default"
            />
          ))}
        </div>

        {/* Featured Article */}
        <div className=" border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <Skeleton className="w-full h-96" variant="none" />
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-10 w-32 mt-4" variant="default" />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={`article-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

