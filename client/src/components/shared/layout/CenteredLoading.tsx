import { memo } from 'react';
import { Loading } from '@/components/design-system/primitives/Loading';

function CenteredLoadingComponent() {
  return (
    <div className="top-0 left-0 z-1000 absolute flex justify-center items-center bg-white text-zinc-950 w-full h-screen overflow-hidden">
      <div className="text-center space-y-4">
        <Loading centered size="xl" />
        <p className="text-zinc-950">กำลังโหลด...</p>
      </div>
    </div>
  );
}

const CenteredLoading = memo(CenteredLoadingComponent);
export default CenteredLoading;
