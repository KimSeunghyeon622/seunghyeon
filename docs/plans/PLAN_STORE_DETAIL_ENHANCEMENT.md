# 업체 상세페이지 기능 강화 계획

## 작업 개요

업체 상세페이지(`StoreDetail.tsx`)의 다음 기능들을 추가/수정합니다:
1. 리뷰 목록 표시 기능 추가
2. 제품 수량 선택 및 장바구니 기능 추가
3. 제품 클릭 오류 수정 및 모든 기능 완성

---

## Phase 1: 리뷰 목록 표시 기능

### 현재 상태
- 리뷰 개수와 평균 별점만 표시됨
- 실제 리뷰 내용을 볼 수 없음

### 목표
- 업체 상세페이지에서 리뷰 목록을 확인할 수 있도록 함
- 각 리뷰의 별점, 내용, 작성자, 작성일 표시

### 구현 계획
1. **UI 설계** (frontend-design 스킬)
   - 리뷰 섹션 UI 디자인
   - 리뷰 카드 컴포넌트 디자인
   - 별점 표시 방식
   - 리뷰 더보기 기능

2. **개발** (tdd-agent)
   - `reviewApi.ts`의 `fetchStoreReviews` 함수 활용
   - StoreDetail에 리뷰 목록 표시 기능 추가
   - 리뷰 로딩 상태 처리
   - 빈 리뷰 상태 처리

### 테스트 항목
- [ ] 리뷰 목록이 정상적으로 표시되는지
- [ ] 리뷰가 없을 때 적절한 메시지 표시
- [ ] 별점이 올바르게 표시되는지
- [ ] 작성자 정보가 올바르게 표시되는지

---

## Phase 2: 제품 수량 선택 및 장바구니 기능

### 현재 상태
- 각 제품마다 "예약하기" 버튼만 있음
- 수량 선택 기능 없음
- 여러 제품을 한번에 예약하는 기능 없음
- 장바구니 기능 없음

### 목표
- 각 제품에 수량 선택 UI 추가 (증가/감소 버튼)
- 선택한 제품들을 장바구니에 담기
- 장바구니에서 여러 제품을 한번에 예약
- 장바구니 상태 관리 (Zustand 스토어)

### 구현 계획
1. **UI 설계** (frontend-design 스킬)
   - 제품 카드에 수량 선택 UI 추가
   - 장바구니 아이콘 및 배지 디자인
   - 장바구니 화면 UI 디자인
   - 장바구니에서 예약하기 화면 UI 디자인

2. **개발** (tdd-agent)
   - 장바구니 Zustand 스토어 생성 (`cartStore.ts`)
   - 제품 수량 선택 컴포넌트 개발
   - 장바구니 화면 개발 (`CartScreen.tsx`)
   - 장바구니에서 여러 제품 한번에 예약 기능
   - 예약 API 수정 (여러 제품 지원)

### 테스트 항목
- [ ] 수량 선택이 정상적으로 작동하는지
- [ ] 장바구니에 제품이 추가되는지
- [ ] 장바구니에서 제품이 제거되는지
- [ ] 여러 제품을 한번에 예약할 수 있는지
- [ ] 재고 수량을 초과하지 않는지

---

## Phase 3: 제품 클릭 오류 수정 및 기능 완성

### 현재 문제
- 제품 클릭 시 `Cannot read property 'name' of undefined` 오류 발생
- `onReserve(product)` 호출 시 product가 제대로 전달되지 않을 수 있음

### 목표
- 제품 클릭 오류 수정
- 업체 상세페이지의 모든 기능이 정상 작동하도록 완성

### 구현 계획
1. **오류 수정** (tdd-agent)
   - `onReserve` 함수에서 product 검증 추가
   - ReservationScreen에서 product 안전하게 접근
   - App.tsx에서 StoreDetail 호출 시 product 전달 확인

2. **기능 완성** (tdd-agent)
   - 모든 버튼과 기능이 정상 작동하는지 확인
   - 사용자 시나리오 기반 테스트
   - 에러 처리 강화

### 테스트 항목
- [ ] 제품 클릭 시 오류가 발생하지 않는지
- [ ] 모든 버튼이 정상 작동하는지
- [ ] 사용자 시나리오가 정상적으로 작동하는지
- [ ] 에러 처리가 적절한지

---

## 기술 스택

- **상태 관리**: Zustand (장바구니 스토어)
- **API**: `reviewApi.ts`, `reservationApi.ts`
- **UI 컴포넌트**: React Native 기본 컴포넌트

---

## 작업 순서

1. Phase 1: 리뷰 목록 표시 기능 (frontend-design → tdd-agent)
2. Phase 2: 장바구니 기능 (frontend-design → tdd-agent)
3. Phase 3: 오류 수정 및 완성 (tdd-agent)

---

## 참고 파일

- `app/src/screens/StoreDetail.tsx` - 업체 상세페이지
- `app/src/api/reviewApi.ts` - 리뷰 API
- `app/src/api/reservationApi.ts` - 예약 API
- `app/src/stores/selectionStore.ts` - 선택 상태 관리 (참고)
- `app/src/screens/ReservationScreen.tsx` - 예약 화면
