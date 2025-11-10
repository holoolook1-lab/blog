type Props = { title: string; content: string };

export default function PostDetail({ title, content }: Props) {
  return (
    <article className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}