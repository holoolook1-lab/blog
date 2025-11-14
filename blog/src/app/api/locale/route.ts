import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { locale } = await req.json();
    if (!['ko', 'en'].includes(locale)) return NextResponse.json({ ok: false }, { status: 400 });
    const res = new NextResponse(null, { status: 204 });
    res.headers.set('Set-Cookie', `locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`);
    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
