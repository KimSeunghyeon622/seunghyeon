# 코드 점검 보고서

> **점검일**: 2026-01-18
> **점검 대상**: `app/src/` 폴더 전체
> **점검 기준**: PRD, TRD 문서

---

## 1. 점검 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| **PRD 기능 구현율** | 79% (26/33) | MVP 기준 양호 |
| **코드 구조** | ⚠️ 개선 필요 | 컴포넌트 분리 미흡 |
| **상태 관리** | ✅ 양호 | Zustand 적용 완료 |
| **타입 안전성** | ⚠️ 부분적 | 일부 any 타입 사용 |
| **보안** | ✅ 양호 | RLS 정책 적용 완료 |

---

## 2. PRD 대비 기능 구현 현황

### 2.1 소비자 기능

| 기능 | PRD 요구사항 | 구현 상태 | 파일 |
|------|-------------|----------|------|
| 로그인 | Must-have | ✅ 완료 | LoginScreen.tsx |
| 소비자 회원가입 | Must-have | ✅ 완료 | ConsumerSignupScreen.tsx |
| 업체 리스트 | Must-have | ✅ 완료 | StoreListHome.tsx |
| 업체 상세 | Must-have | ✅ 완료 | StoreDetail.tsx |
| 예약하기 | Must-have | ✅ 완료 | ReservationScreen.tsx |
| 예약 내역 | Must-have | ✅ 완료 | MyReservations.tsx |
| 리뷰 작성 | Must-have | ✅ 완료 | ReviewWrite.tsx |
| 마이페이지 | Must-have | ✅ 완료 | MyPageScreen.tsx |
| 프로필 편집 | Should-have | ✅ 완료 | ProfileEditScreen.tsx |
| 즐겨찾기 | Should-have | ✅ 완료 | StoreListHomeWithSearch.tsx |
| **지도 탐색** | 높음 | ❌ 미구현 | - |
| **소셜 로그인** | 낮음 | ❌ 미구현 | - |
| **푸시 알림** | 중간 | ❌ 미구현 | - |

### 2.2 업주 기능

| 기능 | PRD 요구사항 | 구현 상태 | 파일 |
|------|-------------|----------|------|
| 업주 회원가입 | Must-have | ✅ 완료 | StoreSignupScreen.tsx |
| 대시보드 | Must-have | ✅ 완료 | StoreDashboard.tsx |
| 상품 관리 | Must-have | ✅ 완료 | StoreProductManagement.tsx |
| 캐시 관리 | Must-have | ✅ 완료 | StoreCashManagement.tsx |
| 캐시 내역 | Must-have | ✅ 완료 | StoreCashHistory.tsx |
| 예약 관리 | Must-have | ✅ 완료 | StoreReservationManagement.tsx |
| 리뷰 관리 | Must-have | ✅ 완료 | StoreReviewManagement.tsx |
| 리뷰 답글 | Should-have | ✅ 완료 | StoreReviewManagementWithReply.tsx |
| 업체 정보 | Should-have | ✅ 완료 | StoreInfoManagement.tsx |
| 영업시간 관리 | Should-have | ✅ 완료 | StoreOperatingHoursScreen.tsx |
| 단골 고객 | Nice-to-have | ✅ 완료 | StoreRegularCustomers.tsx |
| **실결제 연동** | 높음 | ❌ 미구현 | UI만 존재 |

### 2.3 시스템 기능

| 기능 | PRD 요구사항 | 구현 상태 | 위치 |
|------|-------------|----------|------|
| 수수료 자동 차감 | Must-have | ✅ 완료 | DB 트리거 |
| 예약 번호 생성 | Must-have | ✅ 완료 | DB 함수 |
| 재고 자동 관리 | Must-have | ✅ 완료 | DB 트리거 |
| 평점 자동 업데이트 | Must-have | ✅ 완료 | DB 트리거 |
| **운영자 대시보드** | 중간 | ❌ 미구현 | - |

---

## 3. 코드 품질 분석

### 3.1 긍정적 요소 ✅

1. **Zustand 상태 관리 적용**
   - `authStore.ts`: 인증 상태 관리
   - `navigationStore.ts`: 화면 전환 관리
   - `selectionStore.ts`: 선택 항목 관리
   - 깔끔한 분리와 타입 정의

2. **Supabase 연동 구조**
   - 환경변수로 API 키 관리 (`EXPO_PUBLIC_*`)
   - AsyncStorage 세션 저장
   - 토큰 자동 갱신

3. **에러 핸들링**
   - try-catch 블록 사용
   - 사용자 친화적 Alert 메시지
   - 로딩 상태 관리

4. **TypeScript 사용**
   - 인터페이스 정의
   - 타입 추론 활용

### 3.2 개선 필요 사항 ⚠️

#### 3.2.1 구조적 문제

| 문제 | 현재 상태 | 권장 사항 | 우선순위 |
|------|----------|----------|----------|
| **components 폴더 비어있음** | 모든 UI가 screens에 집중 | 재사용 컴포넌트 분리 | 높음 |
| **중복 화면 파일** | StoreListHome 3개 버전 | 하나로 통합 | 중간 |
| **하드코딩된 값** | 색상, 카테고리 배열 | constants 폴더로 분리 | 중간 |
| **스타일 중복** | 각 화면에 동일 스타일 | 공통 스타일 모듈화 | 낮음 |

#### 3.2.2 중복 파일 목록

```
screens/
├── StoreListHome.tsx           # 기본 버전
├── StoreListHomeWithSearch.tsx # 검색 추가 버전
├── StoreList.tsx               # 검색 전용 버전 (중복?)
├── ReviewScreen.tsx            # 간단한 버전
├── ReviewWrite.tsx             # 향상된 버전
├── StoreReviewManagement.tsx   # 기본 버전
└── StoreReviewManagementWithReply.tsx # 향상된 버전
```

#### 3.2.3 추출해야 할 공통 컴포넌트

| 컴포넌트 | 사용 위치 | 예상 효과 |
|----------|----------|----------|
| `Button` | 전체 화면 | 일관된 버튼 스타일 |
| `Input` | 로그인, 회원가입, 프로필 | 일관된 입력 필드 |
| `Card` | 업체 목록, 상품 목록 | 재사용 가능한 카드 |
| `Header` | 모든 화면 | 일관된 헤더 |
| `LoadingSpinner` | API 호출 시 | 로딩 상태 표시 |
| `EmptyState` | 목록 비어있을 때 | 빈 상태 안내 |
| `StarRating` | 리뷰, 업체 상세 | 별점 표시/입력 |

#### 3.2.4 타입 개선 필요

```typescript
// 현재: any 타입 사용 예시 (개선 필요)
const [products, setProducts] = useState<any[]>([]);

// 권장: 명시적 타입 정의
interface Product {
  id: string;
  name: string;
  original_price: number;
  discounted_price: number;
  stock_quantity: number;
  // ...
}
const [products, setProducts] = useState<Product[]>([]);
```

---

## 4. 미완성 기능 상세

### 4.1 지도 기반 탐색 (미구현)

**현재 상태**: `StoreDetail.tsx`에 "추후 구현 예정" 텍스트만 표시

**필요 작업**:
1. 카카오맵 또는 구글맵 SDK 연동
2. 업체 위치 마커 표시
3. 현재 위치 기반 거리 계산
4. 클러스터링 (업체 밀집 지역)

### 4.2 실결제 연동 (미구현)

**현재 상태**: `StoreCashManagement.tsx`에 UI만 존재

**필요 작업**:
1. 토스페이먼츠 SDK 연동
2. 결제 창 호출
3. 웹훅 처리 (Edge Function)
4. 결제 완료 후 캐시 충전

### 4.3 푸시 알림 (미구현)

**현재 상태**: 코드에 알림 관련 로직 없음

**필요 작업**:
1. Expo Push Notifications 설정
2. 알림 권한 요청
3. 토큰 저장 (DB)
4. 알림 발송 로직 (Edge Function)

### 4.4 예약 취소 환불 (부분 구현)

**현재 상태**: 취소 UI는 있으나 환불 로직 불완전

**필요 작업**:
1. 픽업 1시간 전 취소 가능 조건 검증
2. 캐시 환불 처리
3. 재고 자동 복구 확인

---

## 5. 권장 개선 우선순위

### Phase 1: 즉시 개선 (1주)

| 작업 | 설명 | 영향도 |
|------|------|--------|
| 중복 화면 통합 | StoreListHome 3개 → 1개 | 유지보수성 향상 |
| 공통 컴포넌트 추출 | Button, Input, Card | 코드 재사용성 |
| 타입 정의 강화 | any 타입 제거 | 타입 안전성 |
| constants 분리 | 색상, 카테고리 | 일관성 |

### Phase 2: 핵심 기능 완성 (2주)

| 작업 | 설명 | PRD 우선순위 |
|------|------|-------------|
| 예약 취소 완성 | 환불 로직 구현 | 높음 |
| 지도 탐색 | 카카오맵 연동 | 높음 |
| 실결제 연동 | 토스페이먼츠 | 높음 |

### Phase 3: 부가 기능 (3주+)

| 작업 | 설명 | PRD 우선순위 |
|------|------|-------------|
| 푸시 알림 | Expo Push | 중간 |
| 검색 강화 | 통합 검색 | 중간 |
| 소셜 로그인 | 카카오/구글 | 낮음 |

---

## 6. 테스트 필요 항목

### 6.1 기능 테스트

- [ ] 로그인/로그아웃 플로우
- [ ] 회원가입 (소비자/업주)
- [ ] 업체 목록 필터링/정렬
- [ ] 예약 생성 및 확인
- [ ] 예약 취소 및 재고 복구
- [ ] 리뷰 작성 및 평점 반영
- [ ] 캐시 충전/차감 내역
- [ ] 상품 등록/수정/삭제
- [ ] 영업시간 설정

### 6.2 엣지 케이스

- [ ] 재고 부족 시 예약 시도
- [ ] 캐시 부족 상태에서 예약 확정
- [ ] 동시 예약 (동시성)
- [ ] 네트워크 오류 시 처리
- [ ] 세션 만료 시 처리

---

## 7. 결론

현재 코드베이스는 **MVP 기준 79% 완료** 상태이며, 핵심 비즈니스 로직은 대부분 구현되어 있습니다.

**강점**:
- Zustand 상태 관리 잘 적용됨
- Supabase 연동 안정적
- 주요 사용자 플로우 구현 완료

**개선 필요**:
- 코드 구조 개선 (컴포넌트 분리)
- 중복 코드 정리
- 미완성 기능 완성 (지도, 결제, 알림)

다음 단계로 **Phase 1 개선 작업**을 권장합니다.
