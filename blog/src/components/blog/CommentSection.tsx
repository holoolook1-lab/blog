"use client";
import { MessageSquare, Users } from 'lucide-react';
import CommentForm from './CommentForm';
import ClientCommentList from './ClientCommentList';

export default function CommentSection({ postId }: { postId: string }) {
  return (
    <section className="mt-12 space-y-6">
      {/* 댓글 섹션 헤더 */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100">
            <MessageSquare size={20} className="text-primary-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">댓글</h2>
            <p className="text-sm text-neutral-600">의견을 공유해주세요</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Users size={16} aria-hidden="true" />
          <span>참여 중</span>
        </div>
      </div>

      {/* 댓글 작성 폼 */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <CommentForm
          postId={postId}
          onSubmitted={() => {
            try {
              window.dispatchEvent(new CustomEvent('comments:reload', { detail: { postId } }));
            } catch {}
          }}
        />
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        <ClientCommentList postId={postId} />
      </div>
    </section>
  );
}
