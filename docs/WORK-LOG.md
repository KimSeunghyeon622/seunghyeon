# 프로젝트 업무 이력 (Work Log)

> **프로젝트명**: 재고 할인 중개 플랫폼 (투굿투고 유사 서비스)
> **마지막 업데이트**: 2026-02-13
> **현재 상태**: MVP 개발 진행 중 (95% 완료)

---

## ⚠️ AI 어시스턴트 필수 확인사항

**새로운 세션 시작 시, 사용자가 요청하지 않아도 반드시 이 파일의 "최근 업데이트" 섹션을 자동으로 읽고 확인해야 합니다.**

---

## 최근 업데이트

### 2026-02-02 (useFocusEffect 긴급 버그 수정)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| useFocusEffect 오류 해결 | tdd-agent | `StoreDetail.tsx` | NavigationContainer 없어서 발생한 오류 해결 |

**문제**: `useFocusEffect` 훅이 `NavigationContainer`를 찾을 수 없어서 오류 발생
**원인**: 현재 앱은 React Navigation 대신 수동 화면 전환 사용
**해결**: `useFocusEffect` → `useEffect`로 변경

**검증:** TypeScript 에러 0건

---

### 2026-02-02 (리뷰/별점 기능 3가지 개선)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 업체 리스트에서 리뷰/별점 실시간 반영 | tdd-agent | `StoreListHome.tsx` | reviews 조인 + 직접 계산 |
| 업체 상세페이지 리뷰 3개 + 더보기 버튼 | tdd-agent | `StoreDetail.tsx` | 5개→3개 변경 |
| 전체 리뷰 화면 신규 생성 | tdd-agent | `StoreAllReviewsScreen.tsx` | 신규 화면 |
| App.tsx 네비게이션 연결 | tdd-agent | `App.tsx` | 상태 추가 |
| UI 디자인 문서 작성 | frontend-design | `UI_DESIGN_StoreAllReviewsScreen.md` | - |

**구현 완료:**
1. **업체 리스트 리뷰/별점 실시간 반영**: stores 조회 시 reviews 조인하여 평점/리뷰 수 직접 계산
2. **업체 상세 리뷰 섹션**: 최대 3개 표시 + '리뷰 더 보기' 버튼 (3개 초과 시)
3. **전체 리뷰 화면**: 평점 요약, 별점 분포, 정렬 기능, 모든 리뷰 목록

**검증:** TypeScript 에러 0건

---

### 2026-02-02 (리뷰 새로고침 + DB 상품명 정리)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 리뷰 화면 복귀 시 자동 새로고침 | tdd-agent | `StoreDetail.tsx` | useFocusEffect 적용 |
| DB 상품명 [삭제됨] 접두어 제거 | 팀장 (MCP) | DB 직접 실행 | 1건 정리 완료 |

**구현 완료:**
1. **리뷰 새로고침 문제 해결**: `useEffect` → `useFocusEffect`로 변경하여 화면 복귀 시 리뷰 자동 새로고침
2. **DB 상품명 정리**: `[삭제됨] [삭제됨] [삭제됨] 크로와상` → `크로와상 (유통기한 임박)`으로 정리

**검증:** TypeScript 에러 0건

---

### 2026-01-27 (리뷰/별점 기능 개선 + 상품 삭제 버그 수정)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 리뷰/별점 업체 페이지 실시간 반영 | tdd-agent | `StoreDetail.tsx` | reviews 배열에서 직접 계산 |
| 별점만으로 리뷰 등록 가능 | tdd-agent | `ReviewScreen.tsx` | 리뷰 텍스트 필수 해제 |
| 버튼 텍스트 변경 | tdd-agent | `ReviewScreen.tsx` | '리뷰 등록' → '별점 등록' |
| 상품 삭제 시 [삭제됨] 중복 방지 | tdd-agent | `StoreProductManagement.tsx` | 상품명 변경 로직 제거 |

**구현 완료:**

1. **리뷰/별점 업체 페이지 실시간 반영**:
   - 업체 상세 페이지에서 `store.average_rating`과 `store.review_count` 대신 `reviews` 배열에서 직접 계산하도록 변경
   - 리뷰 작성 후 새로고침 없이 즉시 평점/리뷰 수 반영

2. **별점만으로 리뷰 등록 가능**:
   - 리뷰 내용 필수 검사 로직 제거
   - 별점만 선택해도 등록 가능

3. **버튼 텍스트 변경**:
   - '리뷰 등록' → '별점 등록'으로 변경

4. **상품 삭제 시 [삭제됨] 중복 방지**:
   - 삭제 시 상품명에 `[삭제됨]` 접두어 추가하던 로직 제거
   - `is_active: false`만 설정하여 soft delete 처리
   - 재판매/재삭제해도 상품명 유지

**검증 결과:**
- TypeScript: 에러 0건
- Playwright 테스트: 업체 상세 페이지에서 리뷰 수/평점 정상 표시 확인

---

### 2026-01-27 (RLS 정책 수정 + 네비게이션 개선)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| consumers RLS 정책 수정 | 팀장 (MCP) | DB 마이그레이션 | 업주가 예약 고객 정보 조회 가능 |
| 업주 예약 취소 시 소비자 알림 | - | RLS 정책으로 해결 | `consumers.user_id` 조회 가능 |
| 업주 예약 화면 고객 닉네임 표시 | - | RLS 정책으로 해결 | `consumers.nickname` 조회 가능 |
| 업주 예약 화면 고객 전화번호 표시 | - | RLS 정책으로 해결 | `consumers.phone` 조회 가능 |
| 리뷰 완료건 클릭 시 리뷰 관리 이동 | tdd-agent | `PurchaseHistoryScreen.tsx` | TouchableOpacity로 변경 |
| 리뷰 작성 완료 후 원래 화면 복귀 | tdd-agent | `ReviewScreen.tsx`, `App.tsx`, `selectionStore.ts` | onComplete prop 추가 |

**구현 완료:**

1. **consumers RLS 정책 수정** (3가지 버그 해결):
   - **근본 원인**: `consumers` 테이블 RLS가 `auth.uid() = user_id`만 허용하여 업주가 고객 정보 조회 불가
   - **해결**: `get_my_store_customer_ids()` SECURITY DEFINER 함수 생성 + 새 RLS 정책 추가
   - **효과**: 업주 예약 화면에서 고객 닉네임/전화번호 표시, 예약 취소 시 소비자 알림 정상 동작

2. **최근 구매 내역 리뷰 완료건 클릭 시 리뷰 관리로 이동**:
   - `PurchaseHistoryScreen`에 `onNavigateToMyReviews` prop 추가
   - 리뷰 완료 뱃지를 `TouchableOpacity`로 변경하여 클릭 가능

3. **리뷰 작성 완료 후 원래 화면으로 복귀**:
   - `selectionStore`에 `reviewReturnScreen` 상태 추가
   - `ReviewScreen`에 `onComplete` prop 추가
   - purchasehistory에서 리뷰 작성 시 purchasehistory로 복귀

**검증 결과:**
- TypeScript: 에러 0건

---

### 2026-01-26 (6가지 버그 수정 및 UX 개선)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 리뷰 이미지 업로드 오류 수정 | tdd-agent | `reviewApi.ts` | blob.arrayBuffer 에러 해결 |
| 업체 평점 계산 오류 수정 | tdd-agent | `ReviewScreen.tsx` | 평점 업데이트 로직 개선 + DB 수동 업데이트 |
| 최근 구매 내역 리뷰 완료 표시 | tdd-agent | `PurchaseHistoryScreen.tsx` | 명시적 리뷰 조회로 변경 |
| '작성한 리뷰' → '리뷰 관리' | tdd-agent | `MyPageScreen.tsx` | 메뉴명 변경 |
| 업주 예약 화면 디폴트 탭 | tdd-agent | `MyReservations.tsx` | '내 매장 예약' 탭 디폴트 |
| 상품 삭제 오류 해결 | tdd-agent | `StoreProductManagement.tsx` | soft delete 방식 적용 |

**구현 완료:**
1. **리뷰 이미지 업로드 오류 수정**:
   - `blob.arrayBuffer()` 대신 `expo-file-system`과 `base64-arraybuffer` 사용
   - React Native 환경 호환성 확보

2. **업체 평점 계산 오류 수정**:
   - 리뷰 작성 후 평점 업데이트 로직에 에러 핸들링 강화
   - 500ms 딜레이 추가로 DB 반영 시간 확보
   - 기존 데이터 Supabase MCP로 수동 업데이트 (달콤 베이커리: 4.5 → 3.7점)

3. **최근 구매 내역 리뷰 완료 표시**:
   - Supabase 자동 조인 대신 명시적 `reservation_id` 조건으로 리뷰 조회
   - `Promise.all`로 각 예약별 리뷰 존재 여부 개별 확인

4. **메뉴명 변경**: '알림 설정' → '알림', '작성한 리뷰' → '리뷰 관리'

5. **업주 예약 화면**: store 조회 후 `setActiveTab('store')` 호출

6. **상품 삭제**: hard delete → soft delete (is_active=false, 이름에 [삭제됨] 접두어)

**검증 결과:**
- TypeScript: 에러 0건
- Supabase 평점 업데이트: 성공

---

### 2026-01-25 (10가지 기능 개발 1-4번 - 예약/리뷰 화면 개선)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 4번: 업주 예약 탭 순서 변경 | tdd-agent | `MyReservations.tsx` | "내 매장 예약" 좌측 배치 |
| 2번: 업주 취소 시 소비자 알림 | tdd-agent | `MyReservations.tsx` | 이미 구현됨 (확인) |
| 1번: 최근 구매 내역 별도 화면 | tdd-agent | `PurchaseHistoryScreen.tsx` | 신규 화면 생성 |
| 3번: 업주 리뷰 탭 분리 | tdd-agent | `MyReviewsScreen.tsx` | 우리 가게 리뷰 + 내가 작성한 리뷰 2탭 |

**구현 완료:**
1. **업주 예약 탭 순서 변경**: "내 매장 예약" (좌측) / "나의 예약" (우측)
2. **업주 취소 시 알림**: 기존 구현 확인 - `handleStoreCancelReservation`에서 소비자 user_id로 알림 INSERT
3. **최근 구매 내역 별도 화면**:
   - `PurchaseHistoryScreen.tsx` 신규 생성
   - picked_up=true인 확정 거래건만 표시
   - 리뷰 미작성 건에 "리뷰 작성" 버튼
   - MyPageScreen "전체보기" 클릭 시 이동
4. **업주 리뷰 탭 분리**:
   - 업주: "우리 가게 리뷰" + "내가 작성한 리뷰" 2탭
   - 일반 소비자: 기존 화면 유지 (탭 없음)
   - 답글 작성/수정 모달 포함

**UI 디자인 문서:**
- `docs/plans/UI_DESIGN_PurchaseHistoryScreen.md` 생성
- `docs/plans/UI_DESIGN_MyReviewsScreen_OwnerTab.md` 생성

**타입 체크:** `npx tsc --noEmit` 성공

---

### 2026-01-25 (8가지 기능 개발 - 리뷰/예약 UX 개선)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 픽업 완료 시 리뷰 작성 선택 옵션 | tdd-agent | `MyReservations.tsx` | "나중에 작성하기" 버튼 추가 |
| 작성한 리뷰 업체명 클릭 시 상세페이지 이동 | tdd-agent | `MyReviewsScreen.tsx` | 업체명 클릭 시 StoreDetail 이동 |
| 작성한 리뷰에 업주 답글 표시 | tdd-agent | `MyReviewsScreen.tsx` | 이미 구현됨 (확인 완료) |
| 소비자 리뷰 수정 기능 | tdd-agent | `MyReviewsScreen.tsx` | 수정 모달 추가, 별점/내용 수정 가능 |
| 업주 답글 수정 기능 | tdd-agent | `StoreReviewManagement.tsx` | 이미 구현됨 (확인 완료) |
| 예약 시 재고 즉시 차감 | tdd-agent | `create_reservation_secure` RPC | SQL 마이그레이션 파일 생성 |
| 내 매장 예약에 고객 닉네임 표시 | tdd-agent | `MyReservations.tsx` | 이미 구현됨 (확인 완료) |
| 내 매장 예약에 고객 전화번호 표시 | tdd-agent | `MyReservations.tsx` | 이미 구현됨 (확인 완료) |

**구현 완료:**
1. **픽업 완료 시 리뷰 선택 옵션**: Alert로 "나중에 작성하기" / "리뷰 작성" 선택 가능
2. **작성한 리뷰 화면 개선**:
   - 업체명 클릭 시 상세 페이지로 이동 (파란색 링크 스타일)
   - 각 리뷰에 "수정" 버튼 추가
   - 수정 모달에서 별점/내용 수정 후 DB 업데이트
   - 업주 답글 표시 (기존 구현 확인)
3. **maybeSingle() 규칙 적용**: consumers 조회 시 single() -> maybeSingle()

**이미 구현되어 있던 기능:**
- 업주 답글 수정 (StoreReviewManagement.tsx)
- 내 매장 예약에 고객 닉네임/전화번호 표시 (MyReservations.tsx)

**SQL 마이그레이션:**
- `docs/sql/20260125-create-reservation-secure-v2.sql` 생성
- 예약 시 stock_quantity 즉시 차감 로직 포함

---

### 2026-01-24 (업주 화면 UX 개선 및 예약 탭 분리)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 예약 화면 탭 분리 (소비자/매장 구분) | tdd-agent | `app/src/screens/MyReservations.tsx` | '나의 예약'과 '내 매장 예약' 탭 분리 |
| 가게 정보 수정 시 updated_at 자동 업데이트 | tdd-agent | `app/src/screens/StoreInfoManagement.tsx` | 수정 후 즉시 홈 화면 반영 |
| 영업시간 입력 UX 개선 | tdd-agent | `app/src/screens/StoreInfoManagement.tsx` | 시/분 입력 상자 분리, ':' UI 표시 |
| 픽업 시간 포맷팅 개선 | tdd-agent | `app/src/screens/MyReservations.tsx` | '01월 24일 18:00' 형식으로 표시 |
| 테스트 계정 정보 문서 생성 | 팀장 | `docs/TEST-ACCOUNTS.md` | 테스트용 계정 정보 정리 |

**문제:**
1. 업체 정보 수정 후 홈 화면에 반영 안 됨
2. 영업시간 입력 시 ':' 직접 입력 불편
3. 픽업 예약시간 표시 오류
4. 업주가 다른 업체 예약 시 "내 매장 예약"에 표시됨

**해결:**
1. **MyReservations.tsx 대폭 개선**
   - 탭 분리: "나의 예약" (소비자로서 한 예약) / "내 매장 예약" (업주로서 받은 예약)
   - 각 탭에 맞는 데이터 별도 조회 및 표시
   - 내 매장 예약에는 고객 정보(닉네임, 전화번호) 표시
   - 픽업 시간 포맷 개선: `formatPickupTime()` 함수 추가

2. **StoreInfoManagement.tsx 개선**
   - `updated_at` 필드 명시적 업데이트 추가 (즉시 반영)
   - 영업시간 입력 UI 개선: 시(HH)와 분(MM) 입력 상자 분리
   - 숫자만 입력 가능, 자동 범위 체크 (시: 00-23, 분: 00-59)
   - ':' 구분자는 UI에 표시 (입력 불필요)

**테스트 계정:**
- 업주: owner1@test.com (엄마손 반찬집), owner2@test.com (달콤 베이커리), owner3@test.com (프레시 밀키트)
- 소비자: consumer@test.com (테스트소비자)
- 상세 정보: `docs/TEST-ACCOUNTS.md` 참고

---

### 2026-01-24 (예약 기능 버그 수정 - reserved_quantity 오류 해결)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| create_reservation_secure 함수 수정 | tdd-agent | Supabase RPC 함수 | reserved_quantity 컬럼 없이 동작하도록 수정 |
| Product 타입 정의 수정 | tdd-agent | `app/src/types/database.ts` | 실제 DB 스키마와 일치하도록 수정 |

**문제:**
- 업체 상세페이지에서 "바로 예약" 클릭 시 "예약 실패" 발생
- 오류 메시지: `column p.reserved_quantity does not exist`
- `create_reservation_secure` RPC 함수가 DB에 없는 `reserved_quantity` 컬럼 참조

**원인:**
- `docs/security-enhancement.sql`이 아직 적용되지 않았음
- 해당 SQL에 `reserved_quantity` 컬럼 추가가 포함되어 있었으나 미적용

**해결:**
- RPC 함수를 `reserved_quantity` 없이 `stock_quantity`만 사용하도록 수정
- 예약 시 `stock_quantity` 직접 차감 방식으로 변경
- TypeScript `Product` 인터페이스를 실제 DB 스키마와 일치하도록 수정

**변경 내용:**
1. `create_reservation_secure` 함수: `reserved_quantity` 참조 제거, `stock_quantity`만 사용
2. `types/database.ts`: `reserved_quantity` 제거, `manufactured_date`, `send_notification`, `category` 추가

---

### 2026-01-23 (소셜 로그인 후 회원 유형 선택 기능 및 구글 로그인 비활성화)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 소셜 로그인 후 회원 유형 선택 기능 구현 | tdd-agent | `authStore.ts`, `navigationStore.ts`, `ConsumerSignupScreen.tsx`, `StoreSignupScreen.tsx`, `SignupTypeScreen.tsx`, `App.tsx`, `StoreListHome.tsx` | 구글 로그인 비활성화로 현재 미사용 |
| 구글 로그인 기능 비활성화 (MVP 단계) | tdd-agent | `LoginScreen.tsx` | 나중에 필요시 재활성화 가능하도록 주석 처리 |

**주요 내용:**
- 구글 로그인 성공 후 일반 소비자/업주 선택 화면 추가
- 소비자 선택 시: 전화번호만 입력 (닉네임은 선택사항)
- 업주 선택 시: 이메일/비밀번호 제외하고 업체 정보만 입력
- MVP 단계에서 구글 로그인 기능 비활성화 (버튼 숨김, 코드 주석 처리)
- StoreListHome.tsx에서 자동 소비자 등록 로직 제거 (이미 등록된 사용자만 조회)

**구현된 기능:**
1. **소셜 로그인 후 프로필 설정 플로우**: 구글 로그인 성공 후 회원 유형 선택 → 추가 정보 입력
2. **소비자 추가 정보 입력**: 전화번호 필수, 닉네임 선택 (미입력 시 이메일 아이디 사용)
3. **업주 추가 정보 입력**: 업체명, 카테고리, 대표자명, 연락처, 사업자등록번호, 주소 입력

**비활성화된 기능:**
- 구글 로그인 버튼 및 관련 코드 (주석 처리, 나중에 재활성화 가능)

---

### 2026-01-23 (관심업체, 알림설정, 장바구니 기능 추가)
| 작업 | 담당 | 산출물 | 비고 |
|------|------|--------|------|
| 업체리스트 관심업체(하트) 기능 | tdd-agent | `app/src/screens/StoreListHome.tsx` | 하트 클릭 시 관심업체 등록/해제 |
| 메인 홈 헤더 장바구니 아이콘 | tdd-agent | `app/src/screens/StoreListHome.tsx` | 헤더 우측에 장바구니 아이콘 추가 |
| 업체 상세페이지 알림 설정 | tdd-agent | `app/src/screens/StoreDetail.tsx` | 전체/특정 제품군 알림 선택 모달 |
| 고정 장바구니 아이콘 (Floating) | tdd-agent | `app/src/screens/StoreDetail.tsx` | 우측 하단 고정 버튼 |
| 과거 상품 이력 개선 | tdd-agent | `app/src/screens/StoreProductManagement.tsx` | 신규 등록 제품도 즉시 이력에 포함 |
| 버그 수정: single() → maybeSingle() | tdd-agent | `StoreListHome.tsx`, `StoreDetail.tsx` | 소비자 조회 시 에러 방지 |
| 상세페이지 우측 상단 장바구니 제거 | tdd-agent | `app/src/screens/StoreDetail.tsx` | floating 버튼과 중복 제거 |
| 상세페이지 카테고리 표시 제거 | tdd-agent | `app/src/screens/StoreDetail.tsx` | 가게명 옆 카테고리 제거 |
| tdd-agent 규칙 추가 | 팀장 | `.claude/agents/tdd-agent.md` | frontend-design 필수, maybeSingle() 규칙 |

**주요 내용:**
- 업체리스트에서 하트 클릭으로 관심업체 등록/해제 가능
- 메인 홈에서도 장바구니 아이콘 표시 (아이템 개수 뱃지)
- 업체 상세페이지에서 알림 설정 가능 (전체 알림 / 특정 제품만 알림)
- 스크롤해도 고정되는 장바구니 버튼 (Floating Action Button)
- 신규 등록 제품이 즉시 "과거 상품 불러오기"에 포함됨

**버그 수정:**
- `single()` → `maybeSingle()` 변경: consumers 테이블 조회 시 데이터 없으면 에러 발생하던 문제 수정

**추가된 규칙:**
1. **신규 화면 개발 시 frontend-design 스킬 필수 활용**
2. **Supabase single() vs maybeSingle() 사용 규칙 명시**

---

## 다음 작업 목록

### 🔥 즉시 진행 필요
1. **테스트 자동화**
   - Playwright MCP로 E2E 테스트 작성
   - 주요 플로우 자동 테스트

### 우선순위 높음
2. **지도 탐색 기능 구현**
   - 카카오맵 연동

### 우선순위 중간
3. **토스페이먼츠 실결제 연동**
4. **푸시 알림 실제 연동** (Expo Push - Development Build 필요)
5. **매출 통계 기능 구현**

### 우선순위 낮음
6. **소셜 로그인 구현** (카카오/구글)
7. **운영자 대시보드 구현**

---

## 프로젝트 진행 상태

### 기능 구현 현황

**소비자 기능** (95% 완료)
- ✅ 로그인/회원가입
- ✅ 업체 리스트 조회 (카테고리, 별점 필터)
- ✅ 업체 상세 보기
- ✅ 예약하기 (바로 예약 + 장바구니)
- ✅ 예약 내역 조회 (탭 분리, 전화하기 기능 포함)
- ✅ 리뷰 작성
- ✅ 마이페이지 (5개 메뉴 완성)
- ✅ 즐겨찾기 (관심업체 화면)
- ✅ 작성한 리뷰 화면
- ✅ 알림 설정 화면 (업체별 전체/특정 제품 알림)
- ✅ FAQ 화면
- ✅ 고객센터 화면
- ✅ 장바구니 기능
- ❌ 지도 탐색 (미구현)
- ❌ 소셜 로그인 (비활성화)
- ❌ 푸시 알림 연동 (UI만 완료)

**업주 기능** (90% 완료)
- ✅ 업주 회원가입
- ✅ 대시보드
- ✅ 상품 관리 (과거상품 검색 기능 포함)
- ✅ 캐시 관리 (영업상태 수동 변경 가능)
- ✅ 예약 관리 (내 매장 예약 / 나의 예약 탭 분리)
- ✅ 리뷰 관리
- ✅ 업체 정보 관리 (영업시간 UX 개선)
- ❌ 매출 통계 (미구현)
- ❌ 재고 예측 (미구현)

---

## 테스트 환경

### 테스트 도구 현황
| 테스트 유형 | 도구 | 상태 | 비고 |
|------------|------|------|------|
| **SQL 쿼리 검증** | Supabase MCP | ✅ 사용 중 | 실시간 DB 쿼리 실행 |
| **E2E 테스트** | Playwright MCP | ✅ 준비 완료 | Expo 웹 빌드 완료 (`dist/`) |
| **유닛 테스트** | Jest | ✅ 준비 완료 | `npm test` 실행 가능 |

### 테스트 계정
- 상세 정보: `docs/TEST-ACCOUNTS.md` 참고
- 업주: owner1@test.com, owner2@test.com, owner3@test.com
- 소비자: consumer@test.com

---

## 알려진 이슈

없음

---

**문의사항이나 문제가 있으면 관련 문서를 확인하세요.**
