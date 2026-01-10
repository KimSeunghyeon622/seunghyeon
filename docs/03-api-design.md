# API 설계

> **재고 할인 중개 플랫폼 - API Design**
>
> - **Backend**: Supabase (PostgreSQL + Edge Functions)
> - **Protocol**: REST + GraphQL (Supabase Client)
> - **Version**: 1.0.0
> - **Last Updated**: 2026-01-10

---

## 📋 목차

1. [API 개요](#api-개요)
2. [인증 (Authentication)](#인증-authentication)
3. [소비자 API](#소비자-api)
4. [업체 API](#업체-api)
5. [공통 API](#공통-api)
6. [운영자 API](#운영자-api)
7. [외부 연동 API](#외부-연동-api)
8. [에러 코드](#에러-코드)

---

## API 개요

### 기술 스택

- **Supabase Client**: 기본 CRUD 작업
- **Supabase RPC**: 복잡한 쿼리 (거리 계산 등)
- **Supabase Edge Functions**: 비즈니스 로직 (알림, 결제 등)
- **Supabase Realtime**: 실시간 동기화

### 인증 방식

- **JWT Token**: Supabase Auth에서 발급
- **헤더**: `Authorization: Bearer <token>`
- **만료 시간**: Access Token 1시간, Refresh Token 30일

### Base URL

```
Supabase API: https://{project_id}.supabase.co
Edge Functions: https://{project_id}.functions.supabase.co
```

---

## 인증 (Authentication)

### 1. 회원가입

#### `POST /auth/signup`

**요청**
```typescript
{
  email: string;
  password: string;
  userType: 'consumer' | 'store';
  profile: {
    // consumer인 경우
    nickname?: string;

    // store인 경우
    storeName?: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}
```

**응답**
```typescript
{
  user: {
    id: string;
    email: string;
    userType: 'consumer' | 'store';
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}
```

**구현 (Edge Function)**
```typescript
// supabase/functions/auth-signup/index.ts
serve(async (req) => {
  const { email, password, userType, profile } = await req.json();

  // 1. Supabase Auth 회원가입
  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. user_profiles 생성
  await supabaseAdmin.from('user_profiles').insert({
    user_id: authData.user.id,
    user_type: userType,
  });

  // 3. userType에 따라 프로필 생성
  if (userType === 'consumer') {
    await supabaseAdmin.from('consumers').insert({
      user_id: authData.user.id,
      nickname: profile.nickname,
    });
  } else if (userType === 'store') {
    const { data: storeData } = await supabaseAdmin.from('stores').insert({
      user_id: authData.user.id,
      name: profile.storeName,
      phone: profile.phone,
      address: profile.address,
      latitude: profile.latitude,
      longitude: profile.longitude,
    }).select().single();

    // 캐시 계정 생성
    await supabaseAdmin.from('store_cash').insert({
      store_id: storeData.id,
      balance: 0,
    });
  }

  return new Response(JSON.stringify({
    user: authData.user,
    session: authData.session,
  }));
});
```

---

### 2. 로그인

#### `POST /auth/login`

**요청**
```typescript
{
  email: string;
  password: string;
}
```

**응답**
```typescript
{
  user: {
    id: string;
    email: string;
    userType: 'consumer' | 'store' | 'admin';
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
```

**구현 (Supabase Client)**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// userType 조회
const { data: profile } = await supabase
  .from('user_profiles')
  .select('user_type')
  .eq('user_id', data.user.id)
  .single();
```

---

### 3. 로그아웃

#### `POST /auth/logout`

**구현**
```typescript
await supabase.auth.signOut();
```

---

### 4. 토큰 갱신

#### `POST /auth/refresh`

**구현**
```typescript
const { data, error } = await supabase.auth.refreshSession();
```

---

## 소비자 API

### 1. 업체 리스트 조회

#### `GET /stores` (거리순)

**파라미터**
```typescript
{
  latitude: number;
  longitude: number;
  radius?: number; // km (기본: 5km)
  sortBy?: 'distance' | 'rating'; // 기본: distance
  limit?: number; // 기본: 20
  offset?: number; // 페이지네이션
}
```

**응답**
```typescript
{
  stores: Array<{
    id: string;
    name: string;
    address: string;
    thumbnailUrl: string;
    distance: number; // km
    averageRating: number;
    totalTransactions: number;
    status: 'active' | 'inactive';
    productCount: number;
    maxDiscountRate: number;
  }>;
  total: number;
}
```

**구현 (RPC)**
```typescript
const { data, error } = await supabase.rpc('get_nearby_stores', {
  user_lat: latitude,
  user_lng: longitude,
  radius_km: radius ?? 5,
  sort_by: sortBy ?? 'distance',
  limit_count: limit ?? 20,
  offset_count: offset ?? 0,
});
```

---

### 2. 업체 상세 조회

#### `GET /stores/:storeId`

**응답**
```typescript
{
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  addressDetail: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string;
  images: string[];
  openingTime: string;
  closingTime: string;
  averageRating: number;
  totalTransactions: number;
  refundPolicy: string;
  exchangePolicy: string;
  noShowPolicy: string;
  products: Array<{
    id: string;
    name: string;
    images: string[];
    originalPrice: number;
    discountedPrice: number;
    discountRate: number;
    stock: number;
    availableStock: number;
    manufacturedDate: string;
    expiryDate: string;
  }>;
}
```

**구현**
```typescript
const { data: store } = await supabase
  .from('stores')
  .select(`
    *,
    products (
      *
    )
  `)
  .eq('id', storeId)
  .eq('products.status', 'active')
  .single();
```

---

### 3. 상품 예약

#### `POST /reservations`

**요청**
```typescript
{
  productId: string;
  quantity: number;
  pickupTime: string; // ISO 8601 format
}
```

**응답**
```typescript
{
  id: string;
  reservationNumber: string;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  store: {
    id: string;
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  quantity: number;
  totalAmount: number;
  savedAmount: number;
  pickupTime: string;
  status: 'confirmed';
  createdAt: string;
}
```

**구현 (Edge Function)**
```typescript
// supabase/functions/create-reservation/index.ts
serve(async (req) => {
  const { productId, quantity, pickupTime } = await req.json();
  const userId = req.headers.get('x-user-id'); // JWT에서 추출

  // 1. 소비자 정보 조회
  const { data: consumer } = await supabaseAdmin
    .from('consumers')
    .select('id')
    .eq('user_id', userId)
    .single();

  // 2. 상품 정보 조회
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*, store:stores(*)')
    .eq('id', productId)
    .single();

  // 3. 재고 확인
  if (product.available_stock < quantity) {
    throw new Error('재고가 부족합니다');
  }

  // 4. 업체 캐시 확인
  const { data: storeCash } = await supabaseAdmin
    .from('store_cash')
    .select('balance, status')
    .eq('store_id', product.store_id)
    .single();

  if (storeCash.status === 'depleted') {
    throw new Error('해당 업체는 현재 예약이 불가능합니다');
  }

  // 5. 예약 생성 (트리거가 재고 차감 처리)
  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .insert({
      consumer_id: consumer.id,
      store_id: product.store_id,
      product_id: productId,
      quantity,
      original_price: product.original_price,
      discounted_price: product.discounted_price,
      total_amount: product.discounted_price * quantity,
      saved_amount: (product.original_price - product.discounted_price) * quantity,
      pickup_time: pickupTime,
      status: 'confirmed',
    })
    .select('*, product:products(*), store:stores(*)')
    .single();

  // 6. 업체에 알림 발송
  await sendNotification(product.store.user_id, {
    type: 'reservation_confirmed',
    title: '새로운 예약이 접수되었습니다',
    body: `${consumer.nickname}님이 ${product.name}을(를) 예약했습니다`,
    reservationId: reservation.id,
  });

  return new Response(JSON.stringify(reservation));
});
```

---

### 4. 예약 취소 (소비자)

#### `POST /reservations/:reservationId/cancel`

**요청**
```typescript
{
  reason?: string;
}
```

**응답**
```typescript
{
  id: string;
  status: 'cancelled_by_consumer';
  cancelledAt: string;
}
```

**구현 (Edge Function)**
```typescript
serve(async (req) => {
  const reservationId = req.url.split('/').slice(-2)[0];
  const { reason } = await req.json();

  // 1. 예약 조회
  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .select('*, store:stores(*)')
    .eq('id', reservationId)
    .single();

  // 2. 취소 가능 여부 확인 (60분 이내)
  const createdAt = new Date(reservation.created_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / 60000;

  if (diffMinutes > 60) {
    throw new Error('예약 후 60분이 지나 취소할 수 없습니다');
  }

  // 3. 예약 취소 (트리거가 재고 복구 처리)
  const { data: updated } = await supabaseAdmin
    .from('reservations')
    .update({
      status: 'cancelled_by_consumer',
      cancelled_at: now.toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', reservationId)
    .select()
    .single();

  // 4. 업체에 알림
  await sendNotification(reservation.store.user_id, {
    type: 'reservation_cancelled',
    title: '예약이 취소되었습니다',
    body: `예약 번호 ${reservation.reservation_number}이(가) 취소되었습니다`,
  });

  return new Response(JSON.stringify(updated));
});
```

---

### 5. 예약 내역 조회

#### `GET /reservations`

**파라미터**
```typescript
{
  status?: 'confirmed' | 'completed' | 'cancelled_by_consumer' | 'cancelled_by_store';
  startDate?: string; // ISO 8601
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

**응답**
```typescript
{
  reservations: Array<{
    id: string;
    reservationNumber: string;
    product: {
      name: string;
      images: string[];
    };
    store: {
      name: string;
      address: string;
    };
    quantity: number;
    totalAmount: number;
    savedAmount: number;
    pickupTime: string;
    status: string;
    createdAt: string;
  }>;
  total: number;
}
```

**구현**
```typescript
const { data: consumer } = await supabase
  .from('consumers')
  .select('id')
  .eq('user_id', userId)
  .single();

let query = supabase
  .from('reservations')
  .select('*, product:products(*), store:stores(*)', { count: 'exact' })
  .eq('consumer_id', consumer.id)
  .order('created_at', { ascending: false });

if (status) query = query.eq('status', status);
if (startDate) query = query.gte('created_at', startDate);
if (endDate) query = query.lte('created_at', endDate);

query = query.range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1);

const { data, count } = await query;
```

---

### 6. 픽업 완료

#### `POST /reservations/:reservationId/complete`

**응답**
```typescript
{
  id: string;
  status: 'completed';
  completedAt: string;
  commissionAmount: number;
}
```

**구현 (Edge Function)**
```typescript
serve(async (req) => {
  const reservationId = req.url.split('/').slice(-2)[0];

  // 1. 예약 조회
  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single();

  if (reservation.status !== 'confirmed') {
    throw new Error('픽업 완료할 수 없는 상태입니다');
  }

  // 2. 픽업 완료 (트리거가 모든 처리 진행)
  const { data: updated } = await supabaseAdmin
    .from('reservations')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .select()
    .single();

  return new Response(JSON.stringify(updated));
});
```

---

### 7. 리뷰 작성

#### `POST /reviews`

**요청**
```typescript
{
  reservationId: string;
  rating: number; // 1~5
  content: string;
  images?: string[]; // Supabase Storage URL
}
```

**응답**
```typescript
{
  id: string;
  reservation: {
    id: string;
    reservationNumber: string;
  };
  store: {
    id: string;
    name: string;
  };
  rating: number;
  content: string;
  images: string[];
  createdAt: string;
}
```

**구현 (Edge Function)**
```typescript
serve(async (req) => {
  const { reservationId, rating, content, images } = await req.json();
  const userId = req.headers.get('x-user-id');

  // 1. 예약 정보 조회
  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .select('*, consumer:consumers(*)')
    .eq('id', reservationId)
    .single();

  // 2. 리뷰 작성 가능 여부 확인
  if (reservation.status !== 'completed') {
    throw new Error('픽업 완료된 예약만 리뷰 작성이 가능합니다');
  }

  // 3. 리뷰 권한 확인
  const { data: rights } = await supabaseAdmin
    .from('review_rights')
    .select('available_rights')
    .eq('consumer_id', reservation.consumer_id)
    .eq('store_id', reservation.store_id)
    .single();

  if (!rights || rights.available_rights < 1) {
    throw new Error('리뷰 작성 권한이 없습니다');
  }

  // 4. 리뷰 작성
  const { data: review } = await supabaseAdmin
    .from('reviews')
    .insert({
      reservation_id: reservationId,
      consumer_id: reservation.consumer_id,
      store_id: reservation.store_id,
      rating,
      content,
      images,
    })
    .select('*, store:stores(*)')
    .single();

  // 5. 리뷰 권한 차감
  await supabaseAdmin
    .from('review_rights')
    .update({ used_rights: rights.used_rights + 1 })
    .eq('consumer_id', reservation.consumer_id)
    .eq('store_id', reservation.store_id);

  // 6. 업체에 알림
  await sendNotification(reservation.store.user_id, {
    type: 'review_received',
    title: '새로운 리뷰가 작성되었습니다',
    body: `${reservation.consumer.nickname}님이 ${rating}점 리뷰를 남겼습니다`,
    reviewId: review.id,
  });

  return new Response(JSON.stringify(review));
});
```

---

### 8. 즐겨찾기 추가/삭제

#### `POST /favorites`

**요청**
```typescript
{
  storeId: string;
}
```

#### `DELETE /favorites/:storeId`

**구현**
```typescript
// 추가
const { data: consumer } = await supabase
  .from('consumers')
  .select('id')
  .eq('user_id', userId)
  .single();

await supabase.from('favorites').insert({
  consumer_id: consumer.id,
  store_id: storeId,
});

// 삭제
await supabase
  .from('favorites')
  .delete()
  .eq('consumer_id', consumer.id)
  .eq('store_id', storeId);
```

---

### 9. 알림 구독 설정

#### `POST /notification-subscriptions`

**요청**
```typescript
{
  storeId: string;
  type: 'all_products' | 'specific_product';
  productId?: string; // type이 specific_product인 경우 필수
}
```

**구현**
```typescript
const { data: consumer } = await supabase
  .from('consumers')
  .select('id')
  .eq('user_id', userId)
  .single();

await supabase.from('notification_subscriptions').insert({
  consumer_id: consumer.id,
  store_id: storeId,
  type,
  product_id: productId,
});
```

---

## 업체 API

### 1. 상품 등록

#### `POST /products`

**요청**
```typescript
{
  name: string;
  description?: string;
  images: string[];
  originalPrice: number;
  discountedPrice: number;
  stock: number;
  manufacturedDate: string; // YYYY-MM-DD
  expiryDate: string;
}
```

**응답**
```typescript
{
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  discountRate: number; // 자동 계산
  stock: number;
  status: 'active';
  createdAt: string;
}
```

**구현 (Edge Function)**
```typescript
serve(async (req) => {
  const productData = await req.json();
  const userId = req.headers.get('x-user-id');

  // 1. 업체 정보 조회
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single();

  // 2. 상품 등록
  const { data: product } = await supabaseAdmin
    .from('products')
    .insert({
      store_id: store.id,
      ...productData,
      status: 'active',
    })
    .select()
    .single();

  // 3. 알림 구독자들에게 알림 발송
  const { data: subscriptions } = await supabaseAdmin
    .from('notification_subscriptions')
    .select('consumer:consumers(user_id)')
    .eq('store_id', store.id)
    .eq('type', 'all_products')
    .eq('is_active', true);

  for (const sub of subscriptions) {
    await sendNotification(sub.consumer.user_id, {
      type: 'product_registered',
      title: '새로운 상품이 등록되었습니다',
      body: `${productData.name} - ${product.discount_rate}% 할인`,
      productId: product.id,
    });
  }

  return new Response(JSON.stringify(product));
});
```

---

### 2. 상품 수정

#### `PATCH /products/:productId`

**요청**
```typescript
{
  name?: string;
  description?: string;
  images?: string[];
  originalPrice?: number;
  discountedPrice?: number;
  stock?: number;
  manufacturedDate?: string;
  expiryDate?: string;
}
```

**구현**
```typescript
await supabase
  .from('products')
  .update(productData)
  .eq('id', productId)
  .eq('store_id', storeId); // RLS로 자동 필터링
```

---

### 3. 상품 삭제

#### `DELETE /products/:productId`

**구현**
```typescript
await supabase
  .from('products')
  .update({ status: 'deleted' })
  .eq('id', productId);
```

---

### 4. 예약 목록 조회

#### `GET /store/reservations`

**파라미터**
```typescript
{
  status?: 'confirmed' | 'completed' | 'cancelled_by_consumer' | 'cancelled_by_store';
  date?: string; // YYYY-MM-DD
}
```

**응답**
```typescript
{
  reservations: Array<{
    id: string;
    reservationNumber: string;
    consumer: {
      nickname: string;
    };
    product: {
      name: string;
    };
    quantity: number;
    totalAmount: number;
    pickupTime: string;
    status: string;
    createdAt: string;
  }>;
}
```

**구현**
```typescript
const { data: store } = await supabase
  .from('stores')
  .select('id')
  .eq('user_id', userId)
  .single();

let query = supabase
  .from('reservations')
  .select('*, consumer:consumers(nickname), product:products(name)')
  .eq('store_id', store.id)
  .order('created_at', { ascending: false });

if (status) query = query.eq('status', status);
if (date) {
  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setDate(endOfDay.getDate() + 1);
  query = query.gte('created_at', startOfDay.toISOString())
                .lt('created_at', endOfDay.toISOString());
}

const { data } = await query;
```

---

### 5. 예약 취소 (업체)

#### `POST /store/reservations/:reservationId/cancel`

**요청**
```typescript
{
  reason: string;
}
```

**구현 (Edge Function)**
```typescript
serve(async (req) => {
  const reservationId = req.url.split('/').slice(-2)[0];
  const { reason } = await req.json();

  // 1. 예약 조회
  const { data: reservation } = await supabaseAdmin
    .from('reservations')
    .select('*, consumer:consumers(*)')
    .eq('id', reservationId)
    .single();

  // 2. 취소 가능 여부 확인
  const now = new Date();
  const createdAt = new Date(reservation.created_at);
  const pickupTime = new Date(reservation.pickup_time);

  const minutesSinceCreated = (now.getTime() - createdAt.getTime()) / 60000;
  const hoursUntilPickup = (pickupTime.getTime() - now.getTime()) / 3600000;

  if (minutesSinceCreated > 30 && hoursUntilPickup < 2) {
    throw new Error('취소 가능 시간이 지났습니다');
  }

  // 3. 예약 취소
  const { data: updated } = await supabaseAdmin
    .from('reservations')
    .update({
      status: 'cancelled_by_store',
      cancelled_at: now.toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', reservationId)
    .select()
    .single();

  // 4. 소비자에게 알림
  await sendNotification(reservation.consumer.user_id, {
    type: 'reservation_cancelled',
    title: '예약이 취소되었습니다',
    body: `${reservation.store.name}에서 예약을 취소했습니다: ${reason}`,
    reservationId: reservation.id,
  });

  return new Response(JSON.stringify(updated));
});
```

---

### 6. 캐시 충전

#### `POST /store/cash/charge`

**요청**
```typescript
{
  amount: number; // 50000, 100000, 300000, 500000, 1000000
}
```

**응답**
```typescript
{
  orderId: string;
  amount: number;
  paymentUrl: string; // 토스 페이먼츠 결제 URL
}
```

**구현 (Edge Function)**
```typescript
serve(async (req) => {
  const { amount } = await req.json();
  const userId = req.headers.get('x-user-id');

  // 1. 업체 정보 조회
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 2. orderId 생성
  const orderId = `CASH_${store.id}_${Date.now()}`;

  // 3. 토스 페이먼츠 결제 요청
  const tossResponse = await fetch('https://api.tosspayments.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${TOSS_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      orderId,
      orderName: `캐시 충전 ${amount.toLocaleString()}원`,
      successUrl: `${APP_URL}/payment/success`,
      failUrl: `${APP_URL}/payment/fail`,
      customerName: store.name,
    }),
  });

  const tossData = await tossResponse.json();

  // 4. cash_transactions에 pending 상태로 추가
  await supabaseAdmin.from('cash_transactions').insert({
    store_id: store.id,
    type: 'charge',
    amount,
    status: 'pending',
    order_id: orderId,
  });

  return new Response(JSON.stringify({
    orderId,
    amount,
    paymentUrl: tossData.checkout.url,
  }));
});
```

---

### 7. 캐시 내역 조회

#### `GET /store/cash/transactions`

**파라미터**
```typescript
{
  type?: 'charge' | 'deduct' | 'refund';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

**응답**
```typescript
{
  transactions: Array<{
    id: string;
    type: 'charge' | 'deduct' | 'refund';
    amount: number;
    balanceAfter: number;
    status: string;
    description: string;
    createdAt: string;
  }>;
  currentBalance: number;
  total: number;
}
```

**구현**
```typescript
const { data: store } = await supabase
  .from('stores')
  .select('id')
  .eq('user_id', userId)
  .single();

const { data: cash } = await supabase
  .from('store_cash')
  .select('balance')
  .eq('store_id', store.id)
  .single();

let query = supabase
  .from('cash_transactions')
  .select('*', { count: 'exact' })
  .eq('store_id', store.id)
  .order('created_at', { ascending: false });

if (type) query = query.eq('type', type);
if (startDate) query = query.gte('created_at', startDate);
if (endDate) query = query.lte('created_at', endDate);

query = query.range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1);

const { data, count } = await query;
```

---

### 8. 리뷰 답글 작성

#### `POST /store/reviews/:reviewId/reply`

**요청**
```typescript
{
  reply: string;
}
```

**구현**
```typescript
await supabase
  .from('reviews')
  .update({
    reply,
    reply_created_at: new Date().toISOString(),
  })
  .eq('id', reviewId);
```

---

## 공통 API

### 1. 프로필 조회

#### `GET /profile`

**응답**
```typescript
// 소비자인 경우
{
  userType: 'consumer';
  profile: {
    id: string;
    nickname: string;
    totalSavings: number;
    avatarUrl: string;
  };
}

// 업체인 경우
{
  userType: 'store';
  profile: {
    id: string;
    name: string;
    description: string;
    phone: string;
    address: string;
    thumbnailUrl: string;
    averageRating: number;
    totalTransactions: number;
  };
  cash: {
    balance: number;
    status: 'sufficient' | 'low' | 'depleted';
  };
}
```

**구현**
```typescript
const { data: userProfile } = await supabase
  .from('user_profiles')
  .select('user_type')
  .eq('user_id', userId)
  .single();

if (userProfile.user_type === 'consumer') {
  const { data: consumer } = await supabase
    .from('consumers')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { userType: 'consumer', profile: consumer };
} else if (userProfile.user_type === 'store') {
  const { data: store } = await supabase
    .from('stores')
    .select('*, cash:store_cash(*)')
    .eq('user_id', userId)
    .single();

  return { userType: 'store', profile: store, cash: store.cash };
}
```

---

### 2. 프로필 수정

#### `PATCH /profile`

**요청 (소비자)**
```typescript
{
  nickname?: string;
  avatarUrl?: string;
}
```

**요청 (업체)**
```typescript
{
  name?: string;
  description?: string;
  phone?: string;
  thumbnailUrl?: string;
  images?: string[];
  openingTime?: string;
  closingTime?: string;
  refundPolicy?: string;
  exchangePolicy?: string;
  noShowPolicy?: string;
}
```

**구현**
```typescript
// 소비자
await supabase
  .from('consumers')
  .update(profileData)
  .eq('user_id', userId);

// 업체
await supabase
  .from('stores')
  .update(profileData)
  .eq('user_id', userId);
```

---

### 3. 이미지 업로드

#### `POST /upload/image`

**요청**
```typescript
{
  file: File; // multipart/form-data
  bucket: 'products' | 'stores' | 'reviews' | 'avatars';
}
```

**응답**
```typescript
{
  url: string; // Supabase Storage 공개 URL
}
```

**구현**
```typescript
const { data, error } = await supabase.storage
  .from(bucket)
  .upload(`${userId}/${Date.now()}_${file.name}`, file, {
    cacheControl: '3600',
    upsert: false,
  });

const url = supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
```

---

### 4. 알림 목록 조회

#### `GET /notifications`

**파라미터**
```typescript
{
  isRead?: boolean;
  limit?: number;
  offset?: number;
}
```

**응답**
```typescript
{
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    metadata: any;
    createdAt: string;
  }>;
  unreadCount: number;
}
```

**구현**
```typescript
let query = supabase
  .from('notifications')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

if (isRead !== undefined) query = query.eq('is_read', isRead);

query = query.range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1);

const { data, count } = await query;

const { count: unreadCount } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('is_read', false);
```

---

### 5. 알림 읽음 처리

#### `POST /notifications/:notificationId/read`

**구현**
```typescript
await supabase
  .from('notifications')
  .update({
    is_read: true,
    read_at: new Date().toISOString(),
  })
  .eq('id', notificationId)
  .eq('user_id', userId);
```

---

## 운영자 API

### 1. 대시보드 통계

#### `GET /admin/dashboard`

**응답**
```typescript
{
  totalUsers: number;
  totalStores: number;
  totalReservations: number;
  totalRevenue: number;
  recentReservations: Array<Reservation>;
  recentReviews: Array<Review>;
}
```

---

### 2. 리뷰 삭제

#### `DELETE /admin/reviews/:reviewId`

**요청**
```typescript
{
  reason: string;
}
```

**구현**
```typescript
await supabase
  .from('reviews')
  .update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    deleted_by: adminUserId,
  })
  .eq('id', reviewId);
```

---

### 3. 업체 정지

#### `POST /admin/stores/:storeId/suspend`

**요청**
```typescript
{
  reason: string;
  duration?: number; // 일 단위, null이면 무기한
}
```

**구현**
```typescript
await supabase
  .from('stores')
  .update({ status: 'suspended' })
  .eq('id', storeId);
```

---

## 외부 연동 API

### 1. 토스 페이먼츠 Webhook

#### `POST /webhooks/toss`

**요청 (토스에서 전송)**
```typescript
{
  orderId: string;
  paymentKey: string;
  amount: number;
  status: 'DONE' | 'FAILED' | 'CANCELLED';
}
```

**구현**
```typescript
serve(async (req) => {
  const { orderId, paymentKey, amount, status } = await req.json();

  // orderId에서 storeId 추출
  const storeId = orderId.split('_')[1];

  if (status === 'DONE') {
    // 1. 캐시 충전
    const { data: storeCash } = await supabaseAdmin
      .from('store_cash')
      .select('balance')
      .eq('store_id', storeId)
      .single();

    await supabaseAdmin
      .from('store_cash')
      .update({
        balance: storeCash.balance + amount,
        total_charged: storeCash.total_charged + amount,
      })
      .eq('store_id', storeId);

    // 2. 거래 내역 업데이트
    await supabaseAdmin
      .from('cash_transactions')
      .update({
        status: 'completed',
        payment_key: paymentKey,
        completed_at: new Date().toISOString(),
        balance_after: storeCash.balance + amount,
      })
      .eq('order_id', orderId);

  } else if (status === 'FAILED' || status === 'CANCELLED') {
    // 거래 실패
    await supabaseAdmin
      .from('cash_transactions')
      .update({ status: 'failed' })
      .eq('order_id', orderId);
  }

  return new Response(JSON.stringify({ received: true }));
});
```

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| `AUTH_001` | 인증 실패 | 잘못된 이메일/비밀번호 |
| `AUTH_002` | 토큰 만료 | JWT 토큰 만료 |
| `AUTH_003` | 권한 없음 | 접근 권한 없음 |
| `STORE_001` | 업체를 찾을 수 없음 | 존재하지 않는 업체 |
| `STORE_002` | 업체 비활성화 | 영업 종료 또는 캐시 부족 |
| `PRODUCT_001` | 상품을 찾을 수 없음 | 존재하지 않는 상품 |
| `PRODUCT_002` | 재고 부족 | 요청 수량 > 재고 |
| `RESERVATION_001` | 예약 실패 | 예약 생성 실패 |
| `RESERVATION_002` | 취소 불가 | 취소 가능 시간 초과 |
| `RESERVATION_003` | 예약을 찾을 수 없음 | 존재하지 않는 예약 |
| `REVIEW_001` | 리뷰 작성 권한 없음 | 픽업 완료하지 않음 |
| `REVIEW_002` | 리뷰 이미 작성됨 | 중복 리뷰 |
| `CASH_001` | 캐시 부족 | 잔액 부족 |
| `CASH_002` | 충전 실패 | 결제 실패 |
| `PAYMENT_001` | 결제 실패 | 토스 페이먼츠 오류 |

---

## 다음 단계

- [ ] Supabase Edge Functions 구현
- [ ] React Native API 클라이언트 작성
- [ ] API 테스트 코드 작성
- [ ] API 문서 자동화 (Swagger/OpenAPI)

---

**문서 작성**: Claude Code
**최종 검토**: 2026-01-10
