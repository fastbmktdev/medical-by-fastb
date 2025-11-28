"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  Progress,
  Tooltip,
} from "@heroui/react";
import {
  ShareIcon,
  UserPlusIcon,
  TrophyIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  GiftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  SparklesIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { cn, showSuccessToast, showErrorToast } from '@shared/lib/utils';
import { Loading } from "@/components/design-system/primitives/Loading";

// --- Types ---
type Status = "pending" | "completed" | "rewarded";
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
  status: Status;
  points_earned: number;
  created_at: string;
  source: string;
}

interface AffiliateApiReferral {
  id: string;
  referred_user_email?: string | null;
  status?: Status | null;
  points_earned?: number | null;
  commission_amount?: number | null;
  created_at: string;
  source?: string | null;
}

interface AffiliateApiResponse {
  referralHistory?: AffiliateApiReferral[];
  totalReferrals?: number;
  totalEarnings?: number;
  currentMonthReferrals?: number;
  conversionRate?: number;
}

// --- Utility Components ---
const PageWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      "min-h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden",
      className
    )}
  >
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10  blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10  blur-3xl animate-pulse delay-1000"></div>
    </div>
    <div className="container mx-auto px-4 py-16 relative z-10">{children}</div>
  </div>
);

// --- StatCard Component ---
const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  growth?: number;
}> = ({ icon, value, label, growth }) => (
  <Card className="bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-600 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 group backdrop-blur-sm  border">
    <CardBody className="text-center p-4">
      <div className="flex items-center justify-between gap-2 mb-2 w-full">
        {icon}
        <span className="text-zinc-400 text-sm text-right">{label}</span>
      </div>
      <div className="flex items-start justify-between h-full">
        <p className="text-3xl font-bold text-white flex flex-col items-center gap-2 w-10 h-full">
          {value}
        </p>
        <p className="flex flex-col items-center gap-2">
          {growth !== undefined && (
            <div className="flex items-center justify-center mt-3">
              {growth >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-400 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-400 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${growth >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {growth >= 0 ? "+" : ""}
                {growth}%
              </span>
            </div>
          )}
        </p>
      </div>
    </CardBody>
  </Card>
);

// --- Helper Functions ---
const SOCIAL_SHARE_URLS: Record<
  string,
  (link: string, message: string) => string
> = {
  facebook: (link) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
  x: (_, message) =>
    `https://x.com/intent/post?text=${encodeURIComponent(message)}`,
  line: (link) =>
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`,
};

function calculateMonthlyGrowth(
  referralHistory: ReferralHistory[],
  currentMonthReferrals: number
): number {
  if (!referralHistory.length) return 0;
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastMonthYear =
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const lastMonthReferrals = referralHistory.filter((ref) => {
    const refDate = new Date(ref.created_at);
    return (
      refDate.getMonth() === lastMonth &&
      refDate.getFullYear() === lastMonthYear
    );
  }).length;

  if (lastMonthReferrals > 0) {
    return Math.round(
      ((currentMonthReferrals - lastMonthReferrals) / lastMonthReferrals) * 100
    );
  }
  return currentMonthReferrals > 0 ? 100 : 0;
}

// --- Main Component ---
export default function AffiliateDashboardPage() {
  const { user } = useAuth();

  const [affiliateCode, setAffiliateCode] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [stats, setStats] = useState<AffiliateStats>({
    totalReferrals: 0,
    totalEarnings: 0,
    currentMonthReferrals: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
    topReferralSource: "Direct",
  });
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateAffiliateCode = useCallback(() => {
    if (!user) return;
    const code = `MT${user.id.slice(-8).toUpperCase()}`;
    setAffiliateCode(code);
    setAffiliateLink(`${window.location.origin}/signup?ref=${code}`);
  }, [user]);

  const loadAffiliateData = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/affiliate");
      if (!response.ok) {
        throw new Error("Failed to fetch affiliate data");
      }
      const data: AffiliateApiResponse = await response.json();
      const apiReferralHistory = data.referralHistory ?? [];
      const normalizedHistory: ReferralHistory[] = apiReferralHistory.map(
        (ref) => ({
          id: ref.id,
          referred_user_email: ref.referred_user_email || "Unknown",
          status: ref.status || "pending",
          points_earned:
            typeof ref.points_earned === "number"
              ? ref.points_earned
              : (ref.commission_amount ?? 0),
          created_at: ref.created_at,
          source: ref.source || "Direct",
        })
      );

      setReferralHistory(normalizedHistory);

      // Calculate top referral source
      const sourceCounts: Record<string, number> = {};
      normalizedHistory.forEach((ref) => {
        const source = ref.source || "Direct";
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      const topSource =
        Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "Direct";

      setStats({
        totalReferrals: data.totalReferrals || 0,
        totalEarnings: data.totalEarnings || 0,
        currentMonthReferrals: data.currentMonthReferrals || 0,
        conversionRate: data.conversionRate || 0,
        monthlyGrowth: calculateMonthlyGrowth(
          normalizedHistory,
          data.currentMonthReferrals || 0
        ),
        topReferralSource: topSource,
      });
    } catch (error) {
      console.error("Error loading affiliate data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      generateAffiliateCode();
      loadAffiliateData();
    }
  }, [user, generateAffiliateCode, loadAffiliateData]);

  // --- Handlers ---
  const copyToClipboard = async (text: string, label: string = "") => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessToast(`${label || "เนื้อหา"} คัดลอกเรียบร้อยแล้ว!`);
    } catch {
      showErrorToast("ไม่สามารถคัดลอกได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const shareOnSocial = (platform: string) => {
    const message = `🥊 เข้าร่วมแพลตฟอร์มการแพทย์กับฉัน! ใช้โค้ด ${affiliateCode} เพื่อรับสิทธิพิเศษ! ${affiliateLink}`;
    const url = SOCIAL_SHARE_URLS[platform]?.(affiliateLink, message);
    if (url) window.open(url, "_blank", "width=600,height=400");
  };

  // --- UI States ---
  if (!user) {
    return (
      <PageWrapper>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Affiliate Dashboard</h1>
          <p className="text-zinc-300 text-xl mb-8">
            กรุณาเข้าสู่ระบบเพื่อเข้าถึง Affiliate Dashboard
          </p>
          <Button
            color="primary"
            size="lg"
            onClick={() => (window.location.href = "/login")}
          >
            เข้าสู่ระบบ
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <Loading
            variant="spinner"
            size="lg"
            text="กำลังโหลดข้อมูล..."
            centered
          />
        </div>
      </PageWrapper>
    );
  }

  // --- Main Render ---
  return (
    <PageWrapper className="min-h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden mt-16">
      {/* Header Section */}
      <div className="text-center mb-12 animate-fade-in w-2/5">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-red-500 to-orange-500  mb-6 shadow-lg shadow-red-500/30">
          <SparklesIcon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
          Affiliate Dashboard
        </h1>
        <p className="text-zinc-300 text-xl max-w-3xl mx-auto">
          ติดตามผลงานและสถิติการแนะนำของคุณแบบเรียลไทม์
        </p>
      </div>
      <div className="mx-auto px-4 relative z-10 flex flex-col gap-6 w-3/5">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<UserPlusIcon className="w-10 h-10 text-blue-400" />}
            value={stats.totalReferrals}
            label="ผู้แนะนำทั้งหมด"
            growth={stats.monthlyGrowth}
          />
          <StatCard
            icon={<TrophyIcon className="w-10 h-10 text-yellow-400" />}
            value={stats.totalEarnings.toLocaleString("th-TH")}
            label="แต้มสะสมทั้งหมด"
          />
          <StatCard
            icon={<FireIcon className="w-10 h-10 text-orange-400" />}
            value={stats.currentMonthReferrals}
            label="เดือนนี้"
          />
          <StatCard
            icon={<GiftIcon className="w-10 h-10 text-purple-400" />}
            value={`${stats.conversionRate}%`}
            label="อัตราการแปลง"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Affiliate Link Card */}
          <Card className="bg-zinc-800/60 border-zinc-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <h2 className="text-xl font-semibold flex items-center text-white">
                <div className="p-2 bg-linear-to-br from-blue-500 to-blue-600  mr-3">
                  <LinkIcon className="w-5 h-5 text-white" />
                </div>
                ลิงก์แนะนำของคุณ
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {[
                { label: "โค้ดแนะนำ", value: affiliateCode, icon: "🎯" },
                { label: "ลิงก์แนะนำ", value: affiliateLink, icon: "🔗" },
              ].map(({ label, value, icon }) => (
                <div key={label}>
                  <label className="text-zinc-300 text-sm mb-2 flex items-center gap-2">
                    <span>{icon}</span>
                    {label}
                  </label>
                  <div className="flex gap-3">
                    <input
                      value={value}
                      readOnly
                      className="flex-1 bg-zinc-100/50 border border-zinc-600  px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    <Tooltip content="คัดลอก">
                      <Button
                        color="primary"
                        variant="flat"
                        onClick={() => copyToClipboard(value, label)}
                        className="min-w-unit-14"
                      >
                        <ClipboardDocumentIcon className="w-5 h-5" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ))}
              <Divider className="my-6 bg-zinc-100/50" />
              <div>
                <p className="text-zinc-300 text-sm mb-4 flex items-center gap-2">
                  <ShareIcon className="w-4 h-4" />
                  แชร์บนโซเชียลมีเดีย
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    {
                      name: "facebook",
                      label: "Facebook",
                      color: "bg-blue-600 hover:bg-blue-700",
                    },
                    {
                      name: "x",
                      label: "X",
                      color: "bg-[#000000] hover:bg-[#111111]",
                    },
                    {
                      name: "line",
                      label: "LINE",
                      color: "bg-green-500 hover:bg-green-600",
                    },
                  ].map((platform) => (
                    <Button
                      key={platform.name}
                      className={`${platform.color} text-white border-0`}
                      size="md"
                      onClick={() => shareOnSocial(platform.name)}
                      startContent={<ShareIcon className="w-4 h-4" />}
                    >
                      {platform.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Performance Stats Card */}
          <Card className="bg-zinc-800/60 border-zinc-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <h2 className="text-xl font-semibold flex items-center text-white">
                <div className="p-2 bg-linear-to-br from-green-500 to-green-600  mr-3">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                สถิติประสิทธิภาพ
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {[
                {
                  label: "อัตราการแปลง",
                  value: stats.conversionRate,
                  icon: "📊",
                },
                {
                  label: "การเติบโตรายเดือน",
                  value: stats.monthlyGrowth,
                  icon: "📈",
                },
              ].map(({ label, value, icon }) => {
                const color: "success" | "danger" | "primary" =
                  label === "การเติบโตรายเดือน"
                    ? value >= 0
                      ? "success"
                      : "danger"
                    : "primary";

                return (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-zinc-300 flex items-center gap-2">
                        <span>{icon}</span>
                        {label}
                      </span>
                      <span
                        className={`font-semibold text-lg ${
                          label === "การเติบโตรายเดือน"
                            ? value >= 0
                              ? "text-green-400"
                              : "text-red-400"
                            : "text-blue-400"
                        }`}
                      >
                        {label === "การเติบโตรายเดือน" && value >= 0 ? "+" : ""}
                        {value}%
                      </span>
                    </div>
                    <Progress
                      value={Math.abs(value)}
                      className="w-full"
                      color={color}
                      size="lg"
                      showValueLabel={false}
                    />
                  </div>
                );
              })}
              <Divider className="my-4 bg-zinc-100/50" />
              <div className="flex justify-between items-center p-3 bg-zinc-100/30 ">
                <span className="text-zinc-300 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  ช่องทางแนะนำหลัก
                </span>
                <Chip color="primary" variant="flat" size="sm">
                  {stats.topReferralSource}
                </Chip>
              </div>
              <div className="bg-linear-to-br from-zinc-700/50 to-zinc-800/50 p-5  border border-zinc-600/50">
                <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  เป้าหมายประจำเดือน
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-zinc-300">แนะนำ 10 คน</span>
                    <span className="text-white font-semibold">
                      {stats.totalReferrals}/10
                    </span>
                  </div>
                  <Progress
                    value={Math.min((stats.totalReferrals / 10) * 100, 100)}
                    className="w-full"
                    color="warning"
                    size="lg"
                  />
                  {stats.totalReferrals >= 10 && (
                    <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>บรรลุเป้าหมายแล้ว!</span>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Referral History Card */}
        <Card className="bg-zinc-800/60 border-zinc-700/50 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 mt-8">
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <div className="p-2 bg-linear-to-br from-purple-500 to-purple-600  mr-3">
                <UserPlusIcon className="w-5 h-5 text-white" />
              </div>
              ประวัติการแนะนำ
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {referralHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table
                  aria-label="Referral history"
                  classNames={{
                    wrapper: "bg-transparent",
                    th: "bg-zinc-100/50 text-zinc-300 border-b border-zinc-600",
                    td: "border-b border-zinc-700/50 text-zinc-300",
                  }}
                >
                  <TableHeader>
                    <TableColumn>วันที่</TableColumn>
                    <TableColumn>ผู้แนะนำ</TableColumn>
                    <TableColumn>ช่องทาง</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                    <TableColumn className="text-right">
                      แต้มที่ได้รับ
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {referralHistory.map((referral) => (
                      <TableRow
                        key={referral.id}
                        className="hover:bg-zinc-100/30 transition-colors"
                      >
                        <TableCell>
                          {new Date(referral.created_at).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600  flex items-center justify-center text-white text-xs font-bold">
                              {referral.referred_user_email
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="max-w-[200px] truncate">
                              {referral.referred_user_email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" color="primary" variant="flat">
                            {referral.source || "Direct"}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={
                              referral.status === "rewarded"
                                ? "success"
                                : referral.status === "completed"
                                  ? "primary"
                                  : "warning"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {referral.status === "rewarded" ? (
                              <span className="flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3" />
                                ได้รับแต้มแล้ว
                              </span>
                            ) : referral.status === "completed" ? (
                              <span className="flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3" />
                                ยืนยันแล้ว
                              </span>
                            ) : (
                              "รอดำเนินการ"
                            )}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-400 font-semibold flex items-center justify-end gap-1">
                            <TrophyIcon className="w-4 h-4" />+
                            {referral.points_earned.toLocaleString("th-TH")}{" "}
                            แต้ม
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-zinc-100/50  flex items-center justify-center mx-auto mb-6">
                  <UserPlusIcon className="w-12 h-12 text-zinc-500" />
                </div>
                <p className="text-zinc-300 text-lg font-medium mb-2">
                  ยังไม่มีประวัติการแนะนำ
                </p>
                <p className="text-zinc-500 text-sm mb-6">
                  เริ่มแชร์ลิงก์แนะนำของคุณได้เลย!
                </p>
                <Button
                  color="primary"
                  variant="flat"
                  onClick={() => {
                    if (affiliateLink) {
                      copyToClipboard(affiliateLink, "ลิงก์แนะนำ");
                    }
                  }}
                  startContent={<ShareIcon className="w-4 h-4" />}
                >
                  คัดลอกลิงก์แนะนำ
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
