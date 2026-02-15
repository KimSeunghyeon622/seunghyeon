# 보안 강화 가이드

## 개요

보안 점검 결과 발견된 취약점을 수정하기 위한 가이드입니다.

> **최종 업데이트**: 2026-02-12
> **버전**: v2.0

---

## 적용 순서

### 1단계: 패키지 설치 (필수)

```bash
cd app
npx expo install expo-secure-store
```

### 2단계: Supabase SQL 실행 (필수)

Supabase 대시보드 - SQL Editor에서 다음 파일 실행:

**통합 마이그레이션 (권장):**
```
docs/migrations/000_security_fixes_all.sql
```

**또는 개별 마이그레이션:**
```
docs/migrations/001_create_public_stores_view.sql
docs/migrations/002_push_token_access_control.sql
docs/migrations/003_create_rating_trigger.sql
docs/migrations/004_create_reservation_status_rpc.sql
```

**기존 보안 함수 (이미 적용된 경우 생략):**
```
docs/security-enhancement.sql
```

---

## 수정된 취약점 요약

### 1. 비즈니스 로직 노출 (치명적) ✅ 해결

**문제점:**
- 프론트엔드에서 `total_amount` 계산 후 DB에 전송
- 악의적 사용자가 가격을 0원으로 조작 가능

**해결책:**
- `create_reservation_secure` RPC 함수 생성
- 서버에서 상품 가격 조회 및 금액 계산
- 프론트엔드는 `product_id`, `quantity`만 전송

**수정 파일:**
- `docs/security-enhancement.sql` (함수 생성)
- `app/src/screens/ReservationScreen.tsx` (RPC 호출)

---

### 2. 재고 동시성 문제 (높음) ✅ 해결

**문제점:**
- 재고 확인과 차감이 분리됨 (TOCTOU 취약점)
- 1개 남은 상품을 2명이 동시 예약 시 마이너스 재고 발생

**해결책:**
- `FOR UPDATE` 문으로 행 잠금 (Row Lock)
- 단일 트랜잭션 내에서 재고 확인 + 차감 처리

**수정 파일:**
- `docs/security-enhancement.sql`

---

### 3. stores 테이블 민감 정보 노출 (중간) ✅ 해결

**문제점:**
- `stores` 테이블 전체 조회 가능
- `cash_balance`, `business_number` 등 노출

**해결책:**
- `public_stores` 뷰 생성 (민감 컬럼 제외)
- 프론트엔드에서 stores 직접 조회 대신 뷰 사용 권장

**프론트엔드 변경 권장:**
```typescript
// 변경 전
const { data } = await supabase.from('stores').select('*');

// 변경 후 (민감 정보 제외된 뷰 사용)
const { data } = await supabase.from('public_stores').select('*');
```

---

### 4. reviews INSERT 정책 강화 ✅ 해결

**문제점:**
- 예약하지 않은 업체에도 리뷰 작성 가능

**해결책:**
- `reviews_insert_with_reservation` 정책 추가
- 완료된 예약(completed/picked_up)이 있는 경우만 리뷰 작성 허용

---

### 5. cash_transactions INSERT 차단 ✅ 해결

**문제점:**
- 클라이언트에서 직접 거래 내역 삽입 가능

**해결책:**
- INSERT 정책 미생성으로 클라이언트 직접 삽입 차단
- `process_cash_charge_secure` 함수를 통해서만 처리

---

### 6. 보안 저장소 (낮음) ✅ 해결

**문제점:**
- `AsyncStorage`에 인증 토큰 저장
- 앱 데이터에서 평문 접근 가능

**해결책:**
- `expo-secure-store` 사용
- 네이티브에서 하드웨어 수준 암호화

**수정 파일:**
- `app/src/lib/supabase.ts`

---

## 추가 권장 사항

### Supabase Auth 설정 (대시보드에서 설정)

1. **이메일 확인 강제화**
   - Authentication → Providers → Email → Confirm email 활성화

2. **비밀번호 정책**
   - Authentication → Policies → Password 설정
   - 최소 8자, 대소문자 + 숫자 + 특수문자 권장

### 환경 변수 보안 (배포 시)

```bash
# EAS 시크릿 설정 (빌드 시 환경변수 보호)
eas secret:create --name SUPABASE_URL --value "your-url"
eas secret:create --name SUPABASE_ANON_KEY --value "your-key"
```

---

### 7. push_token 접근 제한 (중간) - 추가됨

**문제점:**
- consumers, stores 테이블의 push_token이 노출 가능
- 푸시 토큰 탈취 시 스팸 알림 발송 가능

**해결책:**
- consumers/stores 테이블 RLS 정책 강화
- `public_consumers` 뷰 생성 (push_token 제외)
- store_notification_settings 테이블 정책 추가

**프론트엔드 변경 권장:**
```typescript
// 예약자 정보 조회 시 public_consumers 뷰 사용
const { data } = await supabase.from('public_consumers').select('*');
```

---

### 8. 평점 조작 방지 (중간) - 추가됨

**문제점:**
- 클라이언트에서 직접 stores.average_rating 수정 가능
- 악의적 사용자가 평점 조작 가능

**해결책:**
- reviews 테이블 INSERT/UPDATE/DELETE 트리거 생성
- stores.average_rating, review_count 자동 계산
- 클라이언트에서 직접 수정 불가 (트리거에서만 업데이트)

---

### 9. 예약 상태 변경 보안 (중간) - 추가됨

**문제점:**
- 클라이언트에서 예약 상태 직접 변경 가능
- 무효한 상태 전이 가능 (예: cancelled -> completed)

**해결책:**
- `update_reservation_status` RPC 함수 생성
- 권한 검증 (소비자/업주 구분)
- 유효한 상태 전이만 허용
- 상태 변경 시 재고 자동 처리 (취소/노쇼 시 복구, 완료 시 차감)

**프론트엔드 변경 필수:**
```typescript
// 변경 전 (직접 UPDATE)
await supabase.from('reservations')
  .update({ status: 'completed' })
  .eq('id', reservationId);

// 변경 후 (RPC 함수 사용)
const { data, error } = await supabase.rpc('update_reservation_status', {
  p_reservation_id: reservationId,
  p_new_status: 'completed',
  p_cancel_reason: null
});
```

---

## 테스트 체크리스트

적용 후 다음 항목 확인:

### 기존 항목
- [ ] 예약 생성 시 서버에서 가격이 올바르게 계산되는지
- [ ] 동시 예약 시 재고가 마이너스로 되지 않는지
- [ ] 예약하지 않은 업체에 리뷰 작성이 차단되는지
- [ ] `public_stores` 뷰에서 민감 컬럼이 제외되는지
- [ ] 앱 재시작 후 로그인 세션이 유지되는지 (SecureStore)

### 추가 항목 (v2.0)
- [ ] `public_consumers` 뷰에서 push_token이 제외되는지
- [ ] 리뷰 작성/수정/삭제 시 업체 평점이 자동 업데이트되는지
- [ ] 예약 상태 변경 RPC 함수가 올바르게 동작하는지
  - [ ] 소비자가 pending/confirmed 예약을 취소할 수 있는지
  - [ ] 업주가 pending 예약을 확정(confirmed)할 수 있는지
  - [ ] 업주가 confirmed 예약을 완료/취소/노쇼 처리할 수 있는지
  - [ ] 무효한 상태 전이가 거부되는지 (예: completed -> cancelled)
- [ ] 취소/노쇼 시 재고가 복구되는지
- [ ] 완료 시 재고가 차감되는지

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `docs/security-enhancement.sql` | 보안 함수, RLS 정책, 뷰 생성 |
| `docs/migrations/000_security_fixes_all.sql` | **통합 보안 마이그레이션 (v2.0)** |
| `docs/migrations/001_create_public_stores_view.sql` | stores 민감 정보 보호 |
| `docs/migrations/002_push_token_access_control.sql` | push_token 접근 제한 |
| `docs/migrations/003_create_rating_trigger.sql` | 평점 자동 계산 트리거 |
| `docs/migrations/004_create_reservation_status_rpc.sql` | 예약 상태 변경 RPC |
| `app/src/screens/ReservationScreen.tsx` | RPC 함수 호출로 변경 |
| `app/src/lib/supabase.ts` | expo-secure-store 적용 |

---

## 마이그레이션 상세

### 001: public_stores 뷰
- 민감 정보 제외: cash_balance, business_number, business_registration_url, push_token, user_id
- 승인된 업체만 표시 (is_approved = true)

### 002: push_token 접근 제한
- consumers: 본인만 push_token 조회/수정 가능
- stores: 업주 본인만 push_token 조회/수정 가능
- store_notification_settings: 업주 본인만 접근 가능
- public_consumers 뷰 생성 (push_token 제외)

### 003: 평점 트리거
- reviews INSERT/UPDATE/DELETE 시 자동 실행
- stores.average_rating, review_count 자동 계산
- 기존 데이터 평점 재계산 포함

### 004: 예약 상태 변경 RPC
- 권한 검증 (소비자/업주)
- 유효한 상태 전이만 허용:
  - pending: 소비자(cancelled), 업주(confirmed, cancelled)
  - confirmed: 소비자(cancelled), 업주(completed, cancelled, no_show)
  - completed/cancelled/no_show: 변경 불가
- 상태 변경 시 재고 자동 처리

---

## 문의

보안 관련 추가 질문이 있으면 언제든 요청해주세요.
