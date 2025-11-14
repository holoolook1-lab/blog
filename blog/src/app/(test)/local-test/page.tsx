"use client";
import { useEffect, useState } from 'react';
import { TEST_POSTS, initializeLocalTestData, getLocalTestPost } from '@/lib/local-test-data';
import Link from 'next/link';

export default function LocalTestPage() {
  const [status, setStatus] = useState<string>('');
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    try {
      initializeLocalTestData();
      setStatus('로컬 테스트 데이터가 초기화되었습니다.');
      
      // 로컬 스토리지에서 데이터 확인
      const data = localStorage.getItem('local_test_posts');
      if (data) {
        const parsed = JSON.parse(data);
        setPosts(parsed);
        setStatus(`총 ${parsed.length}개의 테스트 게시글이 로드되었습니다.`);
      }
    } catch (error) {
      setStatus(`오류 발생: ${error}`);
    }
  }, []);

  const testPostAccess = (slug: string) => {
    try {
      const post = getLocalTestPost(slug);
      if (post) {
        alert(`게시글 찾기 성공: ${post.title}`);
      } else {
        alert('게시글을 찾을 수 없습니다.');
      }
    } catch (error) {
      alert(`오류: ${error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">로컬 테스트 데이터 확인</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">{status}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">테스트 게시글 목록</h2>
        <div className="space-y-2">
          {TEST_POSTS.map((post) => (
            <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">{post.title}</h3>
                <p className="text-sm text-gray-600">슬러그: {post.slug}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => testPostAccess(post.slug)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  접근 테스트
                </button>
                <Link
                  href={`/posts/${post.slug}`}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  바로가기
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">디버그 정보</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 로컬 스토리지 키: local_test_posts</li>
          <li>• 테스트 URL: /posts/test-post-1, /posts/test-post-2</li>
          <li>• 브라우저 콘솔(F12)에서 localStorage.getItem('local_test_posts') 로 확인 가능</li>
        </ul>
      </div>
    </div>
  );
}