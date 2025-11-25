"use client";

import { useState, useEffect, Fragment } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
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
  Switch,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { ScheduledReport, CustomReport } from '@shared/types/database.types';
import { ConfirmationModal } from '@/components/compositions/modals/ConfirmationModal';

interface ScheduledReportsManagerProps {
  onSave?: () => void;
}

export function ScheduledReportsManager({ onSave }: ScheduledReportsManagerProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ScheduledReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    custom_report_id: '',
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom',
    schedule_config: {
      time: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
    } as Record<string, unknown>,
    recipients: [] as string[],
    cc_recipients: [] as string[],
    bcc_recipients: [] as string[],
    format: 'pdf' as 'pdf' | 'csv' | 'excel',
    is_active: true,
  });
  const [recipientInput, setRecipientInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadScheduledReports();
    loadCustomReports();
  }, []);

  const loadScheduledReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reports/scheduled');
      const result = await response.json();
      if (result.success) {
        setScheduledReports(result.data || []);
      }
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายงานที่กำหนดเวลา');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomReports = async () => {
    try {
      const response = await fetch('/api/admin/reports/custom');
      const result = await response.json();
      if (result.success) {
        setCustomReports(result.data || []);
      }
    } catch (error) {
      console.error('Error loading custom reports:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.recipients.length === 0) {
      toast.error('กรุณากรอกชื่อรายงานและผู้รับอีเมล');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId 
        ? `/api/admin/reports/scheduled/${editingId}`
        : '/api/admin/reports/scheduled';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          custom_report_id: formData.custom_report_id || null,
          cc_recipients: formData.cc_recipients.length > 0 ? formData.cc_recipients : null,
          bcc_recipients: formData.bcc_recipients.length > 0 ? formData.bcc_recipients : null,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(editingId ? 'อัปเดตรายงานสำเร็จ' : 'สร้างรายงานสำเร็จ');
        onClose();
        resetForm();
        loadScheduledReports();
        onSave?.();
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving scheduled report:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (report: ScheduledReport) => {
    setReportToDelete(report);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/reports/scheduled/${reportToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('ลบรายงานสำเร็จ');
        loadScheduledReports();
        setIsDeleteModalOpen(false);
        setReportToDelete(null);
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      toast.error('เกิดข้อผิดพลาดในการลบรายงาน');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setReportToDelete(null);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/reports/scheduled/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(isActive ? 'ปิดการใช้งานรายงานแล้ว' : 'เปิดการใช้งานรายงานแล้ว');
        loadScheduledReports();
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error toggling scheduled report:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  const handleEdit = (report: ScheduledReport) => {
    setEditingId(report.id);
    setFormData({
      custom_report_id: report.custom_report_id || '',
      name: report.name,
      description: report.description || '',
      frequency: report.frequency,
      schedule_config: report.schedule_config as Record<string, unknown>,
      recipients: report.recipients,
      cc_recipients: report.cc_recipients || [],
      bcc_recipients: report.bcc_recipients || [],
      format: report.format,
      is_active: report.is_active,
    });
    onOpen();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      custom_report_id: '',
      name: '',
      description: '',
      frequency: 'daily',
      schedule_config: {
        time: '09:00',
        dayOfWeek: 1,
        dayOfMonth: 1,
      },
      recipients: [],
      cc_recipients: [],
      bcc_recipients: [],
      format: 'pdf',
      is_active: true,
    });
    setRecipientInput('');
  };

  const addRecipient = (field: 'recipients' | 'cc_recipients' | 'bcc_recipients') => {
    const input = field === 'recipients' ? recipientInput : '';
    if (!input || !input.includes('@')) {
      toast.error('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], input],
    }));
    setRecipientInput('');
  };

  const removeRecipient = (field: 'recipients' | 'cc_recipients' | 'bcc_recipients', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      <Card className="bg-default-100/50 backdrop-blur-sm border-none">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-6 h-6" />
            <h3 className="font-bold text-xl">รายงานที่กำหนดเวลา</h3>
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
          ) : scheduledReports.length === 0 ? (
            <p className="text-center text-default-400 py-8">ยังไม่มีรายงานที่กำหนดเวลา</p>
          ) : (
            <Table aria-label="Scheduled reports table">
              <TableHeader>
                <TableColumn>ชื่อรายงาน</TableColumn>
                <TableColumn>ความถี่</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>รันครั้งถัดไป</TableColumn>
                <TableColumn>รันสำเร็จ</TableColumn>
                <TableColumn>จัดการ</TableColumn>
              </TableHeader>
              <TableBody items={scheduledReports} emptyContent="ยังไม่มีรายงานที่กำหนดเวลา">
                {(report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.name}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {report.frequency === 'daily' ? 'รายวัน' :
                         report.frequency === 'weekly' ? 'รายสัปดาห์' :
                         report.frequency === 'monthly' ? 'รายเดือน' :
                         report.frequency === 'quarterly' ? 'รายไตรมาส' :
                         report.frequency === 'yearly' ? 'รายปี' : 'กำหนดเอง'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Switch
                        isSelected={report.is_active && report.status === 'active'}
                        onValueChange={() => handleToggleActive(report.id, report.is_active && report.status === 'active')}
                        size="sm"
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      {report.next_run_at 
                        ? new Date(report.next_run_at).toLocaleString('th-TH')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-success" />
                        <span>{report.success_count}</span>
                        {report.failure_count > 0 && (
                          <>
                            <XCircleIcon className="w-4 h-4 text-danger ml-2" />
                            <span className="text-danger">{report.failure_count}</span>
                          </>
                        )}
                      </div>
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

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {editingId ? 'แก้ไขรายงานที่กำหนดเวลา' : 'สร้างรายงานที่กำหนดเวลา'}
          </ModalHeader>
          <ModalBody>
            <Select
              label="รายงานกำหนดเอง (ไม่บังคับ)"
              placeholder="เลือกรายงานกำหนดเอง หรือสร้างรายงานใหม่"
              selectedKeys={formData.custom_report_id ? [formData.custom_report_id] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setFormData((prev) => ({ ...prev, custom_report_id: selectedKey === 'none' ? '' : (selectedKey || '') }));
              }}
            >
              <SelectItem key="none">สร้างรายงานใหม่</SelectItem>
              {customReports.length > 0 ? (
                <>
                  {customReports.map((report) => (
                    <SelectItem key={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </>
              ) : null}
            </Select>
            <Input
              label="ชื่อรายงาน"
              placeholder="เช่น รายงานผู้ใช้รายวัน"
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
              label="ความถี่"
              selectedKeys={[formData.frequency]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setFormData((prev) => ({ ...prev, frequency: selectedKey as typeof formData.frequency }));
              }}
              isRequired
            >
              <SelectItem key="daily">รายวัน</SelectItem>
              <SelectItem key="weekly">รายสัปดาห์</SelectItem>
              <SelectItem key="monthly">รายเดือน</SelectItem>
              <SelectItem key="quarterly">รายไตรมาส</SelectItem>
              <SelectItem key="yearly">รายปี</SelectItem>
            </Select>
            <Input
              label="เวลา"
              type="time"
              value={formData.schedule_config.time as string}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                schedule_config: { ...prev.schedule_config, time: e.target.value },
              }))}
            />
            {formData.frequency === 'weekly' && (
              <Select
                label="วันในสัปดาห์"
                selectedKeys={[String(formData.schedule_config.dayOfWeek)]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData((prev) => ({
                    ...prev,
                    schedule_config: { ...prev.schedule_config, dayOfWeek: parseInt(selectedKey) },
                  }));
                }}
              >
                <SelectItem key="1">จันทร์</SelectItem>
                <SelectItem key="2">อังคาร</SelectItem>
                <SelectItem key="3">พุธ</SelectItem>
                <SelectItem key="4">พฤหัสบดี</SelectItem>
                <SelectItem key="5">ศุกร์</SelectItem>
                <SelectItem key="6">เสาร์</SelectItem>
                <SelectItem key="7">อาทิตย์</SelectItem>
              </Select>
            )}
            {(formData.frequency === 'monthly' || formData.frequency === 'quarterly' || formData.frequency === 'yearly') && (
              <Input
                label="วันของเดือน"
                type="number"
                min="1"
                max="31"
                value={String(formData.schedule_config.dayOfMonth || 1)}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  schedule_config: { ...prev.schedule_config, dayOfMonth: parseInt(e.target.value) },
                }))}
              />
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">ผู้รับอีเมล</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="อีเมลผู้รับ"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRecipient('recipients');
                    }
                  }}
                />
                <Button onPress={() => addRecipient('recipients')}>เพิ่ม</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.recipients.map((email, index) => (
                  <Chip
                    key={index}
                    onClose={() => removeRecipient('recipients', index)}
                    variant="flat"
                    color="primary"
                  >
                    {email}
                  </Chip>
                ))}
              </div>
            </div>
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
            <Switch
              isSelected={formData.is_active}
              onValueChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
            >
              เปิดใช้งาน
            </Switch>
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
        message={`คุณต้องการลบรายงานที่กำหนดเวลา "${reportToDelete?.name}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบรายงาน"
        cancelText="ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        loading={isDeleting}
        testId="delete-scheduled-report-modal"
      />
    </>
  );
}
