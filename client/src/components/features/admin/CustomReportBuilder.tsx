"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { CustomReport } from '@shared/types/database.types';
import { ConfirmationModal } from '@/components/compositions/modals/ConfirmationModal';

const AVAILABLE_TABLES = [
  { value: 'profiles', label: 'ผู้ใช้ (Profiles)' },
  { value: 'hospitals', label: 'โรงพยาบาล (hospitals)' },
  { value: 'appointments', label: 'การจอง (appointments)' },
  { value: 'payments', label: 'การชำระเงิน (Payments)' },
  { value: 'orders', label: 'คำสั่งซื้อ (Orders)' },
  { value: 'user_points', label: 'คะแนนผู้ใช้ (User Points)' },
  { value: 'promotions', label: 'โปรโมชั่น (Promotions)' },
];

const COLUMN_MAPPINGS: Record<string, { columns: string[]; headers: string[] }> = {
  profiles: {
    columns: ['id', 'full_name', 'email', 'phone', 'created_at'],
    headers: ['ID', 'ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทร', 'วันที่สร้าง'],
  },
  hospitals: {
    columns: ['id', 'hospital_name', 'hospital_name_english', 'address', 'created_at'],
    headers: ['ID', 'ชื่อโรงพยาบาล', 'ชื่อโรงพยาบาล (อังกฤษ)', 'ที่อยู่', 'วันที่สร้าง'],
  },
  appointments: {
    columns: ['id', 'booking_number', 'customer_name', 'customer_email', 'status', 'created_at'],
    headers: ['ID', 'หมายเลขจอง', 'ชื่อลูกค้า', 'อีเมล', 'สถานะ', 'วันที่สร้าง'],
  },
  payments: {
    columns: ['id', 'transaction_id', 'amount', 'payment_method', 'status', 'created_at'],
    headers: ['ID', 'หมายเลขธุรกรรม', 'จำนวนเงิน', 'วิธีชำระ', 'สถานะ', 'วันที่สร้าง'],
  },
  orders: {
    columns: ['id', 'order_number', 'total_amount', 'status', 'created_at'],
    headers: ['ID', 'หมายเลขคำสั่งซื้อ', 'ยอดรวม', 'สถานะ', 'วันที่สร้าง'],
  },
  user_points: {
    columns: ['id', 'user_id', 'points', 'updated_at'],
    headers: ['ID', 'ผู้ใช้', 'คะแนน', 'อัปเดตล่าสุด'],
  },
  promotions: {
    columns: ['id', 'title', 'title_english', 'is_active', 'created_at'],
    headers: ['ID', 'หัวข้อ', 'หัวข้อ (อังกฤษ)', 'เปิดใช้งาน', 'วันที่สร้าง'],
  },
};

interface CustomReportBuilderProps {
  onSave?: () => void;
}

export function CustomReportBuilder({ onSave }: CustomReportBuilderProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<CustomReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    table_name: '',
    columns: [] as string[],
    column_headers: [] as string[],
    filters: {} as Record<string, unknown>,
    format: 'pdf' as 'pdf' | 'csv' | 'excel',
    include_summary: false,
    include_charts: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCustomReports();
  }, []);

  useEffect(() => {
    if (formData.table_name && COLUMN_MAPPINGS[formData.table_name]) {
      const mapping = COLUMN_MAPPINGS[formData.table_name];
      setFormData((prev) => ({
        ...prev,
        columns: mapping.columns,
        column_headers: mapping.headers,
      }));
    }
  }, [formData.table_name]);

  const loadCustomReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reports/custom');
      const result = await response.json();
      if (result.success) {
        setCustomReports(result.data || []);
      }
    } catch (error) {
      console.error('Error loading custom reports:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายงาน');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.table_name || formData.columns.length === 0) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId 
        ? `/api/admin/reports/custom/${editingId}`
        : '/api/admin/reports/custom';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(editingId ? 'อัปเดตรายงานสำเร็จ' : 'สร้างรายงานสำเร็จ');
        onClose();
        resetForm();
        loadCustomReports();
        onSave?.();
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving custom report:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (report: CustomReport) => {
    setReportToDelete(report);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/reports/custom/${reportToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('ลบรายงานสำเร็จ');
        loadCustomReports();
        setIsDeleteModalOpen(false);
        setReportToDelete(null);
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting custom report:', error);
      toast.error('เกิดข้อผิดพลาดในการลบรายงาน');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setReportToDelete(null);
  };

  const handleEdit = (report: CustomReport) => {
    setEditingId(report.id);
    setFormData({
      name: report.name,
      description: report.description || '',
      table_name: report.table_name,
      columns: report.columns,
      column_headers: report.column_headers || report.columns,
      filters: report.filters,
      format: report.format,
      include_summary: report.include_summary,
      include_charts: report.include_charts,
    });
    onOpen();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      table_name: '',
      columns: [],
      column_headers: [],
      filters: {},
      format: 'pdf',
      include_summary: false,
      include_charts: false,
    });
  };

  return (
    <>
      <Card className="bg-default-100/50 backdrop-blur-sm border-none">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-6 h-6" />
            <h3 className="font-bold text-xl">รายงานกำหนดเอง</h3>
          </div>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() => {
              resetForm();
              onOpen();
            }}
          >
            สร้างรายงานใหม่
          </Button>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-center text-default-400">กำลังโหลด...</p>
          ) : customReports.length === 0 ? (
            <p className="text-center text-default-400 py-8">ยังไม่มีรายงานกำหนดเอง</p>
          ) : (
            <Table aria-label="Custom reports table">
              <TableHeader>
                <TableColumn>ชื่อรายงาน</TableColumn>
                <TableColumn>ตาราง</TableColumn>
                <TableColumn>รูปแบบ</TableColumn>
                <TableColumn>วันที่สร้าง</TableColumn>
                <TableColumn>จัดการ</TableColumn>
              </TableHeader>
              <TableBody items={customReports} emptyContent="ยังไม่มีรายงานกำหนดเอง">
                {(report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.name}</TableCell>
                    <TableCell>{report.table_name}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {report.format.toUpperCase()}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => handleEdit(report)}
                          aria-label="แก้ไขรายงาน"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={() => handleDeleteClick(report)}
                          aria-label="ลบรายงาน"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {editingId ? 'แก้ไขรายงานกำหนดเอง' : 'สร้างรายงานกำหนดเอง'}
          </ModalHeader>
          <ModalBody>
            <Input
              label="ชื่อรายงาน"
              placeholder="เช่น รายงานผู้ใช้รายเดือน"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              isRequired
            />
            <Textarea
              label="คำอธิบาย"
              placeholder="อธิบายรายละเอียดของรายงาน"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
            <Select
              label="ตาราง"
              placeholder="เลือกตารางที่ต้องการรายงาน"
              selectedKeys={formData.table_name ? [formData.table_name] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setFormData((prev) => ({ ...prev, table_name: selectedKey || '' }));
              }}
              isRequired
            >
              {AVAILABLE_TABLES.map((table) => (
                <SelectItem key={table.value}>
                  {table.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="รูปแบบ"
              selectedKeys={[formData.format]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setFormData((prev) => ({ ...prev, format: selectedKey as 'pdf' | 'csv' | 'excel' }));
              }}
            >
              <SelectItem key="pdf">PDF</SelectItem>
              <SelectItem key="csv">CSV</SelectItem>
              <SelectItem key="excel">Excel</SelectItem>
            </Select>
            <div className="flex gap-4">
              <Checkbox
                isSelected={formData.include_summary}
                onValueChange={(checked) => setFormData((prev) => ({ ...prev, include_summary: checked }))}
              >
                รวมสรุปข้อมูล
              </Checkbox>
              <Checkbox
                isSelected={formData.include_charts}
                onValueChange={(checked) => setFormData((prev) => ({ ...prev, include_charts: checked }))}
              >
                รวมกราฟ
              </Checkbox>
            </div>
            {formData.columns.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">คอลัมน์ที่เลือก ({formData.columns.length} คอลัมน์):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.columns.map((col, idx) => (
                    <Chip key={idx} size="sm" variant="flat">
                      {formData.column_headers[idx] || col}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              ยกเลิก
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSaving}
            >
              {editingId ? 'อัปเดต' : 'สร้าง'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="ยืนยันการลบรายงาน"
        message={`คุณต้องการลบรายงาน "${reportToDelete?.name}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบรายงาน"
        cancelText="ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        loading={isDeleting}
        testId="delete-report-modal"
      />
    </>
  );
}
