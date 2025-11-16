import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || '';
    let report: any = null;
    if (ct.includes('application/csp-report')) {
      const text = await req.text();
      try { report = JSON.parse(text)['csp-report']; } catch { report = { raw: text }; }
    } else {
      const body = await req.json();
      report = body; // application/reports+json 등 최신 포맷
    }
    // 간단한 서버 로그만 남김(PII 제외). 필요 시 외부 로깅으로 교체.
    console.warn('[CSP Report]', JSON.stringify(report)?.slice(0, 2000));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'parse_error' }, { status: 400 });
  }
}
