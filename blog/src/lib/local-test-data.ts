// 로컬 테스트용 데이터
export const TEST_POSTS = [
  {
    id: 'test-post-1',
    title: '테스트 게시글 1',
    slug: 'test-post-1',
    content: `
<h2>안녕하세요!</h2>
<p>이것은 테스트 게시글의 본문 내용입니다.</p>
<p>여러 줄의 내용을 포함하고 있습니다:</p>
<ul style="list-style-type: disc; padding-left: 2rem; margin: 1rem 0;">
  <li>첫 번째 항목</li>
  <li>두 번째 항목</li>
  <li>세 번째 항목</li>
</ul>
<p><strong>굵은 텍스트</strong>와 <em>기울임 텍스트</em>도 테스트합니다.</p>
<p>그리고 <a href="https://example.com" target="_blank" rel="noopener noreferrer">링크</a>도 포함되어 있습니다.</p>

<h3>YouTube 영상 테스트</h3>
<p>아래는 YouTube 영상 링크입니다:</p>
https://www.youtube.com/watch?v=09K79_bD6w0

<p>영상이 자동으로 재생되어야 합니다.</p>
    `,
    excerpt: '이것은 테스트 게시글의 요약입니다.',
    cover_url: null,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'test-user',
    author: {
      id: 'test-user',
      username: '테스트유저',
      avatar_url: null
    },
    tags: ['테스트', '데모'],
    likes_count: 5,
    comments_count: 2,
    views_count: 100
  },
  {
    id: 'test-post-2',
    title: '빈 본문 테스트',
    slug: 'test-post-2',
    content: '', // 빈 본문 테스트용
    excerpt: '이 게시글은 본문이 비어있습니다.',
    cover_url: null,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'test-user',
    author: {
      id: 'test-user',
      username: '테스트유저',
      avatar_url: null
    },
    tags: ['빈본문', '테스트'],
    likes_count: 0,
    comments_count: 0,
    views_count: 10
  }
];

// 로컬 스토리지 키
const LOCAL_POSTS_KEY = 'local_test_posts';

// 로컬 테스트 데이터 초기화
export function initializeLocalTestData() {
  if (typeof window === 'undefined') return;
  
  const existing = localStorage.getItem(LOCAL_POSTS_KEY);
  if (!existing) {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(TEST_POSTS));
  }
}

// 로컬 테스트 게시글 조회
export function getLocalTestPost(slug: string) {
  // 서버 사이드에서는 기본 테스트 데이터 반환
  if (typeof window === 'undefined') {
    return TEST_POSTS.find((post: any) => post.slug === slug) || null;
  }
  
  try {
    const data = localStorage.getItem(LOCAL_POSTS_KEY);
    if (!data) {
      // 기본 테스트 데이터 반환
      return TEST_POSTS.find((post: any) => post.slug === slug) || null;
    }
    
    const posts = JSON.parse(data);
    return posts.find((post: any) => post.slug === slug) || null;
  } catch (error) {
    console.log('로컬 테스트 데이터 조회 오류:', error);
    // 오류 발생 시 기본 데이터 반환
    return TEST_POSTS.find((post: any) => post.slug === slug) || null;
  }
}

// 로컬 테스트 게시글 목록 조회
export function getLocalTestPosts() {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(LOCAL_POSTS_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 로컬 테스트 게시글 저장
export function saveLocalTestPost(post: any) {
  if (typeof window === 'undefined') return false;
  
  try {
    const posts = getLocalTestPosts();
    const existingIndex = posts.findIndex((p: any) => p.id === post.id);
    
    if (existingIndex >= 0) {
      posts[existingIndex] = post;
    } else {
      posts.push(post);
    }
    
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
    return true;
  } catch {
    return false;
  }
}