# 🔄 소비자/업주 통합 가이드

> **목적**: App.tsx에 소비자와 업주 화면을 통합
> **소요 시간**: 5분
> **난이도**: ⭐⭐

---

## 📋 개요

현재 앱은 **소비자만** 사용 가능합니다.
업주 기능을 사용하려면 **App.tsx를 교체**해야 합니다.

---

## 🎯 작동 원리

### 로그인 후 자동 구분:
```
사용자 로그인
    ↓
consumers 테이블 확인
    ↓
있음 → 소비자 UI
    ↓
없음 → stores 테이블 확인
    ↓
있음 → 업주 UI
    ↓
없음 → 로그아웃
```

---

## 🔧 설치 방법

### 1️⃣ App.tsx 백업 (선택사항)
```bash
# 기존 App.tsx 백업
cp App.tsx App.tsx.backup
```

### 2️⃣ App.tsx 교체

**파일 위치**: `C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\App.tsx`

**방법**:
1. 기존 `App.tsx` 파일 **전체 삭제**
2. GitHub의 `docs/FINAL-CODE/App-INTEGRATED.tsx` 내용 복사
3. `App.tsx`에 붙여넣기
4. 저장 (Ctrl + S)

---

## ✅ 테스트

### 소비자 테스트:
1. 기존 소비자 계정으로 로그인
2. HomeScreen 표시되는지 확인
3. "주변 업체 보기", "내 예약 보기" 버튼 작동 확인

### 업주 테스트:
1. **업주 계정 생성** (아래 참조)
2. 업주 계정으로 로그인
3. StoreDashboard 표시되는지 확인
4. "예약 관리", "상품 관리", "캐시 관리" 버튼 작동 확인

---

## 🏪 업주 테스트 계정 만들기

### Supabase SQL Editor에서 실행:

```sql
-- 1. Supabase Auth에서 업주 계정 생성
-- (Supabase Dashboard > Authentication > Users > Add User)
-- 이메일: store1@test.com
-- 비밀번호: test1234

-- 2. stores 테이블에 업주 추가
INSERT INTO stores (
  user_id,
  name,
  address,
  phone,
  cash_balance,
  average_rating
) VALUES (
  '업주_USER_ID',  -- Supabase Auth에서 생성한 user의 id
  '테스트 베이커리',
  '서울시 강남구 테헤란로 123',
  '02-1234-5678',
  1000000.00,  -- 초기 캐시 100만원
  0.0
);

-- 3. 테스트 상품 추가
INSERT INTO products (
  store_id,
  name,
  original_price,
  discounted_price,
  stock_quantity,
  is_active,
  image_url
) VALUES (
  '업체_STORE_ID',  -- 위에서 생성한 store의 id
  '크로와상 (유통기한 임박)',
  5000,
  3000,
  10,
  true,
  null
);
```

**업주 USER_ID 찾는 방법**:
1. Supabase Dashboard
2. Authentication → Users
3. 방금 생성한 사용자 클릭
4. `id` 필드 복사

---

## 🎨 UI 차이

### 소비자 UI:
- 홈 화면
- 업체 리스트
- 업체 상세
- 예약하기
- 내 예약
- 리뷰 작성

### 업주 UI:
- 대시보드 (통계)
- 상품 관리 (등록/수정/삭제)
- 캐시 관리 (충전/내역)
- 예약 관리 (확인/완료/취소)

---

## 🔍 주요 변경사항

### App.tsx 주요 코드:

```typescript
// 사용자 유형 구분
type UserType = 'consumer' | 'store' | null;

// 사용자 유형 체크 함수
const checkUserType = async (userId: string) => {
  // 1. consumers 테이블 확인
  const { data: consumer } = await supabase
    .from('consumers')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (consumer) {
    setUserType('consumer');
    setConsumerScreen('home');
    return;
  }

  // 2. stores 테이블 확인
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (store) {
    setUserType('store');
    setStoreScreen('dashboard');
    return;
  }

  // 3. 둘 다 아니면 로그아웃
  await supabase.auth.signOut();
};
```

---

## ❗ 중요 사항

### 1. 회원가입 화면 수정 필요 (향후)
현재 SignupScreen은 소비자 가입만 지원합니다.
업주 가입은 **수동으로** Supabase에서 생성해야 합니다.

**향후 개선**:
- 회원가입 시 "소비자" / "업주" 선택
- 업주 선택 시 stores 테이블에 자동 추가
- 사업자 등록번호, 업체명 등 추가 정보 입력

### 2. 동일 사용자가 소비자 + 업주?
현재는 **하나의 유형만** 가능합니다.
- consumers 테이블에 있으면 → 소비자
- stores 테이블에 있으면 → 업주

**향후 개선**:
- user_profiles 테이블에 user_type 컬럼 추가
- 로그인 후 유형 선택 화면 표시
- 한 계정으로 소비자/업주 전환 가능

### 3. 네비게이션 히스토리
뒤로가기 버튼으로 screen state 변경합니다.
Android 하드웨어 뒤로가기는 **지원하지 않습니다**.

**향후 개선**:
- React Navigation 도입
- 네이티브 뒤로가기 지원
- 딥링크 지원

---

## 🧪 테스트 체크리스트

### 소비자 기능:
- [ ] 소비자 로그인 → HomeScreen 표시
- [ ] 업체 탐색 작동
- [ ] 예약 작동
- [ ] 리뷰 작성 작동

### 업주 기능:
- [ ] 업주 로그인 → StoreDashboard 표시
- [ ] 상품 관리 작동
- [ ] 캐시 관리 작동
- [ ] 예약 관리 작동
- [ ] 대시보드 통계 표시

### 유형 구분:
- [ ] 소비자 계정은 업주 화면 접근 불가
- [ ] 업주 계정은 소비자 화면 접근 불가
- [ ] 로그아웃 → 로그인 화면 복귀

---

## 🚀 완료!

이제 소비자와 업주가 각자의 화면을 사용할 수 있습니다!

**다음 단계**:
1. UI 개선 (PNG 디자인 적용)
2. 업주 회원가입 화면 추가
3. 토스페이먼츠 연동
4. 지도 API 추가

---

**작성**: Claude Code
**버전**: 1.0
**날짜**: 2026-01-10
