import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coming Soon | Medical Platform",
};

export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-linear-to-b from-slate-900 via-slate-950 to-black px-4 text-center text-white">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {metadata.title as string}
      </h1>
      <p className="max-w-xl text-base text-slate-300 sm:text-lg">
        เรากำลังเตรียมเว็บไซต์ใหม่สำหรับ Medical Platform
        <br />ติดตามข่าวสาร และเตรียมพบกับประสบการณ์ เร็ว ๆ นี้!
      </p>
      <Link
        href="mailto:medicalhospital@gmail.com"
        className=" bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
      >
        ติดต่อเรา
      </Link>
    </main>
  );
}
