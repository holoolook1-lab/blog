'use client';

import { useState } from 'react';
import { AttendanceCheck } from '@/components/game/AttendanceCheck';
import { AchievementList } from '@/components/game/AchievementList';
import { PointsDashboard } from '@/components/game/PointsDashboard';
import { User, Award, Calendar, Coins } from 'lucide-react';

export function GameSystemDashboard() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'achievements' | 'points'>('attendance');

  const tabs = [
    {
      id: 'attendance',
      name: '출석 체크',
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      id: 'achievements',
      name: '업적 시스템',
      icon: Award,
      color: 'text-purple-600',
    },
    {
      id: 'points',
      name: '포인트 & 레벨',
      icon: Coins,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">게임화 시스템</h2>
            <p className="text-gray-600">출석, 업적, 포인트로 즐거운 커뮤니티 생활을 즐겨보세요!</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <AttendanceCheck />
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                출석 보상 시스템
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📅</div>
                    <div className="font-semibold text-gray-900">기본 출석</div>
                    <div className="text-sm text-gray-600 mt-1">10포인트</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔥</div>
                    <div className="font-semibold text-gray-900">7일 연속</div>
                    <div className="text-sm text-gray-600 mt-1">30포인트</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-center">
                    <div className="text-2xl mb-2">💎</div>
                    <div className="font-semibold text-gray-900">30일 연속</div>
                    <div className="text-sm text-gray-600 mt-1">80포인트</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <AchievementList />
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                업적 카테고리
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl">📅</div>
                  <div>
                    <div className="font-semibold text-gray-900">출석 업적</div>
                    <div className="text-sm text-gray-600">매일 출석으로 달성</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl">✍️</div>
                  <div>
                    <div className="font-semibold text-gray-900">콘텐츠 업적</div>
                    <div className="text-sm text-gray-600">글 작성으로 달성</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <div className="text-2xl">❤️</div>
                  <div>
                    <div className="font-semibold text-gray-900">소셜 업적</div>
                    <div className="text-sm text-gray-600">좋아요로 달성</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl">⭐</div>
                  <div>
                    <div className="font-semibold text-gray-900">특별 업적</div>
                    <div className="text-sm text-gray-600">특별한 조건으로 달성</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'points' && (
          <div className="space-y-6">
            <PointsDashboard />
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Coins className="w-6 h-6 text-green-600" />
                포인트로 할 수 있는 것들
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl">🎨</div>
                  <div>
                    <div className="font-semibold text-gray-900">프로필 꾸미기</div>
                    <div className="text-sm text-gray-600">특별한 프로필 테마 구매</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <div className="font-semibold text-gray-900">특별 보상</div>
                    <div className="text-sm text-gray-600">포인트로 특별 아이템 구매</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                  <div className="text-2xl">🏆</div>
                  <div>
                    <div className="font-semibold text-gray-900">랭킹 시스템</div>
                    <div className="text-sm text-gray-600">포인트로 순위 경쟁</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                  <div className="text-2xl">🚀</div>
                  <div>
                    <div className="font-semibold text-gray-900">부스트 기능</div>
                    <div className="text-sm text-gray-600">콘텐츠 노출 증가</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}