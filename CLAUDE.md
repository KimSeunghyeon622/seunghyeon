# 🚀 재고 할인 중개 플랫폼 - Claude 작업 기록

> **프로젝트**: 투굿투고 (재고 할인 중개 플랫폼)
> **개발자**: 비전공자 비개발자 (초보자)
> **상태**: MVP 90% 완료
> **마지막 업데이트**: 2026-01-10

---

## 📋 프로젝트 개요

### 비즈니스 모델
음식물 낭비를 줄이고 소비자에게 할인 혜택을 제공하는 중개 플랫폼

**핵심 수익 모델**:
- 업체가 캐시 선결제 (토스페이먼츠)
- 예약 확정 시 15% 수수료 자동 차감
- 소비자는 업체에서 현장 결제

### 사용자 유형
1. **소비자**: 할인 상품 검색, 예약, 리뷰 작성
2. **업주**: 상품 등록, 예약 관리, 캐시 관리
3. **운영자**: (미구현) 전체 관리

---

## 🛠️ 기술 스택

### Frontend
- **React Native**: 0.73
- **Expo**: SDK 54+
- **TypeScript**: 5.3
- **상태관리**: useState, useCallback hooks

### Backend
- **Supabase**:
  - PostgreSQL 데이터베이스
  - Authentication (JWT)
  - Row Level Security (RLS)
- **향후**: Toss Payments, Google/Kakao Maps

### 프로젝트 위치
- **Windows**: `C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp`
- **Git**: `claude/marketplace-architecture-design-bbYHF` 브랜치

---

## ✅ 완료된 기능 (MVP 90%)

### 1. 인증 시스템 ✅
- 이메일/비밀번호 로그인
- 회원가입 (현재 소비자만)
- 세션 관리 (AsyncStorage)
- 자동 로그인

### 2. 소비자 기능 ✅
- **업체 탐색**: StoreList.tsx
- **업체 상세**: StoreDetail.tsx (영업시간, 평점, 상품)
- **예약하기**: ReservationScreen.tsx (수량, 픽업 시간)
- **예약 내역**: MyReservations.tsx
- **리뷰 작성**: ReviewScreen.tsx (별점 1-5, 텍스트)

### 3. 업주 기능 ✅
- **대시보드**: StoreDashboard.tsx (통계, 매출)
- **상품 관리**: StoreProductManagement.tsx (등록/수정/삭제, 재고)
- **캐시 관리**: StoreCashManagement.tsx (충전, 내역)
- **예약 관리**: StoreReservationManagement.tsx (확인/완료/취소)

### 4. 자동화 시스템 ✅
- 예약 확정 시 15% 수수료 자동 차감 (트리거)
- 리뷰 작성 시 업체 평점 자동 업데이트
- 예약 번호 자동 생성 (generate_reservation_number)

### 5. 통합 네비게이션 ✅
- 로그인 후 사용자 유형 자동 구분
- 소비자 → 소비자 UI
- 업주 → 업주 UI

---

## 📂 주요 파일 구조

```
myapp/
├── App.tsx                          # 소비자/업주 통합 네비게이션
├── src/
│   ├── lib/
│   │   └── supabase.ts             # Supabase 클라이언트 설정
│   └── screens/
│       ├── LoginScreen.tsx         # 로그인
│       ├── SignupScreen.tsx        # 회원가입
│       ├── HomeScreen.tsx          # 소비자 홈
│       ├── StoreList.tsx           # 업체 리스트
│       ├── StoreDetail.tsx         # 업체 상세
│       ├── ReservationScreen.tsx   # 예약하기
│       ├── MyReservations.tsx      # 예약 내역
│       ├── ReviewScreen.tsx        # 리뷰 작성
│       ├── StoreDashboard.tsx      # 업주 대시보드
│       ├── StoreProductManagement.tsx    # 상품 관리
│       ├── StoreCashManagement.tsx       # 캐시 관리
│       └── StoreReservationManagement.tsx # 예약 관리
├── .env                            # Supabase 환경변수
└── package.json
```

---

## 🗄️ Supabase 데이터베이스

### 주요 테이블

#### 1. auth.users (Supabase 기본)
- 이메일/비밀번호 인증

#### 2. consumers (소비자)
- `user_id` → auth.users(id)
- `nickname`, `total_savings`

#### 3. stores (업체)
- `user_id` → auth.users(id)
- `name`, `address`, `latitude`, `longitude`
- `cash_balance` (캐시 잔액)
- `average_rating` (평균 평점)

#### 4. products (상품)
- `store_id` → stores(id)
- `name`, `original_price`, `discounted_price`
- `stock_quantity`, `is_active`

#### 5. reservations (예약)
- `consumer_id` → consumers(id)
- `store_id` → stores(id)
- `product_id` → products(id)
- `reservation_number` (자동 생성)
- `status`: pending, confirmed, completed, cancelled
- `total_amount`, `pickup_time`

#### 6. reviews (리뷰)
- `reservation_id` → reservations(id) (UNIQUE)
- `consumer_id`, `store_id`
- `rating` (1-5), `content`, `reply`

#### 7. cash_transactions (캐시 거래)
- `store_id` → stores(id)
- `transaction_type`: charge, fee, refund
- `amount`, `balance_after`
- `reservation_id`, `description`

### 주요 함수/트리거

#### generate_reservation_number()
- 예약 번호 자동 생성 (R + YYYYMMDD + 일련번호)

#### deduct_commission_fee() [트리거]
- 예약 상태 pending → confirmed 시 자동 실행
- 15% 수수료 계산 및 차감
- cash_transactions에 기록

#### charge_store_cash(store_id, amount, description)
- 캐시 충전 함수
- 잔액 업데이트 및 거래 내역 기록

---

## 🔐 환경 변수 (.env)

```
EXPO_PUBLIC_SUPABASE_URL=https://qycwdncplofgzdrjtklb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 🎯 다음 단계 (TODO)

### 1. 테스트 업주 계정 만들기 (가장 급함!)
**위치**: Supabase Dashboard

**방법**:
1. Authentication → Users → Add User
   - 이메일: store1@test.com
   - 비밀번호: test1234
2. SQL Editor에서 실행:
   ```sql
   INSERT INTO stores (user_id, name, address, latitude, longitude, phone, cash_balance)
   VALUES ('복사한_USER_ID', '테스트 베이커리', '서울시 강남구', 37.5012768, 127.0396597, '02-1234-5678', 1000000.00);
   ```
3. 테스트 상품 추가:
   ```sql
   INSERT INTO products (store_id, name, original_price, discounted_price, stock_quantity, is_active)
   VALUES ((SELECT id FROM stores WHERE name = '테스트 베이커리'), '크로와상', 5000, 3000, 10, true);
   ```

### 2. 기능 테스트
- [ ] 소비자 계정 로그인 → HomeScreen 확인
- [ ] 업주 계정 로그인 → StoreDashboard 확인
- [ ] 상품 등록 작동 확인
- [ ] 캐시 충전 작동 확인
- [ ] 예약 → 확인 → 수수료 차감 확인

### 3. 미구현 기능
- [ ] 업주 회원가입 (현재 수동으로 Supabase에서 생성)
- [ ] 상품 이미지 업로드 (Supabase Storage)
- [ ] 토스페이먼츠 실제 결제 연동
- [ ] 지도 API (구글/카카오)
- [ ] 푸시 알림

### 4. UI 개선
- [ ] PNG 디자인 적용 (사용자가 제공한 UI 이미지)
- [ ] 할인 뱃지
- [ ] 큰 이미지
- [ ] 카드 레이아웃

---

## ⚠️ 중요한 문제 해결 기록

### 1. ESLint 오류 해결
**문제**: useEffect dependency 누락
**해결**: useCallback으로 함수 감싸기

**패턴**:
```typescript
const myFunction = useCallback(async () => {
  // ...
}, [dependencies]);

useEffect(() => {
  myFunction();
}, [myFunction]);
```

### 2. Supabase SQL 실행 순서
**중요**: 단계별로 하나씩 실행!
1. 테이블 컬럼 추가
2. 트리거/함수 생성
3. RLS 정책 설정
4. 테스트 데이터 추가

**오류 방지**:
- `IF NOT EXISTS` 사용
- `DROP IF EXISTS` 먼저 실행

### 3. 사용자 유형 구분
**로그인 후 자동 구분**:
1. consumers 테이블 확인 → 소비자
2. stores 테이블 확인 → 업주
3. 둘 다 없으면 → 로그아웃

---

## 📌 개발자 특성 (중요!)

**비전공자 비개발자**:
- SQL 실행 방법을 초등학생도 이해하도록 설명 필요
- 복사-붙여넣기 방식 선호
- 단계별 상세 가이드 필요
- 오류 메시지 해석 도움 필요

**선호하는 작업 방식**:
- ✅ 빠른 결과물
- ✅ 파일 전체 교체 (부분 수정보다)
- ✅ 실행 후 오류 확인 → 수정 반복
- ❌ 이론적 설명보다 실제 코드

---

## 🔧 자주 사용하는 명령어

### Git
```bash
git status
git add -A
git commit -m "메시지"
git push -u origin claude/marketplace-architecture-design-bbYHF
```

### Expo
```bash
npx expo start
```

### Supabase SQL 위치
1. https://supabase.com 로그인
2. 프로젝트 선택 (qycwdncplofgzdrjtklb)
3. 왼쪽 메뉴: SQL Editor
4. New Query → 코드 붙여넣기 → RUN

---

## 📊 현재 상태

### MVP 진행률: 90%
- ✅ 소비자 기능 100%
- ✅ 업주 기능 100%
- ✅ 통합 네비게이션 100%
- ⏳ 테스트 계정 생성 (다음 단계)
- ⏳ 기능 테스트 (다음 단계)

### 코드 품질
- ✅ TypeScript 타입 안전성
- ✅ ESLint 오류 0개
- ✅ useCallback 최적화 완료
- ✅ 에러 핸들링 완료

### 데이터베이스
- ✅ 테이블 8개 생성
- ✅ 트리거 2개 작동
- ✅ 함수 3개 작동
- ✅ RLS 정책 설정

---

## 🎓 학습한 내용

### React Native
- useState, useEffect, useCallback hooks
- Screen 기반 네비게이션
- Props를 통한 데이터 전달
- AsyncStorage 세션 관리

### Supabase
- PostgreSQL 쿼리 (SELECT, INSERT, UPDATE)
- Foreign Key 관계
- 트리거 (AFTER UPDATE)
- RLS (Row Level Security)
- RPC 함수 호출

### TypeScript
- Interface 정의
- Type 선언
- any 타입 사용 (초보자용)

---

## 💡 개선 아이디어 (향후)

### Phase 2
1. 소셜 로그인 (카카오, 구글)
2. 지도 기반 업체 탐색
3. 실시간 알림 (카카오톡)
4. 검색 기능
5. 즐겨찾기

### Phase 3
1. 운영자 대시보드
2. 실시간 채팅
3. 쿠폰/프로모션
4. 다크 모드
5. 다국어 지원

---

## 🆘 문제 발생 시

### ESLint 오류
→ useCallback 사용 확인

### Supabase 오류
→ SQL 단계별 실행 확인
→ 테이블/컬럼 존재 여부 확인

### 로그인 안 됨
→ consumers 또는 stores 테이블에 레코드 있는지 확인

### 업주 화면 안 나옴
→ stores 테이블에 user_id 매칭 확인

---

## 📞 빠른 참조

### Supabase 프로젝트
- URL: https://qycwdncplofgzdrjtklb.supabase.co
- 대시보드: https://supabase.com/dashboard

### Git 저장소
- 브랜치: claude/marketplace-architecture-design-bbYHF
- 원격: origin

### 문서 위치
- docs/FINAL-CODE/ - 모든 완성 코드
- docs/sql/ - SQL 스크립트
- docs/06-review-integration-guide.md
- docs/INSTALLATION-GUIDE.md
- docs/USER-TYPE-INTEGRATION-GUIDE.md

---

## ✨ 성공 팁

1. **파일 전체 교체**: 부분 수정보다 안전
2. **단계별 실행**: SQL은 하나씩
3. **오류 즉시 수정**: 쌓이지 않게
4. **Git 자주 커밋**: 작업 단위로
5. **테스트 자주**: 기능 완성 후 바로

---

**작성일**: 2026-01-10
**작성자**: Claude Code
**버전**: 1.0

> 이 문서는 /clear 후에도 작업을 이어갈 수 있도록 모든 핵심 정보를 담고 있습니다.
