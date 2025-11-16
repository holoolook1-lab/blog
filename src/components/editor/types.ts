export interface EditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  enableKoreanFeatures?: boolean;
}

export interface ContentEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export interface VideoPlatform {
  name: string;
  color: string;
  domains: string[];
}

export interface LinkCardData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
}