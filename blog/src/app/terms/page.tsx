export const dynamic = 'force-static';

import type { Metadata } from 'next';
import { TERMS_VERSION } from '@/lib/policies';

export const metadata: Metadata = {
  title: `이용 약관 v${TERMS_VERSION}`,
  description: '라키라키 블로그 서비스의 이용 약관',
};

export default function TermsPage() {
  return (
    <main id="main" role="main" aria-labelledby="terms-title" className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 id="terms-title" className="text-2xl font-bold">이용 약관 (v{TERMS_VERSION})</h1>
      <p className="text-sm text-gray-600">시행일: 2025-11-11</p>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">1. 목적</h2>
        <p>본 약관은 라키라키 블로그(이하 “서비스”) 이용과 관련하여 권리·의무 및 책임사항을 규정합니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">2. 계정 및 보안</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>이용자는 자신의 계정 및 비밀번호를 안전하게 관리해야 합니다.</li>
          <li>타인의 계정을 무단 사용하거나 양도·대여할 수 없습니다.</li>
          <li>계정 도용 또는 보안 사고가 의심될 경우 즉시 관리자에게 알려야 합니다.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">3. 콘텐츠 및 저작권</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>게시물의 저작권은 게시자에게 있으며, 서비스는 게시·보관·노출을 위한 이용권을 가집니다.</li>
          <li>타인의 권리를 침해하는 콘텐츠(무단 복제·배포 등)를 게시할 수 없습니다.</li>
          <li>불법·유해·스팸 콘텐츠는 사전 통지 없이 제한·삭제될 수 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">4. 금지 행위</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>법령 위반, 타인 권리 침해, 악성코드 유포, 서비스 장애 유발 행위</li>
          <li>과도한 자동화 요청, 비정상적 스크래핑, 허위 신고·평판 조작</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">5. 개인정보 및 동의</h2>
        <p>개인정보 처리와 동의 관련 사항은 개인정보 처리 방침에 따릅니다(필수 동의는 가입 절차에서 수집하며, 최초 구글 로그인 시 별도 리다이렉트 절차는 적용하지 않습니다).</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">6. 서비스 변경 및 중단</h2>
        <p>서비스는 기능 개선 또는 운영상의 필요에 따라 변경·중단될 수 있으며, 중요한 변경사항은 서비스 내 공지를 통해 안내합니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">7. 책임 제한</h2>
        <p>천재지변, 불가항력, 외부 인프라 장애 등으로 인한 손해에 대해 서비스의 책임은 제한될 수 있습니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">8. 분쟁 해결 및 준거법</h2>
        <p>본 약관은 대한민국 법령을 준거법으로 하며, 분쟁이 발생하는 경우 관할 법원에 따릅니다.</p>
      </section>
    </main>
  );
}
