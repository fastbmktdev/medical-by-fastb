// Gamification utility functions
// Common functions used across gamification components

// ============================================
// RARITY UTILITIES
// ============================================

export const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'text-gray-600 bg-gray-100';
    case 'rare': return 'text-blue-600 bg-blue-100';
    case 'epic': return 'text-purple-600 bg-purple-100';
    case 'legendary': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case 'common': return '🥉';
    case 'rare': return '🥈';
    case 'epic': return '🥇';
    case 'legendary': return '💎';
    default: return '🏅';
  }
};

// ============================================
// LEVEL UTILITIES
// ============================================

export const getLevelIcon = (level: number) => {
  if (level <= 3) return '🥊';
  if (level <= 6) return '🥋';
  if (level <= 8) return '🏆';
  return '👑';
};

export const getLevelTitle = (level: number) => {
  const titles = [
    'นักชกหน้าใหม่', 'นักชกฝึกหัด', 'นักชกมือใหม่', 'นักชกประจำ', 'นักชกมืออาชีพ',
    'นักชกแชมป์', 'นักชกตำนาน', 'นักชกเทพ', 'นักชกอมตะ', 'นักชกสูงสุด'
  ];
  return titles[Math.min(level - 1, titles.length - 1)] || 'นักชกสูงสุด';
};

export const getLevelColor = (level: number) => {
  if (level <= 3) return 'from-gray-400 to-gray-600';
  if (level <= 6) return 'from-blue-400 to-blue-600';
  if (level <= 8) return 'from-purple-400 to-purple-600';
  return 'from-yellow-400 to-yellow-600';
};

// ============================================
// CHALLENGE UTILITIES
// ============================================

export const getChallengeTypeIcon = (type: string) => {
  switch (type) {
    case 'daily': return '📅';
    case 'weekly': return '📊';
    case 'monthly': return '🗓️';
    case 'special': return '🎉';
    default: return '🎯';
  }
};

export const getChallengeTypeColor = (type: string) => {
  switch (type) {
    case 'daily': return 'bg-blue-100 text-blue-800';
    case 'weekly': return 'bg-green-100 text-green-800';
    case 'monthly': return 'bg-purple-100 text-purple-800';
    case 'special': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ============================================
// STREAK UTILITIES
// ============================================

export const getStreakIcon = (type: string) => {
  switch (type) {
    case 'appointment': return '📅';
    case 'login': return '🔑';
    case 'review': return '⭐';
    case 'article_read': return '📖';
    default: return '🔥';
  }
};

export const getStreakColor = (type: string) => {
  switch (type) {
    case 'appointment': return 'text-green-600 bg-green-100';
    case 'login': return 'text-blue-600 bg-blue-100';
    case 'review': return 'text-yellow-600 bg-yellow-100';
    case 'article_read': return 'text-purple-600 bg-purple-100';
    default: return 'text-orange-600 bg-orange-100';
  }
};

export const getStreakTitle = (type: string) => {
  switch (type) {
    case 'appointment': return 'สตรีคการจอง';
    case 'login': return 'สตรีคการเข้าสู่ระบบ';
    case 'review': return 'สตรีคการรีวิว';
    case 'article_read': return 'สตรีคการอ่าน';
    default: return 'สตรีค';
  }
};

export const getStreakDescription = (type: string) => {
  switch (type) {
    case 'appointment': return 'จองโรงพยาบาลต่อเนื่อง';
    case 'login': return 'เข้าสู่ระบบต่อเนื่อง';
    case 'review': return 'เขียนรีวิวต่อเนื่อง';
    case 'article_read': return 'อ่านบทความต่อเนื่อง';
    default: return 'กิจกรรมต่อเนื่อง';
  }
};

export const getStreakStatus = (currentStreak: number) => {
  if (currentStreak === 0) return { text: 'เริ่มต้นใหม่', color: 'text-gray-600' };
  if (currentStreak < 3) return { text: 'กำลังเริ่มต้น', color: 'text-blue-600' };
  if (currentStreak < 7) return { text: 'กำลังมาแรง', color: 'text-green-600' };
  if (currentStreak < 30) return { text: 'กำลังร้อนแรง', color: 'text-orange-600' };
  return { text: 'ไฟแรงมาก!', color: 'text-red-600' };
};

// ============================================
// LEADERBOARD UTILITIES
// ============================================

export const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
};

export const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return 'bg-yellow-100 text-yellow-800';
    case 2: return 'bg-gray-100 text-gray-800';
    case 3: return 'bg-orange-100 text-orange-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

export const getLeaderboardIcon = (type: string) => {
  switch (type) {
    case 'points': return '🏆';
    case 'appointments': return '📅';
    case 'streak': return '🔥';
    case 'monthly': return '📊';
    case 'all_time': return '⭐';
    default: return '🏅';
  }
};

// ============================================
// POINTS HISTORY UTILITIES
// ============================================

export const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'appointment': return '📅';
    case 'profile_update': return '👤';
    case 'review': return '⭐';
    case 'social_share': return '📤';
    case 'article_read': return '📖';
    case 'video_watched': return '🎥';
    case 'login': return '🔑';
    case 'referral': return '👥';
    case 'challenge_complete': return '🎯';
    case 'booking_streak_bonus': return '🔥';
    case 'login_streak_bonus': return '🔥';
    default: return '🏅';
  }
};

export const getActionColor = (actionType: string) => {
  switch (actionType) {
    case 'appointment': return 'text-green-600 bg-green-100';
    case 'profile_update': return 'text-blue-600 bg-blue-100';
    case 'review': return 'text-yellow-600 bg-yellow-100';
    case 'social_share': return 'text-purple-600 bg-purple-100';
    case 'article_read': return 'text-indigo-600 bg-indigo-100';
    case 'video_watched': return 'text-pink-600 bg-pink-100';
    case 'login': return 'text-gray-600 bg-gray-100';
    case 'referral': return 'text-orange-600 bg-orange-100';
    case 'challenge_complete': return 'text-red-600 bg-red-100';
    case 'booking_streak_bonus': return 'text-orange-600 bg-orange-100';
    case 'login_streak_bonus': return 'text-orange-600 bg-orange-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getActionTitle = (actionType: string) => {
  switch (actionType) {
    case 'appointment': return 'จองโรงพยาบาล';
    case 'profile_update': return 'อัปเดตโปรไฟล์';
    case 'review': return 'เขียนรีวิว';
    case 'social_share': return 'แชร์โซเชียล';
    case 'article_read': return 'อ่านบทความ';
    case 'video_watched': return 'ดูวิดีโอ';
    case 'login': return 'เข้าสู่ระบบ';
    case 'referral': return 'แนะนำเพื่อน';
    case 'challenge_complete': return 'ทำความท้าทาย';
    case 'booking_streak_bonus': return 'โบนัสสตรีคการจอง';
    case 'login_streak_bonus': return 'โบนัสสตรีคการเข้าสู่ระบบ';
    default: return 'กิจกรรม';
  }
};

// ============================================
// DATE UTILITIES
// ============================================

export const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'เมื่อสักครู่';
  if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
  if (diffInHours < 48) return 'เมื่อวาน';
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} วันที่แล้ว`;
  return date.toLocaleDateString('th-TH');
};

// ============================================
// PROGRESS UTILITIES
// ============================================

export const calculateLevelProgress = (totalPoints: number, currentLevel: number, pointsToNextLevel: number) => {
  const currentLevelBasePoints = (currentLevel - 1) ** 2 * 100;
  const nextLevelBasePoints = pointsToNextLevel;
  
  return Math.min(
    ((totalPoints - currentLevelBasePoints) / (nextLevelBasePoints - currentLevelBasePoints)) * 100,
    100
  );
};

export const formatPoints = (points: number) => {
  return points.toLocaleString();
};

// ============================================
// NOTIFICATION UTILITIES
// ============================================

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'points': return '🏆';
    case 'badge': return '🏅';
    case 'level': return '⭐';
    case 'streak': return '🔥';
    default: return '🎉';
  }
};

export const getNotificationColor = (type: string) => {
  switch (type) {
    case 'points': return 'bg-blue-500';
    case 'badge': return 'bg-yellow-500';
    case 'level': return 'bg-purple-500';
    case 'streak': return 'bg-orange-500';
    default: return 'bg-green-500';
  }
};