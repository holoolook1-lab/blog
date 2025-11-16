import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

// Core Web Vitals 리포트를 위한 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      value, 
      delta, 
      id, 
      navigationType,
      rating 
    } = body;

    // 필수 필드 검증
    if (!name || value === undefined) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabase();
    
    // 사용자 정보 가져오기 (있는 경우)
    const { data: { user } } = await supabase.auth.getUser();

    // Core Web Vitals 데이터 저장
    const { error } = await supabase.from('core_web_vitals').insert({
      user_id: user?.id || null,
      metric_name: name,
      value: value,
      delta: delta || null,
      navigation_type: navigationType || null,
      rating: rating || null,
      session_id: id || null,
      user_agent: request.headers.get('user-agent') || null,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('Core Web Vitals 저장 실패:', error);
      return NextResponse.json(
        { error: '데이터 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Core Web Vitals 데이터가 저장되었습니다.'
    });

  } catch (error) {
    console.error('Core Web Vitals 처리 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Core Web Vitals 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric'); // 특정 메트릭 조회
    const days = parseInt(searchParams.get('days') || '7'); // 기본 7일

    const supabase = await getServerSupabase();
    
    let query = supabase
      .from('core_web_vitals')
      .select('metric_name, value, rating, timestamp')
      .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (metric) {
      query = query.eq('metric_name', metric);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      console.error('Core Web Vitals 통계 조회 실패:', error);
      return NextResponse.json(
        { error: '통계 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 통계 계산
    const stats = {
      total: data?.length || 0,
      metrics: {} as Record<string, { count: number; avg: number; good: number; needs_improvement: number; poor: number }>
    };

    data?.forEach(record => {
      const metric = record.metric_name;
      if (!stats.metrics[metric]) {
        stats.metrics[metric] = { count: 0, avg: 0, good: 0, needs_improvement: 0, poor: 0 };
      }
      
      const metricStats = stats.metrics[metric];
      metricStats.count++;
      metricStats.avg += record.value;
      
      if (record.rating === 'good') metricStats.good++;
      else if (record.rating === 'needs-improvement') metricStats.needs_improvement++;
      else if (record.rating === 'poor') metricStats.poor++;
    });

    // 평균 계산
    Object.keys(stats.metrics).forEach(metric => {
      const metricStats = stats.metrics[metric];
      if (metricStats.count > 0) {
        metricStats.avg = metricStats.avg / metricStats.count;
      }
    });

    return NextResponse.json({ 
      success: true,
      data: stats,
      period: `${days}일`
    });

  } catch (error) {
    console.error('Core Web Vitals 통계 조회 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}