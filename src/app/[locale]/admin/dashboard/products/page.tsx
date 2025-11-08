"use client";

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input, Tabs, Tab, useDisclosure } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CubeIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import ProductDetailModal from '@/components/features/admin/product-management/ProductDetailModal';
import ProductEditModal from '@/components/features/admin/product-management/ProductEditModal';
import ProductDeleteDialog from '@/components/features/admin/product-management/ProductDeleteDialog';
import ProductCreateModal from '@/components/features/admin/product-management/ProductCreateModal';
import ProductInventoryModal from '@/components/features/admin/product-management/ProductInventoryModal';
import ProductVariantsModal from '@/components/features/admin/product-management/ProductVariantsModal';
import ProductImagesModal from '@/components/features/admin/product-management/ProductImagesModal';

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
  isActive?: boolean;
  isFeatured?: boolean;
  viewsCount?: number;
  salesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

function AdminProductsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const detailModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const createModal = useDisclosure();
  const inventoryModal = useDisclosure();
  const variantsModal = useDisclosure();
  const imagesModal = useDisclosure();
  const [productVariants, setProductVariants] = useState<Array<{
    id?: string;
    type: string;
    name: string;
    value: string;
    priceAdjustment: number;
    stock: number;
    sku?: string | null;
    isDefault: boolean;
    displayOrder: number;
  }>>([]);
  const [productImages, setProductImages] = useState<Array<{
    id?: string;
    imageUrl: string;
    altText?: string;
    isPrimary?: boolean;
    displayOrder?: number;
  }>>([]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
    loadProducts();
  }, [supabase]);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchQuery, selectedTab]);

  async function loadProducts() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products?limit=1000');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }

  function filterProducts() {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nameThai?.toLowerCase().includes(query) ||
        p.nameEnglish?.toLowerCase().includes(query) ||
        p.slug?.toLowerCase().includes(query)
      );
    }

    // Filter by tab
    if (selectedTab === 'active') {
      filtered = filtered.filter(p => p.isActive !== false);
    } else if (selectedTab === 'inactive') {
      filtered = filtered.filter(p => p.isActive === false);
    } else if (selectedTab === 'featured') {
      filtered = filtered.filter(p => p.isFeatured === true);
    } else if (selectedTab === 'low-stock') {
      filtered = filtered.filter(p => (p.stock || 0) < 10);
    }

    setFilteredProducts(filtered);
  }

  async function handleDelete(productId: string) {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product deleted successfully');
        await loadProducts();
        return true;
      } else {
        toast.error(data.error || 'Failed to delete product');
        return false;
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }


  const getStockChip = (stock: number) => {
    if (stock === 0) {
      return <Chip color="danger" variant="flat" size="sm">หมด</Chip>;
    } else if (stock < 10) {
      return <Chip color="warning" variant="flat" size="sm">เหลือน้อย ({stock})</Chip>;
    } else {
      return <Chip color="success" variant="flat" size="sm">{stock} ชิ้น</Chip>;
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive !== false).length,
    inactive: products.filter(p => p.isActive === false).length,
    featured: products.filter(p => p.isFeatured === true).length,
    lowStock: products.filter(p => (p.stock || 0) < 10).length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการสินค้า"
        headerSubtitle="จัดการสินค้าทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการสินค้า"
        headerSubtitle="จัดการสินค้าทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <Toaster position="top-right" />

        {/* Stats Cards */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-5 mb-6">
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">สินค้าทั้งหมด</p>
                  <p className="font-bold text-2xl">{stats.total}</p>
                </div>
                <CubeIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">เปิดใช้งาน</p>
                  <p className="font-bold text-2xl text-green-500">{stats.active}</p>
                </div>
                <CubeIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">ปิดใช้งาน</p>
                  <p className="font-bold text-2xl text-red-500">{stats.inactive}</p>
                </div>
                <CubeIcon className="w-8 h-8 text-red-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">สินค้าแนะนำ</p>
                  <p className="font-bold text-2xl text-yellow-500">{stats.featured}</p>
                </div>
                <CubeIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">สต็อกน้อย</p>
                  <p className="font-bold text-2xl text-orange-500">{stats.lowStock}</p>
                </div>
                <CubeIcon className="w-8 h-8 text-orange-500" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2" />
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="pl-10"
                  startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                />
              </div>
              <Button
                color="primary"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={createModal.onOpen}
              >
                เพิ่มสินค้าใหม่
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="mb-6"
        >
          <Tab key="all" title={`ทั้งหมด (${stats.total})`} />
          <Tab key="active" title={`เปิดใช้งาน (${stats.active})`} />
          <Tab key="inactive" title={`ปิดใช้งาน (${stats.inactive})`} />
          <Tab key="featured" title={`สินค้าแนะนำ (${stats.featured})`} />
          <Tab key="low-stock" title={`สต็อกน้อย (${stats.lowStock})`} />
        </Tabs>

        {/* Products Table */}
        <Card>
          <CardBody>
            <Table aria-label="Products table">
              <TableHeader>
                <TableColumn>สินค้า</TableColumn>
                <TableColumn>หมวดหมู่</TableColumn>
                <TableColumn>ราคา</TableColumn>
                <TableColumn>สต็อก</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>การจัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบสินค้า">
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.nameThai || product.nameEnglish || 'Product'}
                              fill
                              sizes='100%'
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex justify-center items-center w-full h-full">
                              <CubeIcon className="w-6 h-6 text-zinc-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {product.nameThai || product.nameEnglish || 'ไม่มีชื่อ'}
                          </p>
                          {product.nameThai && product.nameEnglish && (
                            <p className="text-zinc-400 text-sm">
                              {product.nameEnglish}
                            </p>
                          )}
                          <p className="text-zinc-500 text-xs">{product.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Chip variant="flat" size="sm">
                          {product.category.nameThai || product.category.nameEnglish}
                        </Chip>
                      ) : (
                        <span className="text-zinc-500 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">฿{product.price.toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      {getStockChip(product.stock || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Chip
                          color={product.isActive !== false ? 'success' : 'danger'}
                          variant="flat"
                          size="sm"
                        >
                          {product.isActive !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Chip>
                        {product.isFeatured && (
                          <Chip color="warning" variant="flat" size="sm">
                            สินค้าแนะนำ
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedProduct(product);
                            detailModal.onOpen();
                          }}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="secondary"
                          onPress={async () => {
                            setSelectedProduct(product);
                            // Load variants
                            try {
                              const response = await fetch(`/api/products/${product.id}/variants`);
                              const data = await response.json();
                              if (data.success) {
                                setProductVariants(data.data || []);
                              }
                            } catch (error) {
                              console.error('Error loading variants:', error);
                              setProductVariants([]);
                            }
                            variantsModal.onOpen();
                          }}
                          title="จัดการ Variants"
                        >
                          <TagIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="secondary"
                          onPress={async () => {
                            setSelectedProduct(product);
                            // Load images
                            try {
                              const response = await fetch(`/api/products/${product.id}/images`);
                              const data = await response.json();
                              if (data.success) {
                                setProductImages(data.data || []);
                              }
                            } catch (error) {
                              console.error('Error loading images:', error);
                              setProductImages([]);
                            }
                            imagesModal.onOpen();
                          }}
                          title="จัดการรูปภาพ"
                        >
                          <PhotoIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="secondary"
                          onPress={() => {
                            setSelectedProduct(product);
                            inventoryModal.onOpen();
                          }}
                          title="จัดการสต็อก"
                        >
                          <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedProduct(product);
                            editModal.onOpen();
                          }}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => {
                            setSelectedProduct(product);
                            deleteDialog.onOpen();
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </DashboardLayout>

      {/* Modals */}
      {selectedProduct && (
        <>
          <ProductDetailModal
            isOpen={detailModal.isOpen}
            onClose={detailModal.onClose}
            product={selectedProduct}
            onEdit={(product) => {
              setSelectedProduct(product);
              detailModal.onClose();
              editModal.onOpen();
            }}
            onDelete={(product) => {
              setSelectedProduct(product);
              detailModal.onClose();
              deleteDialog.onOpen();
            }}
            isProcessing={isProcessing}
          />

          <ProductEditModal
            isOpen={editModal.isOpen}
            onClose={editModal.onClose}
            product={selectedProduct}
            onSave={async (productId, data) => {
              try {
                setIsProcessing(true);
                const response = await fetch(`/api/products/${productId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                  toast.success('อัปเดตสินค้าสำเร็จ');
                  await loadProducts();
                  return true;
                } else {
                  toast.error(result.error || 'Failed to update product');
                  return false;
                }
              } catch (error) {
                console.error('Error updating product:', error);
                toast.error('Failed to update product');
                return false;
              } finally {
                setIsProcessing(false);
              }
            }}
            isProcessing={isProcessing}
          />

          <ProductDeleteDialog
            isOpen={deleteDialog.isOpen}
            onClose={deleteDialog.onClose}
            product={selectedProduct}
            onConfirm={handleDelete}
            isProcessing={isProcessing}
          />

          <ProductInventoryModal
            isOpen={inventoryModal.isOpen}
            onClose={inventoryModal.onClose}
            product={selectedProduct}
            onUpdate={async (productId, stock, action) => {
              try {
                setIsProcessing(true);
                const response = await fetch(`/api/products/${productId}/inventory`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ stock, action }),
                });

                const result = await response.json();

                if (result.success) {
                  toast.success('อัปเดตสต็อกสำเร็จ');
                  await loadProducts();
                  return true;
                } else {
                  toast.error(result.error || 'Failed to update inventory');
                  return false;
                }
              } catch (error) {
                console.error('Error updating inventory:', error);
                toast.error('Failed to update inventory');
                return false;
              } finally {
                setIsProcessing(false);
              }
            }}
            isProcessing={isProcessing}
          />

          <ProductVariantsModal
            isOpen={variantsModal.isOpen}
            onClose={variantsModal.onClose}
            product={selectedProduct}
            variants={productVariants}
            onSave={async (variants) => {
              try {
                setIsProcessing(true);
                
                // Get current variants
                const currentResponse = await fetch(`/api/products/${selectedProduct.id}/variants`);
                const currentData = await currentResponse.json();
                const currentVariants = currentData.success ? currentData.data : [];

                // Delete variants that are not in the new list
                for (const currentVariant of currentVariants) {
                  if (!variants.find(v => v.id === currentVariant.id)) {
                    await fetch(`/api/products/${selectedProduct.id}/variants/${currentVariant.id}`, {
                      method: 'DELETE',
                    });
                  }
                }

                // Create or update variants
                for (const variant of variants) {
                  if (variant.id) {
                    // Update existing variant
                    await fetch(`/api/products/${selectedProduct.id}/variants/${variant.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: variant.type,
                        name: variant.name,
                        value: variant.value,
                        priceAdjustment: variant.priceAdjustment,
                        stock: variant.stock,
                        sku: variant.sku,
                        isDefault: variant.isDefault,
                        displayOrder: variant.displayOrder,
                      }),
                    });
                  } else {
                    // Create new variant
                    await fetch(`/api/products/${selectedProduct.id}/variants`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: variant.type,
                        name: variant.name,
                        value: variant.value,
                        priceAdjustment: variant.priceAdjustment,
                        stock: variant.stock,
                        sku: variant.sku,
                        isDefault: variant.isDefault,
                        displayOrder: variant.displayOrder,
                      }),
                    });
                  }
                }

                toast.success('บันทึก Variants สำเร็จ');
                await loadProducts();
                return true;
              } catch (error) {
                console.error('Error saving variants:', error);
                toast.error('Failed to save variants');
                return false;
              } finally {
                setIsProcessing(false);
              }
            }}
            isProcessing={isProcessing}
          />

          <ProductImagesModal
            isOpen={imagesModal.isOpen}
            onClose={imagesModal.onClose}
            product={selectedProduct}
            images={productImages.map(img => ({
              id: img.id,
              imageUrl: img.imageUrl,
              altText: img.altText,
              isPrimary: img.isPrimary,
              displayOrder: img.displayOrder,
            }))}
            onSave={async (images) => {
              try {
                setIsProcessing(true);
                
                // Get current images
                const currentResponse = await fetch(`/api/products/${selectedProduct.id}/images`);
                const currentData = await currentResponse.json();
                const currentImages = currentData.success ? currentData.data : [];

                // Delete images that are not in the new list
                for (const currentImage of currentImages) {
                  if (!images.find(img => img.id === currentImage.id)) {
                    await fetch(`/api/products/${selectedProduct.id}/images/${currentImage.id}`, {
                      method: 'DELETE',
                    });
                  }
                }

                // Add new images (images without id)
                const newImages = images.filter(img => !img.id);
                if (newImages.length > 0) {
                  await fetch(`/api/products/${selectedProduct.id}/images`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      images: newImages.map(img => ({
                        url: img.imageUrl,
                        altText: img.altText,
                        isPrimary: img.isPrimary,
                        displayOrder: img.displayOrder,
                      })),
                    }),
                  });
                }

                // Update existing images via product update
                const existingImages = images.filter(img => img.id);
                if (existingImages.length > 0) {
                  await fetch(`/api/products/${selectedProduct.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      images: images.map(img => img.imageUrl),
                    }),
                  });
                }

                toast.success('บันทึกรูปภาพสำเร็จ');
                await loadProducts();
                return true;
              } catch (error) {
                console.error('Error saving images:', error);
                toast.error('Failed to save images');
                return false;
              } finally {
                setIsProcessing(false);
              }
            }}
            isProcessing={isProcessing}
          />
        </>
      )}

      <ProductCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onCreate={async (data) => {
          try {
            setIsProcessing(true);
            const response = await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
              toast.success('สร้างสินค้าสำเร็จ');
              await loadProducts();
              return true;
            } else {
              toast.error(result.error || 'Failed to create product');
              return false;
            }
          } catch (error) {
            console.error('Error creating product:', error);
            toast.error('Failed to create product');
            return false;
          } finally {
            setIsProcessing(false);
          }
        }}
        isProcessing={isProcessing}
      />
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminProductsContent />
    </RoleGuard>
  );
}

