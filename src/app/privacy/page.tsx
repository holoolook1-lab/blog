export const dynamic = 'force-static';

import type { Metadata } from 'next';
import { PRIVACY_VERSION } from '@/lib/policies';

export const metadata: Metadata = {
  title: `개인정보 처리 방침 v${PRIVACY_VERSION}`,
  description: '라키라키 블로그 서비스의 개인정보 처리 방침',
  alternates: { canonical: '/privacy', languages: { en: '/en/privacy', ko: '/privacy' } },
};

export default function PrivacyPolicyPage() {
  return (
    <main id="main" role="main" aria-labelledby="privacy-title" className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 id="privacy-title" className="text-2xl font-bold">개인정보 처리 방침 (v{PRIVACY_VERSION})</h1>
      <p className="text-sm text-gray-600">시행일: 2025-11-11</p>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">1. 수집하는 개인정보의 항목 및 방법</h2>
        <p>라키라키 블로그(이하 “서비스”)는 회원가입/로그인 및 게시물 작성·댓글·북마크·신고 기능 제공을 위해 다음 정보를 수집합니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>필수: 이메일(계정 식별 및 인증)</li>
          <li>선택: 닉네임, 프로필 이미지</li>
          <li>OAuth 제공자 정보: Google 계정 식별자, 이메일(해당 제공자 정책 범위 내)</li>
          <li>게시 데이터: 작성한 글/댓글/신고 내역 및 해당 메타데이터</li>
          <li>서비스 로그: 접속 IP, User-Agent, Referer, 접속/요청 시각, 오류 로그</li>
        </ul>
        <p>수집 방법은 회원 직접 입력, OAuth 동의 및 자동 생성되는 서비스 로그를 포함합니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">2. 개인정보의 이용 목적</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>계정 생성 및 인증, 로그인 유지, 비밀번호 재설정</li>
          <li>게시물·댓글·스크랩 등 핵심 기능 제공 및 운영</li>
          <li>악성 이용 방지, 보안 및 서비스 안정화</li>
          <li>고객문의 대응 및 분쟁 해결</li>
          <li>법령 준수(요청·보관 의무 등)</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">3. 보유 및 이용 기간</h2>
        <p>원칙적으로 회원 탈퇴 시 즉시 파기합니다. 다만 법령상 보관 의무가 있는 정보(접속 기록 등)가 있는 경우 해당 기간 동안 최소한으로 보관 후 파기합니다. 악성 이용 방지를 위한 로그는 최대 3개월 범위에서 최소한으로 보관할 수 있습니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">4. 제3자 제공 및 처리 위탁</h2>
        <p>서비스 제공을 위해 인증/데이터베이스/스토리지/호스팅 등 일부 기능을 외부 서비스에 위탁할 수 있습니다. 현재 대표적으로 Supabase(인증·DB·스토리지) 및 호스팅/빌드 인프라 제공자를 사용할 수 있으며, 필요한 범위 내에서만 처리합니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">5. 국외 이전</h2>
        <p>위탁처의 서버 위치에 따라 정보가 국외에서 처리될 수 있습니다. 해당 처리자는 개인정보 보호 관련 적용 법령을 준수하도록 관리합니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">6. 이용자의 권리</h2>
        <p>이용자는 자신의 개인정보에 대해 열람·정정·삭제·동의 철회를 요청할 수 있습니다. 요청은 아래 문의처로 접수해 주세요.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">7. 아동의 개인정보</h2>
        <p>서비스는 만 14세 미만을 대상으로 하지 않으며, 해당 연령대 이용자의 가입을 제한합니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">8. 안전성 확보 조치</h2>
        <p>접근 권한 관리, 최소 권한 원칙, 전송 구간 보호 등 기본적인 보호 조치를 적용합니다. 완전한 무결성을 보장할 수는 없으며, 지속적으로 개선합니다.</p>
      </section>

      <section className="space-y-2 text-sm text-gray-700">
        <h2 className="text-lg font-semibold">9. 문의처</h2>
        <p>이메일: salad20c@gmail.com (개인정보 문의/요청)</p>
      </section>
    </main>
  );
}
