"use client";
import { useState, useEffect } from 'react';
import { Plus, Check, UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  targetUserName?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function FollowButton({ 
  targetUserId, 
  targetUserName,
  size = 'md',
  showIcon = true,
  className = ''
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base'
  };

  // 팔로우 상태 확인
  useEffect(() => {
    checkFollowStatus();
  }, [targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const res = await fetch(`/api/follows/status?targetUserId=${targetUserId}`);
      const data = await res.json();
      
      if (res.ok) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (error) {
      console.warn('팔로우 상태 확인 오류:', error);
    }
  };

  const handleFollow = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const url = isFollowing 
        ? `/api/follows?targetUserId=${targetUserId}`
        : '/api/follows';
      
      const body = isFollowing ? undefined : JSON.stringify({ targetUserId });
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      } else {
        alert(data.error || '팔로우 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('팔로우 처리 오류:', error);
      alert('팔로우 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const buttonText = isFollowing 
    ? (targetUserName ? `${targetUserName} 팔로잉` : '팔로잉')
    : (targetUserName ? `${targetUserName} 팔로우` : '팔로우');

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        ${isFollowing 
          ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        rounded-lg font-medium transition-colors duration-200
        flex items-center gap-2
        ${className}
      `}
    >
      {showIcon && (
        isFollowing ? (
          loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )
        ) : (
          loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )
        )
      )}
      {buttonText}
      {followersCount > 0 && (
        <span className="text-xs opacity-75">
          {followersCount.toLocaleString()}
        </span>
      )}
    </button>
  );
}