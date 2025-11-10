import Link from 'next/link';

export default function TransferPage({ searchParams }: { searchParams: { code?: string; flow?: string } }) {
  const code = searchParams?.code || '';
  const flow = searchParams?.flow || 'login';
  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-bold">교차 브라우저 로그인 승인</h1>
      <p className="mt-4 text-sm text-gray-600">
        같은 디바이스의 다른 브라우저/앱에서 매직 링크를 열었습니다. 아래 승인 코드를 원래 브라우저의 마이페이지에서 입력하면 로그인 승인이 완료됩니다.
      </p>
      <div className="mt-6 rounded-md border p-4">
        <div className="text-sm text-gray-500">승인 코드</div>
        <div className="mt-2 text-3xl tracking-widest font-mono">{code}</div>
      </div>
      <div className="mt-8 text-sm text-gray-600">
        마이페이지로 이동: <Link href="/settings/profile" className="underline">프로필 설정</Link>
      </div>
      <div className="mt-6 text-xs text-gray-500">유효시간: 약 10분. 만료 후에는 새 링크를 요청하세요.</div>
      <div className="mt-10 text-xs text-gray-400">흐름: {flow}</div>
    </main>
  );
}
