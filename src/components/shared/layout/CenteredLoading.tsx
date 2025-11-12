import { Loading } from '@/components/design-system/primitives/Loading';

export default function CenteredLoading() {
  return (
    <div className="top-0 left-0 z-[1000] absolute flex justify-center items-center bg-zinc-950 w-full h-screen overflow-hidden">
      <div className="text-center space-y-4">
        <Loading centered size="xl" />
        <p className="text-white/70">กำลังโหลด...</p>
      </div>
    </div>
  );
}
