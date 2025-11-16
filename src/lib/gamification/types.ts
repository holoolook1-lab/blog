// 게임화 시스템 타입 정의

export interface UserStats {
  id: string;
  user_id: string;
  total_posts: number;
  total_comments: number;
  total_likes_received: number;
  total_likes_given: number;
  total_shares: number;
  streak_days: number; // 연속 출석 일수
  longest_streak: number; // 최대 연속 출석 일수
  last_active_date: string;
  level: number;
  experience: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'writing' | 'engagement' | 'social' | 'streak' | 'special';
  requirement_type: 'count' | 'streak' | 'milestone' | 'social';
  requirement_value: number;
  experience_reward: number;
  badge_reward?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_hidden: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achieved_at: string;
  progress: number; // 현재 진행률 (0-100)
  is_claimed: boolean;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  mission_type: 'write' | 'comment' | 'like' | 'share' | 'social';
  requirement_count: number;
  experience_reward: number;
  item_reward?: string;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

export interface UserDailyMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  is_completed: boolean;
  completed_at?: string;
  claimed_at?: string;
  assigned_at: string;
}

export interface LevelSystem {
  level: number;
  min_experience: number;
  max_experience: number;
  title: string;
  icon: string;
  color: string;
  benefits: string[];
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  level: number;
  experience: number;
  total_posts: number;
  total_likes: number;
  streak_days: number;
  rank: number;
  rank_change: number; // 순위 변동 (+상승, -하락)
}

export interface GamificationEvent {
  type: 'post_created' | 'comment_created' | 'post_liked' | 'post_shared' | 'streak_maintained' | 'achievement_unlocked' | 'mission_completed';
  user_id: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_check_in: string;
  today_check_in: boolean;
  streak_freeze_used: number; // 연속 출석 유지권 사용 횟수
  streak_freeze_available: number; // 사용 가능한 연속 출석 유지권
}

export interface GamificationSettings {
  user_id: string;
  enable_achievements: boolean;
  enable_daily_missions: boolean;
  enable_streak_reminders: boolean;
  enable_leaderboard: boolean;
  enable_experience_notifications: boolean;
  daily_mission_time: string; // 일일 미션 알림 시간 (HH:mm)
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  display_order: number;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_equipped: boolean;
  equipped_position?: number;
}

export interface ExperienceHistory {
  id: string;
  user_id: string;
  experience_gained: number;
  experience_before: number;
  experience_after: number;
  reason: string;
  source_type: 'post' | 'comment' | 'like' | 'achievement' | 'mission' | 'streak';
  source_id?: string;
  created_at: string;
}