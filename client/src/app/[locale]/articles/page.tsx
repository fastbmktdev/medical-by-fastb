"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
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
const IMAGE_MAP: Record<string, string> = {
  ประวัติศาสตร์: "/assets/images/bg-main.jpg",
  เทคนิค: "/assets/images/fallback-img.jpg",
  สุขภาพ: "/assets/images/bg-main.jpg",
  บุคคล: "/assets/images/fallback-img.jpg",
  อุปกรณ์: "/assets/images/bg-main.jpg",
  โภชนาการ: "/assets/images/fallback-img.jpg",
  ข่าวสาร: "/assets/images/bg-main.jpg",
};
function getArticleImage(category: string, image?: string | null) {
  return image || IMAGE_MAP[category] || "/assets/images/bg-main.jpg";
}

type TabType = "articles" | "news";
const ALL_CATEGORY = "ทั้งหมด";
const NEWS_CATEGORY = "ข่าวสาร";

// Tab Navigation Component
const TabNavigation = ({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) => (
  <div className="bg-transparent">
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <div className="flex items-center justify-center">
        <div className="relative bg-gray-100 backdrop-blur-sm p-1 border border-gray-300 shadow-xl">
          {/* Active tab indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-linear-to-r from-purple-500 to-purple-600 transition-all duration-300 ease-out shadow-lg ${
              activeTab === "news" ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <div className="relative flex">
            <button
              onClick={() => onTabChange("articles")}
              className={`relative z-10 px-8 py-3 font-semibold text-sm transition-all duration-300 ${
                activeTab === "articles"
                  ? "text-zinc-950"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">บทความ</div>
            </button>
            <button
              onClick={() => onTabChange("news")}
              className={`relative z-10 px-8 py-3 font-semibold text-sm transition-all duration-300 ${
                activeTab === "news"
                  ? "text-zinc-950"
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
);

// Search Bar Component
const SearchBar = ({
  searchQuery,
  onChange,
  isDebouncing,
  clearSearch,
}: {
  searchQuery: string;
  onChange: (v: string) => void;
  isDebouncing: boolean;
  clearSearch: () => void;
}) => (
  <div className="w-full lg:w-80">
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="ค้นหาบทความ..."
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 placeholder-gray-400 transition-all duration-300 text-sm text-zinc-950"
      />
      {isDebouncing && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      )}
      {!isDebouncing && searchQuery && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-zinc-950 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

// Category Pills Component
const CategoryPills = ({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: string[];
  selectedCategory: string;
  onSelect: (cat: string) => void;
}) => (
  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
    {categories.map((category) => (
      <button
        key={category}
        onClick={() => onSelect(category)}
        className={`group relative px-4 py-2 font-medium text-xs transition-all duration-300 ${
          selectedCategory === category
            ? "bg-linear-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 text-zinc-950"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-zinc-950 border border-gray-300 hover:border-gray-400"
        }`}
      >
        {selectedCategory === category && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-800 shadow-lg" />
        )}
        <span className="relative z-10">{category}</span>
      </button>
    ))}
  </div>
);

// Results Counter Component
const ResultsCounter = ({
  count,
  searchQuery,
  selectedCategory,
}: {
  count: number;
  searchQuery: string;
  selectedCategory: string;
}) => (
  <div className="flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
    <div className="w-1.5 h-1.5 bg-purple-500 animate-pulse" />
    <span>
      {searchQuery
        ? <>
          พบ {count} รายการ
          {selectedCategory !== ALL_CATEGORY && ` • ${selectedCategory}`}
        </>
        : <>
          {count} รายการ
          {selectedCategory !== ALL_CATEGORY && ` • ${selectedCategory}`}
        </>
      }
    </span>
  </div>
);

// Article Card Component
const ArticleCard = ({ article }: { article: any }) => (
  <Link
    key={article.id}
    href={`/articles/${article.slug}`}
    className="group bg-white hover:bg-gray-50 border border-gray-300 overflow-hidden transition-all shadow-md"
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
        <span className="bg-brand-primary px-3 py-1 font-semibold text-xs">
          {article.category}
        </span>
      </div>
      {article.isNew && (
        <div className="absolute top-3 left-3">
          <span className="bg-green-600 px-3 py-1 font-semibold text-xs animate-pulse">
            ใหม่
          </span>
        </div>
      )}
    </div>
    {/* Content */}
    <div className="p-6">
      <h2 className="mb-3 font-semibold group-hover:text-purple-500 text-xl line-clamp-2 transition-colors text-zinc-950">
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
              {article.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="bg-gray-100 px-2 py-0.5 text-gray-700"
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
);

// Articles Grid Component
const ArticlesGrid = ({ articles }: { articles: any[] }) => (
  <div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {articles.map((article) => (
      <ArticleCard key={article.id} article={article} />
    ))}
  </div>
);

// Main Content Component
function ArticlesContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("articles");
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { debouncedValue: debouncedSearchQuery, isDebouncing } = useDebouncedValue(searchQuery, 300);

  // Handle URL parameter for tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "news") {
      setActiveTab("news");
    }
  }, [searchParams]);

  // Fetch articles from API (memoized function)
  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/articles?published=true');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 100));
        throw new Error('Invalid response format');
      }
      const result = await response.json();
      if (result.success && result.data) {
        setArticles(result.data);
      } else {
        console.error('API returned error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Separated Memoized Lists & Categories
  const { allArticles, newsArticles, currentData, categories } = useMemo(() => {
    const allArticles = articles.filter((a) => a.category !== NEWS_CATEGORY);
    const newsArticles = articles.filter((a) => a.category === NEWS_CATEGORY);
    const currentData = activeTab === "articles" ? allArticles : newsArticles;
    const categories =
      activeTab === "articles"
        ? [ALL_CATEGORY, ...Array.from(new Set(allArticles.map((a) => a.category)))]
        : [ALL_CATEGORY, NEWS_CATEGORY];
    return { allArticles, newsArticles, currentData, categories };
  }, [articles, activeTab]);

  // Filtered and Transformed Articles (memoized)
  const filteredArticles = useMemo(() => {
    const dq = debouncedSearchQuery.toLowerCase();
    return currentData.filter((article) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORY || article.category === selectedCategory;
      const matchesSearch =
        dq === "" ||
        article.title.toLowerCase().includes(dq) ||
        article.excerpt.toLowerCase().includes(dq) ||
        (article.tags?.some((tag) => tag.toLowerCase().includes(dq)));
      return matchesCategory && matchesSearch;
    });
  }, [currentData, selectedCategory, debouncedSearchQuery]);

  const transformedArticles = useMemo(
    () =>
      filteredArticles.map((article) => ({
        ...article,
        author: article.author_name || "Unknown",
        isNew: article.is_new,
      })),
    [filteredArticles]
  );

  // Tab switching handler
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSelectedCategory(ALL_CATEGORY);
  }, []);

  // Search clear handler
  const clearSearch = useCallback(() => setSearchQuery(""), []);

  // Category select handler
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

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
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Category Filter Bar */}
      <div className="bg-transparent border-gray-300 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Search Bar */}
            <SearchBar
              searchQuery={searchQuery}
              onChange={setSearchQuery}
              isDebouncing={isDebouncing}
              clearSearch={clearSearch}
            />

            {/* Category Pills */}
            <CategoryPills
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
            />

            {/* Results Counter */}
            <ResultsCounter
              count={transformedArticles.length}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <ArticlesGrid articles={transformedArticles} />

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
    <Suspense
      fallback={
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loading centered size="xl" />
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      }
    >
      <ArticlesContent />
    </Suspense>
  );
}
