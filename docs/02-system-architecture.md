# 시스템 아키텍처 설계

> **재고 할인 중개 플랫폼 - System Architecture**
>
> - **Platform**: React Native + Expo
> - **Backend**: Supabase
> - **Version**: 1.0.0
> - **Last Updated**: 2026-01-10

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [기술 스택](#기술-스택)
3. [전체 아키텍처](#전체-아키텍처)
4. [프론트엔드 아키텍처](#프론트엔드-아키텍처)
5. [백엔드 아키텍처](#백엔드-아키텍처)
6. [외부 서비스 연동](#외부-서비스-연동)
7. [보안 전략](#보안-전략)
8. [배포 및 인프라](#배포-및-인프라)
9. [성능 최적화](#성능-최적화)
10. [에러 처리 및 모니터링](#에러-처리-및-모니터링)

---

## 시스템 개요

### 플랫폼 특징

- **타겟**: 하이브리드 모바일 앱 (iOS + Android)
- **사용자**: 소비자, 업체, 운영자 (3가지 유형)
- **핵심 가치**: 재고 할인 상품 중개를 통한 음식물 낭비 감소 및 소비자 혜택

### 비즈니스 모델

```
소비자 --[예약]--> 플랫폼 --[알림]--> 업체
소비자 --[현장결제]--> 업체
업체 --[캐시 선충전]--> 플랫폼 (토스 페이먼츠)
업체 --[수수료 15%]--> 플랫폼 (픽업 완료 시 실시간 차감)
```

---

## 기술 스택

### Frontend

| 항목 | 기술 | 사유 |
|------|------|------|
| **Framework** | React Native | 크로스 플랫폼, 빠른 개발 |
| **Build Tool** | Expo (SDK 52+) | 개발/배포 간소화, EAS Build |
| **Language** | TypeScript | 타입 안정성, 개발 생산성 |
| **상태 관리** | Zustand + React Query | 간단한 전역 상태 + 서버 상태 분리 |
| **Navigation** | React Navigation 6+ | 네이티브 네비게이션 |
| **UI Library** | React Native Paper | Material Design 기반 |
| **지도** | Google Maps (초기) → 네이버/카카오 (추후) | 문서화 우수, 국내 정확도 |
| **Forms** | React Hook Form + Zod | 폼 검증 및 관리 |

### Backend

| 항목 | 기술 | 사유 |
|------|------|------|
| **BaaS** | Supabase | Auth, DB, Storage, Realtime 통합 |
| **Database** | PostgreSQL | Supabase 기본, 강력한 RLS |
| **Auth** | Supabase Auth | 소셜 로그인, JWT 토큰 |
| **Storage** | Supabase Storage | 이미지 업로드 |
| **Realtime** | Supabase Realtime | 실시간 알림, 재고 동기화 |

### External Services

| 항목 | 기술 | 사유 |
|------|------|------|
| **결제** | 토스 페이먼츠 | 국내 점유율, 간편 연동 |
| **지도** | Google Maps API / Kakao Maps SDK | 초기 Google, 추후 Kakao 전환 |
| **푸시 알림** | Expo Push Notifications | Expo 통합, 무료 |
| **카카오톡 알림** | Kakao Alimtalk API | 높은 도달률 |
| **이미지 최적화** | Expo Image | 자동 캐싱, 최적화 |
| **에러 추적** | Sentry | 에러 모니터링, 실시간 알림 |

### DevOps

| 항목 | 기술 | 사유 |
|------|------|------|
| **버전 관리** | Git + GitHub | 협업, CI/CD 연동 |
| **빌드/배포** | EAS Build + EAS Submit | Expo 공식 도구 |
| **CI/CD** | GitHub Actions | 자동 빌드, 테스트 |
| **App Distribution** | Apple App Store, Google Play | 공식 스토어 |

---

## 전체 아키텍처

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Mobile App                          │
│              (React Native + Expo)                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   소비자 앱   │  │   업체 앱    │  │  운영자 앱   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │   Supabase API     │
                   │  (GraphQL/REST)    │
                   └─────────┬──────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐
    │   Auth    │    │  PostgreSQL │    │  Storage  │
    │           │    │  (Database) │    │  (Images) │
    └───────────┘    └─────────────┘    └───────────┘
                             │
                   ┌─────────┴──────────┐
                   │   Edge Functions   │
                   │  (서버리스 로직)     │
                   └─────────┬──────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐
    │ 토스      │    │  Google     │    │  Expo     │
    │ 페이먼츠  │    │  Maps API   │    │  Push     │
    └───────────┘    └─────────────┘    └───────────┘
```

### Component Interaction Flow

```
┌─────────────┐
│   소비자    │
└──────┬──────┘
       │
       │ 1. 업체 조회 (거리순/평점순)
       ▼
┌──────────────────────────────────────┐
│  Supabase Query                      │
│  - stores 테이블 조회                │
│  - 거리 계산 (PostGIS)               │
│  - 캐시 상태 확인 (store_cash)       │
└──────┬───────────────────────────────┘
       │
       │ 2. 상품 예약
       ▼
┌──────────────────────────────────────┐
│  Transaction (동시성 제어)           │
│  1. products.reserved_stock += qty   │
│  2. reservations INSERT              │
│  3. 예약 번호 자동 생성              │
└──────┬───────────────────────────────┘
       │
       │ 3. 알림 발송
       ▼
┌──────────────────────────────────────┐
│  Edge Function: send_notification    │
│  - Expo Push (앱 푸시)               │
│  - Kakao Alimtalk (카톡)            │
└──────┬───────────────────────────────┘
       │
       │ 4. 픽업 완료
       ▼
┌──────────────────────────────────────┐
│  Trigger: complete_pickup()          │
│  1. 재고 차감                        │
│  2. 캐시 차감 (15%)                  │
│  3. 거래 건수 증가                   │
│  4. 리뷰 권한 부여                   │
└──────────────────────────────────────┘
```

---

## 프론트엔드 아키텍처

### 폴더 구조

```
/
├── app/                      # Expo Router (파일 기반 라우팅)
│   ├── (auth)/              # 인증 관련 화면
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (consumer)/          # 소비자 앱
│   │   ├── _layout.tsx      # 탭 네비게이션
│   │   ├── index.tsx        # 홈 (업체 리스트)
│   │   ├── favorites.tsx    # 즐겨찾기
│   │   ├── reservations.tsx # 예약 내역
│   │   └── profile.tsx      # 마이페이지
│   ├── (store)/             # 업체 앱
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx    # 대시보드
│   │   ├── products.tsx     # 상품 관리
│   │   ├── cash.tsx         # 캐시 관리
│   │   └── settings.tsx     # 설정
│   └── (admin)/             # 운영자 앱
│       └── dashboard.tsx
│
├── src/
│   ├── components/          # 재사용 컴포넌트
│   │   ├── common/          # 공통 (Button, Input 등)
│   │   ├── consumer/        # 소비자 전용
│   │   └── store/           # 업체 전용
│   │
│   ├── features/            # 기능별 모듈
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   └── services/
│   │   ├── store/
│   │   ├── product/
│   │   ├── reservation/
│   │   ├── review/
│   │   ├── payment/
│   │   └── notification/
│   │
│   ├── lib/                 # 외부 라이브러리 설정
│   │   ├── supabase.ts      # Supabase 클라이언트
│   │   ├── react-query.ts   # React Query 설정
│   │   ├── toss.ts          # 토스 페이먼츠
│   │   └── maps.ts          # 지도 API
│   │
│   ├── hooks/               # 공통 커스텀 훅
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   └── useNotification.ts
│   │
│   ├── store/               # 전역 상태 (Zustand)
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── types/               # TypeScript 타입 정의
│   │   ├── database.ts      # DB 테이블 타입
│   │   ├── api.ts           # API 요청/응답 타입
│   │   └── navigation.ts    # 네비게이션 타입
│   │
│   ├── utils/               # 유틸리티 함수
│   │   ├── date.ts
│   │   ├── distance.ts      # 거리 계산
│   │   └── validation.ts
│   │
│   └── constants/           # 상수
│       ├── config.ts        # 앱 설정
│       └── theme.ts         # 테마 색상
│
├── assets/                  # 정적 파일
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── app.json                 # Expo 설정
├── eas.json                 # EAS Build 설정
├── package.json
└── tsconfig.json
```

### 상태 관리 전략

#### 1. **전역 상태 (Zustand)**

```typescript
// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  userType: 'consumer' | 'store' | 'admin' | null;
  session: Session | null;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userType: null,
  session: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  logout: () => set({ user: null, session: null, userType: null }),
}));
```

#### 2. **서버 상태 (React Query)**

```typescript
// src/features/store/hooks/useStores.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useStores = (latitude: number, longitude: number) => {
  return useQuery({
    queryKey: ['stores', latitude, longitude],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_nearby_stores', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: 5,
      });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
};
```

#### 3. **실시간 동기화 (Supabase Realtime)**

```typescript
// src/features/reservation/hooks/useRealtimeReservations.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useRealtimeReservations = (storeId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`store:${storeId}:reservations`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          // 새 예약 알림
          queryClient.invalidateQueries(['reservations', storeId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);
};
```

### 네비게이션 구조

```typescript
// Expo Router 파일 기반 라우팅

(auth)                  → 로그인/회원가입
  ├─ login
  └─ register

(consumer)              → 소비자 앱 (탭)
  ├─ index              → 홈 (업체 리스트)
  ├─ [storeId]          → 업체 상세
  │   └─ [productId]    → 상품 예약
  ├─ favorites          → 즐겨찾기
  ├─ reservations       → 예약 내역
  │   └─ [id]           → 예약 상세
  └─ profile            → 마이페이지

(store)                 → 업체 앱 (탭)
  ├─ dashboard          → 대시보드
  ├─ products           → 상품 관리
  │   ├─ add            → 상품 등록
  │   └─ [id]/edit      → 상품 수정
  ├─ reservations       → 예약 관리
  ├─ reviews            → 리뷰 관리
  ├─ cash               → 캐시 관리
  │   └─ charge         → 캐시 충전
  └─ settings           → 설정

(admin)                 → 운영자 앱
  └─ dashboard          → 관리 대시보드
```

---

## 백엔드 아키텍처

### Supabase 구성

#### 1. **Authentication**

```typescript
// 회원가입 플로우
1. Supabase Auth 가입 (email + password)
2. Trigger: 자동으로 user_profiles 생성
3. 사용자 타입에 따라 consumers 또는 stores 생성
```

#### 2. **Row Level Security (RLS)**

```sql
-- 예시: 소비자는 자신의 예약만 조회 가능
CREATE POLICY "소비자는 자신의 예약만 조회" ON reservations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM consumers WHERE id = reservations.consumer_id
    )
  );
```

#### 3. **Edge Functions (서버리스)**

Supabase Edge Functions (Deno)를 활용한 비즈니스 로직:

**① 알림 발송**
```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { userId, type, title, body } = await req.json();

  // Expo Push 발송
  await sendExpoPush(userId, { title, body });

  // Kakao Alimtalk 발송
  await sendKakaoAlimtalk(userId, { title, body });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**② 거리 기반 업체 검색**
```sql
-- RPC 함수
CREATE OR REPLACE FUNCTION get_nearby_stores(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INT
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  distance_km DECIMAL,
  average_rating DECIMAL,
  product_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    earth_distance(
      ll_to_earth(user_lat, user_lng),
      ll_to_earth(s.latitude, s.longitude)
    ) / 1000 AS distance_km,
    s.average_rating,
    COUNT(p.id)::INT AS product_count
  FROM stores s
  LEFT JOIN products p ON s.id = p.store_id AND p.status = 'active'
  WHERE s.status = 'active'
    AND earth_box(ll_to_earth(user_lat, user_lng), radius_km * 1000) @> ll_to_earth(s.latitude, s.longitude)
  GROUP BY s.id, s.name, s.latitude, s.longitude, s.average_rating
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
```

**③ 예약 생성 (트랜잭션)**
```typescript
// supabase/functions/create-reservation/index.ts
serve(async (req) => {
  const { productId, quantity, pickupTime } = await req.json();

  // 트랜잭션 시작
  const { data, error } = await supabaseAdmin.rpc('create_reservation_transaction', {
    p_product_id: productId,
    p_quantity: quantity,
    p_pickup_time: pickupTime,
  });

  if (error) throw error;

  // 알림 발송
  await sendNotification(data.store_id, {
    type: 'reservation_confirmed',
    reservation_id: data.id,
  });

  return new Response(JSON.stringify(data));
});
```

---

## 외부 서비스 연동

### 1. 토스 페이먼츠 (업체 캐시 충전)

#### 플로우

```
1. 업체가 충전 금액 선택 (5만원, 10만원, 30만원, 50만원, 100만원)
2. 토스 페이먼츠 결제창 열기 (WebView)
3. 결제 승인
4. Webhook으로 Supabase Edge Function 호출
5. store_cash 테이블 업데이트
6. cash_transactions 내역 추가
```

#### 구현

```typescript
// src/features/payment/services/tossPayments.ts
import { TossPayments } from '@tosspayments/payment-sdk';

export const chargeCash = async (amount: number, storeId: string) => {
  const tossPayments = await TossPayments(TOSS_CLIENT_KEY);

  const orderId = `CASH_${storeId}_${Date.now()}`;

  await tossPayments.requestPayment('카드', {
    amount,
    orderId,
    orderName: `캐시 충전 ${amount.toLocaleString()}원`,
    successUrl: `${APP_SCHEME}://payment/success`,
    failUrl: `${APP_SCHEME}://payment/fail`,
    customerName: storeName,
  });
};
```

#### Webhook 처리

```typescript
// supabase/functions/toss-webhook/index.ts
serve(async (req) => {
  const { orderId, amount, status } = await req.json();

  if (status === 'DONE') {
    // orderId에서 storeId 추출
    const storeId = orderId.split('_')[1];

    // 캐시 충전
    await supabaseAdmin.rpc('charge_store_cash', {
      p_store_id: storeId,
      p_amount: amount,
      p_order_id: orderId,
    });
  }

  return new Response(JSON.stringify({ received: true }));
});
```

### 2. Google Maps API (거리 계산 및 지도 표시)

#### 사용 API

- **Geocoding API**: 주소 → 좌표 변환
- **Distance Matrix API**: 거리 계산
- **Maps SDK**: 지도 표시

#### 구현

```typescript
// src/lib/maps.ts
import { GOOGLE_MAPS_API_KEY } from '@/constants/config';

export const geocodeAddress = async (address: string) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();

  if (data.results.length === 0) throw new Error('주소를 찾을 수 없습니다');

  const { lat, lng } = data.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Haversine 공식
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number) => (value * Math.PI) / 180;
```

### 3. 푸시 알림 (Expo Push Notifications)

#### 토큰 저장

```typescript
// src/hooks/useNotification.ts
import * as Notifications from 'expo-notifications';

export const useNotification = () => {
  const registerPushToken = async (userId: string) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Supabase에 토큰 저장
    await supabase.from('push_tokens').upsert({
      user_id: userId,
      token,
      platform: Platform.OS,
    });
  };

  return { registerPushToken };
};
```

#### 알림 발송

```typescript
// supabase/functions/send-push-notification/index.ts
const sendExpoPush = async (tokens: string[], message: { title: string; body: string }) => {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: tokens,
      title: message.title,
      body: message.body,
      sound: 'default',
    }),
  });

  return response.json();
};
```

### 4. 카카오톡 알림톡

```typescript
// supabase/functions/send-kakao-alimtalk/index.ts
const sendKakaoAlimtalk = async (phone: string, templateCode: string, params: any) => {
  const response = await fetch('https://api.kakao.com/v2/api/kakaoalimtalk/send', {
    method: 'POST',
    headers: {
      'Authorization': `KakaoAK ${KAKAO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      templateCode,
      ...params,
    }),
  });

  return response.json();
};
```

---

## 보안 전략

### 1. 인증 및 인가

```typescript
// RLS 정책으로 데이터 접근 제어
// API 호출 시 JWT 토큰 자동 포함

// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### 2. API Key 관리

```typescript
// .env 파일로 민감 정보 관리
// app.config.ts에서 환경변수 주입

export default {
  expo: {
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      tossClientKey: process.env.TOSS_CLIENT_KEY,
    },
  },
};
```

### 3. 입력 검증

```typescript
// Zod 스키마로 클라이언트/서버 양쪽 검증
import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  originalPrice: z.number().positive(),
  discountedPrice: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

// 사용
const validated = ProductSchema.parse(formData);
```

### 4. XSS/SQL Injection 방어

- Supabase Client: 자동으로 SQL Injection 방어
- React Native: 기본적으로 XSS 방어됨
- 사용자 입력: sanitize-html 사용

---

## 배포 및 인프라

### 1. 모바일 앱 배포

#### EAS Build 설정

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

#### 배포 플로우

```bash
# 1. 개발 빌드
eas build --profile development --platform ios

# 2. 프리뷰 (내부 테스트)
eas build --profile preview --platform all

# 3. 프로덕션 빌드 + 스토어 제출
eas build --profile production --platform all --auto-submit
```

### 2. Supabase 배포

- **호스팅**: Supabase Cloud (Managed)
- **Region**: ap-northeast-2 (서울)
- **Tier**: Pro (프로덕션) / Free (개발)

### 3. CI/CD

```yaml
# .github/workflows/eas-build.yml
name: EAS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: eas build --platform all --non-interactive --no-wait
```

---

## 성능 최적화

### 1. 이미지 최적화

```typescript
// Expo Image 사용
import { Image } from 'expo-image';

<Image
  source={{ uri: productImageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk" // 자동 캐싱
/>
```

### 2. 리스트 최적화

```typescript
// FlashList 사용 (RecyclerListView 기반)
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={stores}
  renderItem={({ item }) => <StoreCard store={item} />}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
/>
```

### 3. 데이터 캐싱

```typescript
// React Query 캐싱 전략
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: 3,
    },
  },
});
```

### 4. 코드 스플리팅

```typescript
// React.lazy로 화면 지연 로딩
const StoreDetailScreen = lazy(() => import('./screens/StoreDetail'));
```

---

## 에러 처리 및 모니터링

### 1. Sentry 설정

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
});
```

### 2. 에러 바운더리

```typescript
// src/components/common/ErrorBoundary.tsx
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react-native';

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <View>
          <Text>오류가 발생했습니다</Text>
          <Text>{error.message}</Text>
          <Button onPress={resetError}>다시 시도</Button>
        </View>
      )}
    >
      {children}
    </SentryErrorBoundary>
  );
};
```

### 3. 로깅

```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
    Sentry.addBreadcrumb({
      category: 'info',
      message,
      data,
      level: 'info',
    });
  },

  error: (message: string, error: Error) => {
    console.error(`[ERROR] ${message}`, error);
    Sentry.captureException(error, {
      tags: { message },
    });
  },
};
```

---

## 다음 단계

- [ ] API 엔드포인트 상세 설계
- [ ] 프로젝트 초기 설정 (Expo 프로젝트 생성)
- [ ] Supabase 프로젝트 생성 및 마이그레이션
- [ ] 개발 로드맵 작성

---

**문서 작성**: Claude Code
**최종 검토**: 2026-01-10
