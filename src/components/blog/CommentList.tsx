type Comment = {
  id: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
};

export default function CommentList({ comments }: { comments: Comment[] }) {
  const roots = comments.filter((c) => !c.parent_id);
  const children = comments.filter((c) => c.parent_id);
  const byParent = new Map<string, Comment[]>();
  children.forEach((c) => {
    const arr = byParent.get(c.parent_id!) || [];
    arr.push(c);
    byParent.set(c.parent_id!, arr);
  });
  return (
    <ul className="space-y-3">
      {roots.length === 0 && (
        <li className="border rounded p-3 text-center text-sm text-gray-600">첫 댓글을 남겨주세요.</li>
      )}
      {roots.map((c) => (
        <li key={c.id} className="border rounded p-3">
          <p className="text-sm">{c.content}</p>
          <ul className="mt-2 space-y-2">
            {(byParent.get(c.id) || []).map((r) => (
              <li key={r.id} className="border rounded p-2 ml-4">
                <p className="text-sm">{r.content}</p>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}