'use client';

import { useState, useEffect } from 'react';
import { getUserPoints, getPointTransactions, getLevelProgress, formatPoints, getPointTypeIcon, getPointTypeName } from '@/lib/game/points';
import { Database } from '@/types/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Coins, TrendingUp, Award, Clock } from 'lucide-react';

const supabase = createClientComponentClient<Database>();

export function PointsDashboard() {
  const [userPoints, setUserPoints] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [levelProgress, setLevelProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPointsData();
  }, []);

  const loadPointsData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [pointsData, transactionsData, levelData] = await Promise.all([
          getUserPoints(user.id),
          getPointTransactions(user.id, 10),
          getLevelProgress(0), // 임시로 0 전달, 실제 포인트로 교체 필요
        ]);

        setUserPoints(pointsData);
        setTransactions(transactionsData);
        
        if (pointsData) {
          const progress = getLevelProgress(pointsData.total_points);
          setLevelProgress(progress);
        }
      }
    } catch (error) {
      console.error('포인트 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userPoints || !levelProgress) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="text-center py-8">
          <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">포인트 시스템</h3>
          <p className="text-gray-500">활동을 시작하고 포인트를 모아보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 레벨 정보 카드 */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            레벨 정보
          </h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">
              {levelProgress.currentLevel.icon} Lv.{levelProgress.currentLevel.level}
            </div>
            <div className="text-sm text-gray-600">{levelProgress.currentLevel.title}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">현재 포인트</span>
            <span className="font-semibold text-gray-900">
              {formatPoints(userPoints.total_points)}P
            </span>
          </div>

          {levelProgress.nextLevel && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress.progress}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatPoints(levelProgress.currentPoints)}P</span>
                <span>{formatPoints(levelProgress.requiredPoints)}P</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">다음 레벨</span>
                <span className="font-semibold text-gray-900">
                  {levelProgress.nextLevel.icon} {levelProgress.nextLevel.title}
                </span>
              </div>
            </>
          )}

          {levelProgress.nextLevel && (
            <div className="bg-white rounded-lg p-3 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  다음 레벨까지 {formatPoints(levelProgress.requiredPoints - levelProgress.currentPoints)}P 남음
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {levelProgress.nextLevel.icon} {levelProgress.nextLevel.title} 달성 중
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 포인트 내역 */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            최근 포인트 내역
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatPoints(userPoints.total_points)}P
            </div>
            <div className="text-sm text-gray-600">총 포인트</div>
          </div>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-4">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">최근 포인트 내역이 없습니다.</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">
                    {getPointTypeIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getPointTypeName(transaction.type)} • {new Date(transaction.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
                <div className={`font-bold ${
                  transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.points > 0 ? '+' : ''}{transaction.points}P
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}