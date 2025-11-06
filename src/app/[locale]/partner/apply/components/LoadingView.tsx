/**
 * Loading screen component while checking authentication
 */
export const LoadingView = () => {
  return (
    <div className="flex justify-center items-center bg-zinc-950 min-h-screen">
      <div className="text-center">
        <div className="inline-block mb-4 border-4 border-red-600 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
        <p className="text-zinc-300 text-lg">กำลังโหลด...</p>
      </div>
    </div>
  );
};

