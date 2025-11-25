/**
 * MSW handlers for /api/products routes
 */

import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import { mockDataStore } from '../../data/store';
import { delay } from '../../utils/delay';

/**
 * Handle GET /api/products
 */
export const getProductsApiHandler = http.get('/api/products', async ({ request }) => {
  await delay();

  const url = new URL(request.url);
  const featured = url.searchParams.get('featured');
  const active = url.searchParams.get('active');
  const limit = url.searchParams.get('limit');
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');

  let products = mockDataStore.getProducts();

  // Filter by featured (mock products don't have is_featured, so we'll simulate it)
  if (featured === 'true') {
    // Simulate featured products (first 4 products)
    products = products.slice(0, 4);
  }

  // Filter by active (mock products don't have is_active, so we'll return all)
  // In real implementation, you would filter by is_active field

  // Filter by category
  if (category) {
    // Mock products have category as string, so we can't filter by category_id
    // In real implementation, you would filter by category_id
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.nameThai?.toLowerCase().includes(searchLower) ||
        p.nameEnglish?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }

  // Apply limit
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum)) {
      products = products.slice(0, limitNum);
    }
  }

  // Format products to match API response format
  const formattedProducts = products.map((product, index) => {
    const categoryName = typeof product.category === 'string' ? product.category : 'อื่นๆ';
    const categorySlug = faker.helpers.slugify(categoryName.toLowerCase());
    
    return {
      id: String(product.id),
      slug: product.slug,
      nameThai: product.nameThai || '',
      nameEnglish: product.nameEnglish || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category
        ? {
            id: faker.string.uuid(),
            nameThai: categoryName,
            nameEnglish: categoryName,
            slug: categorySlug,
          }
        : null,
      sku: `SKU-${String(product.id).slice(0, 8).toUpperCase()}`,
      weightKg: faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }),
      dimensions: `${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 5, max: 30 })} cm`,
      isActive: true,
      isFeatured: featured === 'true' || index < 4, // First 4 are featured
      viewsCount: faker.number.int({ min: 0, max: 1000 }),
      salesCount: faker.number.int({ min: 0, max: 500 }),
      image: product.image || product.images?.[0] || null,
      images: product.images || [],
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };
  });

  return HttpResponse.json({
    success: true,
    data: formattedProducts,
  });
});

/**
 * Handle GET /api/products/:id
 */
export const getProductByIdApiHandler = http.get(
  '/api/products/:id',
  async ({ params }) => {
    await delay();

    const { id } = params;
    const product = mockDataStore.getProductById(id as string);

    if (!product) {
      return HttpResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Format product to match API response format
    const categoryName = typeof product.category === 'string' ? product.category : 'อื่นๆ';
    const categorySlug = faker.helpers.slugify(categoryName.toLowerCase());

    const formattedProduct = {
      id: String(product.id),
      slug: product.slug,
      nameThai: product.nameThai || '',
      nameEnglish: product.nameEnglish || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category
        ? {
            id: faker.string.uuid(),
            nameThai: categoryName,
            nameEnglish: categoryName,
            slug: categorySlug,
          }
        : null,
      sku: `SKU-${String(product.id).slice(0, 8).toUpperCase()}`,
      weightKg: faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }),
      dimensions: `${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 5, max: 30 })} cm`,
      isActive: true,
      isFeatured: false,
      viewsCount: faker.number.int({ min: 0, max: 1000 }),
      salesCount: faker.number.int({ min: 0, max: 500 }),
      image: product.image || product.images?.[0] || null,
      images: product.images || [],
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: formattedProduct,
    });
  }
);

/**
 * Handle GET /api/products/slug/:slug
 */
export const getProductBySlugApiHandler = http.get(
  '/api/products/slug/:slug',
  async ({ params }) => {
    await delay();

    const { slug } = params;
    const product = mockDataStore.getProductBySlug(slug as string);

    if (!product) {
      return HttpResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Format product to match API response format
    const categoryName = typeof product.category === 'string' ? product.category : 'อื่นๆ';
    const categorySlug = faker.helpers.slugify(categoryName.toLowerCase());

    const formattedProduct = {
      id: String(product.id),
      slug: product.slug,
      nameThai: product.nameThai || '',
      nameEnglish: product.nameEnglish || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category
        ? {
            id: faker.string.uuid(),
            nameThai: categoryName,
            nameEnglish: categoryName,
            slug: categorySlug,
          }
        : null,
      sku: `SKU-${String(product.id).slice(0, 8).toUpperCase()}`,
      weightKg: faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }),
      dimensions: `${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 5, max: 30 })} cm`,
      isActive: true,
      isFeatured: false,
      viewsCount: faker.number.int({ min: 0, max: 1000 }),
      salesCount: faker.number.int({ min: 0, max: 500 }),
      image: product.image || product.images?.[0] || null,
      images: product.images || [],
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: formattedProduct,
    });
  }
);

export const productsApiHandlers = [
  getProductsApiHandler,
  getProductByIdApiHandler,
  getProductBySlugApiHandler,
];

