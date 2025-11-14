import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

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

  const input = Buffer.from(await file.arrayBuffer());
  let outMime = mime;
  let outPath = `${user.id}/${Date.now()}.${mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'}`;
  let outBlob: Blob | null = null;
  try {
    const mod = await import('sharp');
    const sharp: any = (mod as any).default || (mod as any);
    const buf: Buffer = await sharp(input).rotate().resize({ width: 2048, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    outMime = 'image/webp';
    outPath = `${user.id}/${Date.now()}.webp`;
    outBlob = new Blob([new Uint8Array(buf)], { type: outMime });
  } catch {
    outBlob = new Blob([new Uint8Array(input)], { type: outMime });
  }
  const { data, error } = await supabase.storage.from('blog-images').upload(outPath, outBlob!, {
    contentType: outMime,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: pub } = supabase.storage.from('blog-images').getPublicUrl(outPath);
  return NextResponse.json({ path: outPath, publicUrl: pub.publicUrl });
}
