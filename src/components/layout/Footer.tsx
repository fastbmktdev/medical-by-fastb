import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 h-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-sm text-white/70 flex flex-col sm:flex-row items-center justify-between gap-4 h-[inherit]">
        <p>
          © {new Date().getFullYear()} MUAYTHAI NEXT. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-white">
            About us
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
