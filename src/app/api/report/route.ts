import { NextRequest, NextResponse } from 'next/server';

function escapeHTML(str: string) {
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string));
}

export async function POST(req: NextRequest) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const REPORT_EMAIL_TO = process.env.REPORT_EMAIL_TO;
    const REPORT_EMAIL_FROM = process.env.REPORT_EMAIL_FROM || 'onboarding@resend.dev';

    if (!RESEND_API_KEY || !REPORT_EMAIL_TO) {
      return NextResponse.json({ error: '이메일 발송 설정이 없습니다(RESEND_API_KEY/REPORT_EMAIL_TO).' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const slug: string | undefined = body?.slug;
    const url: string | undefined = body?.url;
    const reason: string | undefined = body?.reason; // legacy
    const category: string | undefined = body?.category;
    const details: string | undefined = body?.details;

    if (!slug || !url) {
      return NextResponse.json({ error: 'slug와 url은 필수입니다.' }, { status: 400 });
    }

    const ua = req.headers.get('user-agent') || '';
    const ref = req.headers.get('referer') || '';
    const subject = `[신고] ${category ? `[${category}] ` : ''}${slug}`;
    const text = `신고가 접수되었습니다.\nURL: ${url}\n유형: ${category || '(미입력)'}\n사유: ${details || reason || '(미입력)'}\nUA: ${ua}\nReferer: ${ref}\n시간: ${new Date().toISOString()}`;
    const html = `<div style="font-family: system-ui">
      <h2>신고가 접수되었습니다</h2>
      <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
      <p><strong>유형:</strong> ${category ? escapeHTML(category) : '(미입력)'}</p>
      <p><strong>사유:</strong> ${details ? escapeHTML(details) : reason ? escapeHTML(reason) : '(미입력)'}</p>
      <p><strong>UA:</strong> ${escapeHTML(ua)}</p>
      <p><strong>Referer:</strong> ${escapeHTML(ref)}</p>
      <p><strong>시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
    </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REPORT_EMAIL_FROM,
        to: REPORT_EMAIL_TO,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json({ error: '이메일 발송 실패', detail: errText }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '알 수 없는 오류' }, { status: 500 });
  }
}
