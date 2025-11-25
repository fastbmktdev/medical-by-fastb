"use client";

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@shared/lib/database/supabase/client';
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
  NewspaperIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import { Article } from '@shared/types';
import ArticleCreateModal from '@/components/features/admin/article-management/ArticleCreateModal';
import ArticleEditModal from '@/components/features/admin/article-management/ArticleEditModal';
import ArticleDeleteDialog from '@/components/features/admin/article-management/ArticleDeleteDialog';

function AdminArticlesContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
    loadArticles();
  }, [supabase]);

  useEffect(() => {
    filterArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, searchQuery, selectedTab]);

  async function loadArticles() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/articles?published=');
      const result = await response.json();

      if (result.success && result.data) {
        setArticles(result.data);
      } else {
        toast.error('โหลดบทความไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  }

  function filterArticles() {
    let filtered = articles;

    // Filter by tab
    if (selectedTab === 'published') {
      filtered = filtered.filter(a => a.is_published);
    } else if (selectedTab === 'draft') {
      filtered = filtered.filter(a => !a.is_published);
    } else if (selectedTab === 'scheduled') {
      filtered = filtered.filter(a => a.scheduled_publish_at && !a.is_published);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(query) ||
          a.excerpt.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query) ||
          a.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
  }

  const handleDelete = () => {
    if (selectedArticle) {
      loadArticles();
      deleteDialog.onClose();
      setSelectedArticle(null);
    }
  };

  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    editModal.onOpen();
  };

  const handleDeleteClick = (article: Article) => {
    setSelectedArticle(article);
    deleteDialog.onOpen();
  };

  const handlePublish = async (article: Article, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/articles/${article.id}-admin/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: isPublished }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isPublished ? 'เผยแพร่บทความสำเร็จ' : 'ยกเลิกการเผยแพร่สำเร็จ');
        loadArticles();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error publishing article:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.is_published).length,
    draft: articles.filter(a => !a.is_published).length,
    scheduled: articles.filter(a => a.scheduled_publish_at && !a.is_published).length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการบทความ"
        headerSubtitle="จัดการบทความทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent  w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการบทความ"
        headerSubtitle="จัดการบทความทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <Toaster position="top-right" />

        {/* Stats Cards */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-4 mb-6">
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">บทความทั้งหมด</p>
                  <p className="font-bold text-2xl">{stats.total}</p>
                </div>
                <NewspaperIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">เผยแพร่แล้ว</p>
                  <p className="font-bold text-2xl text-green-500">{stats.published}</p>
                </div>
                <DocumentTextIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">ฉบับร่าง</p>
                  <p className="font-bold text-2xl text-yellow-500">{stats.draft}</p>
                </div>
                <DocumentTextIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">กำหนดเวลา</p>
                  <p className="font-bold text-2xl text-purple-500">{stats.scheduled}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-purple-500" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-80">
                <Input
                  placeholder="ค้นหาบทความ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />}
                  classNames={{
                    base: 'w-full',
                    input: 'text-sm',
                  }}
                />
              </div>
              <Button
                color="primary"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={createModal.onOpen}
              >
                สร้างบทความใหม่
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
          <Tab key="published" title={`เผยแพร่แล้ว (${stats.published})`} />
          <Tab key="draft" title={`ฉบับร่าง (${stats.draft})`} />
          <Tab key="scheduled" title={`กำหนดเวลา (${stats.scheduled})`} />
        </Tabs>

        {/* Articles Table */}
        <Card>
          <CardBody>
            <Table aria-label="Articles table">
              <TableHeader>
                <TableColumn>ชื่อบทความ</TableColumn>
                <TableColumn>หมวดหมู่</TableColumn>
                <TableColumn>ผู้เขียน</TableColumn>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>การแสดงผล</TableColumn>
                <TableColumn>จัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบบทความ">
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{article.title}</p>
                        <p className="text-zinc-400 text-xs line-clamp-1">{article.excerpt}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {article.category}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{article.author_name || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(article.date).toLocaleDateString('th-TH')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {article.is_published ? (
                        <Chip color="success" size="sm" variant="flat">
                          เผยแพร่แล้ว
                        </Chip>
                      ) : article.scheduled_publish_at ? (
                        <Chip color="warning" size="sm" variant="flat">
                          กำหนดเวลา
                        </Chip>
                      ) : (
                        <Chip color="default" size="sm" variant="flat">
                          ฉบับร่าง
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">
                          ดู {article.views_count || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => window.open(`/articles/${article.slug}`, '_blank')}
                          aria-label="ดูบทความ"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => handleEdit(article)}
                          aria-label="แก้ไขบทความ"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color={article.is_published ? 'warning' : 'success'}
                          onPress={() => handlePublish(article, !article.is_published)}
                        >
                          {article.is_published ? 'ยกเลิกเผยแพร่' : 'เผยแพร่'}
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={() => handleDeleteClick(article)}
                          aria-label="ลบบทความ"
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
      <ArticleCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={loadArticles}
      />
      {selectedArticle && (
        <>
          <ArticleEditModal
            isOpen={editModal.isOpen}
            onClose={editModal.onClose}
            onSuccess={loadArticles}
            article={selectedArticle}
          />
          <ArticleDeleteDialog
            isOpen={deleteDialog.isOpen}
            onClose={deleteDialog.onClose}
            onConfirm={handleDelete}
            article={selectedArticle}
          />
        </>
      )}
    </>
  );
}

export default function AdminArticlesPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminArticlesContent />
    </RoleGuard>
  );
}
