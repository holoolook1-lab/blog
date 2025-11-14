'use client';
import dynamic from 'next/dynamic';

const IntegratedEditor = dynamic(() => import('./IntegratedEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
      <div className="text-gray-500">통합 에디터 로딩 중...</div>
    </div>
  ),
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  enableKoreanFeatures?: boolean;
  enableSpellCheck?: boolean;
  enableAutoComplete?: boolean;
  defaultTab?: string;
};

export default function Editor({
  value,
  onChange,
  placeholder,
  className,
  enableKoreanFeatures = true,
  enableSpellCheck = true,
  enableAutoComplete = true,
  defaultTab = 'advanced'
}: Props) {
  return (
    <IntegratedEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      enableKoreanFeatures={enableKoreanFeatures}
      enableSpellCheck={enableSpellCheck}
      enableAutoComplete={enableAutoComplete}
      defaultTab={defaultTab}
    />
  );
}