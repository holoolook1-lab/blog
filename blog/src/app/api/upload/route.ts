import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'file_required' }, { status: 400 });

  const mime = file.type;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(mime)) return NextResponse.json({ error: 'invalid_type' }, { status: 415 });

  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'file_too_large' }, { status: 413 });

  // 이미지 최적화: WebP 변환 + 최대폭 제한(과대 해상도 방지)
  const input = Buffer.from(await file.arrayBuffer());
  const webp = await sharp(input)
    .rotate() // EXIF 방향 교정
    .resize({ width: 2048, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const targetMime = 'image/webp';
  const filePath = `${user.id}/${Date.now()}.webp`;
  // Node 런타임의 타입 호환을 위해 Buffer를 Uint8Array로 감싸 BlobPart로 전달
  const webpBlob = new Blob([new Uint8Array(webp)], { type: targetMime });
  const { data, error } = await supabase.storage.from('blog-images').upload(filePath, webpBlob, {
    contentType: targetMime,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: pub } = supabase.storage.from('blog-images').getPublicUrl(filePath);
  return NextResponse.json({ path: filePath, publicUrl: pub.publicUrl });
}
