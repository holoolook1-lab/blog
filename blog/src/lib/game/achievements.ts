import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'attendance' | 'content' | 'social' | 'special';
  requirement_type: 'streak' | 'total' | 'level' | 'custom';
  requirement_value: number;
  points_reward: number;
  created_at: string;
}

export interface UserAchievement extends Achievement {
  achieved_at: string;
  is_new?: boolean;
}

export interface AchievementProgress {
  achievement: Achievement;
  currentProgress: number;
  targetProgress: number;
  isCompleted: boolean;
  percentage: number;
}

export async function getAchievements(): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('업적 조회 오류:', error);
    return [];
  }
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (error) throw error;
    
    return data?.map(item => ({
      ...item.achievement,
      achieved_at: item.achieved_at,
      is_new: item.is_new || false,
    })) || [];
  } catch (error) {
    console.error('사용자 업적 조회 오류:', error);
    return [];
  }
}

export async function getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
  try {
    // 모든 업적 가져오기
    const allAchievements = await getAchievements();
    
    // 사용자의 현재 통계 가져오기
    const userStats = await getUserStats(userId);
    
    // 사용자의 달성한 업적 ID 목록
    const userAchievements = await getUserAchievements(userId);
    const achievedIds = new Set(userAchievements.map(ua => ua.id));

    return allAchievements.map(achievement => {
      let currentProgress = 0;
      let isCompleted = achievedIds.has(achievement.id);

      if (!isCompleted) {
        // 현재 진행도 계산
        switch (achievement.requirement_type) {
          case 'streak':
            currentProgress = userStats.attendanceStreak;
            break;
          case 'total':
            if (achievement.category === 'attendance') {
              currentProgress = userStats.totalAttendance;
            }
            break;
          case 'level':
            currentProgress = userStats.currentLevel;
            break;
          case 'custom':
            currentProgress = getCustomProgress(achievement, userStats);
            break;
        }
      } else {
        currentProgress = achievement.requirement_value;
      }

      const percentage = Math.min(
        (currentProgress / achievement.requirement_value) * 100,
        100
      );

      return {
        achievement,
        currentProgress: Math.max(0, currentProgress),
        targetProgress: achievement.requirement_value,
        isCompleted,
        percentage,
      };
    });
  } catch (error) {
    console.error('업적 진행도 조회 오류:', error);
    return [];
  }
}

export async function checkContentAchievements(userId: string, contentType: string, count: number): Promise<UserAchievement[]> {
  const newAchievements: UserAchievement[] = [];

  try {
    // 콘텐츠 관련 업적 확인
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('category', 'content')
      .eq('requirement_type', 'custom');

    if (!achievements) return newAchievements;

    // 사용자의 현재 업적 확인
    const userAchievements = await getUserAchievements(userId);
    const achievedIds = new Set(userAchievements.map(ua => ua.id));

    for (const achievement of achievements) {
      if (achievedIds.has(achievement.id)) continue;

      // 콘텐츠 업적 조건 확인
      if (shouldAwardContentAchievement(achievement, contentType, count)) {
        // 업적 지급
        const newAchievement = await awardAchievement(userId, achievement);
        if (newAchievement) {
          newAchievements.push(newAchievement);
        }
      }
    }

  } catch (error) {
    console.error('콘텐츠 업적 확인 오류:', error);
  }

  return newAchievements;
}

export async function checkSocialAchievements(userId: string, socialType: string, count: number): Promise<UserAchievement[]> {
  const newAchievements: UserAchievement[] = [];

  try {
    // 소셜 관련 업적 확인
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('category', 'social')
      .eq('requirement_type', 'custom');

    if (!achievements) return newAchievements;

    // 사용자의 현재 업적 확인
    const userAchievements = await getUserAchievements(userId);
    const achievedIds = new Set(userAchievements.map(ua => ua.id));

    for (const achievement of achievements) {
      if (achievedIds.has(achievement.id)) continue;

      // 소셜 업적 조건 확인
      if (shouldAwardSocialAchievement(achievement, socialType, count)) {
        // 업적 지급
        const newAchievement = await awardAchievement(userId, achievement);
        if (newAchievement) {
          newAchievements.push(newAchievement);
        }
      }
    }

  } catch (error) {
    console.error('소셜 업적 확인 오류:', error);
  }

  return newAchievements;
}

async function awardAchievement(userId: string, achievement: Achievement): Promise<UserAchievement | null> {
  try {
    // 업적 지급
    const { data: userAchievement, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievement.id,
      })
      .select()
      .single();

    if (error) throw error;

    // 포인트 지급
    await addUserPoints(userId, achievement.points_reward, 'achievement', `업적 달성: ${achievement.name}`);

    return {
      ...achievement,
      achieved_at: userAchievement.achieved_at,
      is_new: true,
    };

  } catch (error) {
    console.error('업적 지급 오류:', error);
    return null;
  }
}

async function getUserStats(userId: string) {
  // 사용자 통계 가져오기 (출석, 콘텐츠, 소셜 등)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const { data: userPoints } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    attendanceStreak: attendance?.streak_count || 0,
    totalAttendance: attendance?.total_attendance || 0,
    currentLevel: userPoints?.current_level || 1,
    totalPoints: userPoints?.total_points || 0,
  };
}

function getCustomProgress(achievement: Achievement, userStats: any): number {
  // 커스텀 업적의 진행도 계산
  switch (achievement.name) {
    case '첫 글쓰기':
      return 0; // 별도로 처리
    case '10개 글':
      return 0; // 별도로 처리
    case '50개 글':
      return 0; // 별도로 처리
    case '100개 글':
      return 0; // 별도로 처리
    case '첫 좋아요':
      return 0; // 별도로 처리
    case '10개 좋아요':
      return 0; // 별도로 처리
    case '100개 좋아요':
      return 0; // 별도로 처리
    default:
      return 0;
  }
}

function shouldAwardContentAchievement(achievement: Achievement, contentType: string, count: number): boolean {
  // 콘텐츠 업적 조건 확인
  if (achievement.category !== 'content') return false;

  switch (achievement.name) {
    case '첫 글쓰기':
      return count >= 1;
    case '10개 글':
      return count >= 10;
    case '50개 글':
      return count >= 50;
    case '100개 글':
      return count >= 100;
    default:
      return false;
  }
}

function shouldAwardSocialAchievement(achievement: Achievement, socialType: string, count: number): boolean {
  // 소셜 업적 조건 확인
  if (achievement.category !== 'social') return false;

  switch (achievement.name) {
    case '첫 좋아요':
      return count >= 1;
    case '10개 좋아요':
      return count >= 10;
    case '100개 좋아요':
      return count >= 100;
    default:
      return false;
  }
}

async function addUserPoints(
  userId: string, 
  points: number, 
  type: string, 
  description: string
): Promise<void> {
  try {
    // 사용자 포인트 정보 가져오기 또는 생성
    const { data: existingPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingPoints) {
      // 기존 포인트 업데이트
      await supabase
        .from('user_points')
        .update({ 
          total_points: existingPoints.total_points + points,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // 새 포인트 레코드 생성
      await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: points,
          current_level: 1,
        });
    }

    // 포인트 내역 기록
    await supabase
      .from('point_transactions')
      .insert({
        user_id: userId,
        points: points,
        type: type,
        description: description,
      });

  } catch (error) {
    console.error('포인트 추가 오류:', error);
  }
}