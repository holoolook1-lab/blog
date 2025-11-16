'use client';

import { useState, useEffect } from 'react';
import { getUserAchievements, getAchievementProgress, type AchievementProgress, type UserAchievement } from '@/lib/game/achievements';
import { Trophy, Star, Calendar, Edit3, Heart, Target, Award, Crown, Gem, Medal } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

const categoryIcons = {
  attendance: Calendar,
  content: Edit3,
  social: Heart,
  special: Star,
};

const categoryColors = {
  attendance: 'bg-blue-100 text-blue-800 border-blue-200',
  content: 'bg-green-100 text-green-800 border-green-200',
  social: 'bg-pink-100 text-pink-800 border-pink-200',
  special: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function AchievementList() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achieved' | 'progress'>('achieved');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [userAchievements, achievementProgress] = await Promise.all([
          getUserAchievements(user.id),
          getAchievementProgress(user.id),
        ]);
        
        setAchievements(userAchievements);
        setProgress(achievementProgress);
      }
    } catch (error) {
      console.error('업적 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          내 업적
        </h3>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('achieved')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'achieved'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            달성 업적 ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'progress'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            진행 중 ({progress.filter(p => !p.isCompleted).length})
          </button>
        </div>
      </div>

      {activeTab === 'achieved' ? (
        <div className="space-y-4">
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">아직 달성한 업적이 없습니다.</p>
              <p className="text-gray-400 text-sm mt-2">활동을 시작하고 업적을 달성해보세요!</p>
            </div>
          ) : (
            achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">{achievement.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full border ${categoryColors[achievement.category]}`}>
                        {getCategoryName(achievement.category)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{achievement.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {achievement.points_reward} 포인트
                      </span>
                      <span>달성일: {formatDate(achievement.achieved_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {progress.filter(p => !p.isCompleted).length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">진행 중인 업적이 없습니다.</p>
              <p className="text-gray-400 text-sm mt-2">새로운 업적을 달성해보세요!</p>
            </div>
          ) : (
            progress.filter(p => !p.isCompleted).map((progressItem) => (
              <div
                key={progressItem.achievement.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl opacity-50">{progressItem.achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-700">{progressItem.achievement.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full border ${categoryColors[progressItem.achievement.category]}`}>
                        {getCategoryName(progressItem.achievement.category)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{progressItem.achievement.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">진행도</span>
                    <span className="font-medium text-gray-900">
                      {progressItem.currentProgress} / {progressItem.targetProgress}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressItem.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {progressItem.percentage.toFixed(1)}% 완료
                    </span>
                    <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      보상: {progressItem.achievement.points_reward} 포인트
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function getCategoryName(category: string): string {
  const names = {
    attendance: '출석',
    content: '콘텐츠',
    social: '소셜',
    special: '특별',
  };
  return names[category as keyof typeof names] || category;
}