import { designTokens } from './design-tokens';

// 공통 UI 유틸리티 클래스
export const uiClasses = {
  // 카드 스타일
  card: {
    base: 'bg-white rounded-lg border border-secondary-200 shadow-sm',
    hover: 'hover:shadow-md hover:border-secondary-300 transition-all duration-200',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  
  // 섹션 스타일
  section: {
    base: 'w-full',
    spacing: {
      sm: 'mb-6',
      md: 'mb-8',
      lg: 'mb-12',
    },
  },
  
  // 그리드 레이아웃
  grid: {
    cols: {
      2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
      3: 'grid grid-cols-1 md:grid-cols-3 gap-6',
      4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
    },
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    },
  },
  
  // 플렉스 레이아웃
  flex: {
    between: 'flex items-center justify-between',
    center: 'flex items-center justify-center',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center',
  },
  
  // 타이포그래피
  typography: {
    // 제목
    heading: {
      xs: 'text-xs font-semibold text-secondary-700',
      sm: 'text-sm font-semibold text-secondary-800',
      base: 'text-base font-semibold text-secondary-900',
      lg: 'text-lg font-semibold text-secondary-900',
      xl: 'text-xl font-bold text-secondary-900',
      '2xl': 'text-2xl font-bold text-secondary-900',
    },
    // 본문
    body: {
      xs: 'text-xs text-secondary-600 leading-relaxed',
      sm: 'text-sm text-secondary-700 leading-relaxed',
      base: 'text-base text-secondary-800 leading-normal',
    },
    // 보조 텍스트
    caption: 'text-xs text-secondary-500',
  },
  
  // 버튼 스타일
  button: {
    // 크기
    size: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    },
    // 변형
    variant: {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
      outline: 'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 focus:ring-secondary-500',
      ghost: 'bg-transparent text-secondary-700 hover:bg-secondary-100 focus:ring-secondary-500',
      danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    },
    // 상태
    states: 'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  },
  
  // 입력 필드 스타일
  input: {
    base: 'w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-50 disabled:text-secondary-500',
    error: 'border-error-500 text-error-900 placeholder-error-300 focus:border-error-500 focus:ring-error-500',
  },
  
  // 뱃지 스타일
  badge: {
    base: 'inline-flex items-center font-medium rounded-full',
    size: {
      xs: 'px-2 py-0.5 text-xs',
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    },
    variant: {
      default: 'bg-secondary-100 text-secondary-800',
      primary: 'bg-primary-100 text-primary-800',
      secondary: 'bg-secondary-200 text-secondary-900',
      outline: 'border border-secondary-300 bg-white text-secondary-700',
      success: 'bg-success-50 text-success-700 border border-success-200',
      warning: 'bg-warning-50 text-warning-700 border border-warning-200',
      error: 'bg-error-50 text-error-700 border border-error-200',
    },
  },
  
  // 아이콘 스타일
  icon: {
    size: {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
    },
    color: {
      primary: 'text-primary-600',
      secondary: 'text-secondary-600',
      muted: 'text-secondary-400',
      success: 'text-success-600',
      warning: 'text-warning-600',
      error: 'text-error-600',
    },
  },
  
  // 호버 및 포커스 효과
  hover: {
    base: 'transition-all duration-200 cursor-pointer',
    scale: 'hover:scale-105',
    opacity: 'hover:opacity-80',
    shadow: 'hover:shadow-md',
  },
  
  // 반응형 브레이크포인트
  responsive: {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
  },
} as const;

// 공통 컴포넌트 클래스 생성기
export const createComponentClasses = (base: string, variants: Record<string, string>) => {
  return (variant?: keyof typeof variants, additional?: string) => {
    const variantClass = variant ? variants[variant] : '';
    return [base, variantClass, additional].filter(Boolean).join(' ');
  };
};

// 레이아웃 유틸리티
export const layoutUtils = {
  // 컨테이너
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // 섹션 스페이싱
  sectionSpace: {
    sm: 'py-6',
    md: 'py-8',
    lg: 'py-12',
  },
  
  // 카드 그리드
  cardGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
  
  // 반응형 플렉스
  responsiveFlex: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
  
  // 래핑 플렉스
  wrapFlex: 'flex flex-wrap items-center gap-2',
};

// 애니메이션 유틸리티
export const animationUtils = {
  // 페이드 인
  fadeIn: 'animate-fade-in',
  // 슬라이드 업
  slideUp: 'animate-slide-up',
  // 펄스
  pulse: 'animate-pulse',
  // 스켈레톤
  skeleton: 'animate-pulse bg-secondary-200',
};

// 접근성 유틸리티
export const a11yUtils = {
  // 스크린 리더 전용
  srOnly: 'sr-only',
  // 포커스 트랩
  focusTrap: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  // 고대비 모드
  highContrast: 'contrast-more:border contrast-more:border-secondary-400',
};