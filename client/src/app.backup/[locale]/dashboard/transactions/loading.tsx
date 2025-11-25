import { Skeleton, SkeletonTable } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for transactions page
 */
export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`stat-${i}`}
              className=" border border-zinc-800 bg-zinc-900/50 p-4 space-y-2"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>

        {/* Transactions Table */}
        <div className=" border border-zinc-800 bg-zinc-900/50 p-6">
          <SkeletonTable rows={10} columns={5} />
        </div>
      </div>
    </div>
  );
}

