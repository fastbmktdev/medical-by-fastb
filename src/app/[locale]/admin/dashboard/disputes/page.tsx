"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Card, CardBody, Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Tabs, Tab } from '@heroui/react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import { PaymentDispute } from '@/services/payment.service';

function DisputesContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [disputes, setDisputes] = useState<PaymentDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<PaymentDispute | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isResponding, setIsResponding] = useState(false);
  const [responseForm, setResponseForm] = useState({
    product_description: '',
    customer_name: '',
    customer_email: '',
    billing_address: '',
    receipt: '',
    shipping_address: '',
    shipping_carrier: '',
    shipping_date: '',
    shipping_tracking_number: '',
    uncategorized_text: '',
    admin_notes: '',
  });

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadDisputes();
      }
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  const loadDisputes = async () => {
    try {
      const response = await fetch('/api/payments/disputes?limit=100');
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('Error loading disputes:', error);
    }
  };

  const getStatusChip = (status: PaymentDispute['status']) => {
    const statusConfig = {
      warning_needs_response: { label: 'เตือน: ต้องการตอบ', color: 'warning' as const, icon: ExclamationTriangleIcon },
      warning_under_review: { label: 'เตือน: อยู่ระหว่างตรวจสอบ', color: 'warning' as const, icon: ClockIcon },
      warning_closed: { label: 'เตือน: ปิดแล้ว', color: 'default' as const, icon: CheckCircleIcon },
      needs_response: { label: 'ต้องการตอบ', color: 'danger' as const, icon: ExclamationTriangleIcon },
      under_review: { label: 'อยู่ระหว่างตรวจสอบ', color: 'warning' as const, icon: ClockIcon },
      charge_refunded: { label: 'คืนเงินแล้ว', color: 'default' as const, icon: CheckCircleIcon },
      won: { label: 'ชนะ', color: 'success' as const, icon: CheckCircleIcon },
      lost: { label: 'แพ้', color: 'danger' as const, icon: XCircleIcon },
    };

    const config = statusConfig[status] || statusConfig.needs_response;
    const Icon = config.icon;

    return (
      <Chip
        color={config.color}
        variant="flat"
        size="sm"
        startContent={<Icon className="w-3 h-3" />}
      >
        {config.label}
      </Chip>
    );
  };

  const getReasonText = (reason?: string) => {
    const reasonMap: Record<string, string> = {
      bank_cannot_process: 'ธนาคารไม่สามารถประมวลผลได้',
      check_returned: 'เช็คถูกส่งคืน',
      credit_not_processed: 'เครดิตยังไม่ถูกประมวลผล',
      customer_initiated: 'ลูกค้าเป็นผู้เริ่ม',
      debit_not_authorized: 'เดบิตไม่ได้รับอนุญาต',
      duplicate: 'ซ้ำ',
      fraudulent: 'ฉ้อโกง',
      general: 'ทั่วไป',
      incorrect_account_details: 'รายละเอียดบัญชีไม่ถูกต้อง',
      insufficient_funds: 'เงินไม่เพียงพอ',
      product_not_received: 'ไม่ได้รับสินค้า',
      product_unacceptable: 'สินค้าไม่เป็นที่ยอมรับ',
      subscription_canceled: 'ยกเลิกการสมัครสมาชิก',
      unrecognized: 'ไม่รู้จัก',
    };
    return reasonMap[reason || ''] || reason || 'ไม่ระบุ';
  };

  const handleViewDispute = (dispute: PaymentDispute) => {
    setSelectedDispute(dispute);
    setIsModalOpen(true);
  };

  const handleRespondToDispute = async () => {
    if (!selectedDispute) return;

    setIsResponding(true);
    try {
      const evidence: Record<string, string> = {};
      
      if (responseForm.product_description) evidence.product_description = responseForm.product_description;
      if (responseForm.customer_name) evidence.customer_name = responseForm.customer_name;
      if (responseForm.customer_email) evidence.customer_email = responseForm.customer_email;
      if (responseForm.billing_address) evidence.billing_address = responseForm.billing_address;
      if (responseForm.receipt) evidence.receipt = responseForm.receipt;
      if (responseForm.shipping_address) evidence.shipping_address = responseForm.shipping_address;
      if (responseForm.shipping_carrier) evidence.shipping_carrier = responseForm.shipping_carrier;
      if (responseForm.shipping_date) evidence.shipping_date = responseForm.shipping_date;
      if (responseForm.shipping_tracking_number) evidence.shipping_tracking_number = responseForm.shipping_tracking_number;
      if (responseForm.uncategorized_text) evidence.uncategorized_text = responseForm.uncategorized_text;

      const response = await fetch(`/api/payments/disputes/${selectedDispute.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evidence,
          admin_notes: responseForm.admin_notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to respond to dispute');
      }

      await loadDisputes();
      setIsModalOpen(false);
      setSelectedDispute(null);
      setResponseForm({
        product_description: '',
        customer_name: '',
        customer_email: '',
        billing_address: '',
        receipt: '',
        shipping_address: '',
        shipping_carrier: '',
        shipping_date: '',
        shipping_tracking_number: '',
        uncategorized_text: '',
        admin_notes: '',
      });
      alert('ส่งการตอบกลับสำเร็จ');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตอบกลับ');
    } finally {
      setIsResponding(false);
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'needs_response') {
      return dispute.status === 'needs_response' || dispute.status === 'warning_needs_response';
    }
    if (selectedTab === 'under_review') {
      return dispute.status === 'under_review' || dispute.status === 'warning_under_review';
    }
    if (selectedTab === 'resolved') {
      return ['won', 'lost', 'charge_refunded', 'warning_closed'].includes(dispute.status);
    }
    return true;
  });

  const urgentDisputes = disputes.filter(d => 
    d.status === 'needs_response' || d.status === 'warning_needs_response'
  ).length;

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการข้อพิพาท"
        headerSubtitle="จัดการข้อพิพาทการชำระเงิน"
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
    <DashboardLayout
      menuItems={adminMenuItems}
      headerTitle="จัดการข้อพิพาท"
      headerSubtitle="จัดการข้อพิพาทการชำระเงิน"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-default-500 text-sm">ทั้งหมด</p>
                  <p className="text-2xl font-bold">{disputes.length}</p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-default-400" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-danger/10 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-danger text-sm">ต้องการตอบ</p>
                  <p className="text-2xl font-bold text-danger">{urgentDisputes}</p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-danger" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-warning/10 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-warning text-sm">อยู่ระหว่างตรวจสอบ</p>
                  <p className="text-2xl font-bold text-warning">
                    {disputes.filter(d => d.status === 'under_review' || d.status === 'warning_under_review').length}
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-warning" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-success/10 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-success text-sm">แก้ไขแล้ว</p>
                  <p className="text-2xl font-bold text-success">
                    {disputes.filter(d => ['won', 'lost', 'charge_refunded', 'warning_closed'].includes(d.status)).length}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-success" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Disputes Table */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-6"
              color="danger"
            >
              <Tab key="all" title="ทั้งหมด" />
              <Tab key="needs_response" title="ต้องการตอบ" />
              <Tab key="under_review" title="อยู่ระหว่างตรวจสอบ" />
              <Tab key="resolved" title="แก้ไขแล้ว" />
            </Tabs>

            <Table
              aria-label="Disputes table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>เหตุผล</TableColumn>
                <TableColumn>จำนวนเงิน</TableColumn>
                <TableColumn>วันที่สร้าง</TableColumn>
                <TableColumn>วันที่ต้องตอบ</TableColumn>
                <TableColumn>การจัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบข้อพิพาท">
                {filteredDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-white text-sm">
                      {dispute.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{getStatusChip(dispute.status)}</TableCell>
                    <TableCell className="text-default-400">
                      {getReasonText(dispute.reason)}
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      ฿{dispute.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {new Date(dispute.created_at).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {dispute.evidence_due_by
                        ? new Date(dispute.evidence_due_by).toLocaleDateString('th-TH')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<EyeIcon className="w-4 h-4" />}
                        onPress={() => handleViewDispute(dispute)}
                      >
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Dispute Detail Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDispute(null);
          }}
          size="3xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-xl font-semibold">รายละเอียดข้อพิพาท</h3>
                    {selectedDispute && getStatusChip(selectedDispute.status)}
                  </div>
                </ModalHeader>
                <ModalBody>
                  {selectedDispute && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-default-500 text-sm">ID</label>
                          <p className="font-mono text-white">{selectedDispute.id}</p>
                        </div>
                        <div>
                          <label className="text-default-500 text-sm">Stripe Dispute ID</label>
                          <p className="font-mono text-white text-sm">{selectedDispute.stripe_dispute_id}</p>
                        </div>
                        <div>
                          <label className="text-default-500 text-sm">จำนวนเงิน</label>
                          <p className="font-mono font-bold text-white">
                            ฿{selectedDispute.amount.toLocaleString()} {selectedDispute.currency.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <label className="text-default-500 text-sm">เหตุผล</label>
                          <p className="text-white">{getReasonText(selectedDispute.reason)}</p>
                        </div>
                        <div>
                          <label className="text-default-500 text-sm">วันที่ต้องตอบ</label>
                          <p className="text-white">
                            {selectedDispute.evidence_due_by
                              ? new Date(selectedDispute.evidence_due_by).toLocaleString('th-TH')
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <label className="text-default-500 text-sm">วันที่ตอบ</label>
                          <p className="text-white">
                            {selectedDispute.responded_at
                              ? new Date(selectedDispute.responded_at).toLocaleString('th-TH')
                              : 'ยังไม่ได้ตอบ'}
                          </p>
                        </div>
                      </div>

                      {selectedDispute.admin_notes && (
                        <div>
                          <label className="text-default-500 text-sm">หมายเหตุ</label>
                          <p className="text-white bg-default-100 p-3 rounded-lg">
                            {selectedDispute.admin_notes}
                          </p>
                        </div>
                      )}

                      {(selectedDispute.status === 'needs_response' || 
                        selectedDispute.status === 'warning_needs_response') && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-4">ตอบกลับข้อพิพาท</h4>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                label="คำอธิบายสินค้า"
                                value={responseForm.product_description}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, product_description: e.target.value })
                                }
                              />
                              <Input
                                label="ชื่อลูกค้า"
                                value={responseForm.customer_name}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, customer_name: e.target.value })
                                }
                              />
                              <Input
                                label="อีเมลลูกค้า"
                                type="email"
                                value={responseForm.customer_email}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, customer_email: e.target.value })
                                }
                              />
                              <Input
                                label="ที่อยู่เรียกเก็บเงิน"
                                value={responseForm.billing_address}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, billing_address: e.target.value })
                                }
                              />
                              <Input
                                label="ใบเสร็จ"
                                value={responseForm.receipt}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, receipt: e.target.value })
                                }
                              />
                              <Input
                                label="ที่อยู่จัดส่ง"
                                value={responseForm.shipping_address}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, shipping_address: e.target.value })
                                }
                              />
                              <Input
                                label="ผู้ให้บริการจัดส่ง"
                                value={responseForm.shipping_carrier}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, shipping_carrier: e.target.value })
                                }
                              />
                              <Input
                                label="วันที่จัดส่ง"
                                type="date"
                                value={responseForm.shipping_date}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, shipping_date: e.target.value })
                                }
                              />
                              <Input
                                label="หมายเลขติดตาม"
                                value={responseForm.shipping_tracking_number}
                                onChange={(e) =>
                                  setResponseForm({ ...responseForm, shipping_tracking_number: e.target.value })
                                }
                              />
                            </div>
                            <Textarea
                              label="ข้อความเพิ่มเติม"
                              value={responseForm.uncategorized_text}
                              onChange={(e) =>
                                setResponseForm({ ...responseForm, uncategorized_text: e.target.value })
                              }
                            />
                            <Textarea
                              label="หมายเหตุสำหรับทีม"
                              value={responseForm.admin_notes}
                              onChange={(e) =>
                                setResponseForm({ ...responseForm, admin_notes: e.target.value })
                              }
                              description="หมายเหตุนี้จะไม่แสดงให้ลูกค้าเห็น"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    ปิด
                  </Button>
                  {(selectedDispute?.status === 'needs_response' || 
                    selectedDispute?.status === 'warning_needs_response') && (
                    <Button
                      color="danger"
                      startContent={<PaperAirplaneIcon className="w-4 h-4" />}
                      onPress={handleRespondToDispute}
                      isLoading={isResponding}
                    >
                      ส่งการตอบกลับ
                    </Button>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default function DisputesPage() {
  return (
    <RoleGuard allowedRole="admin">
      <DisputesContent />
    </RoleGuard>
  );
}

