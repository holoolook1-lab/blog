'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';
import { FollowButton } from './FollowButton';
import { Users, User, X } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface FollowListItem {
  id: string;
  created_at: string;
  follower?: UserProfile;
  following?: UserProfile;
}

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  type: 'followers' | 'following';
}

export function FollowListModal({ isOpen, onClose, userId, username, type }: FollowListModalProps) {
  const [users, setUsers] = useState<FollowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = async (pageNum: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/users/${userId}/follows?type=${type}&page=${pageNum}&limit=20`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (pageNum === 1) {
          setUsers(data.data);
        } else {
          setUsers(prev => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.hasNext);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('팔로우/팔로워 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers(1);
    }
  }, [isOpen, type]);

  const handleLoadMore = () => {
    fetchUsers(page + 1);
  };

  const getUserProfile = (item: FollowListItem): UserProfile => {
    return type === 'followers' ? item.follower! : item.following!;
  };

  const title = type === 'followers' 
    ? `${username}님을 팔로우하는 사람` 
    : `${username}님이 팔로우하는 사람`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading && page === 1 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{type === 'followers' ? '팔로워가 없습니다.' : '팔로우하는 사람이 없습니다.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((item) => {
                const profile = getUserProfile(item);
                const fallback = profile.username?.charAt(0).toUpperCase() || 'U';
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Link 
                      href={`/profile/${profile.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{fallback}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{profile.username}</p>
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground truncate">{profile.bio}</p>
                        )}
                      </div>
                    </Link>
                    
                    <FollowButton
                      targetUserId={profile.id}
                      targetUsername={profile.username}
                      variant="outline"
                      size="sm"
                      showIcon={false}
                    />
                  </div>
                );
              })}
              
              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {isLoading ? '불러오는 중...' : '더 보기'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}