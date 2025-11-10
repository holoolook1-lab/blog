import Link from 'next/link';

export default function Monogram({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" aria-label="홈으로 이동" className="block rounded" style={{ lineHeight: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className="shadow-sm"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="16" fill="#111827" />
        <text
          x="16"
          y="19"
          textAnchor="middle"
          fontSize="14"
          fontFamily="'Pretendard', 'Noto Sans KR', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial"
          fill="#ffffff"
        >
          라
        </text>
      </svg>
    </Link>
  );
}