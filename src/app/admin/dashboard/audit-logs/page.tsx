"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Input,
  Select,
  SelectItem,
  Button,
  Pagination,
  Spinner,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import type { AuditLog } from '@/types/database.types';

interface AuditLogsResponse {
  auditLogs: AuditLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

function AdminAuditLogsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    actionType: '',
    resourceType: '',
    severity: '',
    success: '',
    startDate: '',
    endDate: '',
  });
  const [searchUserId, setSearchUserId] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    loadAuditLogs();
  }, [pagination.offset, filters, searchUserId]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      if (searchUserId) {
        params.append('userId', searchUserId);
      }
      if (filters.actionType) {
        params.append('actionType', filters.actionType);
      }
      if (filters.resourceType) {
        params.append('resourceType', filters.resourceType);
      }
      if (filters.severity) {
        params.append('severity', filters.severity);
      }
      if (filters.success) {
        params.append('success', filters.success);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        const data = result.data as AuditLogsResponse;
        setAuditLogs(data.auditLogs);
        setPagination(data.pagination);
      } else {
        console.error('Failed to load audit logs:', result.error);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const resetFilters = () => {
    setFilters({
      actionType: '',
      resourceType: '',
      severity: '',
      success: '',
      startDate: '',
      endDate: '',
    });
    setSearchUserId('');
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      create: 'สร้าง',
      update: 'อัปเดต',
      delete: 'ลบ',
      view: 'ดู',
      login: 'เข้าสู่ระบบ',
      logout: 'ออกจากระบบ',
      approve: 'อนุมัติ',
      reject: 'ปฏิเสธ',
      publish: 'เผยแพร่',
      unpublish: 'ยกเลิกการเผยแพร่',
      activate: 'เปิดใช้งาน',
      deactivate: 'ปิดใช้งาน',
      payment: 'ชำระเงิน',
      refund: 'คืนเงิน',
      payout: 'จ่ายเงิน',
      status_change: 'เปลี่ยนสถานะ',
      permission_change: 'เปลี่ยนสิทธิ์',
      role_change: 'เปลี่ยนบทบาท',
      password_change: 'เปลี่ยนรหัสผ่าน',
      email_change: 'เปลี่ยนอีเมล',
      data_export: 'ส่งออกข้อมูล',
      data_import: 'นำเข้าข้อมูล',
      bulk_operation: 'ดำเนินการแบบกลุ่ม',
      system_action: 'การกระทำระบบ',
    };
    return labels[actionType] || actionType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && auditLogs.length === 0) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="Audit Logs"
        headerSubtitle="ดูประวัติการกระทำทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" color="danger" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={adminMenuItems}
      headerTitle="Audit Logs"
      headerSubtitle="ดูประวัติการกระทำทั้งหมดในระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      {/* Filters */}
      <Card className="mb-6 bg-default-100/50 backdrop-blur-sm border-none">
        <CardBody>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Input
              label="User ID"
              placeholder="ค้นหาตาม User ID"
              value={searchUserId}
              onValueChange={(value) => {
                setSearchUserId(value);
                setPagination((prev) => ({ ...prev, offset: 0 }));
              }}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
            />
            
            <Select
              label="Action Type"
              placeholder="เลือก Action Type"
              selectedKeys={filters.actionType ? [filters.actionType] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('actionType', selected || '');
              }}
            >
              {[
                'create',
                'update',
                'delete',
                'view',
                'login',
                'logout',
                'approve',
                'reject',
                'payment',
                'payout',
                'role_change',
                'password_change',
              ].map((action) => (
                <SelectItem key={action}>
                  {getActionTypeLabel(action)}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Resource Type"
              placeholder="เลือก Resource Type"
              selectedKeys={filters.resourceType ? [filters.resourceType] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('resourceType', selected || '');
              }}
            >
              {[
                'user',
                'profile',
                'gym',
                'booking',
                'payment',
                'partner_payout',
                'promotion',
              ].map((resource) => (
                <SelectItem key={resource}>
                  {resource}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Severity"
              placeholder="เลือก Severity"
              selectedKeys={filters.severity ? [filters.severity] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('severity', selected || '');
              }}
            >
              <SelectItem key="critical">Critical</SelectItem>
              <SelectItem key="high">High</SelectItem>
              <SelectItem key="medium">Medium</SelectItem>
              <SelectItem key="low">Low</SelectItem>
            </Select>

            <Select
              label="Success"
              placeholder="เลือก Success Status"
              selectedKeys={filters.success ? [filters.success] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('success', selected || '');
              }}
            >
              <SelectItem key="true">Success</SelectItem>
              <SelectItem key="false">Failed</SelectItem>
            </Select>

            <Input
              type="date"
              label="Start Date"
              value={filters.startDate}
              onValueChange={(value) => handleFilterChange('startDate', value)}
            />

            <Input
              type="date"
              label="End Date"
              value={filters.endDate}
              onValueChange={(value) => handleFilterChange('endDate', value)}
            />
          </div>

          <div className="flex justify-end mt-4">
            <Button
              color="default"
              variant="flat"
              startContent={<ArrowPathIcon className="w-4 h-4" />}
              onPress={resetFilters}
            >
              รีเซ็ตตัวกรอง
            </Button>
            <Button
              color="primary"
              variant="flat"
              startContent={<FunnelIcon className="w-4 h-4" />}
              onPress={loadAuditLogs}
              className="ml-2"
            >
              กรอง
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <section className="mb-6">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">Total Logs</p>
              <p className="font-bold text-3xl">{pagination.total}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">Showing</p>
              <p className="font-bold text-3xl">
                {auditLogs.length} / {pagination.total}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">Page</p>
              <p className="font-bold text-3xl">
                {Math.floor(pagination.offset / pagination.limit) + 1}
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Audit Logs Table */}
      <Card className="bg-default-100/50 backdrop-blur-sm border-none">
        <CardBody>
          <Table aria-label="Audit logs table">
            <TableHeader>
              <TableColumn>วันที่/เวลา</TableColumn>
              <TableColumn>User</TableColumn>
              <TableColumn>Action</TableColumn>
              <TableColumn>Resource</TableColumn>
              <TableColumn>Severity</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Description</TableColumn>
            </TableHeader>
            <TableBody
              items={auditLogs}
              isLoading={isLoading}
              loadingContent={<Spinner color="danger" />}
              emptyContent="ไม่พบข้อมูล audit logs"
            >
              {(log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {log.user_email || log.user_id?.substring(0, 8) || 'N/A'}
                      </span>
                      {log.user_role && (
                        <span className="text-xs text-default-400">{log.user_role}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color="primary">
                      {getActionTypeLabel(log.action_type)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{log.resource_type}</span>
                      {log.resource_name && (
                        <span className="text-xs text-default-400">
                          {log.resource_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getSeverityColor(log.severity)}
                    >
                      {log.severity}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={log.success ? 'success' : 'danger'}
                    >
                      {log.success ? 'สำเร็จ' : 'ล้มเหลว'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm truncate">{log.description}</p>
                      {log.error_message && (
                        <p className="text-xs text-danger mt-1">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={Math.ceil(pagination.total / pagination.limit)}
                page={Math.floor(pagination.offset / pagination.limit) + 1}
                onChange={(page) => {
                  setPagination((prev) => ({
                    ...prev,
                    offset: (page - 1) * prev.limit,
                  }));
                }}
                color="danger"
              />
            </div>
          )}
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminAuditLogsContent />
    </RoleGuard>
  );
}

