"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ARTICLES } from "@/lib/data";
import {
  CalendarIcon,
  UserIcon,
  TagIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  // Get related articles from same category
  const relatedArticles = ARTICLES.filter(
    (a) => a.category === article.category && a.id !== article.id
  ).slice(0, 3);

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      {/* Breadcrumb & Back Button */}
      <div className="bg-zinc-900 border-zinc-800 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-4xl">
          <div className="flex items-center gap-2 mb-4 text-zinc-400 text-sm">
            <Link href="/" className="hover:text-white transition-colors">
              หน้าแรก
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
            <Link href="/articles" className="hover:text-white transition-colors">
              บทความ
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-white">{article.title}</span>
          </div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>กลับไปหน้าบทความ</span>
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <article className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-block bg-red-600 px-4 py-1 rounded-full font-semibold text-white text-sm">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-6 font-bold text-4xl md:text-5xl leading-tight">
          {article.title}
        </h1>

        {/* Meta Information */}
        <div className="flex md:flex-row flex-col gap-4 mb-8 pb-8 border-zinc-800 border-b text-zinc-400 text-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            <span>{article.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            <span>
              {new Date(article.date).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Featured Image Placeholder */}
        <div className="relative bg-zinc-800 mb-8 rounded-xl w-full h-64 md:h-96 overflow-hidden">
          <div className="flex justify-center items-center w-full h-full">
            <span className="text-8xl">🥊</span>
          </div>
        </div>

        {/* Excerpt */}
        <div className="bg-zinc-900 mb-8 p-6 border-zinc-800 border-l-4 border-l-red-600 rounded-r-lg">
          <p className="text-zinc-300 text-lg leading-relaxed">{article.excerpt}</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-zinc-300 text-lg leading-relaxed">
          {article.content.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-zinc-800 border-t">
            <div className="flex items-center gap-3">
              <TagIcon className="w-5 h-5 text-zinc-400" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg font-medium text-zinc-300 text-sm transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-zinc-900 mt-12 py-12 border-zinc-800 border-t">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <h2 className="mb-8 font-bold text-white text-2xl">บทความที่เกี่ยวข้อง</h2>
            <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/articles/${related.slug}`}
                  className="group bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg overflow-hidden transition-all"
                >
                  <div className="relative bg-zinc-700 w-full h-32">
                    <div className="flex justify-center items-center w-full h-full">
                      <span className="text-4xl">🥊</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 font-semibold text-white group-hover:text-red-500 line-clamp-2 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-zinc-500 text-xs">
                      {new Date(related.date).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

