# 장바구니 및 수량 선택 UI 설계

## 디자인 컨셉

### 톤
- **직관적이고 편리함**: 수량 선택과 장바구니 담기가 쉬워야 함
- **명확한 시각적 피드백**: 수량 변경과 장바구니 추가 시 즉각적인 반응

### 색상 팔레트
```javascript
const colors = {
  primary: '#00D563',      // 브랜드 그린
  background: '#F5F5F5',   // 배경
  surface: '#FFFFFF',      // 카드 배경
  textPrimary: '#333333',  // 주요 텍스트
  textSecondary: '#666666', // 보조 텍스트
  border: '#E0E0E0',       // 구분선
  accent: '#FF6B6B',       // 포인트 (장바구니 아이콘, 예약 버튼)
  success: '#00C853',      // 성공 (담기 완료)
  disabled: '#CCCCCC',     // 비활성화
};
```

---

## UI 구조

### 1. 제품 카드에 수량 선택 UI 추가

**현재**: "예약하기 →" 버튼만 있음

**변경 후**: 수량 선택 + 장바구니 담기 + 예약하기

```
┌─────────────────────────────────────┐
│  [상품 이미지]                       │
│  [상품 정보]                         │
│  [가격 정보]                         │
│  ────────────────────────────────  │
│  재고: 10개                          │
│                                      │
│  수량:  [-]  2  [+]                 │
│                                      │
│  [🛒 장바구니 담기]  [예약하기 →]   │
└─────────────────────────────────────┘
```

**상세 스펙**:

1. **수량 선택 UI**
   - 감소 버튼 (-): 왼쪽, 원형, 회색 배경
   - 수량 표시: 중앙, 숫자 (bold, 18px)
   - 증가 버튼 (+): 오른쪽, 원형, 그린 배경
   - 최소값: 1
   - 최대값: 재고 수량
   - 재고 초과 시 버튼 비활성화

2. **액션 버튼**
   - 장바구니 담기: 왼쪽, 아이콘 + 텍스트
   - 예약하기: 오른쪽, 기존 스타일 유지

### 2. 장바구니 아이콘 (상단 고정)

**위치**: StoreDetail 상단, 뒤로가기 버튼 옆

```
┌─────────────────────────────────────┐
│  [←]                    [🛒 (3)]   │
│                                      │
│  [커버 이미지]                        │
└─────────────────────────────────────┘
```

**구성 요소**:
- 장바구니 아이콘
- 장바구니 아이템 개수 배지 (빨간색 원, 흰색 숫자)
- 클릭 시 장바구니 화면으로 이동

### 3. 장바구니 화면 (CartScreen)

**레이아웃**:

```
┌─────────────────────────────────────┐
│  [←]  장바구니              [🛒 (3)] │
│  ────────────────────────────────  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ [상품 이미지]  상품명          │  │
│  │              원가: 10,000원    │  │
│  │              할인가: 5,000원   │  │
│  │                              │  │
│  │  수량: [-]  2  [+]           │  │
│  │  [삭제]                       │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ [상품 이미지]  상품명          │  │
│  │              원가: 8,000원     │  │
│  │              할인가: 4,000원   │  │
│  │                              │  │
│  │  수량: [-]  1  [+]           │  │
│  │  [삭제]                       │  │
│  └──────────────────────────────┘  │
│                                      │
│  ────────────────────────────────  │
│  총 상품 수: 3개                     │
│  총 결제 금액: 14,000원              │
│                                      │
│  [픽업 시간 선택]                    │
│  [18:00 ▼]                          │
│                                      │
│  [한번에 예약하기]                   │
└─────────────────────────────────────┘
```

**상세 스펙**:

1. **장바구니 아이템 카드**
   - 상품 이미지 (왼쪽, 80x80)
   - 상품명, 가격 정보
   - 수량 선택 UI (증가/감소)
   - 삭제 버튼 (오른쪽 상단)

2. **합계 섹션**
   - 총 상품 수
   - 총 결제 금액 (큰 글씨, 강조)

3. **픽업 시간 선택**
   - 드롭다운 또는 시간 선택 UI

4. **예약하기 버튼**
   - 하단 고정
   - 모든 제품을 한번에 예약

### 4. 빈 장바구니 상태

```
┌─────────────────────────────────────┐
│                                     │
│            🛒                        │
│                                     │
│      장바구니가 비어있습니다        │
│   상품을 담아주세요!                 │
│                                     │
│  [쇼핑 계속하기]                     │
└─────────────────────────────────────┘
```

---

## 컴포넌트 구조

### QuantitySelector 컴포넌트

```typescript
interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}
```

### CartItemCard 컴포넌트

```typescript
interface CartItemCardProps {
  item: {
    productId: string;
    productName: string;
    imageUrl?: string;
    originalPrice: number;
    discountedPrice: number;
    quantity: number;
    stockQuantity: number;
  };
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}
```

### CartScreen 컴포넌트

```typescript
interface CartScreenProps {
  storeId: string;
  onBack: () => void;
  onReserve: (items: CartItem[], pickupTime: string) => void;
}
```

---

## 스타일 가이드

### 수량 선택 UI
```javascript
quantitySelector: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginVertical: 12,
},
quantityButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F0F0F0',
},
quantityButtonActive: {
  backgroundColor: '#00D563',
},
quantityButtonDisabled: {
  backgroundColor: '#E0E0E0',
  opacity: 0.5,
},
quantityText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333333',
  marginHorizontal: 20,
  minWidth: 30,
  textAlign: 'center',
},
```

### 장바구니 아이콘
```javascript
cartIconContainer: {
  position: 'absolute',
  top: 40,
  right: 20,
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
cartBadge: {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#FF6B6B',
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 6,
},
cartBadgeText: {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: 'bold',
},
```

### 장바구니 아이템 카드
```javascript
cartItemCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
},
cartItemHeader: {
  flexDirection: 'row',
  marginBottom: 12,
},
cartItemImage: {
  width: 80,
  height: 80,
  borderRadius: 8,
  marginRight: 12,
  backgroundColor: '#F0F0F0',
},
cartItemInfo: {
  flex: 1,
},
cartItemName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333333',
  marginBottom: 4,
},
cartItemPrice: {
  fontSize: 14,
  color: '#666666',
},
cartItemActions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 12,
},
removeButton: {
  padding: 8,
},
removeButtonText: {
  fontSize: 14,
  color: '#FF6B6B',
  fontWeight: '600',
},
```

### 장바구니 합계 섹션
```javascript
cartSummary: {
  backgroundColor: '#FFFFFF',
  padding: 20,
  marginTop: 20,
  borderTopWidth: 1,
  borderTopColor: '#E0E0E0',
},
summaryRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
},
summaryLabel: {
  fontSize: 14,
  color: '#666666',
},
summaryValue: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333333',
},
totalAmount: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#FF6B6B',
},
```

---

## 인터랙션

### 수량 선택
1. **증가 버튼 클릭**
   - 수량 +1
   - 재고 초과 시 버튼 비활성화
   - 즉각적인 시각적 피드백

2. **감소 버튼 클릭**
   - 수량 -1 (최소 1)
   - 1일 때 버튼 비활성화

3. **수량 직접 입력** (선택사항)
   - 숫자 키패드로 직접 입력 가능
   - 재고 범위 내에서만 허용

### 장바구니 담기
1. **"장바구니 담기" 버튼 클릭**
   - 선택한 수량만큼 장바구니에 추가
   - 중복 상품은 수량 합산
   - 성공 피드백 (토스트 또는 애니메이션)
   - 장바구니 아이콘 배지 업데이트

2. **장바구니 아이콘 클릭**
   - 장바구니 화면으로 이동
   - 장바구니가 비어있으면 빈 상태 표시

### 장바구니 관리
1. **수량 변경**
   - 장바구니 화면에서 수량 변경 가능
   - 재고 초과 시 경고

2. **아이템 삭제**
   - 삭제 버튼 클릭 시 확인 다이얼로그
   - 확인 시 장바구니에서 제거

3. **한번에 예약하기**
   - 모든 장바구니 아이템을 한번에 예약
   - 각 상품별로 예약 생성
   - 예약 완료 후 장바구니 비우기

---

## 상태 관리 (Zustand)

### CartStore 구조

```typescript
interface CartItem {
  productId: string;
  productName: string;
  imageUrl?: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  stockQuantity: number;
  storeId: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalAmount: () => number;
  getItemsByStore: (storeId: string) => CartItem[];
}
```

---

## 사용자 시나리오

### 시나리오 1: 단일 상품 예약
1. 상품 카드에서 수량 선택 (2개)
2. "예약하기" 버튼 클릭
3. 예약 화면으로 이동 (기존 플로우)

### 시나리오 2: 여러 상품 장바구니 담기
1. 상품 A에서 수량 2개 선택 → "장바구니 담기"
2. 상품 B에서 수량 1개 선택 → "장바구니 담기"
3. 상품 C에서 수량 3개 선택 → "장바구니 담기"
4. 장바구니 아이콘 클릭
5. 장바구니 화면에서 확인
6. 픽업 시간 선택
7. "한번에 예약하기" 클릭
8. 모든 상품이 예약됨

### 시나리오 3: 장바구니 수정
1. 장바구니 화면에서 상품 A 수량 변경 (2 → 3)
2. 상품 B 삭제
3. "한번에 예약하기" 클릭

---

## 반응형 고려사항

- 모바일 화면에 최적화
- 터치 영역: 최소 44x44px
- 수량 버튼: 36x36px (충분한 터치 영역)
- 장바구니 아이콘: 48x48px

---

## 접근성

- 수량 버튼에 접근성 라벨 추가
- 장바구니 아이콘에 접근성 라벨 추가
- 키보드 네비게이션 지원 (웹)
- 색상 대비 비율 준수

---

## 구현 우선순위

1. **Phase 2-1**: 수량 선택 UI 컴포넌트
2. **Phase 2-2**: 장바구니 Zustand 스토어
3. **Phase 2-3**: 제품 카드에 수량 선택 및 장바구니 담기 추가
4. **Phase 2-4**: 장바구니 아이콘 및 배지
5. **Phase 2-5**: 장바구니 화면 개발
6. **Phase 2-6**: 여러 제품 한번에 예약 기능

---

## 참고 디자인

- 쿠팡 장바구니
- 배달의민족 장바구니
- 네이버 쇼핑 장바구니

**차별점**:
- 더 직관적인 수량 선택 UI
- 음식 관련 앱에 맞는 따뜻한 톤
- 빠른 예약을 위한 간편한 플로우
