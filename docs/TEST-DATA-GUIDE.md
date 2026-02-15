# 테스트 데이터 설정 가이드

> **목적**: 소비자 앱 기능 테스트를 위한 업주/가게/상품/예약/리뷰 데이터 생성
> **예상 소요시간**: 10~15분

---

## 생성되는 테스트 데이터

### 1. 업주 계정 3개 (서로 다른 업종)

| 계정 | 이메일 | 가게명 | 업종 | 특징 |
|------|--------|--------|------|------|
| 업주1 | owner1@test.com | 엄마손 반찬집 | 반찬 | 30년 전통, 리뷰 15개, 평점 4.5 |
| 업주2 | owner2@test.com | 달콤 베이커리 | 제과 | 천연발효빵, 리뷰 42개, 평점 4.8 |
| 업주3 | owner3@test.com | 프레시 밀키트 | 밀키트 | 프리미엄 밀키트, 리뷰 28개, 평점 4.3 |

### 2. 소비자 계정 1개

| 계정 | 이메일 | 닉네임 |
|------|--------|--------|
| 소비자 | consumer@test.com | 테스트소비자 |

### 3. 각 가게별 데이터

**상품 (가게당 4개)**
- 현재 판매 중: 3개 (재고 있음, 할인 적용)
- 과거 상품: 1개 (판매 종료, 비활성)

**예약 내역 (소비자 기준 총 6건)**
| 상태 | 가게 | 용도 |
|------|------|------|
| ✅ 완료 | 반찬집 | 리뷰 작성됨 |
| ✅ 완료 | 베이커리 | 리뷰 작성됨 + 업주 답글 |
| ✅ 완료 | 밀키트 | 리뷰 미작성 (테스트용) |
| 🟡 확정 | 반찬집 | 진행 중 예약 |
| ❌ 취소 | 베이커리 | 취소 내역 확인용 |
| ⚠️ 노쇼 | 밀키트 | 노쇼 상태 확인용 |

**즐겨찾기**: 반찬집, 베이커리

---

## 실행 방법

### STEP 1: Supabase에서 테스트 계정 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴 → **Authentication** → **Users**
4. **Add User** → **Create new user** 클릭
5. 아래 4개 계정 생성:

```
이메일: owner1@test.com
비밀번호: test1234

이메일: owner2@test.com
비밀번호: test1234

이메일: owner3@test.com
비밀번호: test1234

이메일: consumer@test.com
비밀번호: test1234
```

> 💡 **Tip**: "Auto Confirm User" 체크하면 이메일 인증 없이 바로 사용 가능

### STEP 2: User ID 복사

계정 생성 후 Users 목록에서 각 사용자의 **User UID** 복사:

![User UID 위치](https://i.imgur.com/placeholder.png)

```
owner1@test.com → 복사한 UUID
owner2@test.com → 복사한 UUID
owner3@test.com → 복사한 UUID
consumer@test.com → 복사한 UUID
```

### STEP 3: SQL 파일 수정

`docs/test-data-setup.sql` 파일의 STEP 1 섹션에서 UUID 교체:

```sql
-- 아래 UUID를 Supabase에서 생성한 실제 user_id로 교체하세요
v_owner1_user_id UUID := '여기에_owner1_UUID_붙여넣기';
v_owner2_user_id UUID := '여기에_owner2_UUID_붙여넣기';
v_owner3_user_id UUID := '여기에_owner3_UUID_붙여넣기';
v_consumer_user_id UUID := '여기에_consumer_UUID_붙여넣기';
```

### STEP 4: SQL 실행

1. Supabase Dashboard → **SQL Editor**
2. **New Query** 클릭
3. `docs/test-data-setup.sql` 내용 전체 복사 & 붙여넣기
4. **Run** 버튼 클릭

### STEP 5: 확인

SQL 실행 결과에서 다음 확인:
- 가게 3개 생성됨
- 상품 12개 생성됨
- 예약 6개 생성됨
- 리뷰 5개 생성됨

---

## 테스트 시나리오

### 소비자 앱 테스트 (consumer@test.com / test1234)

| 기능 | 테스트 방법 |
|------|------------|
| **홈 화면** | 3개 가게가 표시되는지 확인 |
| **가게 상세** | 각 가게 클릭하여 상품, 리뷰, 영업시간 확인 |
| **예약하기** | 상품 선택 후 예약 진행 |
| **예약 내역** | 완료/확정/취소/노쇼 내역 확인 |
| **전화하기** | 예약 상세에서 가게 전화 연결 테스트 |
| **리뷰 작성** | 밀키트 완료 예약에서 리뷰 작성 |
| **내 리뷰** | 작성한 리뷰 목록, 업주 답글 확인 |
| **관심업체** | 즐겨찾기 목록 확인, 추가/삭제 |
| **알림 설정** | 알림 토글 테스트 |
| **FAQ** | FAQ 카테고리/내용 확인 |
| **고객센터** | 전화/이메일/카카오톡 연결 |

### 업주 앱 테스트 (owner1@test.com / test1234)

| 기능 | 테스트 방법 |
|------|------------|
| **대시보드** | 통계 및 메뉴 확인 |
| **상품 관리** | 현재/과거 상품 목록, 검색 |
| **예약 관리** | 확정 예약 처리 |
| **캐시 관리** | 잔액 확인, 충전, 영업상태 토글 |
| **캐시 내역** | 충전/수수료 내역 |
| **리뷰 관리** | 리뷰 목록, 답글 작성 |

---

## 문제 해결

### Q: SQL 실행 시 "duplicate key" 오류

기존 데이터가 있습니다. STEP 0.5의 삭제 쿼리를 먼저 실행하세요.

### Q: 로그인이 안 됨

1. Supabase에서 계정이 "Confirmed" 상태인지 확인
2. 이메일/비밀번호 정확히 입력했는지 확인

### Q: 가게가 안 보임

`stores` 테이블에서 `is_approved = true` 인지 확인하세요.

---

## 데이터 초기화 (재설정)

테스트 데이터를 삭제하고 다시 시작하려면:

```sql
-- 모든 테스트 데이터 삭제
DELETE FROM reviews WHERE store_id IN (SELECT id FROM stores WHERE name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM reservations WHERE store_id IN (SELECT id FROM stores WHERE name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM cash_transactions WHERE store_id IN (SELECT id FROM stores WHERE name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM favorites WHERE store_id IN (SELECT id FROM stores WHERE name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM store_operating_hours WHERE store_id IN (SELECT id FROM stores WHERE name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트'));
DELETE FROM stores WHERE name IN ('엄마손 반찬집', '달콤 베이커리', '프레시 밀키트');
DELETE FROM consumers WHERE nickname = '테스트소비자';
```

---

*작성일: 2026-01-19*
