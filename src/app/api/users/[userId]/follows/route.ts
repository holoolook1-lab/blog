import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await getServerSupabase();
    
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'followers'; // 'followers' or 'following'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    let query;
    let countQuery;

    if (type === 'followers') {
      // 나를 팔로우하는 사람들
      query = supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          follower:users!user_follows_follower_id_fkey (
            id,
            username,
            email,
            avatar_url,
            bio,
            created_at
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      countQuery = supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    } else {
      // 내가 팔로우하는 사람들
      query = supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          following:users!user_follows_following_id_fkey (
            id,
            username,
            email,
            avatar_url,
            bio,
            created_at
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      countQuery = supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
    }

    const [{ data: users, error }, { count, error: countError }] = await Promise.all([
      query,
      countQuery
    ]);

    if (error || countError) {
      console.error('팔로우/팔로워 목록 조회 실패:', error || countError);
      return NextResponse.json(
        { error: '목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('팔로우/팔로워 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}