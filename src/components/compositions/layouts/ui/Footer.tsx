"use client";

import { Link } from "@/navigation";
import { useEffect, useState } from "react";

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-white/10 border-t h-16">
      <div className="flex sm:flex-row flex-col justify-between items-center gap-4 mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl h-[inherit] text-white/70 text-sm">
        <p>
          © {currentYear ?? new Date().getFullYear()} THAIKICK MUAYTHAI. All rights reserved.
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
