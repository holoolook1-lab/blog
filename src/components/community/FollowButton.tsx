'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { UserPlus, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function FollowButton({
  targetUserId,
  targetUsername,
  className = '',
  variant = 'primary',
  size = 'md',
  showIcon = true
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 팔로우 상태 확인
  useEffect(() => {
    checkFollowStatus();
  }, [targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/users/${targetUserId}/follow/status`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error('팔로우 상태 확인 실패:', error);
    }
  };

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setIsFollowing(true);
        toast({
          title: '팔로우 완료',
          description: `${targetUsername}님을 팔로우했습니다.`,
        });
      } else {
        toast({
          title: '팔로우 실패',
          description: data.error || '팔로우에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('팔로우 실패:', error);
      toast({
        title: '팔로우 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${targetUserId}/follow/status`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setIsFollowing(false);
        toast({
          title: '언팔로우 완료',
          description: `${targetUsername}님을 언팔로우했습니다.`,
        });
      } else {
        toast({
          title: '언팔로우 실패',
          description: data.error || '언팔로우에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('언팔로우 실패:', error);
      toast({
        title: '언팔로우 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFollowing) {
    return (
      <Button
        onClick={handleUnfollow}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={className}
      >
        {showIcon && <UserMinus className="mr-2 h-4 w-4" />}
        {isLoading ? '처리 중...' : '팔로잉'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {showIcon && <UserPlus className="mr-2 h-4 w-4" />}
      {isLoading ? '처리 중...' : '팔로우'}
    </Button>
  );
}