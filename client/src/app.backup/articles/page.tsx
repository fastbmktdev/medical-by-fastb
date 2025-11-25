"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from '@/navigation';
import Image from "next/image";
import { Article } from '@shared/types';
import { useDebouncedValue } from '@shared/lib/hooks';
import {
  CalendarIcon,
  UserIcon,
  TagIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared";
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

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ArticlesContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"articles" | "news">("articles");
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debounce search query with loading state
  const { debouncedValue: debouncedSearchQuery, isDebouncing } = useDebouncedValue(searchQuery, 300);

  // Handle URL parameter for tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "news") {
      setActiveTab("news");
    }
  }, [searchParams]);

  // Fetch articles from API
  useEffect(() => {
    async function fetchArticles() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/articles?published=true');
        const result = await response.json();
        
        if (result.success && result.data) {
          setArticles(result.data);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchArticles();
  }, []);

  // Separate articles and news
  const allArticles = articles.filter((a) => a.category !== "ข่าวสาร");
  const news = articles.filter((a) => a.category === "ข่าวสาร");

  const currentData = activeTab === "articles" ? allArticles : news;
  const categories =
    activeTab === "articles"
      ? ["ทั้งหมด", ...Array.from(new Set(allArticles.map((a) => a.category)))]
      : ["ทั้งหมด", "ข่าวสาร"];

  // Filter by category and search (using debounced query)
  const filteredArticles = currentData.filter((article) => {
    const matchesCategory =
      selectedCategory === "ทั้งหมด" || article.category === selectedCategory;
    const matchesSearch =
      debouncedSearchQuery === "" ||
      article.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      article.tags?.some((tag) =>
        tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );

    return matchesCategory && matchesSearch;
  });

  // Transform article data to include legacy author field
  const transformedArticles = filteredArticles.map(article => ({
    ...article,
    author: article.author_name || 'Unknown',
    isNew: article.is_new,
  }));

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen text-zinc-950">
        <PageHeader
          title={activeTab === "articles" ? "บทความการแพทย์" : "ข่าวสารการแพทย์"}
          description="กำลังโหลด..."
        />
        <div className="flex justify-center items-center py-20">
          <Loading centered size="xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-zinc-950">
      <PageHeader
        title={activeTab === "articles" ? "บทความการแพทย์" : "ข่าวสารการแพทย์"}
        description={
          activeTab === "articles"
            ? "เรียนรู้เกี่ยวกับการแพทย์ ตั้งแต่ประวัติศาสตร์ เทคนิค การฝึกซ้อม และอีกมากมาย"
            : "ติดตามข่าวสารและเหตุการณ์ล่าสุดในวงการการแพทย์"
        }
      />

      {/* Tab Navigation */}
      <div className="bg-transparent">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="flex items-center justify-center">
            <div className="relative bg-gray-100 backdrop-blur-sm p-1  border border-gray-300 shadow-xl">
              {/* Active tab indicator */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-linear-to-r from-purple-500 to-purple-600  transition-all duration-300 ease-out shadow-lg ${
                  activeTab === "news" ? "translate-x-full" : "translate-x-0"
                }`}
              />

              <div className="relative flex">
                <button
                  onClick={() => {
                    setActiveTab("articles");
                    setSelectedCategory("ทั้งหมด");
                  }}
                  className={`relative z-10 px-8 py-3  font-bold text-sm transition-all duration-300 ${
                    activeTab === "articles"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">บทความ</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("news");
                    setSelectedCategory("ทั้งหมด");
                  }}
                  className={`relative z-10 px-8 py-3  font-bold text-sm transition-all duration-300 ${
                    activeTab === "news"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">ข่าวสาร</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-transparent border-gray-300 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Search Bar */}
            <div className="w-full lg:w-80">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาบทความ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 text-sm text-zinc-950"
                />
                {isDebouncing && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent  animate-spin" />
                  </div>
                )}
                {!isDebouncing && searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-zinc-950 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`group relative px-4 py-2  font-medium text-xs transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-linear-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-zinc-950 border border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {/* Active indicator dot */}
                  {selectedCategory === category && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white  shadow-lg" />
                  )}

                  <span className="relative z-10">{category}</span>
                </button>
              ))}
            </div>

            {/* Results Counter */}
            <div className="flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
              <div className="w-1.5 h-1.5 bg-purple-500  animate-pulse" />
              <span>
                {searchQuery ? (
                  <>
                    พบ {transformedArticles.length} รายการ
                    {selectedCategory !== "ทั้งหมด" && ` • ${selectedCategory}`}
                  </>
                ) : (
                  <>
                    {transformedArticles.length} รายการ
                    {selectedCategory !== "ทั้งหมด" && ` • ${selectedCategory}`}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {transformedArticles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group bg-white hover:bg-gray-50 border border-gray-300  overflow-hidden transition-all shadow-md"
            >
              {/* Article Image */}
              <div className="relative w-full h-48 overflow-hidden">
                <Image
                  src={getArticleImage(article.category, article.image)}
                  alt={article.title}
                  fill
                  sizes='100%'
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="bg-brand-primary px-3 py-1  font-semibold text-xs">
                    {article.category}
                  </span>
                </div>
                {article.isNew && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-green-600 px-3 py-1  font-semibold text-xs animate-pulse">
                      ใหม่
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="mb-3 font-bold group-hover:text-purple-500 text-xl line-clamp-2 transition-colors text-zinc-950">
                  {article.title}
                </h2>
                <p className="mb-4 text-gray-600 text-sm line-clamp-3">
                  {article.excerpt}
                </p>

                {/* Meta */}
                <div className="space-y-2 text-gray-600 text-xs">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span>{article.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {new Date(article.date).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <TagIcon className="w-4 h-4" />
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 px-2 py-0.5  text-gray-700"
                          >
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

        {transformedArticles.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-600 text-xl">ไม่พบบทความในหมวดหมู่นี้</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ArticlesPage() {
  return (
    <Suspense fallback={
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loading centered size="xl" />
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <ArticlesContent />
    </Suspense>
  );
}
