/**
 * Products API Endpoint
 *
 * GET /api/products - Get all products
 * POST /api/products - Create new product (Admin only)
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/database/supabase/server";
import { withAdminAuth } from "@/lib/api/withAdminAuth";
import {
  ValidationError,
  ConflictError,
  successResponse,
  withErrorHandler,
} from "@/lib/api/error-handler";

interface ProductImage {
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  is_primary: boolean;
  display_order: number;
}

/**
 * Helper function to check if user is admin
 */
async function checkIsAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.role === "admin";
}

/**
 * GET /api/products
 * Get all products
 * Query params:
 * - category: category_id (UUID)
 * - search: search text
 * - featured: true/false
 * - active: true/false (default: true for public)
 * - limit: number of items
 * - offset: offset for pagination
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const isAdmin =
    !authError && user ? await checkIsAdmin(supabase, user.id) : false;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category");
  const featuredParam = searchParams.get("featured");
  const activeParam = searchParams.get("active");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Default: show only active products for non-admin users
  const active =
    activeParam === null
      ? !isAdmin
        ? true
        : undefined
      : activeParam === "true";

  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_categories (
        id,
        name_thai,
        name_english,
        slug
      )
    `
    )
    .order("created_at", { ascending: false });

  // Apply active filter
  if (active !== undefined) {
    query = query.eq("is_active", active);
  }

  // Apply featured filter
  if (featuredParam === "true") {
    query = query.eq("is_featured", true);
  }

  // Apply category filter
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  // Apply search filter
  if (search) {
    query = query.or(
      `name_thai.ilike.%${search}%,name_english.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    // Handle connection errors
    if (
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("ECONNREFUSED")
    ) {
      throw new Error("ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  // Get product images
  const productIds = data?.map((p) => p.id) || [];
  const images: Record<string, ProductImage[]> = {};

  if (productIds.length > 0) {
    const { data: productImages, error: imagesError } = await supabase
      .from("product_images")
      .select("product_id, image_url, alt_text, is_primary, display_order")
      .in("product_id", productIds)
      .order("display_order")
      .order("is_primary", { ascending: false });

    // Continue even if images query fails
    if (!imagesError && productImages) {
      productImages.forEach((img: ProductImage) => {
        if (!images[img.product_id]) {
          images[img.product_id] = [];
        }
        images[img.product_id].push(img);
      });
    }
  }

  // Format response - return empty array if no data (not an error)
  const formattedData = (data || []).map((product: any) => ({
    id: product.id || "",
    slug: product.slug || "",
    nameThai: product.name_thai || "",
    nameEnglish: product.name_english || "",
    description: product.description || "",
    price: product.price ? parseFloat(product.price) || 0 : 0,
    stock: product.stock ?? 0,
    category: product.product_categories
      ? {
          id: product.product_categories.id || "",
          nameThai: product.product_categories.name_thai || "",
          nameEnglish: product.product_categories.name_english || "",
          slug: product.product_categories.slug || "",
        }
      : null,
    sku: product.sku || "",
    weightKg: product.weight_kg ? parseFloat(product.weight_kg) || null : null,
    dimensions: product.dimensions || "",
    isActive: product.is_active ?? true,
    isFeatured: product.is_featured ?? false,
    viewsCount: product.views_count ?? 0,
    salesCount: product.sales_count ?? 0,
    image:
      images[product.id]?.find((img: ProductImage) => img.is_primary)?.image_url ||
      images[product.id]?.[0]?.image_url ||
      null,
    images: images[product.id]?.map((img: ProductImage) => img.image_url) || [],
    createdAt: product.created_at || "",
    updatedAt: product.updated_at || "",
  }));

  // Return data directly (not wrapped in products object) for backward compatibility
  return successResponse(formattedData);
});

/**
 * POST /api/products
 * Create new product (Admin only)
 */
export const POST = withAdminAuth(
  withErrorHandler(async (request: NextRequest) => {
    const supabase = await createClient();
    let body: any;

    try {
      body = await request.json();
    } catch {
      throw new ValidationError("รูปแบบข้อมูลไม่ถูกต้อง");
    }

    // Validate required fields
    const { nameThai, nameEnglish, price, stock } = body;
    if (
      !nameThai ||
      !nameEnglish ||
      price === undefined ||
      stock === undefined
    ) {
      throw new ValidationError(
        "ต้องระบุ: nameThai, nameEnglish, price, stock"
      );
    }

    // Generate slug from name_english
    const slug =
      body.slug ||
      nameEnglish
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingProduct) {
      throw new ConflictError("มีสินค้าที่ใช้ slug นี้อยู่แล้ว");
    }

    // Create product
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        slug,
        name_thai: nameThai,
        name_english: nameEnglish,
        description: body.description || null,
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: body.categoryId || null,
        sku: body.sku || null,
        weight_kg: body.weightKg ? parseFloat(body.weightKg) : null,
        dimensions: body.dimensions || null,
        is_active: body.isActive !== undefined ? body.isActive : true,
        is_featured: body.isFeatured || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    // Add images if provided
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      const imageRecords = body.images.map((url: string, index: number) => ({
        product_id: product.id,
        image_url: url,
        alt_text: `${nameEnglish} - Image ${index + 1}`,
        display_order: index,
        is_primary: index === 0,
      }));

      await supabase.from("product_images").insert(imageRecords);
    }

    return successResponse(
      {
        id: product.id || "",
        slug: product.slug || "",
        nameThai: product.name_thai || "",
        nameEnglish: product.name_english || "",
        description: product.description || "",
        price: product.price ? parseFloat(product.price) || 0 : 0,
        stock: product.stock ?? 0,
        categoryId: product.category_id || null,
        sku: product.sku || "",
        weightKg: product.weight_kg ? parseFloat(product.weight_kg) || null : null,
        dimensions: product.dimensions || "",
        isActive: product.is_active ?? true,
        isFeatured: product.is_featured ?? false,
      },
      201
    );
  })
);
