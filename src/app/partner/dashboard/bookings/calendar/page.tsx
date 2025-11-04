"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
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
} from '@heroicons/react/24/outline';
import type { Booking } from '@/types';

interface CalendarBooking extends Booking {
  date: string;
  timeSlot?: string;
}

function BookingCalendarView() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [gym, setGym] = useState<{ id: string; gym_name: string } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: gymData } = await supabase
          .from('gyms')
          .select('id, gym_name')
          .eq('user_id', user.id)
          .maybeSingle();

        setGym(gymData);

        if (gymData) {
          await loadBookings(gymData.id);
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase, currentMonth]);

  const loadBookings = async (gymId: string) => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('gym_id', gymId)
      .gte('start_date', startOfMonth.toISOString().split('T')[0])
      .lte('start_date', endOfMonth.toISOString().split('T')[0])
      .order('start_date', { ascending: true });

    if (bookingsData) {
      setBookings(bookingsData);
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'แดชบอร์ด', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'ปฏิทินการจอง', href: '/partner/dashboard/bookings/calendar', icon: CalendarIcon },
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

  const getBookingsForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.start_date === dateStr);
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

  const getStatusColor = (status: string) => {
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

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                const dayBookings = date ? getBookingsForDate(date) : [];
                const isToday = date && 
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border border-default-200 rounded-lg p-2 ${
                      isToday ? 'bg-primary-50 border-primary' : 'bg-default-50'
                    } ${!date ? 'opacity-0' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : ''}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.slice(0, 3).map(booking => (
                            <div
                              key={booking.id}
                              onClick={() => handleBookingClick(booking)}
                              className="cursor-pointer hover:opacity-80"
                            >
                              <Chip
                                size="sm"
                                color={getStatusColor(booking.status) as any}
                                variant="flat"
                                className="w-full text-xs"
                              >
                                <div className="truncate">
                                  {booking.customer_name || 'ลูกค้า'}
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

        {/* Booking Detail Modal */}
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
                          color={getStatusColor(selectedBooking.status) as any}
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

