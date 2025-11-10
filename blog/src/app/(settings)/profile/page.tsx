"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import ActionToast from '@/components/ui/ActionToast';
import { compressToWebp } from '@/lib/utils/imageClient';
import ProfileStats from '@/components/profile/ProfileStats';

type Profile = { id: string; username: string | null; avatar_url: string | null };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      const { data: p } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', user.id).single();
      const initial = (p as Profile) || null;
      setProfile(initial);
      setUsername(initial?.username || '');
      setAvatarUrl(initial?.avatar_url || '');
    });
  }, []);

  const validateUsername = (u: string) => {
    const trimmed = (u || '').trim();
    if (!trimmed) return '닉네임을 입력하세요';
    if (trimmed.length < 2 || trimmed.length > 24) return '닉네임은 2~24자여야 합니다';
    if (!/^[a-z0-9_-]+$/i.test(trimmed)) return '닉네임은 영문/숫자/밑줄/하이픈만 가능합니다';
    return null;
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    const err = validateUsername(username);
    if (err) {
      setToast({ type: 'error', message: err });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setToast({ type: 'error', message: '로그인이 필요합니다' });
      return;
    }
    // 중복 닉네임 확인 (본인 제외)
    const { data: dupe } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .limit(1);
    if (dupe && dupe.length) {
      setToast({ type: 'error', message: '이미 사용 중인 닉네임입니다' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, username, avatar_url: avatarUrl });
    if (error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: '프로필을 저장했습니다' });
    setIsSaving(false);
  };

  const onUploadAvatar = async (file: File | null) => {
    if (!file) return;
    setIsUploading(true);
    setToast(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setToast({ type: 'error', message: 'JPEG/PNG/WEBP 이미지만 가능합니다' });
      setIsUploading(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: '이미지 최대 크기는 5MB 입니다' });
      setIsUploading(false);
      return;
    }
    let toUpload: File = file;
    try {
      if (file.type !== 'image/webp') {
        toUpload = await compressToWebp(file, { maxWidth: 1024, quality: 0.82 });
      }
    } catch (err: any) {
      console.warn('아바타 WebP 변환 실패, 원본 업로드 진행:', err?.message);
    }
    const form = new FormData();
    form.append('file', toUpload);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) {
      setToast({ type: 'error', message: json.error || '업로드 실패' });
    } else {
      setAvatarUrl(json.publicUrl || json.path);
      setToast({ type: 'success', message: '아바타 업로드 완료' });
    }
    setIsUploading(false);
  };

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">프로필 설정</h1>
      <ProfileStats />
      <form className="space-y-3" onSubmit={onSave}>
        <div>
          <input className="border rounded w-full p-2" placeholder="닉네임 (영문/숫자/_/-, 2~24자)" value={username} onChange={(e) => setUsername(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">중복 닉네임은 저장할 수 없습니다.</p>
        </div>
        <div className="space-y-2">
          <input className="border rounded w-full p-2" placeholder="아바타 URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          <div className="flex items-center gap-2">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onUploadAvatar(e.target.files?.[0] || null)} />
            {isUploading && <span className="text-xs text-gray-600">업로드 중...</span>}
          </div>
        </div>
        <button className="bg-black text-white px-3 py-1 rounded disabled:opacity-60" type="submit" disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</button>
      </form>
      {toast && <ActionToast toast={{ type: toast.type, message: toast.message }} onClose={() => setToast(null)} />}
    </main>
  );
}
