import { Skeleton, SkeletonForm, SkeletonAvatar } from "@/components/design-system/primitives/Skeleton";

/**
 * Loading state for profile page
 */
export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Profile Card */}
        <div className=" border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <SkeletonAvatar size="xl" />
            
            {/* Info */}
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className=" border border-zinc-800 bg-zinc-900/50 p-6">
          <SkeletonForm fields={6} />
        </div>
      </div>
    </div>
  );
}

