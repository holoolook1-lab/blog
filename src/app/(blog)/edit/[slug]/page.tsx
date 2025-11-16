import { getServerSupabase } from '@/lib/supabase/server';
import EditForm from '@/components/blog/EditForm';
import { normalizeSlug } from '@/lib/slug';

type Params = { params: Promise<{ slug: string }> };

export default async function EditPage({ params }: Params) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return (
      <main id="main" role="main" aria-labelledby="edit-title" className="max-w-3xl mx-auto p-4 space-y-4">
        <h1 id="edit-title" className="text-2xl font-bold">편집</h1>
        <p className="text-sm text-gray-600">환경변수 설정 후 콘텐츠가 표시됩니다.</p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main id="main" role="main" aria-labelledby="edit-restricted-title" className="max-w-3xl mx-auto p-4 space-y-3">
        <h1 id="edit-restricted-title" className="text-2xl font-bold">접근 제한</h1>
        <p className="text-sm text-gray-700">로그인 후 접근 가능합니다.</p>
      </main>
    );
  }

  const { slug } = await params;
  let clean = (slug || '').toString();
  try { clean = decodeURIComponent(clean); } catch {}
  clean = normalizeSlug(clean);
  const { data: post } = await supabase
    .from('posts')
    .select('id, user_id, title, slug, content, cover_image, published, heading')
    .eq('slug', clean)
    .single();

  if (!post) return (
    <main id="main" role="main" aria-labelledby="edit-notfound-title" className="max-w-3xl mx-auto p-4 space-y-3">
      <h1 id="edit-notfound-title" className="text-2xl font-bold">포스트 없음</h1>
      <p className="text-sm text-gray-700">존재하지 않는 포스트입니다.</p>
    </main>
  );
  if (post.user_id !== user.id) {
    return (
      <main id="main" role="main" aria-labelledby="edit-owneronly-title" className="max-w-3xl mx-auto p-4 space-y-3">
        <h1 id="edit-owneronly-title" className="text-2xl font-bold">접근 제한</h1>
        <p className="text-sm text-gray-700">본인의 글만 편집할 수 있습니다.</p>
      </main>
    );
  }

  return (
    <main id="main" role="main" aria-labelledby="edit-title" className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 id="edit-title" className="text-2xl font-bold">글 편집</h1>
      {(() => {
        const initial = {
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          cover_image: post.cover_image,
          published: post.published,
          heading: (post as any).heading || null,
        };
        return <EditForm initial={initial} />;
      })()}
    </main>
  );
}
export const dynamic = 'force-dynamic';
