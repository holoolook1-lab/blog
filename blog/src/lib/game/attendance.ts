import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  streak_count: number;
  total_attendance: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStats {
  currentStreak: number;
  totalAttendance: number;
  lastAttendanceDate: string | null;
  isTodayChecked: boolean;
  canCheckIn: boolean;
}

export async function checkAttendance(): Promise<{
  success: boolean;
  data?: {
    attendance: AttendanceRecord;
    stats: AttendanceStats;
    pointsEarned: number;
    newAchievements: any[];
  };
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const today = new Date().toISOString().split('T')[0];
    const koreaToday = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 오늘 이미 출석했는지 확인
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', koreaToday)
      .single();

    if (existingAttendance) {
      return { 
        success: false, 
        error: '오늘은 이미 출석하셨습니다.' 
      };
    }

    // 어제 출석 정보 가져오기 (연속 출석 계산용)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: yesterdayAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', yesterday)
      .single();

    // 사용자의 전체 출석 통계 가져오기
    const { data: userStats } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    let streakCount = 1;
    let totalAttendance = 1;

    if (yesterdayAttendance) {
      streakCount = yesterdayAttendance.streak_count + 1;
    }

    if (userStats && userStats.length > 0) {
      totalAttendance = userStats.length + 1;
    }

    // 새 출석 기록 생성
    const { data: newAttendance, error: insertError } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        date: koreaToday,
        streak_count: streakCount,
        total_attendance: totalAttendance,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 포인트 지급 (기본 출석 포인트 + 연속 출석 보너스)
    let pointsEarned = 10; // 기본 출석 포인트
    if (streakCount >= 7) pointsEarned += 20; // 7일 연속 보너스
    if (streakCount >= 30) pointsEarned += 50; // 30일 연속 보너스
    if (streakCount >= 100) pointsEarned += 100; // 100일 연속 보너스

    // 포인트 추가
    await addUserPoints(user.id, pointsEarned, 'attendance', '출석 체크');

    // 업적 확인 및 지급
    const newAchievements = await checkAndAwardAchievements(user.id, {
      attendanceStreak: streakCount,
      totalAttendance: totalAttendance,
    });

    // 통계 계산
    const stats: AttendanceStats = {
      currentStreak: streakCount,
      totalAttendance: totalAttendance,
      lastAttendanceDate: koreaToday,
      isTodayChecked: true,
      canCheckIn: false,
    };

    return {
      success: true,
      data: {
        attendance: newAttendance,
        stats,
        pointsEarned,
        newAchievements,
      },
    };

  } catch (error) {
    console.error('출석 체크 오류:', error);
    return { 
      success: false, 
      error: '출석 체크 중 오류가 발생했습니다.' 
    };
  }
}

export async function getAttendanceStats(userId: string): Promise<AttendanceStats> {
  try {
    const koreaToday = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // 오늘 출석 확인
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', koreaToday)
      .single();

    // 최근 출석 기록 가져오기
    const { data: recentAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // 전체 출석 수
    const { count: totalAttendance } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    let currentStreak = 0;
    if (recentAttendance) {
      // 연속 출석 계산
      const lastDate = new Date(recentAttendance.date);
      const today = new Date(koreaToday);
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        currentStreak = recentAttendance.streak_count;
      }
    }

    return {
      currentStreak: currentStreak || 0,
      totalAttendance: totalAttendance || 0,
      lastAttendanceDate: recentAttendance?.date || null,
      isTodayChecked: !!todayAttendance,
      canCheckIn: !todayAttendance,
    };

  } catch (error) {
    console.error('출석 통계 조회 오류:', error);
    return {
      currentStreak: 0,
      totalAttendance: 0,
      lastAttendanceDate: null,
      isTodayChecked: false,
      canCheckIn: true,
    };
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

async function checkAndAwardAchievements(
  userId: string, 
  stats: { attendanceStreak: number; totalAttendance: number }
): Promise<any[]> {
  const newAchievements: any[] = [];

  try {
    // 모든 업적 가져오기
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*');

    if (!achievements) return newAchievements;

    // 사용자의 현재 업적 확인
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const achievedIds = userAchievements?.map(ua => ua.achievement_id) || [];

    // 새로운 업적 확인
    for (const achievement of achievements) {
      if (achievedIds.includes(achievement.id)) continue;

      let shouldAward = false;

      switch (achievement.requirement_type) {
        case 'streak':
          if (stats.attendanceStreak >= achievement.requirement_value) {
            shouldAward = true;
          }
          break;
        case 'total':
          if (stats.totalAttendance >= achievement.requirement_value) {
            shouldAward = true;
          }
          break;
      }

      if (shouldAward) {
        // 업적 지급
        const { data: newAchievement } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
          })
          .select()
          .single();

        if (newAchievement) {
          // 업적 포인트 지급
          await addUserPoints(
            userId, 
            achievement.points_reward, 
            'achievement', 
            `업적 달성: ${achievement.name}`
          );

          newAchievements.push({
            ...achievement,
            achieved_at: newAchievement.achieved_at,
          });
        }
      }
    }

  } catch (error) {
    console.error('업적 확인 오류:', error);
  }

  return newAchievements;
}