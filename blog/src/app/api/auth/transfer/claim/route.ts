import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code: string | undefined = body?.code;
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ ok: false, message: '승인 코드가 필요합니다' }, { status: 400 });
    }

    const { adminSupabase } = await import('@/lib/supabase/admin');
    const admin = adminSupabase;
    if (!admin) {
      return NextResponse.json({ ok: false, message: '서버 설정 누락(SERVICE_ROLE)' }, { status: 500 });
    }

    // 코드로 레코드 조회 (만료 확인)
    const { data, error } = await admin
      .from('login_transfers')
      .select('*')
      .eq('code', code)
      .limit(1)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, message: '코드가 존재하지 않거나 만료되었습니다' }, { status: 404 });
    }
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      // 만료된 레코드는 정리
      await admin.from('login_transfers').delete().eq('code', code);
      return NextResponse.json({ ok: false, message: '코드가 만료되었습니다' }, { status: 410 });
    }

    // 현재 브라우저에 세션 쿠키를 설정하기 위한 SSR 클라이언트
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const response = new NextResponse(null, { status: 200 });
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(projectUrl, anonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options?: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    });

    if (data.auth_code) {
      await supabase.auth.exchangeCodeForSession(data.auth_code);
    } else if (data.token_hash) {
      await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: data.token_hash });
    } else {
      return NextResponse.json({ ok: false, message: '인증 정보가 없습니다' }, { status: 500 });
    }

    // 일회용 레코드 삭제
    await admin.from('login_transfers').delete().eq('code', code);

    return response;
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || '알 수 없는 오류' }, { status: 500 });
  }
}

