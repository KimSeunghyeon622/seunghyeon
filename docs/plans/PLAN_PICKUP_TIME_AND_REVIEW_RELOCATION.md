# 픽업 시간 선택 및 리뷰 위치 변경 계획

## 작업 개요

1. 제품 예약 시 픽업 시간 선택 UI 추가 (30분 단위, 업체 영업시간 고려)
2. 리뷰 섹션을 제품 아래로 이동 및 자동 스크롤 기능 추가
3. 픽업가능시간과 영업시간 통일

---

## 작업 1: 픽업 시간 선택 UI 및 기능

### 현재 상태
- `ReservationScreen.tsx`: TextInput으로 직접 입력
- `CartScreen.tsx`: TextInput으로 직접 입력
- 업체별 영업시간 정보 미활용

### 목표
- 시간 입력창 클릭 시 하단에 스크롤 형태로 시간대 표시
- 30분 단위로 시간대 생성
- 업체별 영업시간을 고려하여 선택 가능한 시간만 표시

### 구현 계획

#### 1. UI 설계 (frontend-design 스킬)
- 시간 선택 모달/바텀시트 디자인
- 30분 단위 시간 리스트 UI
- 선택된 시간 하이라이트
- 업체 영업시간 범위 표시

#### 2. 개발 (tdd-agent)
- `TimePickerModal.tsx` 컴포넌트 생성
- 업체 영업시간 조회 로직
- 30분 단위 시간 생성 로직
- `ReservationScreen.tsx`에 적용
- `CartScreen.tsx`에 적용

### 기술 사양
- **시간 형식**: "HH:MM" (예: "09:00", "18:30")
- **간격**: 30분 단위
- **영업시간 고려**: `store_operating_hours` 테이블 또는 `opening_hours_text` 활용
- **UI**: React Native Modal 또는 Bottom Sheet

---

## 작업 2: 리뷰 위치 변경 및 자동 스크롤

### 현재 상태
- 리뷰 섹션이 업체 정보 아래, 제품 위에 위치
- 상단 별점/리뷰 클릭 시 아무 동작 없음

### 목표
- 리뷰 섹션을 제품 목록 아래로 이동
- 상단 별점/리뷰 클릭 시 리뷰 섹션으로 자동 스크롤

### 구현 계획

#### 1. UI 설계 (frontend-design 스킬)
- 리뷰 섹션 위치 변경 (제품 아래)
- 상단 별점/리뷰 클릭 가능한 UI로 변경

#### 2. 개발 (tdd-agent)
- `StoreDetail.tsx`에서 리뷰 섹션 위치 변경
- `ScrollView`의 `scrollTo` 기능 활용
- 상단 별점/리뷰에 `onPress` 핸들러 추가

### 기술 사양
- **스크롤 방식**: `ScrollView`의 `scrollTo` 또는 `ref` 사용
- **애니메이션**: 부드러운 스크롤 애니메이션 적용

---

## 작업 3: 픽업가능시간과 영업시간 통일

### 현재 상태
- `stores` 테이블에 `opening_hours_text`, `pickup_start_time`, `pickup_end_time` 존재
- `store_operating_hours` 테이블도 존재

### 목표
- 픽업가능시간과 영업시간을 하나로 통일
- 영업시간을 기준으로 픽업 시간 선택

### 구현 계획

#### 1. DB 스키마 확인 (tdd-agent)
- 현재 스키마 확인
- `pickup_start_time`, `pickup_end_time` 사용처 확인
- `store_operating_hours` 테이블 활용 방안 확인

#### 2. 코드 수정 (tdd-agent)
- `pickup_start_time`, `pickup_end_time` 제거 또는 deprecated 처리
- `opening_hours_text` 또는 `store_operating_hours`만 사용하도록 변경
- 관련 화면 수정 (`StoreDetail.tsx` 등)

### 기술 사양
- **영업시간 소스**: `store_operating_hours` 테이블 우선 사용
- **폴백**: `opening_hours_text` 사용 (없는 경우)

---

## 작업 순서

1. **작업 1-1**: 픽업 시간 선택 UI 설계 (frontend-design)
2. **작업 1-2**: 픽업 시간 선택 컴포넌트 개발 (tdd-agent)
3. **작업 1-3**: ReservationScreen에 적용 (tdd-agent)
4. **작업 1-4**: CartScreen에 적용 (tdd-agent)
5. **작업 2-1**: 리뷰 위치 변경 UI 설계 (frontend-design)
6. **작업 2-2**: 리뷰 위치 변경 및 자동 스크롤 구현 (tdd-agent)
7. **작업 3-1**: DB 스키마 확인 및 통일 방안 수립 (tdd-agent)
8. **작업 3-2**: 코드 수정 및 적용 (tdd-agent)

---

## 참고 파일

- `app/src/screens/ReservationScreen.tsx` - 예약 화면
- `app/src/screens/CartScreen.tsx` - 장바구니 화면
- `app/src/screens/StoreDetail.tsx` - 업체 상세페이지
- `app/src/types/database.ts` - 타입 정의
- `docs/TRD.md` - DB 스키마 정보
