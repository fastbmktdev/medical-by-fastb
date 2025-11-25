import { Link } from '@/navigation';

export default function ArticleNotFound() {
  return (
    <div className="flex flex-col justify-center items-center bg-zinc-100 px-4 min-h-screen text-white">
      <h1 className="mb-4 font-bold text-red-600 text-6xl">404</h1>
      <h2 className="mb-2 font-semibold text-2xl">ไม่พบบทความที่คุณกำลังค้นหา</h2>
      <p className="mb-8 text-zinc-400 text-center">
        บทความนี้อาจถูกลบหรือย้ายไปที่อื่นแล้ว
      </p>
      <Link
        href="/articles"
        className="bg-brand-primary hover:bg-red-600 px-6 py-3  font-semibold transition-colors"
      >
        กลับไปหน้าบทความ
      </Link>
    </div>
  );
}

