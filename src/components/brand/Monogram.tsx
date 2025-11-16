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
        <rect x="0" y="0" width="32" height="32" rx="4" fill="#000000" />
        <text
          x="16"
          y="20"
          textAnchor="middle"
          fontSize="16"
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
          fill="#ffffff"
       >
          r
        </text>
      </svg>
    </Link>
  );
}
