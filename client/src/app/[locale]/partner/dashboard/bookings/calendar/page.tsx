"use client";

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@shared/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { Loading } from '@/components/design-system/primitives/Loading';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  type ChipProps,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  HomeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import type { appointment } from '@shared/types';

// Use CalendarBooking consistently
interface CalendarBooking extends appointment {
  date: string;
  timeSlot?: string;
}

function BookingCalendarView() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [hospital, setHospital] = useState<{ id: string; hospital_name: string } | null>(null);
  const [appointments, setBookings] = useState<CalendarBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const loadBookings = useCallback(async (hospitalId: string) => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const { data: bookingsData } = await supabase
      .from('appointments')
      .select('*')
      .eq('hospital_id', hospitalId)
      .gte('start_date', startOfMonth.toISOString().split('T')[0])
      .lte('start_date', endOfMonth.toISOString().split('T')[0])
      .order('start_date', { ascending: true });

    if (bookingsData) {
      setBookings(
        bookingsData.map((appointment: { start_date: string; [key: string]: any }) => ({
          ...appointment,
          date: appointment.start_date,
        }))
      );
    }
  }, [currentMonth, supabase]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: hospitalData } = await supabase
          .from('hospitals')
          .select('id, hospital_name')
          .eq('user_id', user.id)
          .maybeSingle();

        setHospital(hospitalData);

        if (hospitalData) {
          await loadBookings(hospitalData.id);
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [loadBookings, supabase]);

  const menuItems: MenuItem[] = [
    { label: 'แดชบอร์ด', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'ข้อมูลโรงพยาบาล', href: '/partner/dashboard/hospital', icon: BuildingStorefrontIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/appointments', icon: CalendarIcon },
    { label: 'ปฏิทินการจอง', href: '/partner/dashboard/appointments/calendar', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getBookingsForDate = (date: Date): CalendarBooking[] => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(b => b.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusColor = (status: string): ChipProps['color'] => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleBookingClick = (appointment: CalendarBooking) => {
    setSelectedBooking(appointment);
    onOpen();
  };

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  if (isLoading) {
    return (
      <RoleGuard allowedRole="partner">
        <DashboardLayout
          menuItems={menuItems}
          headerTitle="ปฏิทินการจอง"
          headerSubtitle="ดูการจองแบบปฏิทิน"
          roleLabel="พาร์ทเนอร์"
          roleColor="primary"
          userEmail={user?.email}
        >
          <div className="flex justify-center items-center py-20">
            <Loading centered size="xl" />
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  const days = getDaysInMonth();

  return (
    <RoleGuard allowedRole="partner">
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="ปฏิทินการจอง"
        headerSubtitle="ดูการจองแบบปฏิทิน"
        roleLabel="พาร์ทเนอร์"
        roleColor="primary"
        userEmail={user?.email}
      >
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                variant="light"
                onPress={() => navigateMonth('prev')}
                aria-label="เดือนก่อนหน้า"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-bold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
              </h2>
              <Button
                isIconOnly
                variant="light"
                onPress={() => navigateMonth('next')}
                aria-label="เดือนถัดไป"
              >
                <ArrowRightIcon className="w-5 h-5" />
              </Button>
            </div>
            <Button
              variant="flat"
              onPress={() => setCurrentMonth(new Date())}
            >
              วันนี้
            </Button>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-default-500 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((date, index) => {
                const dayBookings: CalendarBooking[] = date ? getBookingsForDate(date) : [];
                const isToday = date &&
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border border-default-200  p-2 ${
                      isToday ? 'bg-primary-50 border-primary' : 'bg-default-50'
                    } ${!date ? 'opacity-0' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : ''}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.slice(0, 3).map(appointment => (
                            <div
                              key={appointment.id}
                              onClick={() => handleBookingClick(appointment)}
                              className="cursor-pointer hover:opacity-80"
                            >
                              <Chip
                                size="sm"
                                color={getStatusColor(appointment.status)}
                                variant="flat"
                                className="w-full text-xs"
                              >
                                <div className="truncate">
                                  {appointment.customer_name || 'ลูกค้า'}
                                </div>
                              </Chip>
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-xs text-default-500 text-center">
                              +{dayBookings.length - 3} อีก
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* appointment Detail Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            {selectedBooking && (
              <>
                <ModalHeader>
                  <div>
                    <h3 className="text-lg font-semibold">รายละเอียดการจอง</h3>
                    <p className="text-sm text-default-500">{selectedBooking.booking_number}</p>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-500">ลูกค้า</p>
                        <p className="font-semibold">{selectedBooking.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">อีเมล</p>
                        <p className="font-semibold">{selectedBooking.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">วันที่เริ่ม</p>
                        <p className="font-semibold">
                          {new Date(selectedBooking.start_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">แพ็คเกจ</p>
                        <p className="font-semibold">{selectedBooking.package_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">สถานะ</p>
                        <Chip
                          color={getStatusColor(selectedBooking.status)}
                          variant="flat"
                        >
                          {selectedBooking.status}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">ราคา</p>
                        <p className="font-semibold text-success">
                          ฿{Number(selectedBooking.price_paid || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {selectedBooking.special_requests && (
                      <div>
                        <p className="text-sm text-default-500">คำขอพิเศษ</p>
                        <p className="font-semibold">{selectedBooking.special_requests}</p>
                      </div>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    ปิด
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </RoleGuard>
  );
}

export default BookingCalendarView;

