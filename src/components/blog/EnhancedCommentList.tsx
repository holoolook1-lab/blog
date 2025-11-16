"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import ActionToast from '@/components/ui/ActionToast';
import Image from 'next/image';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { ThumbsUp, ThumbsDown, MessageCircle, MoreVertical, Edit, Trash2, Reply, Send, X, Flag } from 'lucide-react';

type Comment = {
  id: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  like_count?: number;
  dislike_count?: number;
};

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type Toast = { type: 'success' | 'error'; message: string };

type ReactionType = 'like' | 'dislike' | null;

export default function EnhancedCommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>({});
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isReporting, setIsReporting] = useState(false);
  
  const MAX_LEN = 2000;
  const suppressRealtimeUntil = useRef<number>(0);
  const [lastReplySubmitAt, setLastReplySubmitAt] = useState<number>(0);
  const throttleMs = 8000;

  const showToast = (toast: Toast) => {
    setToast(toast);
    setTimeout(() => setToast(null), 2500);
  };

  // 댓글 로드 with pagination
  const load = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/list/${postId}?page=${page}&limit=${pagination.limit}`);
      const json = await res.json();
      
      if (json.error) {
        showToast({ type: 'error', message: '댓글을 불러오는데 실패했습니다' });
        return;
      }
      
      const list: Comment[] = json.comments || [];
      setComments(list);
      setPagination(json.pagination);
      
      const apiProfiles: Profile[] = json.profiles || [];
      const map: Record<string, Profile> = {};
      apiProfiles.forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
      
      // 사용자 반응 로드
      loadUserReactions(list);
    } catch (error) {
      console.warn('댓글 로드 오류:', error);
      showToast({ type: 'error', message: '댓글을 불러오는데 실패했습니다' });
    } finally {
      setLoading(false);
    }
  }, [postId, pagination.limit]);

  // 사용자 반응 로드
  const loadUserReactions = async (comments: Comment[]) => {
    if (!userId) return;
    
    try {
      const reactions = await Promise.all(
        comments.map(async (comment) => {
          const res = await fetch(`/api/comments/reactions?commentId=${comment.id}`);
          const json = await res.json();
          return { commentId: comment.id, reaction: json.userReaction };
        })
      );
      
      const reactionMap: Record<string, ReactionType> = {};
      reactions.forEach(({ commentId, reaction }) => {
        reactionMap[commentId] = reaction;
      });
      setUserReactions(reactionMap);
    } catch (error) {
      console.warn('사용자 반응 로드 오류:', error);
    }
  };

  // 반응 처리 (좋아요/싫어요)
  const handleReaction = async (commentId: string, reactionType: 'like' | 'dislike') => {
    if (!userId) {
      showToast({ type: 'error', message: '로그인이 필요합니다' });
      return;
    }
    
    try {
      const res = await fetch(`/api/comments/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, reactionType })
      });
      
      const json = await res.json();
      
      if (res.ok) {
        // 낙관적 업데이트
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            const currentReaction = userReactions[commentId];
            const newReaction = json.action === 'removed' ? null : reactionType;
            
            // 이전 반응 제거
            let newLikeCount = comment.like_count || 0;
            let newDislikeCount = comment.dislike_count || 0;
            
            if (currentReaction === 'like') newLikeCount--;
            if (currentReaction === 'dislike') newDislikeCount--;
            
            // 새 반응 추가
            if (newReaction === 'like') newLikeCount++;
            if (newReaction === 'dislike') newDislikeCount++;
            
            return {
              ...comment,
              like_count: Math.max(0, newLikeCount),
              dislike_count: Math.max(0, newDislikeCount)
            };
          }
          return comment;
        }));
        
        // 사용자 반응 상태 업데이트
        setUserReactions(prev => ({
          ...prev,
          [commentId]: json.action === 'removed' ? null : reactionType
        }));
        
      } else {
        showToast({ type: 'error', message: json.error || '반응 처리에 실패했습니다' });
      }
    } catch (error) {
      console.warn('반응 처리 오류:', error);
      showToast({ type: 'error', message: '반응 처리에 실패했습니다' });
    }
  };

  // 댓글 수정
  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setShowMenuId(null);
  };

  const submitEdit = async (id: string) => {
    if (!editContent.trim()) {
      showToast({ type: 'error', message: '댓글 내용을 입력해주세요' });
      return;
    }
    
    // 낙관적 업데이트
    setComments(prev => prev.map(c => c.id === id ? { ...c, content: editContent } : c));
    
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      
      if (res.ok) {
        setEditingId(null);
        setEditContent('');
        showToast({ type: 'success', message: '댓글이 수정되었습니다' });
      } else {
        // 실패 시 재로드
        await load(pagination.page);
        showToast({ type: 'error', message: '댓글 수정에 실패했습니다' });
      }
    } catch (error) {
      await load(pagination.page);
      showToast({ type: 'error', message: '댓글 수정에 실패했습니다' });
    }
  };

  // 댓글 신고
  const handleReport = async (commentId: string) => {
    if (!userId) {
      showToast({ type: 'error', message: '로그인이 필요합니다' });
      return;
    }
    
    if (!reportReason) {
      showToast({ type: 'error', message: '신고 사유를 선택해주세요' });
      return;
    }
    
    setIsReporting(true);
    
    try {
      const res = await fetch(`/api/comments/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          commentId: showReportModal,
          reason: reportReason,
          description: reportDescription.trim() || null
        })
      });
      
      const json = await res.json();
      
      if (res.ok) {
        showToast({ type: 'success', message: '댓글이 신고되었습니다. 검토 후 조치하겠습니다.' });
        setShowReportModal(null);
        setReportReason('');
        setReportDescription('');
      } else {
        showToast({ type: 'error', message: json.error || '신고 처리에 실패했습니다' });
      }
    } catch (error) {
      showToast({ type: 'error', message: '신고 처리에 실패했습니다' });
    } finally {
      setIsReporting(false);
    }
  };

  // 댓글 삭제
  const remove = async (id: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
    
    // 낙관적 삭제
    const oldComments = comments;
    setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
    setShowMenuId(null);
    
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setComments(oldComments);
        showToast({ type: 'error', message: '댓글 삭제에 실패했습니다' });
      } else {
        showToast({ type: 'success', message: '댓글이 삭제되었습니다' });
      }
    } catch (error) {
      setComments(oldComments);
      showToast({ type: 'error', message: '댓글 삭제에 실패했습니다' });
    }
  };

  // 답글 작성
  const submitReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      showToast({ type: 'error', message: '답글 내용을 입력해주세요' });
      return;
    }
    
    const now = Date.now();
    if (now - lastReplySubmitAt < throttleMs) {
      showToast({ type: 'error', message: '너무 빠르게 답글을 작성하고 있습니다. 잠시 후 다시 시도해주세요.' });
      return;
    }
    
    setLastReplySubmitAt(now);
    suppressRealtimeUntil.current = now + 1200;
    
    try {
      const res = await fetch(`/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          parent_id: parentId,
          content: replyContent
        })
      });
      
      if (res.ok) {
        setReplyContent('');
        setReplyToId(null);
        await load(pagination.page);
        showToast({ type: 'success', message: '답글이 작성되었습니다' });
      } else {
        const json = await res.json();
        showToast({ type: 'error', message: json.error || '답글 작성에 실패했습니다' });
      }
    } catch (error) {
      showToast({ type: 'error', message: '답글 작성에 실패했습니다' });
    }
  };

  // 초기화
  useEffect(() => {
    load(1);
    supabase.auth.getUser().then(({ data }: any) => setUserId(data.user?.id || null));
  }, []);

  // 실시간 구독
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${postId}`)
      .on('postgres_changes', { 
        event: 'insert', 
        schema: 'public', 
        table: 'comments', 
        filter: `post_id=eq.${postId}` 
      }, (payload: any) => {
        if (Date.now() < suppressRealtimeUntil.current) return;
        const row = payload?.new as Comment;
        if (!row) return;
        
        // 중복 방지
        setComments(prev => {
          const exists = prev.some(c => c.id === row.id);
          if (exists) return prev;
          return [row, ...prev];
        });
        
        // 프로필 정보 로드
        const uid = row.user_id;
        if (uid && !profiles[uid]) {
          supabase.from('profiles')
            .select('id, username, avatar_url')
            .eq('id', uid)
            .maybeSingle()
            .then((res: any) => {
              const data = res?.data;
              if (data) setProfiles(p => ({ ...p, [data.id]: data }));
            });
        }
      })
      .on('postgres_changes', { 
        event: 'update', 
        schema: 'public', 
        table: 'comments', 
        filter: `post_id=eq.${postId}` 
      }, (payload: any) => {
        if (Date.now() < suppressRealtimeUntil.current) return;
        const row = payload?.new as Comment;
        if (!row) return;
        setComments(prev => prev.map(c => c.id === row.id ? row : c));
      })
      .on('postgres_changes', { 
        event: 'delete', 
        schema: 'public', 
        table: 'comments', 
        filter: `post_id=eq.${postId}` 
      }, (payload: any) => {
        if (Date.now() < suppressRealtimeUntil.current) return;
        const oldRow = payload?.old as Comment;
        const delId = oldRow?.id;
        if (!delId) return;
        setComments(prev => prev.filter(c => c.id !== delId && c.parent_id !== delId));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  // 렌더링
  const renderComment = (comment: Comment, depth: number = 0) => {
    const profile = profiles[comment.user_id];
    const isOwner = userId === comment.user_id;
    const isEditing = editingId === comment.id;
    const isReplying = replyToId === comment.id;
    const userReaction = userReactions[comment.id];
    
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mb-4'} border-l-2 ${depth > 0 ? 'border-gray-200' : 'border-transparent'} pl-4`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {profile?.avatar_url ? (
              <Image 
                src={getOptimizedImageUrl(profile.avatar_url)} 
                alt={profile.username || '사용자'} 
                width={40} 
                height={40} 
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">
                  {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">
                {profile?.username || '익명 사용자'}
              </span>
              <span className="text-gray-500 text-sm">
                {new Date(comment.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={MAX_LEN}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitEdit(comment.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-800 whitespace-pre-wrap break-words">{comment.content}</p>
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReaction(comment.id, 'like')}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors ${
                        userReaction === 'like' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{comment.like_count || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => handleReaction(comment.id, 'dislike')}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors ${
                        userReaction === 'dislike' 
                          ? 'bg-red-100 text-red-700 border border-red-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{comment.dislike_count || 0}</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setReplyToId(isReplying ? null : comment.id)}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                    <span>답글</span>
                  </button>
                  
                  {!isOwner && (
                    <button
                      onClick={() => setShowReportModal(comment.id)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      <span>신고</span>
                    </button>
                  )}
                </div>
                
                {isReplying && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="답글을 작성해주세요..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      maxLength={MAX_LEN}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitReply(comment.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        답글 작성
                      </button>
                      <button
                        onClick={() => {
                          setReplyToId(null);
                          setReplyContent('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {isOwner && !isEditing && (
            <div className="relative">
              <button
                onClick={() => setShowMenuId(showMenuId === comment.id ? null : comment.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenuId === comment.id && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => startEdit(comment)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    수정
                  </button>
                  <button
                    onClick={() => remove(comment.id)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 대댓글 렌더링 */}
        {comments.filter(c => c.parent_id === comment.id).map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  // 페이지네이션 컨트롤
  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => load(pagination.page - 1)}
          disabled={!pagination.hasPrev}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          이전
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum;
            if (pagination.totalPages <= 5) {
              pageNum = i + 1;
            } else if (pagination.page <= 3) {
              pageNum = i + 1;
            } else if (pagination.page >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i;
            } else {
              pageNum = pagination.page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => load(pageNum)}
                className={`px-3 py-2 text-sm rounded-md ${
                  pageNum === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => load(pagination.page + 1)}
          disabled={!pagination.hasNext}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          댓글 ({pagination.totalCount})
        </h3>
      </div>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">댓글을 불러오는 중...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</div>
      ) : (
        <div className="space-y-4">
          {/* 최상위 댓글만 렌더링 (parent_id가 null인 것들) */}
          {comments.filter(c => !c.parent_id).map(comment => renderComment(comment))}
        </div>
      )}

      {/* 페이지네이션 */}
      <PaginationControls />

      {/* 토스트 메시지 */}
      {toast && <ActionToast toast={toast} onClose={() => setToast(null)} />}

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">댓글 신고</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  신고 사유 *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">선택해주세요</option>
                  <option value="spam">스팸/홍보</option>
                  <option value="harassment">괴롭힘/욕설</option>
                  <option value="hate_speech">혐오발언</option>
                  <option value="misinformation">허위정보</option>
                  <option value="other">기타</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 설명 (선택사항)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="신고 이유를 자세히 설명해주세요..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reportDescription.length}/500자
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleReport(showReportModal)}
                disabled={!reportReason || isReporting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReporting ? '신고 중...' : '신고하기'}
              </button>
              <button
                onClick={() => {
                  setShowReportModal(null);
                  setReportReason('');
                  setReportDescription('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}