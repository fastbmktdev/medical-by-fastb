"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/react';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface TrainingHistoryStats {
  total_bookings: number;
  unique_gyms: number;
  total_spent: number;
  by_month: Record<string, number>;
}

interface Booking {
  id: string;
  start_date: string;
  price_paid: string | number;
  package_name: string;
  gyms: { gym_name: string; location: string };
}

export function TrainingHistoryView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<TrainingHistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/users/training-history');
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data.bookings || []);
        setStats(data.data.statistics || null);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-zinc-900/50 h-64 rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-white">ประวัติการฝึกซ้อม</h3>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-zinc-950/50 border border-zinc-700">
            <CardBody>
              <p className="text-zinc-400 text-sm">จำนวนครั้งทั้งหมด</p>
              <p className="text-2xl font-bold text-white">{stats.total_bookings}</p>
            </CardBody>
          </Card>
          <Card className="bg-zinc-950/50 border border-zinc-700">
            <CardBody>
              <p className="text-zinc-400 text-sm">ค่ายมวยที่ไป</p>
              <p className="text-2xl font-bold text-white">{stats.unique_gyms}</p>
            </CardBody>
          </Card>
          <Card className="bg-zinc-950/50 border border-zinc-700">
            <CardBody>
              <p className="text-zinc-400 text-sm">ยอดรวมที่ใช้</p>
              <p className="text-2xl font-bold text-white">
                ฿{(stats.total_spent || 0).toLocaleString()}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Booking List */}
      <div className="space-y-3">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <Card key={booking.id} className="bg-zinc-950/50 border border-zinc-700">
              <CardBody className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{booking.gyms?.gym_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPinIcon className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-400 text-sm">{booking.gyms?.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      ฿
                      {Number(booking.price_paid || 0).toLocaleString()}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      {booking.package_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {new Date(booking.start_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <div className="bg-zinc-950/50 p-8 rounded-lg text-center text-zinc-400">
            ยังไม่มีประวัติการฝึกซ้อม
          </div>
        )}
      </div>
    </div>
  );
}

