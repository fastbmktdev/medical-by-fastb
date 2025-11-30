"use client";

import { useState, useEffect } from "react";
import { Link } from '@/navigation';
import { ProductCard } from "@/components/shared";
import { Loading } from "@/components/design-system/primitives/Loading";
import { showErrorToast } from '@shared/lib/utils';
import { getSupabaseErrorMessage } from '@shared/lib/utils/supabase-error-handler';
// Logger removed - use console directly in client components

interface Product {
  id: string;
  slug: string;
  nameThai?: string | null;
  nameEnglish?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  category?: {
    id: string;
    nameThai?: string | null;
    nameEnglish?: string | null;
  } | null;
  image?: string | null;
}

export default function LatestProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      const endpoint = '/api/products?featured=true&active=true&limit=4';
      
      try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          // Handle HTTP errors with specific messages for different status codes
          let errorMessage: string;
          const errorContext = {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            component: 'LatestProducts',
          };

          // Create Error object for proper error tracking
          const httpError = new Error(`HTTP ${response.status}: ${response.statusText}`);

          if (response.status === 404) {
            errorMessage = 'ไม่พบ API endpoint สำหรับสินค้า';
            console.error('Products API endpoint not found (404)', errorContext, httpError);
          } else if (response.status >= 500) {
            errorMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
            console.error('Server error when fetching products', errorContext, httpError);
          } else {
            errorMessage = getSupabaseErrorMessage(
              httpError,
              'ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง'
            );
            console.error('HTTP error when fetching products', errorContext, httpError);
          }
          
          showErrorToast(errorMessage);
          setProducts([]);
          return;
        }
        
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          // Handle invalid response format
          const errorMessage = data.error || 'รูปแบบข้อมูลไม่ถูกต้อง';
          console.warn('Invalid response format from products API', {
            endpoint,
            response: data,
            component: 'LatestProducts',
          });
          showErrorToast(errorMessage);
          setProducts([]);
        }
      } catch (err) {
        // Handle network errors (connection refused, timeout, etc.)
        const error = err instanceof Error ? err : new Error(String(err));
        const errorMessage = getSupabaseErrorMessage(
          error,
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
        );
        console.error('Network error when fetching featured products', {
          endpoint,
          component: 'LatestProducts',
        }, error);
        showErrorToast(errorMessage);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFeaturedProducts();
  }, []);

  return (
    <section className="py-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-semibold text-3xl md:text-4xl text-gray-900">
            สินค้าและบริการ
          </h2>
          <p className="text-gray-600 text-lg">
            แพ็กเกจและบริการทางการแพทย์ที่แนะนำ
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading centered size="xl" />
          </div>
        ) : products.length > 0 ? (
          <div className="gap-6 grid grid-cols-2 md:grid-cols-4 mb-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  slug: product.slug,
                  nameThai: product.nameThai || undefined,
                  nameEnglish: product.nameEnglish || undefined,
                  description: product.description || undefined,
                  price: product.price,
                  stock: product.stock,
                  category: product.category?.nameThai || product.category?.nameEnglish || undefined,
                  image: product.image || undefined,
                }}
                showAddToCart={false}
              />
            ))}
          </div>
        ) : null}

        {/* View All Link */}
        <div className="text-center">
          <Link
            href={"/shop"}
            className="inline-block bg-brand-primary hover:bg-[#8B5CF6] text-zinc-950 px-8 py-3  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 font-semibold transition-colors shadow-lg hover:shadow-xl"
            aria-label="ดูสินค้าทั้งหมด"
          >
            ดูสินค้าทั้งหมด
          </Link>
        </div>
      </div>
    </section>
  );
}
