# 통합 디자인 시스템

## 개요
이 문서는 라키라키 블로그의 통합 디자인 시스템을 설명합니다. Atomic Design 원칙을 기반으로 구축되었으며, 일관성 있고 재사용 가능한 UI 컴포넌트를 제공합니다.

## 디자인 원칙

### 1. 일관성 (Consistency)
- 모든 컴포넌트는 동일한 디자인 토큰을 사용합니다
- 유사한 기능은 유사한 시각적 표현을 가집니다
- 인터랙션 패턴은 통일되어 있습니다

### 2. 접근성 (Accessibility)
- 모든 컴포넌트는 키보드 네비게이션을 지원합니다
- ARIA 라벨과 속성을 적절히 사용합니다
- 색상 대비는 WCAG 2.1 AA 기준을 충족합니다

### 3. 반응형 (Responsiveness)
- 모든 컴포넌트는 모바일 우선 접근법을 따릅니다
- 유연한 레이아웃과 유동적인 간격을 사용합니다

### 4. 성능 (Performance)
- 불필요한 리렌더링을 방지합니다
- CSS 클래스는 최적화되어 있습니다
- 애니메이션은 GPU 가속을 사용합니다

## 디자인 토큰

### 색상 시스템
```typescript
// 주요 색상
primary:   #7c3aed (보라색)
secondary: #64748b (회색)
success:   #16a34a (초록색)
warning:   #d97706 (주황색)
error:     #dc2626 (빨간색)
```

### 타이포그래피
```typescript
// 크기
xs:  12px
sm:  14px
base: 16px
lg:  18px
xl:  20px
2xl: 24px
3xl: 30px
```

### 간격 시스템
```typescript
// 기본 단위: 4px
1:  4px
2:  8px
3: 12px
4: 16px
6: 24px
8: 32px
```

## 컴포넌트 라이브러리

### Button
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  버튼 텍스트
</Button>
```

**Variants:**
- `primary`: 주요 액션 버튼
- `secondary`: 보조 액션 버튼
- `outline`: 테두리만 있는 버튼
- `ghost`: 배경이 없는 버튼
- `danger`: 위험 액션 버튼

**Sizes:**
- `sm`: 작은 버튼
- `md`: 중간 버튼 (기본값)
- `lg`: 큰 버튼

### Badge
```tsx
import { Badge } from '@/components/ui';

<Badge variant="outline" size="sm">
  #태그
</Badge>
```

**Variants:**
- `default`: 기본 배지
- `primary`: 주요 배지
- `secondary`: 보조 배지
- `outline`: 테두리 배지
- `success`: 성공 상태
- `warning`: 경고 상태
- `error`: 에러 상태

### Input
```tsx
import { Input } from '@/components/ui';

<Input
  type="text"
  placeholder="입력하세요..."
  value={value}
  onChange={handleChange}
  rows={3} // textarea로 사용
/>
```

## 마이그레이션 가이드

### 기존 컴포넌트를 새 시스템으로 전환

1. **Button 마이그레이션**
```tsx
// 기존
<button className="px-4 py-2 bg-blue-500 text-white rounded">
  버튼
</button>

// 새 시스템
<Button variant="primary" size="md">
  버튼
</Button>
```

2. **Badge 마이그레이션**
```tsx
// 기존
<span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
  #태그
</span>

// 새 시스템
<Badge variant="outline" size="sm">
  #태그
</Badge>
```

## 사용 예시

### 공유 버튼 개선
```tsx
// 개선 전
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-600">공유하기:</span>
  <button className="p-1 text-gray-700 hover:text-black">
    <Eye size={18} />
  </button>
</div>

// 개선 후
<div className="flex items-center gap-4">
  <span className="text-sm text-secondary-600 font-medium">공유하기</span>
  <button className="p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-all duration-200">
    <Eye size={20} className="text-current" />
  </button>
</div>
```

### 댓글 폼 개선
```tsx
// 개선 전
<textarea className="w-full rounded-md border bg-transparent px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
<button className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
  등록
</button>

// 개선 후
<Input type="text" rows={3} placeholder="댓글을 입력하세요..." />
<Button variant="primary" size="sm" loading={isSubmitting}>
  등록
</Button>
```

## 접근성 체크리스트

- [ ] 키보드 네비게이션 지원
- [ ] ARIA 라벨 적용
- [ ] 색상 대비 충족
- [ ] 포커스 표시 명확
- [ ] 스크린 리더 지원

## 성능 최적화

- [ ] 불필요한 리렌더링 방지
- [ ] CSS 클래스 최적화
- [ ] GPU 가속 애니메이션
- [ ] 지연 로딩 고려

## 유지보수

- 새 컴포넌트 추가 시 이 문서를 업데이트합니다
- 디자인 토큰 변경 시 관련 컴포넌트를 전부 검토합니다
- 접근성 및 성능 테스트를 정기적으로 수행합니다