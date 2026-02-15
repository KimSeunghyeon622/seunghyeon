# Edge Function 배포 가이드

## send-push-notification Edge Function

### 개요
클라이언트에서 직접 Expo Push API를 호출하던 보안 취약점을 해결하기 위해,
푸시 알림 발송을 서버(Edge Function)에서 처리합니다.

### 보안 개선 사항
1. **push_token 서버 전용**: 클라이언트에서 다른 사용자의 push_token을 조회할 수 없음
2. **JWT 인증 필수**: 모든 요청에 인증 토큰 필요
3. **권한 검증**: 발송자가 해당 작업을 수행할 권한이 있는지 확인
4. **service_role 키 서버 전용**: 민감한 데이터 접근은 서버에서만 가능

### 배포 절차

#### 1. Supabase CLI 설치 (이미 설치되어 있다면 생략)
```bash
npm install -g supabase
```

#### 2. Supabase 프로젝트 연결
```bash
supabase login
supabase link --project-ref qycwdncplofgzdrjtklb
```

#### 3. Edge Function 폴더 구조 설정
```bash
# 프로젝트 루트에서
mkdir -p supabase/functions/send-push-notification
cp docs/edge-functions/send-push-notification/index.ts supabase/functions/send-push-notification/
cp docs/edge-functions/send-push-notification/deno.json supabase/functions/send-push-notification/
```

#### 4. 환경 변수 설정 (Supabase Dashboard)
1. Supabase Dashboard > Project Settings > Edge Functions
2. 다음 환경 변수 추가:
   - `EXPO_ACCESS_TOKEN`: Expo 푸시 액세스 토큰 (선택적, 있으면 발송 안정성 향상)

> **참고**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`는 자동으로 주입됩니다.

#### 5. Edge Function 배포
```bash
supabase functions deploy send-push-notification
```

#### 6. 배포 확인
```bash
supabase functions list
```

### 클라이언트 코드 수정 예시

#### 수정 전 (pushNotifications.ts)
```typescript
// 보안 취약: 클라이언트에서 직접 Expo Push API 호출
export async function notifyStoreNewReservation(storeId, ...) {
  const { data: store } = await supabase
    .from('stores')
    .select('push_token')  // 다른 사용자의 push_token 조회
    .eq('id', storeId);

  await sendPushNotification(store.push_token, ...);  // 직접 호출
}
```

#### 수정 후 (pushNotifications.ts)
```typescript
// 보안 강화: Edge Function 호출
export async function notifyStoreNewReservation(
  storeId: string,
  reservationNumber: string,
  productName: string,
  quantity: number
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      type: 'new_reservation',
      targetId: storeId,
      data: { reservationNumber, productName, quantity }
    }
  });

  if (error) {
    console.error('푸시 알림 발송 오류:', error);
  }
}
```

### API 명세

#### POST /functions/v1/send-push-notification

**Headers**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**
```json
{
  "type": "new_reservation" | "reservation_status" | "new_product" | "new_review",
  "targetId": "store_id 또는 consumer_id",
  "data": { ... }
}
```

**알림 타입별 data 구조**

1. **new_reservation** (새 예약 - 업주에게)
   - targetId: store_id
   ```json
   {
     "reservationNumber": "RS-12345678",
     "productName": "딸기 케이크",
     "quantity": 2
   }
   ```

2. **reservation_status** (예약 상태 변경 - 소비자에게)
   - targetId: consumer_id
   ```json
   {
     "storeName": "달콤 베이커리",
     "status": "confirmed" | "completed" | "cancelled",
     "reservationNumber": "RS-12345678"
   }
   ```

3. **new_product** (새 상품 - 관심 업체 소비자들에게)
   - targetId: store_id
   ```json
   {
     "productName": "초코 케이크",
     "storeName": "달콤 베이커리"
   }
   ```

4. **new_review** (새 리뷰 - 업주에게)
   - targetId: store_id
   ```json
   {
     "reviewerNickname": "맛집탐험가",
     "rating": 5
   }
   ```

**Response**
```json
{
  "success": true,
  "message": "알림 발송 완료",
  "sentCount": 5  // new_product 타입의 경우
}
```

### 에러 응답

| 상태 코드 | 설명 |
|----------|------|
| 401 | 인증 실패 (토큰 없음/만료) |
| 400 | 잘못된 요청 (필수 필드 누락, 지원하지 않는 타입) |
| 500 | 서버 오류 |

### 테스트

```bash
# Edge Function 로컬 테스트
supabase functions serve send-push-notification --env-file .env.local

# curl로 테스트
curl -X POST 'http://localhost:54321/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "new_reservation",
    "targetId": "store-uuid-here",
    "data": {
      "reservationNumber": "RS-12345678",
      "productName": "테스트 상품",
      "quantity": 1
    }
  }'
```

### 주의사항

1. **EXPO_ACCESS_TOKEN**: 없어도 작동하지만, 있으면 발송 안정성이 향상됩니다.
   - Expo 계정 > Access Tokens에서 생성

2. **토큰 유효성**: 사용자가 앱을 재설치하면 push_token이 변경될 수 있습니다.
   - 앱 시작 시 토큰을 갱신하도록 권장

3. **배치 발송**: new_product 타입은 관심 업체 등록자 수에 따라 대량 발송됩니다.
   - Expo Push API는 한 번에 최대 100개 메시지만 처리
   - 코드에서 자동으로 100개씩 배치 처리

4. **알림 설정**: 사용자별 알림 설정(push_enabled, notification_type 등)을 존중합니다.
