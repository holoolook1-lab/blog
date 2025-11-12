import { getServerSupabase } from '@/lib/supabase/server';
import EditForm from '@/components/blog/EditForm';
import { normalizeSlug } from '@/lib/slug';

type Params = { params: Promise<{ slug: string }> };

export default async function EditPage({ params }: Params) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return (
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">편집</h1>
        <p className="text-sm text-gray-600">환경변수 설정 후 콘텐츠가 표시됩니다.</p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-3xl mx-auto p-4">로그인 후 접근 가능합니다.</main>
    );
  }

  const { slug } = await params;
  let clean = (slug || '').toString();
  try { clean = decodeURIComponent(clean); } catch {}
  clean = normalizeSlug(clean);
  const { data: post } = await supabase
    .from('posts')
    .select('id, user_id, title, slug, content, cover_image, published')
    .eq('slug', clean)
    .single();

  if (!post) return <main className="max-w-3xl mx-auto p-4">존재하지 않는 포스트입니다.</main>;
  if (post.user_id !== user.id) {
    return <main className="max-w-3xl mx-auto p-4">본인의 글만 편집할 수 있습니다.</main>;
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">글 편집</h1>
      {(() => {
        const initial = {
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          cover_image: post.cover_image,
          published: post.published,
          heading: null as string | null,
        };
        return <EditForm initial={initial} />;
      })()}
    </main>
  );
}
export const dynamic = 'force-dynamic';
