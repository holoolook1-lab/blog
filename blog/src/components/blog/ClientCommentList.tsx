"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import ActionToast from '@/components/ui/ActionToast';
type Toast = { type: 'success' | 'error'; message: string };
import Image from 'next/image';
import { getOptimizedImageUrl } from '@/lib/utils/image';

type Comment = {
  id: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

// Toast 타입은 ActionToast에서 가져와 통일합니다.

export default function ClientCommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const MAX_LEN = 2000;

  const showToast = (toast: Toast) => {
    setToast(toast);
    setTimeout(() => setToast(null), 2500);
  };
  // 실시간 이벤트와 수동 로딩의 중복을 줄이기 위한 억제 타이머
  const [suppressRealtimeUntil, setSuppressRealtimeUntil] = useState<number>(0);
  const [lastReplySubmitAt, setLastReplySubmitAt] = useState<number>(0);
  const throttleMs = 8000;

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/comments/list/${postId}`);
    const json = await res.json();
    const list: Comment[] = json.comments || [];
    setComments(list);
    // fetch profiles for unique user ids
    const ids = Array.from(new Set(list.map((c) => c.user_id))).filter(Boolean);
    if (ids.length) {
      const { data } = await supabase.from('profiles').select('id, username, avatar_url').in('id', ids);
      const map: Record<string, Profile> = {};
      (data || []).forEach((p) => { map[p.id] = p as Profile; });
      setProfiles(map);
    } else {
      setProfiles({});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, [postId]);

  // Supabase Realtime: comments 테이블 실시간 반영
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          // 최근에 수동 로딩을 트리거했다면 잠시 억제하여 중복 로딩 방지
          if (Date.now() < suppressRealtimeUntil) return;
          load();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditContent(c.content);
  };

  const submitEdit = async (id: string) => {
    // optimistic update
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, content: editContent } : c)));
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    setEditingId(null);
    setEditContent('');
    if (!res.ok) {
      // revert by reloading
      await load();
      setSuppressRealtimeUntil(Date.now() + 800);
      showToast({ type: 'error', message: '댓글 수정에 실패했습니다' });
    } else {
      showToast({ type: 'success', message: '댓글이 수정되었습니다' });
    }
  };

  const remove = async (id: string) => {
    // optimistic remove
    const old = comments;
    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setComments(old);
      showToast({ type: 'error', message: '댓글 삭제에 실패했습니다' });
    } else {
      showToast({ type: 'success', message: '댓글이 삭제되었습니다' });
    }
  };

  const submitReply = async (parentId: string) => {
    if (!userId) {
      showToast({ type: 'error', message: '로그인 후 답글을 작성할 수 있습니다.' });
      return;
    }
    if (!replyContent.trim()) return;
    if (Date.now() - lastReplySubmitAt < throttleMs) {
      showToast({ type: 'error', message: '너무 빠르게 반복 제출하고 있어요. 잠시 후 다시 시도하세요' });
      return;
    }
    setLastReplySubmitAt(Date.now());
    const tempId = `temp-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      user_id: userId || 'me',
      post_id: postId,
      parent_id: parentId,
      content: replyContent,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);
    setReplyContent('');
    setReplyToId(null);
    const res = await fetch(`/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, parent_id: parentId, content: optimistic.content }),
    });
    if (!res.ok) {
      // rollback
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      const { error } = await res.json();
      const message = error === 'profanity' ? '답글에 부적절한 단어가 포함되어 있습니다.' : '답글 등록에 실패했습니다.';
      showToast({ type: 'error', message });
      return;
    }
    // 서버 반영은 실시간 이벤트로 재조회하고, 즉시 중복 로딩 억제
    setSuppressRealtimeUntil(Date.now() + 800);
    showToast({ type: 'success', message: '답글이 등록되었습니다' });
  };

  const roots = comments.filter((c) => !c.parent_id);
  const children = comments.filter((c) => c.parent_id);
  const byParent = new Map<string, Comment[]>();
  children.forEach((c) => {
    const arr = byParent.get(c.parent_id!) || [];
    arr.push(c);
    byParent.set(c.parent_id!, arr);
  });

  return (
    <>
      {toast && <ActionToast toast={toast} onClose={() => setToast(null)} />}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
          댓글을 불러오는 중...
        </div>
      )}
      <ul className="space-y-3">
        {roots.map((c) => (
        <li key={c.id} className="border rounded p-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            {profiles[c.user_id]?.avatar_url ? (
              (() => {
                const url = profiles[c.user_id]!.avatar_url!;
                let isSupabasePublic = false;
                try {
                  const u = new URL(url);
                  isSupabasePublic = /\/storage\/v1\/object\/public\//.test(u.pathname);
                } catch {}
                return isSupabasePublic ? (
                  <Image
                    src={getOptimizedImageUrl(url, { width: 48, quality: 80, format: 'webp' })}
                    alt="avatar"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <img src={url} alt="avatar" className="w-6 h-6 rounded-full" />
                );
              })()
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-[10px] text-gray-600">{(profiles[c.user_id]?.username || 'U').slice(0, 1).toUpperCase()}</span>
              </div>
            )}
            <span>{profiles[c.user_id]?.username || '익명'}</span>
            {userId === c.user_id && <span className="ml-1 bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[11px]">내 댓글</span>}
            <span>· {new Date(c.created_at).toLocaleString('ko-KR')}</span>
          </div>
          {editingId === c.id ? (
            <div className="space-y-2">
              <textarea className="border rounded w-full p-2" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              <div className="flex gap-2">
                <button className="bg-black text-white px-3 py-1 rounded" onClick={() => submitEdit(c.id)}>수정 완료</button>
                <button className="border px-3 py-1 rounded" onClick={() => setEditingId(null)}>취소</button>
              </div>
            </div>
          ) : (
            <p className="text-sm">{c.content}</p>
          )}

          <div className="flex gap-2 mt-2">
            {userId === c.user_id && editingId !== c.id && (
              <>
                <button className="border px-3 py-1 rounded" onClick={() => startEdit(c)}>수정</button>
                <button className="border px-3 py-1 rounded" onClick={() => remove(c.id)}>삭제</button>
              </>
            )}
            {userId ? (
              <button className="border px-3 py-1 rounded" onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}>답글</button>
            ) : (
              <button className="border px-3 py-1 rounded" onClick={() => showToast({ type: 'error', message: '로그인 후 답글을 작성할 수 있습니다.' })}>답글</button>
            )}
          </div>

          {replyToId === c.id && (
            <div className="ml-4 mt-2 space-y-2">
              <textarea
                className="border rounded w-full p-2"
                value={replyContent}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text.length > MAX_LEN) {
                    setReplyContent(text.slice(0, MAX_LEN));
                    showToast({ type: 'error', message: `답글은 ${MAX_LEN}자를 넘을 수 없습니다.` });
                  } else {
                    setReplyContent(text);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    submitReply(c.id);
                  }
                }}
                placeholder="답글을 입력하세요..."
              />
              <div className="flex items-center justify-between">
                <span className={`text-sm ${replyContent.length > MAX_LEN ? 'text-red-500' : 'text-gray-500'}`}>
                  {replyContent.length} / {MAX_LEN}
                </span>
                <div className="flex gap-2">
                  <button className="bg-black text-white px-3 py-1 rounded" onClick={() => submitReply(c.id)}>답글 작성</button>
                  <button className="border px-3 py-1 rounded" onClick={() => setReplyToId(null)}>취소</button>
                </div>
              </div>
              <p className="text-xs text-gray-500">Ctrl+Enter로 답글을 빠르게 작성할 수 있습니다.</p>
            </div>
          )}

          {byParent.has(c.id) && (
            <ul className="space-y-3 mt-3 pl-4 border-l">
              {(byParent.get(c.id) || []).map((r) => (
                <li key={r.id} className="border rounded p-2 ml-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    {profiles[r.user_id]?.avatar_url ? (
                      (() => {
                        const url = profiles[r.user_id]!.avatar_url!;
                        let isSupabasePublic = false;
                        try {
                          const u = new URL(url);
                          isSupabasePublic = /\/storage\/v1\/object\/public\//.test(u.pathname);
                        } catch {}
                        return isSupabasePublic ? (
                          <Image
                            src={getOptimizedImageUrl(url, { width: 40, quality: 80, format: 'webp' })}
                            alt="avatar"
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        ) : (
                          <img src={url} alt="avatar" className="w-5 h-5 rounded-full" />
                        );
                      })()
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-[9px] text-gray-600">{(profiles[r.user_id]?.username || 'U').slice(0, 1).toUpperCase()}</span>
                      </div>
                    )}
                    <span>{profiles[r.user_id]?.username || '익명'}</span>
                    {userId === r.user_id && <span className="ml-1 bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[11px]">내 댓글</span>}
                    <span>· {new Date(r.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  {editingId === r.id ? (
                    <div className="space-y-2">
                      <textarea className="border rounded w-full p-2" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                      <div className="flex gap-2">
                        <button className="bg-black text-white px-3 py-1 rounded" onClick={() => submitEdit(r.id)}>수정 완료</button>
                        <button className="border px-3 py-1 rounded" onClick={() => setEditingId(null)}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{r.content}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {userId === r.user_id && editingId !== r.id && (
                      <>
                        <button className="border px-3 py-1 rounded" onClick={() => startEdit(r)}>수정</button>
                        <button className="border px-3 py-1 rounded" onClick={() => remove(r.id)}>삭제</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
      </ul>
    </>
  );
}
