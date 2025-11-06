import { Link } from '@/navigation';
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function EventNotFound() {
  return (
    <div className="flex justify-center items-center bg-zinc-950 px-4 min-h-screen">
      <div className="text-center">
        <ExclamationTriangleIcon className="mx-auto mb-6 w-20 h-20 text-yellow-500" />
        <h1 className="mb-4 font-bold text-4xl">
          ไม่พบอีเวนต์ที่คุณค้นหา
        </h1>
        <p className="mb-8 text-zinc-400 text-xl">
          ขออภัย เราไม่พบอีเวนต์ที่คุณกำลังมองหา
        </p>
        <Link
          href="/events"
          className="inline-block bg-brand-primary hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          กลับไปหน้ารายการอีเวนต์
        </Link>
      </div>
    </div>
  );
}

