"use client";
import dynamic from 'next/dynamic';

const EnhancedContentEditor = dynamic(() => import('./EnhancedContentEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-500">에디터 로딩 중...</div>
      </div>
    </div>
  ),
});

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export default function ContentEditor(props: Props) {
  return <EnhancedContentEditor {...props} />;
}