'use client';

import { useState, useEffect } from 'react';
import { checkAttendance, getAttendanceStats, type AttendanceStats } from '@/lib/game/attendance';
import { Calendar, Trophy, Flame, Target } from 'lucide-react';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

export function AttendanceCheck() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userStats = await getAttendanceStats(user.id);
        setStats(userStats);
      }
    } catch (error) {
      console.error('출석 통계 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!stats?.canCheckIn) return;

    try {
      setCheckingIn(true);
      const result = await checkAttendance();

      if (result.success && result.data) {
        setStats(result.data.stats);
        
        // 성공 메시지 표시
        toast.success(
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold">출석 체크 완료!</p>
              <p className="text-sm text-gray-600">
                {result.data.pointsEarned}포인트 획득
                {result.data.newAchievements.length > 0 && (
                  <span className="ml-1 text-purple-600">
                    + {result.data.newAchievements.length}개 업적
                  </span>
                )}
              </p>
            </div>
          </div>
        );

        // 새 업적이 있다면 별도로 표시
        if (result.data.newAchievements.length > 0) {
          result.data.newAchievements.forEach(achievement => {
            toast.success(
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-semibold">업적 달성!</p>
                  <p className="text-sm text-gray-600">
                    {achievement.icon} {achievement.name}
                  </p>
                </div>
              </div>,
              { duration: 5000 }
            );
          });
        }
      } else {
        toast.error(result.error || '출석 체크에 실패했습니다.');
      }
    } catch (error) {
      console.error('출석 체크 오류:', error);
      toast.error('출석 체크 중 오류가 발생했습니다.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          출석 체크
        </h3>
        {stats.isTodayChecked && (
          <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
            ✓ 오늘 출석 완료
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.currentStreak}</div>
          <div className="text-sm text-gray-600">연속 출석</div>
        </div>

        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalAttendance}</div>
          <div className="text-sm text-gray-600">총 출석</div>
        </div>
      </div>

      {stats.canCheckIn ? (
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
        >
          {checkingIn ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              출석 중...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              오늘 출석하기
            </div>
          )}
        </button>
      ) : (
        <div className="w-full bg-gray-100 text-gray-500 font-semibold py-3 px-6 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" />
            내일 다시 출석 가능
          </div>
        </div>
      )}

      {stats.lastAttendanceDate && (
        <p className="text-center text-sm text-gray-600 mt-3">
          마지막 출석: {new Date(stats.lastAttendanceDate).toLocaleDateString('ko-KR')}
        </p>
      )}
    </div>
  );
}