export default function CenteredLoading() {
  return (
    <div className="top-0 left-0 z-[1000] absolute flex justify-center items-center bg-zinc-900 w-full h-screen overflow-hidden">
      <div className="text-center">
        <div className="inline-block mb-4 border-red-600 border-b-2 rounded-full w-12 h-12 animate-spin"></div>
        <p className="text-white/70">กำลังโหลด...</p>
      </div>
    </div>
  );
}

