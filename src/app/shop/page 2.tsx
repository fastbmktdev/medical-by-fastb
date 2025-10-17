import ShopPageClient from "./ShopPageClient";
import { getProducts } from "@/lib/strapi";
import Link from "next/link";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ShopPage() {
    const { data: products, error } = await getProducts({ pageSize: 100, publicRequest: true }); // Fetch more products

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">เกิดข้อผิดพลาด</h1>
                    <p className="text-zinc-400 mb-4">{error}</p>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        กลับไปหน้าหลัก
                    </Link>
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
                <p>ไม่พบสินค้าในขณะนี้</p>
            </div>
        )
    }

    return <ShopPageClient products={products} />;
}
