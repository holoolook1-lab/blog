import { NextResponse } from 'next/server';

// 간단한 Open Graph/Twitter 카드 메타 추출 API
// GET /api/link-preview?url=<encoded>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url') || '';
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  try {
    // 서버에서 직접 가져와 CORS 회피
    const res = await fetch(url, {
      headers: {
        // 일부 사이트는 UA에 따라 응답을 다르게 줌
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      // 리디렉션 허용
      redirect: 'follow',
    });
    const html = await res.text();

    const pick = (re: RegExp) => {
      const m = html.match(re);
      return m?.[1]?.trim() || '';
    };

    // OG/Twitter 우선 추출
    let title = pick(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) || pick(/<meta[^>]+name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    let description = pick(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) || pick(/<meta[^>]+name=["']twitter:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    let image = pick(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) || pick(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const siteName = pick(/<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    // 폴백: 페이지 타이틀/첫 이미지
    if (!title) title = pick(/<title[^>]*>([^<]+)<\/title>/i);
    if (!image) image = pick(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);

    // 상대 경로 → 절대 경로 변환
    const abs = (u: string) => {
      if (!u) return '';
      try { return new URL(u, url).toString(); } catch { return u; }
    };
    image = abs(image);

    return NextResponse.json({
      ok: true,
      url,
      title,
      description,
      image,
      site_name: siteName,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'fetch_failed', message: e?.message || 'failed' }, { status: 500 });
  }
}

