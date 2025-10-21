import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

/**
 * Global Not Found Page (404)
 * Displayed when a page is not found in the application
 */
export default function NotFound() {
  return (
    <div className="flex justify-center items-center bg-zinc-950 px-4 min-h-screen">
      <div className="text-center">
        <ExclamationTriangleIcon className="mx-auto mb-6 w-20 h-20 text-yellow-500" />
        <h1 className="mb-4 font-bold text-white text-4xl">404</h1>
        <h2 className="mb-4 font-bold text-white text-2xl">
          ไม่พบหน้าที่คุณค้นหา
        </h2>
        <p className="mb-8 text-zinc-400 text-xl">
          ขออภัย เราไม่พบหน้าที่คุณกำลังมองหา
        </p>
        <Link
          href="/"
          className="inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
