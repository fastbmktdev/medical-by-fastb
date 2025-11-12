"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Divider, Tooltip, Tabs, Tab } from '@heroui/react';
import {
  ShareIcon,
  UserPlusIcon,
  TrophyIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  GiftIcon,
  SparklesIcon,
  FireIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { showSuccessToast, showErrorToast } from '@/lib/utils';
import { Loading } from '@/components/design-system/primitives/Loading';

interface AffiliateStats {
  totalReferrals: number;
  totalEarnings: number;
  currentMonthReferrals: number;
  conversionRate: number;
}

interface ReferralHistory {
  id: string;
  referred_user_email: string;
  status: 'pending' | 'completed' | 'rewarded';
  points_earned: number;
  created_at: string;
}

export default function AffiliatePage() {
  const { user } = useAuth();
  // const { userStats } = useGamification();
  const supabase = createClient();
  
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [stats, setStats] = useState<AffiliateStats>({
    totalReferrals: 0,
    totalEarnings: 0,
    currentMonthReferrals: 0,
    conversionRate: 0
  });
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateAffiliateCode = useCallback(() => {
    if (user) {
      const code = `MT${user.id.slice(-8).toUpperCase()}`;
      setAffiliateCode(code);
      setAffiliateLink(`${window.location.origin}/signup?ref=${code}`);
    }
  }, [user]);

  const loadAffiliateData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
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
          created_at: ref.created_at
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

        setStats({
          totalReferrals,
          totalEarnings,
          currentMonthReferrals,
          conversionRate: totalReferrals > 0 ? Math.round((totalReferrals / 10) * 100) : 0
        });
      }
    } catch (error) {
      showErrorToast('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      generateAffiliateCode();
      loadAffiliateData();
    }
  }, [user, generateAffiliateCode, loadAffiliateData]);

  const copyToClipboard = async (text: string, label: string = '') => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessToast(`${label || 'เนื้อหา'} คัดลอกเรียบร้อยแล้ว!`);
    } catch (error) {
      showErrorToast('ไม่สามารถคัดลอกได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const shareOnSocial = (platform: string) => {
    const message = `🥊 เข้าร่วมแพลตฟอร์มมวยไทยกับฉัน! ใช้โค้ด ${affiliateCode} เพื่อรับสิทธิพิเศษ! ${affiliateLink}`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateLink)}`;
        break;
      case 'x':
        url = `https://x.com/intent/post?text=${encodeURIComponent(message)}`;
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
      <div className="min-h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10 flex flex-col items-center justify-center">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-red-500 to-orange-500 rounded-full mb-6 shadow-lg shadow-red-500/30">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              Affiliate Program
            </h1>
            <p className="text-zinc-300 text-xl mb-8">
              แนะนำเพื่อนเข้าร่วมแพลตฟอร์มมวยไทยและรับแต้มสะสม พร้อมสิทธิพิเศษมากมาย
            </p>
            <Button 
              color="primary" 
              size="lg"
              onClick={() => window.location.href = '/login'}
              className="text-lg px-8"
            >
              เข้าสู่ระบบเพื่อเริ่มต้น
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center py-20">
            <Loading variant="spinner" size="lg" text="กำลังโหลดข้อมูล..." centered />
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon, value, label, description }: { icon: React.ReactNode; value: string | number; label: string; description?: string }) => (
    <Card className="bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-600 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 group backdrop-blur-sm">
      <CardBody className="text-center p-3">
        <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <p className="text-xl font-bold text-white mb-1">{value}</p>
        <p className="text-zinc-400 text-xs font-medium">{label}</p>
        {description && <p className="text-zinc-500 text-[10px] mt-1">{description}</p>}
      </CardBody>
    </Card>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Fixed Narrow */}
          <div className="lg:w-80 lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-red-500 to-orange-500 rounded-full mb-4 shadow-lg shadow-red-500/30">
                    <GiftIcon className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold mb-3 bg-linear-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                    Affiliate Program
                  </h1>
                  <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                    แนะนำเพื่อนเข้าร่วมแพลตฟอร์มมวยไทยและรับแต้มสะสม พร้อมสิทธิพิเศษมากมาย
                  </p>
                  <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="text-xs">รับ 200 แต้มต่อการแนะนำ 1 คน</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content with Tabs */}
          <div className="flex-1 min-w-0">
            <Tabs 
              aria-label="Affiliate tabs"
              classNames={{
                tabList: "bg-zinc-800/60 border-zinc-700/50 backdrop-blur-sm rounded-lg p-1",
                tab: "text-zinc-400 data-[selected=true]:text-white data-[selected=true]:bg-zinc-700/50",
                panel: "pt-4"
              }}
            >
              {/* Tab 1: Overview */}
              <Tab
                key="overview"
                title={
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4" />
                    <span>ภาพรวม</span>
                  </div>
                }
              >
                <div className="space-y-4">
                  {/* Stats Cards Section - 4 Columns */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard 
                      icon={<UserPlusIcon className="w-8 h-8 text-blue-400 mx-auto" />} 
                      value={stats.totalReferrals} 
                      label="ผู้แนะนำทั้งหมด"
                    />
                    <StatCard 
                      icon={<TrophyIcon className="w-8 h-8 text-yellow-400 mx-auto" />} 
                      value={stats.totalEarnings.toLocaleString('th-TH')} 
                      label="แต้มสะสมทั้งหมด"
                    />
                    <StatCard 
                      icon={<FireIcon className="w-8 h-8 text-orange-400 mx-auto" />} 
                      value={stats.currentMonthReferrals} 
                      label="เดือนนี้"
                    />
                    <StatCard 
                      icon={<GiftIcon className="w-8 h-8 text-purple-400 mx-auto" />} 
                      value={`${stats.conversionRate}%`} 
                      label="อัตราการแปลง"
                    />
                  </div>

                  {/* Affiliate Link & Quick Actions Combined */}
            <Card className="bg-zinc-800/60 border-zinc-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <h2 className="text-lg font-semibold flex items-center text-white">
                  <div className="p-2 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                    <LinkIcon className="w-4 h-4 text-white" />
                  </div>
                  ลิงก์แนะนำของคุณ
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'โค้ดแนะนำ', value: affiliateCode, icon: '🎯' },
                    { label: 'ลิงก์แนะนำ', value: affiliateLink, icon: '🔗' }
                  ].map(({ label, value, icon }) => (
                    <div key={label}>
                      <label className="text-zinc-300 text-xs mb-2 flex items-center gap-2">
                        <span>{icon}</span>
                        {label}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={value}
                          readOnly
                          className="flex-1"
                          size="sm"
                          classNames={{
                            input: "bg-zinc-700/50 text-white text-xs",
                            inputWrapper: "border-zinc-600 hover:border-zinc-500 h-9"
                          }}
                        />
                        <Tooltip content="คัดลอก">
                          <Button
                            color="primary"
                            variant="flat"
                            size="sm"
                            onClick={() => copyToClipboard(value, label)}
                            className="min-w-unit-12 h-9"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>

                <Divider className="my-3 bg-zinc-700/50" />

                <div>
                  <p className="text-zinc-300 text-xs mb-3 flex items-center gap-2">
                    <ShareIcon className="w-3 h-3" />
                    แชร์บนโซเชียลมีเดีย
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'facebook', label: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700' },
                      { name: 'x', label: 'X', color: 'bg-[#000000] hover:bg-[#111111]' },
                      { name: 'line', label: 'LINE', color: 'bg-green-500 hover:bg-green-600' }
                    ].map(platform => (
                      <Button
                        key={platform.name}
                        className={`${platform.color} text-white border-0`}
                        size="sm"
                        onClick={() => shareOnSocial(platform.name)}
                        startContent={<ShareIcon className="w-3 h-3" />}
                      >
                        <span className="text-xs">{platform.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Divider className="my-3 bg-zinc-700/50" />

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    size="sm"
                    onClick={() => copyToClipboard(affiliateLink, 'ลิงก์แนะนำ')}
                    startContent={<ClipboardDocumentIcon className="w-3 h-3" />}
                  >
                    คัดลอกลิงก์
                  </Button>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                    size="sm"
                    onClick={() => shareOnSocial('line')}
                    startContent={<ShareIcon className="w-3 h-3" />}
                  >
                    แชร์ LINE
                  </Button>
                </div>
              </CardBody>
            </Card>
                </div>
              </Tab>

              {/* Tab 2: How it Works */}
              <Tab
                key="how-it-works"
                title={
                  <div className="flex items-center gap-2">
                    <ShareIcon className="w-4 h-4" />
                    <span>วิธีการทำงาน</span>
                  </div>
                }
              >
                <Card className="bg-zinc-800/60 border-zinc-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <h2 className="text-lg font-semibold flex items-center text-white">
                      <div className="p-1.5 bg-linear-to-br from-green-500 to-green-600 rounded-lg mr-2">
                        <ShareIcon className="w-4 h-4 text-white" />
                      </div>
                      วิธีการทำงาน & สิทธิประโยชน์
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { step: 1, title: 'แชร์ลิงก์', desc: 'ใช้ลิงก์หรือโค้ดแนะนำ', color: 'bg-blue-500', icon: '🔗' },
                        { step: 2, title: 'เพื่อนสมัคร', desc: 'เพื่อนใช้ลิงก์สมัครสมาชิก', color: 'bg-green-500', icon: '👥' },
                        { step: 3, title: 'รับแต้ม', desc: 'รับ 200 แต้มทันที', color: 'bg-yellow-500', icon: '🎁' }
                      ].map(({ step, title, desc, color, icon }) => (
                        <div key={step} className="text-center p-3 bg-zinc-700/30 rounded-lg">
                          <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2 shadow-lg`}>
                            {step}
                          </div>
                          <div className="text-lg mb-1">{icon}</div>
                          <p className="font-semibold text-white text-sm mb-1">{title}</p>
                          <p className="text-zinc-400 text-xs">{desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-linear-to-br from-zinc-700/50 to-zinc-800/50 p-3 rounded-lg border border-zinc-600/50">
                      <h3 className="font-semibold mb-2 text-white flex items-center gap-2 text-sm">
                        <span>🎁</span>
                        สิทธิประโยชน์
                      </h3>
                      <ul className="text-zinc-300 text-xs space-y-1">
                        {[
                          'รับ 200 แต้มต่อการแนะนำ 1 คน',
                          'แต้มสามารถแลกของรางวัลได้',
                          'เข้าถึงสิทธิพิเศษสำหรับ Affiliate'
                        ].map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircleIcon className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardBody>
                </Card>
              </Tab>

              {/* Tab 3: History */}
              <Tab
                key="history"
                title={
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>ประวัติ</span>
                  </div>
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Referral History */}
              <Card className="bg-zinc-800/60 border-zinc-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
                <CardHeader className="pb-2">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <div className="p-1.5 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg mr-2">
                      <ChartBarIcon className="w-4 h-4 text-white" />
                    </div>
                    ประวัติการแนะนำ
                  </h2>
                </CardHeader>
              <CardBody className="p-0">
                {referralHistory.length > 0 ? (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <Table
                      aria-label="Referral history"
                      classNames={{
                        wrapper: "bg-transparent",
                        th: "bg-zinc-700/50 text-zinc-300 border-b border-zinc-600 text-xs px-2 py-2",
                        td: "border-b border-zinc-700/50 text-zinc-300 text-xs px-2 py-2",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>วันที่</TableColumn>
                        <TableColumn>ผู้แนะนำ</TableColumn>
                        <TableColumn className="text-right">แต้ม</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {referralHistory.slice(0, 5).map((referral) => (
                          <TableRow key={referral.id} className="hover:bg-zinc-700/30 transition-colors">
                            <TableCell>
                              <span className="text-xs">
                                {new Date(referral.created_at).toLocaleDateString('th-TH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                  {referral.referred_user_email.charAt(0).toUpperCase()}
                                </div>
                                <span className="max-w-[80px] truncate text-xs">{referral.referred_user_email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-green-400 font-semibold flex items-center justify-end gap-1 text-xs">
                                <TrophyIcon className="w-3 h-3" />
                                +{referral.points_earned.toLocaleString('th-TH')}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {referralHistory.length > 5 && (
                      <div className="text-center py-2 text-xs text-zinc-400">
                        แสดง 5 จาก {referralHistory.length} รายการ
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4">
                    <div className="w-12 h-12 bg-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserPlusIcon className="w-6 h-6 text-zinc-500" />
                    </div>
                    <p className="text-zinc-300 text-sm font-medium mb-1">ยังไม่มีประวัติ</p>
                    <p className="text-zinc-500 text-xs mb-3">เริ่มแชร์ลิงก์แนะนำ!</p>
                  </div>
                )}
              </CardBody>
            </Card>

              {/* Summary & Tips Combined */}
              <Card className="bg-zinc-800/60 border-zinc-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
                <CardHeader className="pb-2">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <div className="p-1.5 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg mr-2">
                      <TrophyIcon className="w-4 h-4 text-white" />
                    </div>
                    สรุปผลงาน
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  {/* Performance Summary */}
                  <div className="bg-linear-to-br from-zinc-700/50 to-zinc-800/50 p-3 rounded-lg border border-zinc-600/50">
                    <h3 className="font-semibold mb-2 text-white flex items-center gap-2 text-sm">
                      <span>📊</span>
                      ผลงานของคุณ
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs">ผู้แนะนำทั้งหมด</span>
                        <span className="text-white font-bold">{stats.totalReferrals} คน</span>
                      </div>
                      <Divider className="bg-zinc-700/30" />
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs">แต้มสะสม</span>
                        <span className="text-yellow-400 font-bold">{stats.totalEarnings.toLocaleString('th-TH')} แต้ม</span>
                      </div>
                      <Divider className="bg-zinc-700/30" />
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs">เดือนนี้</span>
                        <span className="text-blue-400 font-bold">{stats.currentMonthReferrals} คน</span>
                      </div>
                    </div>
                  </div>

                  {/* Tips Section */}
                  <div className="bg-linear-to-br from-purple-500/20 to-pink-500/20 p-3 rounded-lg border border-purple-500/30">
                    <h3 className="font-semibold mb-2 text-white flex items-center gap-2 text-sm">
                      <span>💡</span>
                      เคล็ดลับ Affiliate
                    </h3>
                    <ul className="text-zinc-300 text-xs space-y-1">
                      {[
                        'แชร์ในกลุ่มที่สนใจมวยไทย',
                        'อธิบายประโยชน์ที่ได้รับ',
                        'แชร์เนื้อหาที่น่าสนใจ',
                        'ติดตามผลอย่างสม่ำเสมอ'
                      ].map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Motivation Box */}
                  <div className="bg-linear-to-br from-red-500/20 to-orange-500/20 p-3 rounded-lg border border-red-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <FireIcon className="w-4 h-4 text-orange-400" />
                      <p className="font-semibold text-white text-xs">กำลังใจ</p>
                    </div>
                    <p className="text-zinc-300 text-xs">
                      {stats.totalReferrals === 0
                        ? 'เริ่มต้นแชร์ลิงก์แนะนำของคุณวันนี้!'
                        : `เยี่ยมมาก! คุณได้แนะนำไปแล้ว ${stats.totalReferrals} คน`
                      }
                    </p>
                  </div>
                </CardBody>
              </Card>
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
