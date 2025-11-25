import { Skeleton, SkeletonForm } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for partner hospital management page
 */
export default function PartnerHospitalLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* hospital Info Card */}
        <div className=" border border-zinc-800 bg-zinc-900/50 p-6">
          <Skeleton className="w-full h-64 mb-4" variant="default" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-zinc-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`tab-${i}`} className="h-10 w-24 mb-[-2px]" />
          ))}
        </div>

        {/* Content */}
        <div className=" border border-zinc-800 bg-zinc-900/50 p-6">
          <SkeletonForm fields={8} />
        </div>
      </div>
    </div>
  );
}

