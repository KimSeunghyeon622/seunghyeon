# 리팩토링 가이드

## 적용 완료 항목

### 1. types/ 폴더 (타입 통합)
- `src/types/database.ts` - 전역 타입 정의
- Store, Product, Consumer, Reservation, Review 등

**사용법:**
```typescript
import type { Store, Product, Reservation } from '../types';
```

### 2. constants/ 폴더 (상수 및 Enum)
- `src/constants/enums.ts` - 비즈니스 Enum 추가
- ReservationStatus, CashTransactionType 등

**사용법:**
```typescript
import { ReservationStatus, ReservationStatusLabel } from '../constants';

// 하드코딩 대신 상수 사용
if (status === ReservationStatus.CONFIRMED) { ... }

// 한글 라벨
const label = ReservationStatusLabel[status]; // "확정"
```

### 3. api/ 폴더 (데이터 계층 분리)
- `src/api/storeApi.ts` - 업체 관련 쿼리
- `src/api/productApi.ts` - 상품 관련 쿼리
- `src/api/reservationApi.ts` - 예약 관련 쿼리
- `src/api/reviewApi.ts` - 리뷰 관련 쿼리
- `src/api/consumerApi.ts` - 소비자 관련 쿼리

**사용법:**
```typescript
// 변경 전 (화면에서 직접 호출)
const { data } = await supabase.from('stores').select('*');

// 변경 후 (API 함수 사용)
import { fetchStores } from '../api';
const stores = await fetchStores();
```

### 4. hooks/ 폴더 (커스텀 훅)
- `src/hooks/useStores.ts` - 업체 목록 + 필터링
- `src/hooks/useReservations.ts` - 예약 관리

**사용법:**
```typescript
import { useStores } from '../hooks';

function StoreListScreen() {
  const {
    stores,
    filteredStores,
    loading,
    selectedCategory,
    setCategory,
    refresh,
  } = useStores();

  // UI 렌더링만 담당
}
```

---

## 추가 리팩토링 권장 사항

### 1. 화면별 스타일 분리

현재 화면 파일에 스타일이 포함되어 있어 파일이 길어집니다.

**권장 구조:**
```
src/screens/
  StoreProductManagement/
    index.tsx          # 컴포넌트 로직
    styles.ts          # StyleSheet
    components/        # 하위 컴포넌트
      PastProductItem.tsx
      ProductForm.tsx
```

### 2. 화면에서 API 함수 적용 예시

**StoreListHome.tsx 리팩토링 예시:**
```typescript
// 변경 전
const fetchStores = useCallback(async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_approved', true);
  // ...
}, []);

// 변경 후
import { useStores } from '../hooks';

export default function StoreListHome({ ... }) {
  const { filteredStores, loading, setCategory, refresh } = useStores();

  // UI 렌더링만 담당
}
```

### 3. 공통 컴포넌트 활용

이미 `src/components/`에 공통 컴포넌트가 있습니다:
- `Button.tsx`
- `Input.tsx`
- `LoadingSpinner.tsx`
- `EmptyState.tsx`

화면에서 이 컴포넌트들을 적극 활용하세요.

---

## 폴더 구조 (최종)

```
app/src/
├── api/                 # Supabase 쿼리 함수
│   ├── storeApi.ts
│   ├── productApi.ts
│   ├── reservationApi.ts
│   ├── reviewApi.ts
│   ├── consumerApi.ts
│   └── index.ts
│
├── components/          # 공통 UI 컴포넌트
│   ├── Button.tsx
│   ├── Input.tsx
│   └── ...
│
├── constants/           # 상수 및 Enum
│   ├── colors.ts
│   ├── categories.ts
│   ├── enums.ts
│   └── index.ts
│
├── hooks/               # 커스텀 훅
│   ├── useStores.ts
│   ├── useReservations.ts
│   └── index.ts
│
├── lib/                 # 외부 라이브러리 설정
│   └── supabase.ts
│
├── screens/             # 화면 컴포넌트
│   └── ...
│
├── stores/              # Zustand 스토어
│   ├── authStore.ts
│   ├── navigationStore.ts
│   └── selectionStore.ts
│
└── types/               # 타입 정의
    ├── database.ts
    └── index.ts
```

---

## 마이그레이션 체크리스트

화면을 리팩토링할 때 이 순서로 진행하세요:

- [ ] 화면에서 중복 Interface 제거 → `types/` import
- [ ] 하드코딩된 상태값 → `constants/enums.ts` 상수 사용
- [ ] Supabase 직접 호출 → `api/` 함수로 교체
- [ ] 데이터 로딩/필터링 로직 → 커스텀 훅으로 이전
- [ ] 스타일 분리 (선택사항)

---

## 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 화면을 바꾸지 말고, 하나씩 적용
2. **테스트 필수**: 변경 후 해당 기능이 정상 동작하는지 확인
3. **any 타입 제거**: 가능한 경우 `types/` 타입으로 교체
