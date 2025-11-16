"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import FollowButton from './FollowButton';

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface FollowListProps {
  userId: string;
  currentUserId?: string | null;
  type: 'followers' | 'following';
}

export default function FollowList({ userId, currentUserId, type }: FollowListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [userId, type]);

  const loadUsers = async () => {
    try {
      const res = await fetch(`/api/follows?userId=${userId}&type=${type}`);
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data.users || []);
        setCount(data.count || 0);
      }
    } catch (error) {
      console.warn('팔로우 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {type === 'followers' ? '팔로워가 없습니다.' : '팔로우하는 사용자가 없습니다.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <Link href={`/user/${user.id}`} className="flex-shrink-0">
            {user.avatar_url ? (
              <Image
                src={getOptimizedImageUrl(user.avatar_url, { width: 48 })}
                alt={user.username || '사용자'}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link href={`/user/${user.id}`} className="block">
              <p className="font-medium text-gray-900 truncate">
                {user.username || '익명 사용자'}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString('ko-KR')}
              </p>
            </Link>
          </div>
          
          {currentUserId && currentUserId !== user.id && (
            <FollowButton
              targetUserId={user.id}
              size="sm"
              showIcon={false}
            />
          )}
        </div>
      ))}
    </div>
  );
}