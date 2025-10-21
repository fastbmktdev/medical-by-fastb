"use client";

import { useState } from "react";
import Link from "next/link";
import { ARTICLES } from "@/lib/data";
import { CalendarIcon, UserIcon, TagIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ArticlesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");

  const categories = ["ทั้งหมด", ...Array.from(new Set(ARTICLES.map(a => a.category)))];

  const filteredArticles = selectedCategory === "ทั้งหมด" 
    ? ARTICLES 
    : ARTICLES.filter(a => a.category === selectedCategory);

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      <PageHeader 
        title="บทความมวยไทย" 
        description="เรียนรู้เกี่ยวกับมวยไทย ตั้งแต่ประวัติศาสตร์ เทคนิค การฝึกซ้อม และอีกมากมาย"
      />

      {/* Category Filter */}
      <div className="border-zinc-800 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === category
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl overflow-hidden transition-all"
            >
              {/* Image Placeholder */}
              <div className="relative bg-zinc-800 w-full h-48">
                <div className="flex justify-center items-center w-full h-full">
                  <span className="text-6xl">🥊</span>
                </div>
                <div className="top-3 right-3 absolute">
                  <span className="bg-red-600 px-3 py-1 rounded-full font-semibold text-white text-xs">
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="mb-3 font-bold text-white group-hover:text-red-500 text-xl line-clamp-2 transition-colors">
                  {article.title}
                </h2>
                <p className="mb-4 text-zinc-400 text-sm line-clamp-3">
                  {article.excerpt}
                </p>

                {/* Meta */}
                <div className="space-y-2 text-zinc-500 text-xs">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span>{article.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(article.date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <TagIcon className="w-4 h-4" />
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag, i) => (
                          <span key={i} className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-500 text-xl">ไม่พบบทความในหมวดหมู่นี้</p>
          </div>
        )}
      </div>
    </div>
  );
}

