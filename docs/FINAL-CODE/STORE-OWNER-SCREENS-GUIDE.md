# 📱 업주 페이지 개편 가이드 (SaveIt UI)

> **목표**: SaveIt 앱 스타일의 현대적인 업주 페이지 구현

---

## ✅ 새로 추가된 화면

### 1. StoreDashboard (업주 메인)
- ✅ 가게 정보 관리 카드 (초록색)
- ✅ 매장 상태 토글 (영업중/영업종료)
- ✅ 보유 캐시 표시 + 충전하기 버튼
- ✅ 빠른 관리: 판매상품/예약확인/리뷰/단골고객

### 2. StoreInfoManagement (가게 정보 관리)
- ✅ 대표 사진 업로드
- ✅ 가게명, 소개글 입력
- ✅ 요일별 운영시간 설정 (체크박스)
- ✅ 환불/노쇼 정책 설정
- ✅ 변경사항 저장하기 버튼

### 3. StoreProductManagement (상품 등록)
- ✅ 과거 등록 상품 불러오기 버튼
- ✅ 상품 사진 업로드
- ✅ 상품명, 정가, 할인가 입력
- ✅ 현재 할인율 자동 계산
- ✅ 재고 수량 (+/- 버튼)
- ✅ 제조날짜, 소비기한
- ✅ 단골 알람 전송 토글

---

## 🔧 설치 단계

### 1단계: Supabase SQL 실행

GitHub에서 SQL 파일 열기:
```
https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/sql/10-add-product-fields.sql
```

1. Raw 버튼 → 복사
2. Supabase SQL Editor → 붙여넣기
3. RUN 실행

**추가된 컬럼:**
- products.manufactured_date (제조날짜)
- products.expiry_date (소비기한)
- products.send_notification (단골 알람 전송)

---

### 2단계: 파일 3개 교체/생성

#### 2-1. StoreDashboard.tsx 교체
```
https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreDashboard-NEW.tsx
```
→ `src/screens/StoreDashboard.tsx` 교체

#### 2-2. StoreInfoManagement.tsx 생성 (새 파일!)
```
https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreInfoManagement.tsx
```
→ `src/screens/StoreInfoManagement.tsx` 생성

#### 2-3. StoreProductManagement.tsx 교체
```
https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreProductManagement-NEW.tsx
```
→ `src/screens/StoreProductManagement.tsx` 교체

---

### 3단계: App.tsx 수정 (중요!)

기존 App.tsx에서 다음 import와 네비게이션을 추가해야 합니다:

```typescript
// Import 추가
import StoreInfoManagement from './src/screens/StoreInfoManagement';

// 업주 화면 상태에 'info' 추가
type StoreScreen = 'dashboard' | 'products' | 'cash' | 'reservations' | 'info';

// StoreDashboard에 prop 추가
<StoreDashboard
  onManageProducts={() => setStoreScreen('products')}
  onManageCash={() => setStoreScreen('cash')}
  onManageReservations={() => setStoreScreen('reservations')}
  onManageInfo={() => setStoreScreen('info')}  // 추가
  onManageReviews={() => alert('추후 구현')}   // 추가
  onManageRegulars={() => alert('추후 구현')}  // 추가
  onLogout={async () => {
    setShowStoreMode(false);
    setConsumerScreen('mypage');
  }}
/>

// 가게 정보 관리 화면 추가
{storeScreen === 'info' && (
  <StoreInfoManagement
    onBack={() => setStoreScreen('dashboard')}
    onManageProducts={() => setStoreScreen('products')}
  />
)}
```

---

### 4단계: Metro 재시작

```bash
# Ctrl+C로 중지
npx expo start
```

---

## 🎨 디자인 특징

- **색상**: #00D563 (SaveIt 초록색)
- **카드**: 둥근 모서리 16px, 그림자 효과
- **버튼**: 초록색 primary, 흰색 카드
- **아이콘**: 이모지 사용 (🏪, 📷, 🛒 등)

---

## 📊 주요 기능

### StoreDashboard
- 매장 상태 토글 → stores.is_open 업데이트
- 보유 캐시 표시 → stores.cash_balance

### StoreInfoManagement
- 대표 사진 → stores.cover_image_url
- 운영시간 → stores.opening_hours (JSONB)
- 정책 → stores.refund_policy, no_show_policy

### StoreProductManagement
- 상품 사진 → products.image_url
- 가격 정보 → products.original_price, discounted_price
- 재고 → products.stock_quantity
- 날짜 → products.manufactured_date, expiry_date
- 알람 → products.send_notification

---

## 🚀 향후 구현

- [ ] 리뷰 관리 화면
- [ ] 단골 고객 현황
- [ ] 과거 상품 불러오기
- [ ] 상품 수정/삭제 기능

---

**작성일**: 2026-01-11
**버전**: 1.0
