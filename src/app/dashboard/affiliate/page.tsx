"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Progress
} from '@heroui/react';
import {
  ShareIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  GiftIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface AffiliateStats {
  totalReferrals: number;
  totalEarnings: number;
  currentMonthReferrals: number;
  conversionRate: number;
  monthlyGrowth: number;
  topReferralSource: string;
}

interface ReferralHistory {
  id: string;
  referred_user_email: string;
  status: 'pending' | 'completed' | 'rewarded';
  points_earned: number;
  created_at: string;
  source?: string;
}

export default function AffiliateDashboardPage() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [stats, setStats] = useState<AffiliateStats>({
    totalReferrals: 0,
    totalEarnings: 0,
    currentMonthReferrals: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
    topReferralSource: 'Direct'
  });
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateAffiliateCode();
      loadAffiliateData();
    }
  }, [user]);

  const generateAffiliateCode = () => {
    if (user) {
      const code = `MT${user.id.slice(-8).toUpperCase()}`;
      setAffiliateCode(code);
      setAffiliateLink(`${window.location.origin}/signup?ref=${code}`);
    }
  };

  const loadAffiliateData = async () => {
    if (!user) return;

    try {
      // Load referral history
      const { data: referrals } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('action_type', 'referral')
        .order('created_at', { ascending: false });

      if (referrals) {
        setReferralHistory(referrals.map(ref => ({
          id: ref.id,
          referred_user_email: ref.action_description || 'Unknown',
          status: 'rewarded' as const,
          points_earned: ref.points,
          created_at: ref.created_at,
          source: 'Direct'
        })));

        // Calculate stats
        const totalReferrals = referrals.length;
        const totalEarnings = referrals.reduce((sum, ref) => sum + ref.points, 0);
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentMonthReferrals = referrals.filter(ref => {
          const refDate = new Date(ref.created_at);
          return refDate.getMonth() === currentMonth && refDate.getFullYear() === currentYear;
        }).length;

        // Calculate monthly growth
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthReferrals = referrals.filter(ref => {
          const refDate = new Date(ref.created_at);
          return refDate.getMonth() === lastMonth && refDate.getFullYear() === currentYear;
        }).length;

        const monthlyGrowth = lastMonthReferrals > 0 
          ? Math.round(((currentMonthReferrals - lastMonthReferrals) / lastMonthReferrals) * 100)
          : currentMonthReferrals > 0 ? 100 : 0;

        setStats({
          totalReferrals,
          totalEarnings,
          currentMonthReferrals,
          conversionRate: totalReferrals > 0 ? Math.round((totalReferrals / 10) * 100) : 0,
          monthlyGrowth,
          topReferralSource: 'Direct'
        });
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareOnSocial = (platform: string) => {
    const message = `🥊 เข้าร่วมแพลตฟอร์มมวยไทยกับฉัน! ใช้โค้ด ${affiliateCode} เพื่อรับสิทธิพิเศษ! ${affiliateLink}`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateLink)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
        break;
      case 'line':
        url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(affiliateLink)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Affiliate Dashboard</h1>
            <p className="text-zinc-300 text-xl mb-8">
              กรุณาเข้าสู่ระบบเพื่อเข้าถึง Affiliate Dashboard
            </p>
            <Button 
              color="primary" 
              size="lg"
              onClick={() => window.location.href = '/login'}
            >
              เข้าสู่ระบบ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="border border-white border-t-transparent rounded-full w-8 h-8 animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-300">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            📊 Affiliate Dashboard
          </h1>
          <p className="text-zinc-300 text-xl max-w-3xl mx-auto">
            ติดตามผลงานและสถิติการแนะนำของคุณ
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardBody className="text-center">
              <UserPlusIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
              <p className="text-zinc-400">ผู้แนะนำทั้งหมด</p>
              <div className="flex items-center justify-center mt-2">
                {stats.monthlyGrowth >= 0 ? (
                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${stats.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(stats.monthlyGrowth)}%
                </span>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardBody className="text-center">
              <TrophyIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.totalEarnings}</p>
              <p className="text-zinc-400">แต้มสะสมทั้งหมด</p>
            </CardBody>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardBody className="text-center">
              <ChartBarIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.currentMonthReferrals}</p>
              <p className="text-zinc-400">เดือนนี้</p>
            </CardBody>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardBody className="text-center">
              <GiftIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
              <p className="text-zinc-400">อัตราการแปลง</p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Affiliate Link Section */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <LinkIcon className="w-5 h-5 mr-2" />
                ลิงก์แนะนำของคุณ
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="text-zinc-300 text-sm mb-2 block">โค้ดแนะนำ</label>
                <div className="flex gap-2">
                  <input
                    value={affiliateCode}
                    readOnly
                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white text-sm"
                  />
                  <Button
                    color="primary"
                    variant="flat"
                    onClick={() => copyToClipboard(affiliateCode)}
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 text-sm mb-2 block">ลิงก์แนะนำ</label>
                <div className="flex gap-2">
                  <input
                    value={affiliateLink}
                    readOnly
                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white text-sm"
                  />
                  <Button
                    color="primary"
                    variant="flat"
                    onClick={() => copyToClipboard(affiliateLink)}
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Divider className="my-4" />

              <div>
                <p className="text-zinc-300 text-sm mb-3">แชร์บนโซเชียลมีเดีย</p>
                <div className="flex gap-2">
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onClick={() => shareOnSocial('facebook')}
                  >
                    Facebook
                  </Button>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onClick={() => shareOnSocial('twitter')}
                  >
                    Twitter
                  </Button>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onClick={() => shareOnSocial('line')}
                  >
                    LINE
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Performance Metrics */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                สถิติประสิทธิภาพ
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-300">อัตราการแปลง</span>
                  <span className="text-white font-medium">{stats.conversionRate}%</span>
                </div>
                <Progress 
                  value={stats.conversionRate} 
                  className="w-full"
                  color="primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-300">การเติบโตรายเดือน</span>
                  <span className={`font-medium ${stats.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%
                  </span>
                </div>
                <Progress 
                  value={Math.abs(stats.monthlyGrowth)} 
                  className="w-full"
                  color={stats.monthlyGrowth >= 0 ? "success" : "danger"}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-300">ช่องทางแนะนำหลัก</span>
                  <span className="text-white font-medium">{stats.topReferralSource}</span>
                </div>
              </div>

              <Divider className="my-4" />

              <div className="bg-zinc-700/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">🎯 เป้าหมาย</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">แนะนำ 10 คน</span>
                    <span className="text-white">{stats.totalReferrals}/10</span>
                  </div>
                  <Progress 
                    value={(stats.totalReferrals / 10) * 100} 
                    className="w-full"
                    color="warning"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Referral History */}
        <Card className="bg-zinc-800/50 border-zinc-700 mt-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">ประวัติการแนะนำ</h2>
          </CardHeader>
          <CardBody>
            {referralHistory.length > 0 ? (
              <Table aria-label="Referral history">
                <TableHeader>
                  <TableColumn>วันที่</TableColumn>
                  <TableColumn>ผู้แนะนำ</TableColumn>
                  <TableColumn>ช่องทาง</TableColumn>
                  <TableColumn>สถานะ</TableColumn>
                  <TableColumn>แต้มที่ได้รับ</TableColumn>
                </TableHeader>
                <TableBody>
                  {referralHistory.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        {new Date(referral.created_at).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>{referral.referred_user_email}</TableCell>
                      <TableCell>
                        <Chip size="sm" color="primary" variant="flat">
                          {referral.source || 'Direct'}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={referral.status === 'rewarded' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {referral.status === 'rewarded' ? 'ได้รับแต้มแล้ว' : 'รอดำเนินการ'}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-green-400 font-medium">
                        +{referral.points_earned} แต้ม
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <UserPlusIcon className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-400">ยังไม่มีประวัติการแนะนำ</p>
                <p className="text-zinc-500 text-sm">เริ่มแชร์ลิงก์แนะนำของคุณได้เลย!</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
