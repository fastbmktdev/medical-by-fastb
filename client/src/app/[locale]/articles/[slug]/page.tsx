"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Link } from '@/navigation';
import Image from "next/image";
import { Article } from '@shared/types';
import {
  CalendarIcon,
  UserIcon,
  TagIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  ShareIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { Loading } from "@/components/design-system/primitives/Loading";

// Helper function to get appropriate image based on category
function getArticleImage(category: string, image?: string | null) {
  if (image) return image;
  
  const imageMap: { [key: string]: string } = {
    ประวัติศาสตร์: "/assets/images/bg-main.jpg",
    เทคนิค: "/assets/images/fallback-img.jpg",
    สุขภาพ: "/assets/images/bg-main.jpg",
    บุคคล: "/assets/images/fallback-img.jpg",
    อุปกรณ์: "/assets/images/bg-main.jpg",
    โภชนาการ: "/assets/images/fallback-img.jpg",
    ข่าวสาร: "/assets/images/bg-main.jpg",
  };
  return imageMap[category] || "/assets/images/bg-main.jpg";
}

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundArticle, setNotFoundArticle] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/articles/by-slug/${slug}`);
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Expected JSON but got:', text.substring(0, 100));
          throw new Error('Invalid response format');
        }
        
        const result = await response.json();

        if (result.success && result.data) {
          const articleData = {
            ...result.data,
            author: result.data.author_name || 'Unknown',
            isNew: result.data.is_new,
          };
          setArticle(articleData as Article);

          // Fetch related articles
          try {
            const relatedResponse = await fetch(
              `/api/articles?category=${encodeURIComponent(result.data.category)}&published=true&limit=4`
            );
            
            if (relatedResponse.ok) {
              const relatedContentType = relatedResponse.headers.get('content-type');
              if (relatedContentType && relatedContentType.includes('application/json')) {
                const relatedResult = await relatedResponse.json();

                if (relatedResult.success && relatedResult.data) {
                  const related = relatedResult.data
                    .filter((a: Article) => a.slug !== slug)
                    .slice(0, 3)
                    .map((a: Article) => ({
                      ...a,
                      author: a.author_name || 'Unknown',
                      isNew: a.is_new,
                    }));
                  setRelatedArticles(related);
                }
              }
            }
          } catch (relatedError) {
            console.warn('Error fetching related articles:', relatedError);
            // Continue without related articles
          }
        } else {
          setNotFoundArticle(true);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        setNotFoundArticle(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="bg-transparent min-h-screen mt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loading centered size="xl" />
          <p className="text-zinc-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (notFoundArticle || !article) {
    notFound();
  }

  return (
    <div className="bg-transparent min-h-screen mt-16">
      {/* Breadcrumb & Back Button */}
      <div className="border-zinc-800 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-4xl">
          <div className="flex items-center gap-2 mb-4 text-zinc-400 text-sm">
            <Link href="/" className="hover:text-white transition-colors">
              หน้าแรก
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
            <Link
              href="/articles"
              className="hover:text-white transition-colors"
            >
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
          <span className="inline-block bg-brand-primary px-4 py-1  font-semibold text-sm">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-6 font-bold text-4xl md:text-5xl leading-tight">
          {article.title}
        </h1>

        {/* Meta Information */}
        <div className="flex md:flex-row flex-col gap-4 mb-8 pb-8 border-zinc-800 border-b">
          <div className="flex flex-wrap gap-4 text-zinc-400 text-sm">
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3 ml-auto">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700  transition-colors text-zinc-300 text-sm" 
              aria-label="แชร์บทความ"
            >
              <ShareIcon className="w-4 h-4" />
              แชร์
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700  transition-colors text-zinc-300 text-sm" 
              aria-label="บันทึกบทความ"
            >
              <BookmarkIcon className="w-4 h-4" />
              บันทึก
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative mb-8  w-full h-64 md:h-96 overflow-hidden">
          <Image
            src={getArticleImage(article.category, article.image)}
            alt={article.title}
            fill
            sizes='100%'
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/50 backdrop-blur-sm  p-4">
              <h2 className=" font-bold text-xl mb-2">
                {article.title}
              </h2>
              <p className="text-zinc-200 text-sm line-clamp-2">
                {article.excerpt}
              </p>
            </div>
          </div>
        </div>

        {/* Excerpt */}
        <div className="bg-zinc-900 mb-8 p-6 border-zinc-800 border-l-4 border-l-red-600 ">
          <p className="text-zinc-300 text-lg leading-relaxed">
            {article.excerpt}
          </p>
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
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2  font-medium text-zinc-300 text-sm transition-colors cursor-pointer"
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
            <h2 className="mb-8 font-bold text-2xl">
              บทความที่เกี่ยวข้อง
            </h2>
            <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/articles/${related.slug}`}
                  className="group bg-zinc-800 hover:bg-zinc-700 border border-zinc-700  overflow-hidden transition-all"
                >
                  <div className="relative w-full h-32">
                    <Image
                      src={getArticleImage(related.category, related.image)}
                      alt={related.title}
                      fill
                      sizes='100%'
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span className="bg-brand-primary px-2 py-1  font-semibold text-xs">
                        {related.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 font-semibold group-hover:text-red-500 line-clamp-2 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-zinc-500 text-xs mb-2">
                      {new Date(related.date).toLocaleDateString("th-TH")}
                    </p>
                    <p className="text-zinc-400 text-xs line-clamp-2">
                      {related.excerpt}
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
