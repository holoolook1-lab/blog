import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  type: 'attendance' | 'achievement' | 'content' | 'social' | 'reward';
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface LevelInfo {
  level: number;
  minPoints: number;
  maxPoints: number;
  title: string;
  icon: string;
  color: string;
}

const LEVELS: LevelInfo[] = [
  { level: 1, minPoints: 0, maxPoints: 100, title: '새내기', icon: '🌱', color: 'text-green-600' },
  { level: 2, minPoints: 100, maxPoints: 300, title: '견습생', icon: '🌿', color: 'text-green-700' },
  { level: 3, minPoints: 300, maxPoints: 600, title: '학습자', icon: '🌿', color: 'text-blue-600' },
  { level: 4, minPoints: 600, maxPoints: 1000, title: '숙련자', icon: '🌿', color: 'text-blue-700' },
  { level: 5, minPoints: 1000, maxPoints: 1500, title: '정예 회원', icon: '⭐', color: 'text-purple-600' },
  { level: 6, minPoints: 1500, maxPoints: 2100, title: '전문가', icon: '🏆', color: 'text-purple-700' },
  { level: 7, minPoints: 2100, maxPoints: 2800, title: '마스터', icon: '🎖️', color: 'text-orange-600' },
  { level: 8, minPoints: 2800, maxPoints: 3600, title: '그랜드 마스터', icon: '👑', color: 'text-orange-700' },
  { level: 9, minPoints: 3600, maxPoints: 4500, title: '전설', icon: '💎', color: 'text-red-600' },
  { level: 10, minPoints: 4500, maxPoints: Infinity, title: '신화', icon: '🌟', color: 'text-yellow-600' },
];

export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('포인트 조회 오류:', error);
    return null;
  }
}

export async function getPointTransactions(
  userId: string, 
  limit: number = 10, 
  offset: number = 0
): Promise<PointTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('포인트 내역 조회 오류:', error);
    return [];
  }
}

export function getLevelInfo(points: number): LevelInfo {
  for (const level of LEVELS) {
    if (points >= level.minPoints && points < level.maxPoints) {
      return level;
    }
  }
  return LEVELS[LEVELS.length - 1]; // 최고 레벨
}

export function getNextLevelInfo(points: number): LevelInfo | null {
  const currentLevel = getLevelInfo(points);
  const nextLevelIndex = currentLevel.level;
  
  if (nextLevelIndex < LEVELS.length) {
    return LEVELS[nextLevelIndex];
  }
  
  return null; // 최고 레벨
}

export function getLevelProgress(points: number): {
  currentLevel: LevelInfo;
  nextLevel: LevelInfo | null;
  progress: number;
  currentPoints: number;
  requiredPoints: number;
} {
  const currentLevel = getLevelInfo(points);
  const nextLevel = getNextLevelInfo(points);
  
  if (!nextLevel) {
    // 최고 레벨인 경우
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      currentPoints: points,
      requiredPoints: 0,
    };
  }
  
  const levelRange = nextLevel.maxPoints - currentLevel.minPoints;
  const currentProgress = points - currentLevel.minPoints;
  const progress = (currentProgress / levelRange) * 100;
  
  return {
    currentLevel,
    nextLevel,
    progress: Math.min(100, progress),
    currentPoints: currentProgress,
    requiredPoints: levelRange,
  };
}

export async function addPoints(
  userId: string, 
  points: number, 
  type: PointTransaction['type'], 
  description: string,
  referenceId?: string
): Promise<boolean> {
  try {
    // 포인트 내역 추가
    const { error: transactionError } = await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        points: points,
        type: type,
        description: description,
        reference_id: referenceId,
      });

    if (transactionError) throw transactionError;

    // 사용자 포인트 업데이트 또는 생성
    const existingPoints = await getUserPoints(userId);
    
    if (existingPoints) {
      // 기존 포인트 업데이트
      const newTotalPoints = existingPoints.total_points + points;
      const newLevel = getLevelInfo(newTotalPoints).level;
      
      const { error: updateError } = await supabase
        .from('user_points')
        .update({ 
          total_points: newTotalPoints,
          current_level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      // 새 포인트 레코드 생성
      const newLevel = getLevelInfo(points).level;
      
      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: points,
          current_level: newLevel,
        });

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error('포인트 추가 오류:', error);
    return false;
  }
}

export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  } else if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
}

export function getPointTypeIcon(type: PointTransaction['type']): string {
  const icons = {
    attendance: '📅',
    achievement: '🏆',
    content: '✍️',
    social: '❤️',
    reward: '🎁',
  };
  return icons[type] || '💰';
}

export function getPointTypeName(type: PointTransaction['type']): string {
  const names = {
    attendance: '출석',
    achievement: '업적',
    content: '콘텐츠',
    social: '소셜',
    reward: '보상',
  };
  return names[type] || '기타';
}