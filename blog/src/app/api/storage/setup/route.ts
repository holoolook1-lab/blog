import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// 스토리지 버킷 셋업: 존재하지 않으면 생성, Public 설정
// 서비스 롤 키가 없으면 501로 종료(옵션 기능)
export async function POST() {
  if (!adminSupabase) {
    return NextResponse.json({ error: 'service_key_required' }, { status: 501 });
  }

  const bucket = 'blog-images';
  try {
    // 버킷 존재 여부 확인
    const { data: existing } = await adminSupabase.storage.getBucket(bucket);
    if (!existing) {
      const { error: createErr } = await adminSupabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: '10MB',
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
      });
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
    } else {
      // 이미 존재하면 Public 보장
      const { error: updateErr } = await adminSupabase.storage.updateBucket(bucket, { public: true });
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 최종 확인
    const { data } = await adminSupabase.storage.getBucket(bucket);
    return NextResponse.json({ ok: true, bucket: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'setup_failed' }, { status: 500 });
  }
}

