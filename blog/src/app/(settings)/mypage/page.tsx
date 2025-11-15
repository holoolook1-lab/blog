"use client";
import Link from 'next/link';
import ProtectedLink from '@/components/common/ProtectedLink';
import { outlineButtonSmall } from '@/lib/styles/ui';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import PostCard from '@/components/blog/PostCard';
import ActionToast from '@/components/ui/ActionToast';
import { compressToWebp } from '@/lib/utils/imageClient';
import { GameSystemDashboard } from '@/components/game/GameSystemDashboard';

export default function MyPage() {
  const router = useRouter();
  const { userId, loading } = useAuthUser();
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [recentBookmarks, setRecentBookmarks] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'game'>('profile');

  // 로그인 가드: 로딩 종료 후 미로그인이면 로그인 페이지로 이동
  useEffect(() => {
    if (!loading && userId === null) {
      router.replace('/login?redirect=/mypage');
    }
  }, [loading, userId, router]);

  // 사용자 정보 로드
  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setDataLoading(true);
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      setEmail(u?.email ?? null);
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('username, avatar_url, bio')
          .eq('id', userId)
          .single();
        setUsername((prof as any)?.username ?? null);
        setAvatarUrl((prof as any)?.avatar_url ?? '');
        setBio((prof as any)?.bio ?? '');
      } catch {}

      // 최근 작성(본인 글) - 처음에 20개까지 로드
      try {
        const { data: posts } = await supabase
          .from('posts')
          .select('id, title, slug, cover_image, excerpt, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(0, 19);
        setRecentPosts(posts || []);
      } catch {}

      // 최근 스크랩
      try {
        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('post_id, created_at, posts(title, slug, cover_image, excerpt, created_at)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(0, 4);
        setRecentBookmarks((bookmarks || []).filter((b: any) => b.posts));
      } catch {}
      setDataLoading(false);
    };
    load();
  }, [userId]);

  const validateUsername = (u: string) => {
    const trimmed = (u || '').trim();
    if (!trimmed) return '닉네임을 입력하세요';
    if (trimmed.length < 2 || trimmed.length > 24) return '닉네임은 2~24자여야 합니다';
    // 한글/영문/숫자/밑줄/하이픈 허용
    if (!/^[a-zA-Z0-9ㄱ-ㅎ가-힣_-]+$/.test(trimmed)) return '닉네임은 한글/영문/숫자/_/- 만 가능합니다';
    return null;
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    const err = validateUsername(username || '');
    if (err) { setToast({ type: 'error', message: err }); return; }
    if (!userId) { setToast({ type: 'error', message: '로그인이 필요합니다' }); return; }
    const { data: dupe } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .limit(1);
    if (dupe && dupe.length) { setToast({ type: 'error', message: '이미 사용 중인 닉네임입니다' }); return; }
    setIsSaving(true);
    const { error } = await supabase.from('profiles').upsert({ id: userId, username, avatar_url: avatarUrl, bio });
    if (error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: '프로필을 저장했습니다' });
    setIsSaving(false);
  };

  const onUploadAvatar = async (file: File | null) => {
    if (!file) return;
    setIsUploading(true);
    setToast(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setToast({ type: 'error', message: 'JPEG/PNG/WEBP 이미지만 가능합니다' }); setIsUploading(false); return; }
    if (file.size > 5 * 1024 * 1024) { setToast({ type: 'error', message: '이미지 최대 크기는 5MB 입니다' }); setIsUploading(false); return; }
    let toUpload: File = file;
    try { if (file.type !== 'image/webp') { toUpload = await compressToWebp(file, { maxWidth: 1024, quality: 0.82 }); } } catch {}
    const form = new FormData(); form.append('file', toUpload);
    const res = await fetch('/api/upload', { method: 'POST', body: form }); const json = await res.json();
    if (!res.ok) { setToast({ type: 'error', message: json.error || '업로드 실패' }); }
    else { setAvatarUrl(json.publicUrl || json.path); setToast({ type: 'success', message: '아바타 업로드 완료' }); }
    setIsUploading(false);
  };

  return (
    <main id="main" className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 계정</h1>
        <span className="text-xs text-gray-500">마이페이지 · 프로필 통합</span>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          프로필 설정
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'posts'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          내 글 관리
        </button>
        <button
          onClick={() => setActiveTab('game')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'game'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          🎮 게임화 시스템
        </button>
      </div>

      {/* 프로필 탭 */}
      {activeTab === 'profile' && (
        <section className="rounded border p-4 bg-white">
          <h2 className="text-lg font-semibold">프로필 설정</h2>
          {dataLoading ? (
            <div className="mt-2 space-y-2" aria-busy="true" aria-live="polite">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <p className="text-sm text-gray-600">이메일: {email || '-'}</p>
          )}
          <form className="mt-3 space-y-3" onSubmit={onSave} aria-label="프로필 설정">
            <div>
              <label className="text-sm text-gray-700" htmlFor="mypage-username">닉네임</label>
              <input
                id="mypage-username"
                className="mt-1 border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="닉네임 (한글/영문/숫자/_/-, 2~24자)"
                value={username || ''}
                onChange={(e) => setUsername(e.target.value)}
                aria-describedby="mypage-username-hint"
                aria-required
                required
              />
              <p id="mypage-username-hint" className="text-xs text-gray-500 mt-1">중복 닉네임은 저장할 수 없습니다.</p>
            </div>
            <div className="space-y-2">
              {avatarUrl ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                    <img src={avatarUrl} alt="아바타 미리보기" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <span className="text-xs text-gray-600">미리보기</span>
                </div>
              ) : null}
              <input className="border rounded w-full p-2" placeholder="아바타 URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              <div className="flex items-center gap-2">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onUploadAvatar(e.target.files?.[0] || null)} />
                {isUploading && <span className="text-xs text-gray-600">업로드 중...</span>}
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium">자기소개 (최대 200자)</label>
                <textarea
                  className="border rounded w-full p-2 mt-1"
                  placeholder="자기소개를 입력하세요"
                  value={bio}
                  maxLength={200}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">{bio.length}/200</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
<button className={`${outlineButtonSmall} disabled:opacity-60`} type="submit" disabled={isSaving} aria-busy={isSaving} aria-describedby="mypage-save-hint">{isSaving ? '저장 중...' : '저장'}</button>
              <p id="mypage-save-hint" className="sr-only">프로필 정보를 저장합니다. 저장 중에는 버튼이 비활성화됩니다.</p>
            <ProtectedLink href="/write" className="border rounded px-3 py-1 hover:bg-gray-50" ariaLabel="글 작성">글 작성</ProtectedLink>
            </div>
          </form>
          {toast && <ActionToast toast={{ type: toast.type, message: toast.message }} onClose={() => setToast(null)} />}
        </section>
      )}

      {/* 게시물 관리 탭 */}
      {activeTab === 'posts' && (
        <section className="rounded border p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">내 글 관리</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllPosts(!showAllPosts)}
                className="text-sm text-gray-600 hover:text-gray-800 link-gauge"
              >
                {showAllPosts ? '간략히 보기' : '전체 보기'}
              </button>
              <Link href="/posts" className="text-sm text-gray-600 link-gauge">모든 글 보기</Link>
            </div>
          </div>
          
          {dataLoading ? (
            <div className="mt-3 grid grid-cols-1 gap-3" aria-busy="true" aria-live="polite">
              {[...Array(showAllPosts ? 10 : 4)].map((_, i) => (
                <div key={i} className="rounded border p-4">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  <div className="mt-3 h-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">아직 작성한 글이 없습니다. 첫 글을 작성해보세요.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3">
              {(showAllPosts ? recentPosts : recentPosts.slice(0, 4)).map((p) => (
                <div key={p.id} className="rounded border p-4 group">
                  <PostCard post={p} variant="polaroid" />
                  <div className="mt-3 flex items-center gap-2">
                    <Link 
                      href={`/posts/${encodeURIComponent(p.slug)}`} 
                      className={`${outlineButtonSmall}`}
                    >
                      보기
                    </Link>
                    <button
                      className={`${outlineButtonSmall} border-red-600 text-red-600 hover:bg-red-50`}
                      onClick={async () => {
                        console.log('삭제 버튼 클릭됨, userId:', userId, 'postId:', p.id);
                        if (!userId) { 
                          console.log('로그인되지 않음');
                          setToast({ type: 'error', message: '로그인이 필요합니다' }); 
                          return; 
                        }
                        
                        // 삭제 확인 다이얼로그
                        const isConfirmed = window.confirm('정말로 이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
                        if (!isConfirmed) return;
                        
                        setToast(null);
                        try {
                          console.log('삭제 API 호출 시작:', `/api/posts/${p.id}`);
                          const res = await fetch(`/api/posts/${p.id}`, { 
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                            }
                          });
                          console.log('삭제 API 응답:', res.status, res.statusText);
                          
                          let json;
                          try {
                            json = await res.json();
                            console.log('삭제 API 응답 데이터:', json);
                          } catch (e) {
                            console.log('응답 JSON 파싱 실패:', e);
                            json = {};
                          }
                          
                          if (!res.ok) {
                            console.log('삭제 실패:', res.status, json);
                            throw new Error(json.error || `삭제 실패 (${res.status})`);
                          }
                          
                          console.log('삭제 성공, UI 업데이트');
                          setRecentPosts((prev) => prev.filter((x) => x.id !== p.id));
                          setToast({ type: 'success', message: '삭제했습니다' });
                        } catch (err: any) {
                          console.log('삭제 오류:', err);
                          setToast({ type: 'error', message: err?.message || '삭제 실패' });
                        }
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {!showAllPosts && recentPosts.length > 4 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAllPosts(true)}
                    className="text-sm text-gray-600 hover:text-gray-800 link-gauge"
                  >
                    더보기 ({recentPosts.length - 4}개 더 있음)
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 게임화 시스템 탭 */}
      {activeTab === 'game' && (
        <GameSystemDashboard />
      )}

      {/* 최근 스크랩 - 모든 탭에서 표시 */}
      <section className="rounded border p-4 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 스크랩</h2>
        </div>
        {dataLoading ? (
          <div className="mt-3 grid grid-cols-1 gap-3" aria-busy="true" aria-live="polite">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded border p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="mt-3 h-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : recentBookmarks.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">스크랩한 글이 없습니다.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3">
            {recentBookmarks.map((b) => (
              <PostCard key={b.post_id} post={b.posts} variant="polaroid" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
