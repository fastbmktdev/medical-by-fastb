import { Link } from '@/navigation';
import { CheckCircleIcon } from "@heroicons/react/24/outline";

/**
 * Success screen after form submission
 */
export const SuccessView = () => {
  return (
    <div className="bg-zinc-950 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl">
        <div className="bg-zinc-950 shadow-2xl p-8 md:p-12 rounded-2xl text-center">
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="w-24 h-24 text-green-500" />
          </div>
          <h1 className="mb-4 font-bold text-white text-3xl md:text-4xl">
            สมัครสำเร็จ!
          </h1>
          <p className="mb-4 text-zinc-300 text-xl leading-relaxed">
            ขอบคุณที่สนใจเข้าร่วมเป็น Partner Gym
          </p>
          <p className="mb-8 text-zinc-400 text-lg">
            กรุณารอแอดมินตรวจสอบและติดต่อกลับภายใน 3-5 วันทำการ
          </p>
          <div className="bg-zinc-700 mb-8 p-4 rounded-lg">
            <p className="text-zinc-300 text-sm">
              <strong>สถานะ:</strong> <span className="text-yellow-400">รอการตรวจสอบ</span>
            </p>
          </div>
          <div className="flex sm:flex-row flex-col justify-center gap-4">
            <Link
              href="/"
              className="inline-block bg-brand-primary hover:bg-red-600 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

