"use client";
import CommentForm from './CommentForm';
import ClientCommentList from './ClientCommentList';

export default function CommentSection({ postId }: { postId: string }) {
  return (
    <section className="mt-8">
      <h2 className="font-semibold">댓글</h2>
      <CommentForm postId={postId} onSubmitted={() => { /* ClientCommentList가 자체 로딩 수행 */ }} />
      <ClientCommentList postId={postId} />
    </section>
  );
}