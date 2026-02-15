# 재고 할인 중개 플랫폼 기술명세서 (TRD)

> **문서 버전**: 1.1
> **작성일**: 2026-01-17
> **최종 수정일**: 2026-02-12
> **프로젝트명**: 재고 할인 중개 플랫폼 (투굿투고 유사 서비스)
> **현재 상태**: MVP 90% 완료
>
> **변경 이력**:
> - v1.1 (2026-02-12): 비즈니스 모델 변경 - 거래 수수료(15%) 방식에서 월정액 구독료 방식으로 전환

---

## 목차

1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택](#3-기술-스택)
4. [데이터베이스 설계](#4-데이터베이스-설계)
5. [API 설계](#5-api-설계)
6. [보안 요구사항](#6-보안-요구사항)
7. [코드 가이드라인](#7-코드-가이드라인)
8. [배포 및 환경 설정](#8-배포-및-환경-설정)
9. [성능 최적화](#9-성능-최적화)
10. [향후 기술 계획](#10-향후-기술-계획)
11. [부록](#11-부록)

---

## 1. 개요

### 1.1 문서 목적

이 문서는 **재고 할인 중개 플랫폼**의 기술적 설계와 구현 방법을 정의합니다. 개발자가 프로젝트를 이해하고, 유지보수하며, 확장할 수 있도록 필요한 모든 기술 정보를 담고 있습니다.

### 1.2 범위

- 모바일 앱 (iOS, Android) 개발
- 백엔드 서비스 (Supabase BaaS)
- 외부 서비스 연동 (결제, 지도, 알림)

### 1.3 용어 정의

| 용어 | 정의 |
|------|------|
| **캐시** | 업체가 선충전하여 구독료 결제에 사용하는 플랫폼 내 가상 화폐 |
| **픽업** | 소비자가 업체를 방문하여 예약 상품을 수령하는 것 |
| **예약** | 소비자가 상품을 미리 확보하는 것 (결제는 현장에서) |
| **구독료** | 업체가 플랫폼 서비스 이용을 위해 매월 지불하는 정액 요금 |
| **RLS** | Row Level Security, 행 수준 보안 정책 |
| **BaaS** | Backend as a Service, 서버리스 백엔드 |

### 1.4 프로젝트 위치

```
C:\Users\user\claude-test\app\
```

---

## 2. 시스템 아키텍처

### 2.1 전체 구성도

```
┌─────────────────────────────────────────────────────────────────────┐
│                         클라이언트 앱                                │
│                   (React Native + Expo SDK 54)                      │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │    소비자 앱     │  │     업주 앱      │  │  운영자 앱 (예정)│     │
│  │                 │  │                 │  │                 │     │
│  │ - 업체 탐색     │  │ - 상품 관리     │  │ - 전체 관리     │     │
│  │ - 예약하기      │  │ - 예약 관리     │  │ - 통계          │     │
│  │ - 리뷰 작성     │  │ - 캐시 관리     │  │ - 클레임 처리   │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Supabase Cloud       │
                    │     (BaaS 백엔드)          │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │   Authentication    │  │
                    │  │  (JWT 토큰 인증)     │  │
                    │  └─────────────────────┘  │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │    PostgreSQL DB    │  │
                    │  │   (데이터 저장소)    │  │
                    │  └─────────────────────┘  │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │     Storage         │  │
                    │  │  (이미지 저장소)     │  │
                    │  └─────────────────────┘  │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │   Edge Functions    │  │
                    │  │  (서버리스 로직)     │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
    ┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
    │ 토스페이먼츠   │    │   카카오맵     │    │  Expo Push    │
    │  (결제 예정)   │    │  (지도 예정)   │    │ (알림 예정)   │
    └───────────────┘    └───────────────┘    └───────────────┘
```

### 2.2 클라이언트-서버 통신 흐름

```
[모바일 앱] ──HTTPS/JWT──> [Supabase API] ──SQL──> [PostgreSQL]
     │                          │
     │                          ├──> [RLS 정책 검사]
     │                          │
     │                          └──> [트리거/함수 실행]
     │
     └──WebSocket──> [Supabase Realtime] (실시간 동기화, 예정)
```

**통신 방식**:
1. **REST API**: 기본 CRUD 작업 (Supabase Client 사용)
2. **RPC 함수**: 복잡한 비즈니스 로직 (거리 계산, 예약 생성 등)
3. **Realtime**: 실시간 동기화 (향후 구현 예정)

### 2.3 데이터 흐름 예시: 예약 생성

```
1. 소비자가 상품 선택 및 예약 요청
                │
                ▼
2. 앱에서 Supabase API 호출
   - POST reservations 테이블
                │
                ▼
3. DB 트리거 실행 (reserve_product_stock)
   - 재고 확인 및 차감
   - 예약 번호 자동 생성
                │
                ▼
4. 성공 시 예약 데이터 반환
   - 실패 시 에러 반환 (재고 부족 등)
                │
                ▼
5. 업체에게 알림 발송 (향후 구현)
```

### 2.4 사용자 인증 흐름

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   로그인      │──────▶│ Supabase Auth│──────▶│  JWT 토큰    │
│  (이메일/PW)  │      │   인증 확인   │      │    발급      │
└──────────────┘      └──────────────┘      └──────┬───────┘
                                                   │
                                                   ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  사용자 유형  │◀─────│consumers 또는│◀─────│  user_id로   │
│   자동 구분   │      │stores 조회   │      │  테이블 조회  │
└──────────────┘      └──────────────┘      └──────────────┘
        │
        ├──▶ 소비자: StoreListHome 화면으로 이동
        │
        └──▶ 업주: 마이페이지에서 '사장님 페이지' 접근 가능
```

---

## 3. 기술 스택

### 3.1 프론트엔드

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|----------|
| **React Native** | 0.81.5 | UI 프레임워크 | 크로스 플랫폼, 빠른 개발 |
| **Expo** | SDK 54 | 개발 도구 | 빌드/배포 간소화, 풍부한 API |
| **TypeScript** | 5.9.2 | 언어 | 타입 안전성, 개발 생산성 |
| **React Navigation** | 7.x | 네비게이션 | 네이티브 성능, 유연한 라우팅 |
| **Expo Image** | 3.0.x | 이미지 처리 | 자동 캐싱, 최적화 |
| **Expo Image Picker** | 17.0.x | 이미지 선택 | 카메라/갤러리 접근 |

### 3.2 백엔드 (BaaS)

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|----------|
| **Supabase** | Latest | 백엔드 통합 | Auth, DB, Storage, Realtime 통합 |
| **PostgreSQL** | 15.x | 데이터베이스 | 강력한 RLS, 트리거 지원 |
| **Supabase Auth** | Latest | 인증 | JWT 토큰, 소셜 로그인 지원 |
| **Supabase Storage** | Latest | 파일 저장 | 이미지 업로드, CDN 제공 |

### 3.3 향후 도입 예정 기술

| 기술 | 용도 | 예상 도입 시기 | 비고 |
|------|------|---------------|------|
| **토스페이먼츠** | 실결제 연동 | Phase 1 (2주 내) | 캐시 충전용 |
| **카카오맵 SDK** | 지도 기반 탐색 | Phase 2 (4-6주) | 업체 위치 표시 |
| **Expo Push** | 푸시 알림 | Phase 2 (4-6주) | 예약 알림 |
| **카카오 알림톡** | 카톡 알림 | Phase 3 (6-8주) | 높은 도달률 |
| **Sentry** | 에러 모니터링 | Phase 2 (4-6주) | 실시간 에러 추적 |

### 3.4 개발 도구

| 도구 | 용도 |
|------|------|
| **VS Code** | 코드 에디터 |
| **Git + GitHub** | 버전 관리 |
| **EAS Build** | 앱 빌드 (Expo) |
| **EAS Submit** | 스토어 제출 (Expo) |
| **Supabase Dashboard** | DB 관리, SQL 편집기 |

### 3.5 의존성 패키지 (package.json)

```json
{
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-navigation/bottom-tabs": "^7.4.0",
    "@react-navigation/native": "^7.1.8",
    "@supabase/supabase-js": "^2.90.1",
    "expo": "~54.0.31",
    "expo-image": "~3.0.11",
    "expo-image-picker": "^17.0.10",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "typescript": "~5.9.2"
  }
}
```

---

## 4. 데이터베이스 설계

### 4.1 ERD 개요

```
┌─────────────┐
│   users     │ (Supabase Auth - auth.users)
│             │
│ - id (UUID) │
│ - email     │
│ - phone     │
└──────┬──────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌─────────────┐                   ┌──────────────┐
│   consumers │                   │    stores    │
│             │                   │              │
│ - user_id   │                   │ - user_id    │
│ - nickname  │                   │ - name       │
│ - savings   │◄──────┐           │ - address    │
└──────┬──────┘       │           │ - lat/lng    │
       │              │           │ - avg_rating │
       │              │           └───────┬──────┘
       │              │                   │
       │              │                   ├──────────┐
       │              │                   │          │
       ▼              │                   ▼          ▼
┌──────────────┐      │            ┌───────────┐ ┌────────────────┐
│ reservations │──────┘            │ products  │ │ cash_transactions│
│              │                   │           │ │                │
│ - id         │───────┐           │ - id      │ │ - store_id     │
│ - consumer   │       │           │ - store   │ │ - type         │
│ - product    │       │           │ - price   │ │ - amount       │
│ - status     │       │           │ - stock   │ │ - balance_after│
│ - pickup_at  │       │           └───────────┘ └────────────────┘
└──────────────┘       │
                       │
                       ▼
                ┌──────────────┐      ┌──────────────┐
                │   reviews    │      │  favorites   │
                │              │      │              │
                │ - id         │      │ - consumer   │
                │ - reservation│      │ - store      │
                │ - rating     │      └──────────────┘
                │ - content    │
                │ - reply      │
                └──────────────┘
```

### 4.2 테이블 상세

#### 4.2.1 auth.users (Supabase Auth 기본)

Supabase가 자동 관리하는 인증 테이블입니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 사용자 고유 ID (PK) |
| email | VARCHAR | 이메일 주소 |
| phone | VARCHAR | 전화번호 |
| created_at | TIMESTAMPTZ | 가입일 |
| email_confirmed_at | TIMESTAMPTZ | 이메일 인증일 |

#### 4.2.2 consumers (소비자)

```sql
CREATE TABLE consumers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  total_savings DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- 누적 절약 금액
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 소비자 고유 ID |
| user_id | UUID | auth.users 참조 (FK) |
| nickname | VARCHAR(50) | 닉네임 (고유값) |
| phone | VARCHAR(20) | 연락처 |
| address | TEXT | 기본 주소 |
| total_savings | DECIMAL(10,2) | 누적 절약 금액 |
| avatar_url | TEXT | 프로필 이미지 URL |

#### 4.2.3 stores (업체)

```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  phone VARCHAR(20) NOT NULL,

  -- 주소 정보
  address TEXT NOT NULL,
  address_detail TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- 영업 정보
  business_number VARCHAR(20),  -- 사업자등록번호
  category VARCHAR(50),         -- 업종 카테고리

  -- 이미지
  thumbnail_url TEXT,
  images TEXT[],

  -- 통계
  total_transactions INT NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,

  -- 캐시 및 구독 관련
  cash_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subscription_end_date DATE,  -- 구독 만료일

  -- 상태
  is_approved BOOLEAN DEFAULT false,  -- 관리자 승인 여부
  status VARCHAR(20) DEFAULT 'active',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 업체 고유 ID |
| user_id | UUID | auth.users 참조 (FK) |
| name | VARCHAR(100) | 업체명 |
| description | TEXT | 업체 소개 |
| phone | VARCHAR(20) | 연락처 |
| address | TEXT | 주소 |
| latitude/longitude | DECIMAL | 좌표 (지도용) |
| business_number | VARCHAR(20) | 사업자등록번호 |
| category | VARCHAR(50) | 업종 (베이커리, 음식점 등) |
| cash_balance | DECIMAL(10,2) | 현재 캐시 잔액 |
| subscription_end_date | DATE | 구독 만료일 |
| average_rating | DECIMAL(3,2) | 평균 평점 (1.00~5.00) |
| is_approved | BOOLEAN | 관리자 승인 여부 |

#### 4.2.4 products (상품)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  name VARCHAR(200) NOT NULL,
  description TEXT,
  images TEXT[],

  -- 가격
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  discount_rate DECIMAL(5, 2),  -- 자동 계산 또는 수동 입력

  -- 재고
  stock_quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,

  -- 유통기한
  manufactured_date DATE,
  expiry_date DATE,

  -- 카테고리
  category VARCHAR(50),  -- 빵, 도시락, 음료, 과일, 반찬, 기타

  -- 상태
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (discounted_price <= original_price),
  CHECK (stock_quantity >= 0),
  CHECK (reserved_quantity >= 0)
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 상품 고유 ID |
| store_id | UUID | 업체 ID (FK) |
| name | VARCHAR(200) | 상품명 |
| original_price | DECIMAL(10,2) | 정가 |
| discounted_price | DECIMAL(10,2) | 할인가 |
| discount_rate | DECIMAL(5,2) | 할인율 (%) |
| stock_quantity | INT | 총 재고 수량 |
| reserved_quantity | INT | 예약된 수량 |
| category | VARCHAR(50) | 상품 카테고리 |
| is_active | BOOLEAN | 판매 활성화 여부 |

#### 4.2.5 reservations (예약)

```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_number VARCHAR(20) NOT NULL UNIQUE,  -- 자동 생성

  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  quantity INT NOT NULL DEFAULT 1,

  -- 가격 정보 (스냅샷)
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  saved_amount DECIMAL(10, 2) NOT NULL,

  -- 시간
  pickup_time TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- 상태: pending, confirmed, completed, cancelled
  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  -- 수수료 (레거시 - 구독 모델 전환으로 미사용)
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(10, 2),  -- (미사용) 레거시 필드

  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (quantity > 0)
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 예약 고유 ID |
| reservation_number | VARCHAR(20) | 예약번호 (R + 날짜 + 일련번호) |
| consumer_id | UUID | 소비자 ID (FK) |
| store_id | UUID | 업체 ID (FK) |
| product_id | UUID | 상품 ID (FK) |
| quantity | INT | 예약 수량 |
| total_amount | DECIMAL | 총 결제 금액 |
| saved_amount | DECIMAL | 절약 금액 |
| pickup_time | TIMESTAMPTZ | 픽업 예정 시간 |
| status | VARCHAR(20) | 예약 상태 |
| commission_amount | DECIMAL | (미사용) 레거시 필드 |

**예약 상태 (status)**:
- `pending`: 예약 대기 (기본)
- `confirmed`: 예약 확정
- `completed`: 픽업 완료
- `cancelled`: 취소됨

#### 4.2.6 reviews (리뷰)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  rating INT NOT NULL,  -- 1~5
  content TEXT,
  images TEXT[],

  reply TEXT,  -- 업체 답글
  reply_created_at TIMESTAMPTZ,

  is_deleted BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(reservation_id)  -- 1 예약당 1 리뷰
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 리뷰 고유 ID |
| reservation_id | UUID | 예약 ID (FK, UNIQUE) |
| rating | INT | 별점 (1~5) |
| content | TEXT | 리뷰 내용 |
| reply | TEXT | 업체 답글 |

#### 4.2.7 cash_transactions (캐시 거래)

```sql
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  transaction_type VARCHAR(20) NOT NULL,  -- charge, fee, refund
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,

  reservation_id UUID REFERENCES reservations(id),
  description TEXT,

  -- 결제 정보 (충전 시)
  payment_key VARCHAR(200),
  order_id VARCHAR(100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (amount > 0)
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 거래 고유 ID |
| store_id | UUID | 업체 ID (FK) |
| transaction_type | VARCHAR(20) | 거래 유형 |
| amount | DECIMAL(10,2) | 거래 금액 |
| balance_after | DECIMAL(10,2) | 거래 후 잔액 |
| reservation_id | UUID | 관련 예약 ID (레거시) |

**거래 유형 (transaction_type)**:
- `charge`: 캐시 충전
- `subscription`: 구독료 결제
- `refund`: 환불

#### 4.2.8 favorites (즐겨찾기)

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(consumer_id, store_id)
);
```

#### 4.2.9 store_operating_hours (영업시간)

```sql
CREATE TABLE store_operating_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  day_of_week INT NOT NULL,  -- 0:일, 1:월, ..., 6:토
  opening_time TIME,
  closing_time TIME,
  is_closed BOOLEAN DEFAULT false,  -- 휴무일 여부

  UNIQUE(store_id, day_of_week)
);
```

### 4.3 주요 인덱스

```sql
-- 소비자 조회
CREATE INDEX idx_consumers_user_id ON consumers(user_id);
CREATE INDEX idx_consumers_nickname ON consumers(nickname);

-- 업체 조회
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_rating ON stores(average_rating DESC);

-- 상품 조회
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_active ON products(store_id, is_active);
CREATE INDEX idx_products_category ON products(category);

-- 예약 조회
CREATE INDEX idx_reservations_consumer ON reservations(consumer_id);
CREATE INDEX idx_reservations_store ON reservations(store_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_created ON reservations(created_at DESC);
CREATE INDEX idx_reservations_number ON reservations(reservation_number);

-- 리뷰 조회
CREATE INDEX idx_reviews_store ON reviews(store_id);
CREATE INDEX idx_reviews_consumer ON reviews(consumer_id);

-- 캐시 거래
CREATE INDEX idx_cash_transactions_store ON cash_transactions(store_id);
CREATE INDEX idx_cash_transactions_created ON cash_transactions(created_at DESC);

-- 즐겨찾기
CREATE INDEX idx_favorites_consumer ON favorites(consumer_id);
CREATE INDEX idx_favorites_store ON favorites(store_id);
```

### 4.4 주요 트리거 및 함수

#### 4.4.1 예약 번호 자동 생성

```sql
-- 예약 번호 생성 함수
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix VARCHAR(8);
  sequence_num INT;
BEGIN
  -- 날짜 prefix (YYYYMMDD)
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');

  -- 오늘 생성된 예약 수 + 1
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM reservations
  WHERE reservation_number LIKE 'R' || date_prefix || '%';

  -- 예약 번호: R + YYYYMMDD + 6자리 순번
  NEW.reservation_number := 'R' || date_prefix || LPAD(sequence_num::TEXT, 6, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trg_generate_reservation_number
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION generate_reservation_number();
```

**예약 번호 형식**: `R20260117000001`
- R: 예약 접두어
- 20260117: 날짜 (YYYYMMDD)
- 000001: 당일 일련번호

#### 4.4.2 구독 상태 관리

```sql
-- 구독 상태 확인 함수
CREATE OR REPLACE FUNCTION check_subscription_status(p_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_valid BOOLEAN;
BEGIN
  -- 업체의 구독 상태 확인
  SELECT
    CASE
      WHEN subscription_end_date >= CURRENT_DATE THEN true
      ELSE false
    END INTO subscription_valid
  FROM stores
  WHERE id = p_store_id;

  RETURN COALESCE(subscription_valid, false);
END;
$$ LANGUAGE plpgsql;
```

**구독 만료 시 처리**:
- 구독 만료 업체는 새 상품 등록 불가
- 기존 예약은 정상 처리
- 대시보드에 구독 갱신 안내 표시

**구독료 결제 함수**:

```sql
-- 구독료 결제 함수 (RPC)
CREATE OR REPLACE FUNCTION pay_subscription(
  p_store_id UUID,
  p_amount DECIMAL,
  p_months INT DEFAULT 1
)
RETURNS TABLE (
  new_balance DECIMAL,
  new_subscription_end_date DATE,
  transaction_id UUID
) AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_current_end_date DATE;
  v_new_end_date DATE;
  v_transaction_id UUID;
BEGIN
  -- 현재 잔액 및 구독 종료일 조회
  SELECT cash_balance, COALESCE(subscription_end_date, CURRENT_DATE)
  INTO v_current_balance, v_current_end_date
  FROM stores
  WHERE id = p_store_id
  FOR UPDATE;  -- 행 잠금

  -- 잔액 확인
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION '캐시 잔액이 부족합니다. 현재 잔액: %, 필요 금액: %',
      v_current_balance, p_amount;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- 구독 종료일 계산 (현재 구독 기간이 남아있으면 그 이후로 연장)
  IF v_current_end_date > CURRENT_DATE THEN
    v_new_end_date := v_current_end_date + (p_months || ' months')::INTERVAL;
  ELSE
    v_new_end_date := CURRENT_DATE + (p_months || ' months')::INTERVAL;
  END IF;

  -- 업체 정보 업데이트
  UPDATE stores
  SET cash_balance = v_new_balance,
      subscription_end_date = v_new_end_date,
      updated_at = NOW()
  WHERE id = p_store_id;

  -- 거래 내역 추가
  INSERT INTO cash_transactions (
    store_id, transaction_type, amount, balance_after, description
  )
  VALUES (
    p_store_id,
    'subscription',
    p_amount,
    v_new_balance,
    p_months || '개월 구독료 결제'
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT v_new_balance, v_new_end_date, v_transaction_id;
END;
$$ LANGUAGE plpgsql;
```

#### 4.4.3 업체 평균 평점 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION update_store_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores
  SET average_rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews
    WHERE store_id = NEW.store_id
      AND is_deleted = false
  ),
  updated_at = NOW()
  WHERE id = NEW.store_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_store_rating_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_store_rating();

CREATE TRIGGER trg_update_store_rating_update
AFTER UPDATE OF rating, is_deleted ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_store_rating();
```

#### 4.4.4 캐시 충전 함수 (RPC)

```sql
CREATE OR REPLACE FUNCTION charge_store_cash(
  p_store_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT '캐시 충전'
)
RETURNS TABLE (
  new_balance DECIMAL,
  transaction_id UUID
) AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- 현재 잔액 조회
  SELECT cash_balance INTO v_current_balance
  FROM stores
  WHERE id = p_store_id;

  v_new_balance := v_current_balance + p_amount;

  -- 캐시 충전
  UPDATE stores
  SET cash_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_store_id;

  -- 거래 내역 추가
  INSERT INTO cash_transactions (
    store_id, transaction_type, amount, balance_after, description
  )
  VALUES (
    p_store_id, 'charge', p_amount, v_new_balance, p_description
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT v_new_balance, v_transaction_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. API 설계

### 5.1 API 개요

**통신 방식**: Supabase Client를 통한 REST API + RPC 함수

```typescript
// Supabase 클라이언트 초기화
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
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

### 5.2 인증 API

#### 회원가입

```typescript
// 소비자 회원가입
const signUpConsumer = async (email: string, password: string, nickname: string) => {
  // 1. Auth 회원가입
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. 소비자 프로필 생성
  const { error: profileError } = await supabase
    .from('consumers')
    .insert({
      user_id: authData.user.id,
      nickname,
    });

  if (profileError) throw profileError;

  return authData;
};

// 업주 회원가입
const signUpStore = async (
  email: string,
  password: string,
  storeData: {
    name: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
    businessNumber?: string;
    category?: string;
  }
) => {
  // 1. Auth 회원가입
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. 업체 프로필 생성
  const { error: profileError } = await supabase
    .from('stores')
    .insert({
      user_id: authData.user.id,
      ...storeData,
      is_approved: false,  // 관리자 승인 대기
    });

  if (profileError) throw profileError;

  return authData;
};
```

#### 로그인

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
};
```

#### 로그아웃

```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

### 5.3 소비자 API

#### 업체 리스트 조회

```typescript
// 거리순 업체 리스트
const getStores = async (options?: {
  latitude?: number;
  longitude?: number;
  category?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from('stores')
    .select(`
      *,
      products:products(count)
    `)
    .eq('status', 'active')
    .eq('is_approved', true)
    .order('average_rating', { ascending: false });

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.searchText) {
    query = query.ilike('name', `%${options.searchText}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};
```

#### 업체 상세 조회

```typescript
const getStoreDetail = async (storeId: string) => {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      products:products(*),
      reviews:reviews(
        *,
        consumer:consumers(nickname, avatar_url)
      ),
      operating_hours:store_operating_hours(*)
    `)
    .eq('id', storeId)
    .eq('products.is_active', true)
    .eq('reviews.is_deleted', false)
    .order('created_at', { foreignTable: 'reviews', ascending: false })
    .single();

  if (error) throw error;
  return data;
};
```

#### 예약 생성

```typescript
const createReservation = async (
  consumerId: string,
  productId: string,
  quantity: number,
  pickupTime: string
) => {
  // 1. 상품 정보 조회
  const { data: product } = await supabase
    .from('products')
    .select('*, store:stores(*)')
    .eq('id', productId)
    .single();

  // 2. 재고 확인
  const availableStock = product.stock_quantity - product.reserved_quantity;
  if (availableStock < quantity) {
    throw new Error('재고가 부족합니다');
  }

  // 3. 예약 생성
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      consumer_id: consumerId,
      store_id: product.store_id,
      product_id: productId,
      quantity,
      original_price: product.original_price,
      discounted_price: product.discounted_price,
      total_amount: product.discounted_price * quantity,
      saved_amount: (product.original_price - product.discounted_price) * quantity,
      pickup_time: pickupTime,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // 4. 재고 업데이트
  await supabase
    .from('products')
    .update({
      reserved_quantity: product.reserved_quantity + quantity,
    })
    .eq('id', productId);

  return reservation;
};
```

#### 예약 내역 조회

```typescript
const getMyReservations = async (
  consumerId: string,
  status?: string
) => {
  let query = supabase
    .from('reservations')
    .select(`
      *,
      product:products(name, images),
      store:stores(name, address, phone)
    `)
    .eq('consumer_id', consumerId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};
```

#### 리뷰 작성

```typescript
const createReview = async (
  reservationId: string,
  consumerId: string,
  storeId: string,
  rating: number,
  content: string,
  images?: string[]
) => {
  // 예약 상태 확인
  const { data: reservation } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', reservationId)
    .single();

  if (reservation.status !== 'completed') {
    throw new Error('픽업 완료된 예약만 리뷰 작성이 가능합니다');
  }

  // 리뷰 작성
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reservation_id: reservationId,
      consumer_id: consumerId,
      store_id: storeId,
      rating,
      content,
      images,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### 5.4 업주 API

#### 상품 관리

```typescript
// 상품 등록
const createProduct = async (storeId: string, productData: {
  name: string;
  description?: string;
  originalPrice: number;
  discountedPrice: number;
  stockQuantity: number;
  category?: string;
  images?: string[];
}) => {
  const discountRate = Math.round(
    ((productData.originalPrice - productData.discountedPrice) /
     productData.originalPrice) * 100
  );

  const { data, error } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      name: productData.name,
      description: productData.description,
      original_price: productData.originalPrice,
      discounted_price: productData.discountedPrice,
      discount_rate: discountRate,
      stock_quantity: productData.stockQuantity,
      category: productData.category,
      images: productData.images,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 상품 수정
const updateProduct = async (productId: string, updates: Partial<Product>) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 상품 삭제 (비활성화)
const deleteProduct = async (productId: string) => {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', productId);

  if (error) throw error;
};
```

#### 예약 관리

```typescript
// 예약 목록 조회
const getStoreReservations = async (storeId: string, status?: string) => {
  let query = supabase
    .from('reservations')
    .select(`
      *,
      product:products(name),
      consumer:consumers(nickname)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

// 예약 확정
const confirmReservation = async (reservationId: string) => {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'confirmed' })
    .eq('id', reservationId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 픽업 완료
const completeReservation = async (reservationId: string) => {
  const { data, error } = await supabase
    .from('reservations')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 예약 취소
const cancelReservation = async (
  reservationId: string,
  reason: string,
  cancelledBy: 'consumer' | 'store'
) => {
  const { data: reservation } = await supabase
    .from('reservations')
    .select('product_id, quantity')
    .eq('id', reservationId)
    .single();

  // 재고 복구
  const { data: product } = await supabase
    .from('products')
    .select('reserved_quantity')
    .eq('id', reservation.product_id)
    .single();

  await supabase
    .from('products')
    .update({
      reserved_quantity: product.reserved_quantity - reservation.quantity,
    })
    .eq('id', reservation.product_id);

  // 예약 취소
  const { data, error } = await supabase
    .from('reservations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', reservationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

#### 캐시 관리

```typescript
// 캐시 잔액 조회
const getCashBalance = async (storeId: string) => {
  const { data, error } = await supabase
    .from('stores')
    .select('cash_balance')
    .eq('id', storeId)
    .single();

  if (error) throw error;
  return data.cash_balance;
};

// 캐시 거래 내역 조회
const getCashTransactions = async (
  storeId: string,
  limit: number = 20,
  offset: number = 0
) => {
  const { data, error } = await supabase
    .from('cash_transactions')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

// 캐시 충전 (RPC 함수 호출)
const chargeCash = async (storeId: string, amount: number) => {
  const { data, error } = await supabase
    .rpc('charge_store_cash', {
      p_store_id: storeId,
      p_amount: amount,
      p_description: `캐시 충전 ${amount.toLocaleString()}원`,
    });

  if (error) throw error;
  return data;
};
```

### 5.5 에러 코드

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
| `REVIEW_001` | 리뷰 작성 권한 없음 | 픽업 완료하지 않음 |
| `CASH_001` | 캐시 부족 | 잔액 부족 |

---

## 6. 보안 요구사항

### 6.1 인증 및 인가

#### JWT 토큰 기반 인증

```typescript
// Supabase Auth 설정
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,           // 토큰 저장소
    autoRefreshToken: true,          // 자동 토큰 갱신
    persistSession: true,            // 세션 유지
    detectSessionInUrl: false,       // URL 세션 감지 비활성화 (앱)
  },
});
```

**토큰 관리**:
- Access Token: 1시간 만료
- Refresh Token: 30일 만료 (자동 갱신)
- 저장 위치: AsyncStorage (암호화됨)

### 6.2 Row Level Security (RLS)

Supabase의 RLS 정책으로 데이터 접근을 제어합니다.

```sql
-- consumers 테이블: 자신의 정보만 조회/수정 가능
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "소비자는 자신의 정보만 조회 가능" ON consumers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "소비자는 자신의 정보만 수정 가능" ON consumers
  FOR UPDATE USING (auth.uid() = user_id);

-- stores 테이블: 모두 조회 가능, 소유자만 수정 가능
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 업체 정보 조회 가능" ON stores
  FOR SELECT USING (true);

CREATE POLICY "업체는 자신의 정보만 수정 가능" ON stores
  FOR UPDATE USING (auth.uid() = user_id);

-- products 테이블: 활성 상품만 조회, 업체만 관리
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "활성 상품 조회 가능" ON products
  FOR SELECT USING (is_active = true OR
    EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

CREATE POLICY "업체는 자신의 상품만 관리 가능" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );

-- reservations 테이블: 관련자만 조회 가능
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "소비자는 자신의 예약만 조회" ON reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM consumers WHERE consumers.id = reservations.consumer_id AND consumers.user_id = auth.uid())
  );

CREATE POLICY "업체는 자신의 예약만 조회" ON reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = reservations.store_id AND stores.user_id = auth.uid())
  );
```

### 6.3 API 키 관리

#### 환경 변수 사용 (.env)

```bash
# .env 파일 (절대 Git에 커밋하지 않음)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 향후 추가 예정
EXPO_PUBLIC_TOSS_CLIENT_KEY=test_xxxx
EXPO_PUBLIC_KAKAO_MAP_KEY=xxxx
```

#### .gitignore 설정

```gitignore
# 환경 변수 파일
.env
.env.local
.env.production

# 민감한 설정 파일
google-services.json
GoogleService-Info.plist
```

### 6.4 민감 정보 처리

#### 로깅 주의사항

```typescript
// BAD: 민감 정보 로깅
console.log('로그인 시도:', email, password);  // 절대 금지!

// GOOD: 안전한 로깅
console.log('로그인 시도:', email);
console.log('결제 요청:', { orderId, amount });  // 카드 정보 제외
```

#### 에러 처리

```typescript
// 민감 정보가 포함될 수 있는 에러 처리
try {
  await supabase.auth.signInWithPassword({ email, password });
} catch (error) {
  // 실제 에러 메시지는 서버 로그로만
  console.error('로그인 실패');  // 상세 정보 제외

  // 사용자에게는 일반적인 메시지
  Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요');
}
```

### 6.5 데이터 암호화

| 항목 | 암호화 방식 | 담당 |
|------|------------|------|
| 비밀번호 | bcrypt 해싱 | Supabase Auth 자동 처리 |
| 통신 | HTTPS (TLS 1.3) | Supabase 자동 처리 |
| 토큰 저장 | AsyncStorage (암호화) | React Native 자동 처리 |
| 결제 정보 | PCI DSS 준수 | 토스페이먼츠 처리 (예정) |

---

## 7. 코드 가이드라인

### 7.1 폴더 구조

```
app/
├── App.tsx                          # 메인 앱 (네비게이션 관리)
├── app.json                         # Expo 설정
├── package.json                     # 의존성
├── tsconfig.json                    # TypeScript 설정
├── .env                             # 환경변수 (Git 제외)
├── .gitignore
│
├── src/
│   ├── lib/
│   │   └── supabase.ts              # Supabase 클라이언트 설정
│   │
│   ├── screens/                     # 화면 컴포넌트 (26개)
│   │   │
│   │   │── # 인증 화면
│   │   ├── LoginScreen.tsx          # 로그인
│   │   ├── SignupTypeScreen.tsx     # 회원가입 유형 선택
│   │   ├── ConsumerSignupScreen.tsx # 소비자 회원가입
│   │   ├── StoreSignupScreen.tsx    # 업주 회원가입
│   │   │
│   │   │── # 소비자 화면
│   │   ├── StoreListHome.tsx        # 업체 리스트 (홈)
│   │   ├── StoreListHomeWithSearch.tsx # 검색 포함 업체 리스트
│   │   ├── StoreDetail.tsx          # 업체 상세
│   │   ├── ReservationScreen.tsx    # 예약하기
│   │   ├── MyReservations.tsx       # 예약 내역
│   │   ├── ReviewScreen.tsx         # 리뷰 작성
│   │   ├── MyPageScreen.tsx         # 마이페이지
│   │   ├── ProfileEditScreen.tsx    # 프로필 편집
│   │   │
│   │   │── # 업주 화면
│   │   ├── StoreDashboard.tsx       # 업주 대시보드
│   │   ├── StoreProductManagement.tsx # 상품 관리
│   │   ├── StoreCashManagement.tsx  # 캐시 관리
│   │   ├── StoreCashHistory.tsx     # 캐시 내역
│   │   ├── StoreReservationManagement.tsx # 예약 관리
│   │   ├── StoreReviewManagement.tsx    # 리뷰 관리
│   │   ├── StoreReviewManagementWithReply.tsx # 리뷰 답글
│   │   ├── StoreInfoManagement.tsx  # 업체 정보 관리
│   │   ├── StoreOperatingHoursScreen.tsx # 영업시간 관리
│   │   └── StoreRegularCustomers.tsx # 단골 고객
│   │
│   ├── components/                  # 재사용 컴포넌트
│   │   ├── ui/                      # 기본 UI (Button, Input 등)
│   │   └── common/                  # 공통 컴포넌트
│   │
│   ├── hooks/                       # 커스텀 훅 (향후 추가)
│   │   ├── useAuth.ts
│   │   └── useLocation.ts
│   │
│   ├── types/                       # TypeScript 타입 (향후 추가)
│   │   └── database.ts
│   │
│   └── utils/                       # 유틸리티 함수 (향후 추가)
│       ├── format.ts
│       └── validation.ts
│
├── assets/                          # 정적 파일
│   ├── images/
│   └── fonts/
│
└── components/                      # Expo 기본 컴포넌트
    └── ...
```

### 7.2 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 화면 컴포넌트 | PascalCase + Screen 접미사 | `LoginScreen.tsx`, `MyPageScreen.tsx` |
| 일반 컴포넌트 | PascalCase | `StoreCard.tsx`, `ProductItem.tsx` |
| 커스텀 훅 | camelCase + use 접두사 | `useAuth.ts`, `useLocation.ts` |
| 유틸 함수 | camelCase | `formatDate.ts`, `calculateDistance.ts` |
| 상수 | UPPER_SNAKE_CASE | `API_ENDPOINTS`, `MAX_RETRY_COUNT` |
| 타입/인터페이스 | PascalCase | `Store`, `Product`, `Reservation` |
| 변수/함수 | camelCase | `storeList`, `handleSubmit` |
| 이벤트 핸들러 | on/handle 접두사 | `onPress`, `handleSubmit` |

### 7.3 TypeScript 규칙

#### 타입 정의

```typescript
// types/database.ts

// 업체 타입
interface Store {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  thumbnail_url?: string;
  average_rating: number;
  cash_balance: number;
  is_approved: boolean;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

// 상품 타입
interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  images?: string[];
  original_price: number;
  discounted_price: number;
  discount_rate: number;
  stock_quantity: number;
  reserved_quantity: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 예약 타입
interface Reservation {
  id: string;
  reservation_number: string;
  consumer_id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  original_price: number;
  discounted_price: number;
  total_amount: number;
  saved_amount: number;
  pickup_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  commission_rate: number;
  commission_amount?: number;
  cancellation_reason?: string;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
}

// Props 타입
interface StoreDetailProps {
  storeId: string;
  onReserve: (product: Product) => void;
  onBack: () => void;
}
```

### 7.4 컴포넌트 작성 패턴

#### 기본 화면 컴포넌트 구조

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

// Props 인터페이스 정의
interface MyScreenProps {
  onBack: () => void;
  someId?: string;
}

// 컴포넌트 함수
export default function MyScreen({ onBack, someId }: MyScreenProps) {
  // 1. 상태 정의
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 2. 데이터 로딩 함수 (useCallback으로 메모이제이션)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('some_table')
        .select('*')
        .eq('some_column', someId);

      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      console.error('데이터 로딩 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [someId]);

  // 3. 초기 로딩
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 4. 핸들러 함수
  const handleSomeAction = async () => {
    try {
      // 비즈니스 로직
    } catch (err: any) {
      Alert.alert('오류', err.message);
    }
  };

  // 5. 로딩 상태 렌더링
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D563" />
      </View>
    );
  }

  // 6. 에러 상태 렌더링
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // 7. 메인 렌더링
  return (
    <View style={styles.container}>
      {/* UI 구현 */}
    </View>
  );
}

// 8. 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
});
```

### 7.5 코딩 스타일

| 항목 | 규칙 |
|------|------|
| 들여쓰기 | 2 spaces |
| 세미콜론 | 사용함 |
| 따옴표 | 작은따옴표 (') |
| 최대 줄 길이 | 100자 권장, 120자 최대 |
| 파일당 컴포넌트 | 1개 원칙 |
| import 순서 | React > 외부 라이브러리 > 내부 모듈 |

### 7.6 주석 가이드라인

```typescript
// 간단한 설명은 한 줄 주석
const TAX_RATE = 0.1;  // 세금 비율 10%

/**
 * 복잡한 함수나 모듈은 JSDoc 스타일 주석 사용
 *
 * @param storeId - 업체 고유 ID
 * @param amount - 충전 금액 (원)
 * @returns 충전 후 잔액과 거래 ID
 * @throws 잔액 부족 시 에러
 */
const chargeCash = async (storeId: string, amount: number) => {
  // 구현...
};

// TODO: 향후 구현 예정 표시
// TODO: 토스페이먼츠 실결제 연동 (Phase 1)

// FIXME: 수정 필요한 부분 표시
// FIXME: 동시성 문제 발생 가능성 있음
```

---

## 8. 배포 및 환경 설정

### 8.1 환경 변수

#### .env 파일 설정

```bash
# Supabase (필수)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 토스페이먼츠 (Phase 1에서 추가)
# EXPO_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxx
# TOSS_SECRET_KEY=test_sk_xxx  # 서버 전용, EXPO_PUBLIC 붙이지 않음

# 카카오맵 (Phase 2에서 추가)
# EXPO_PUBLIC_KAKAO_MAP_KEY=xxx

# 앱 설정
EXPO_PUBLIC_APP_ENV=development  # development | staging | production
```

#### 환경별 설정

| 환경 | 용도 | Supabase 프로젝트 |
|------|------|------------------|
| development | 로컬 개발 | 개발용 프로젝트 |
| staging | 테스트 | 스테이징 프로젝트 (선택) |
| production | 실서비스 | 프로덕션 프로젝트 |

### 8.2 빌드 프로세스

#### Expo 빌드 명령어

```bash
# 개발 서버 시작
npx expo start

# 개발 빌드 (내부 테스트용)
eas build --profile development --platform ios
eas build --profile development --platform android

# 프리뷰 빌드 (베타 테스트용)
eas build --profile preview --platform all

# 프로덕션 빌드 (스토어 제출용)
eas build --profile production --platform all

# 스토어 제출
eas submit --platform ios
eas submit --platform android
```

#### eas.json 설정

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_APP_ENV": "staging"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
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

### 8.3 배포 전략

#### 단계별 배포

```
1. 개발 완료
     │
     ▼
2. 로컬 테스트 (Expo Go)
     │
     ▼
3. 개발 빌드 테스트 (development profile)
     │
     ▼
4. 프리뷰 빌드 (preview profile)
     │
     ├── 내부 테스터 배포 (TestFlight / Internal Testing)
     │
     ▼
5. 프로덕션 빌드 (production profile)
     │
     ├── 스토어 제출 (App Store / Play Store)
     │
     ▼
6. 스토어 심사
     │
     ▼
7. 정식 출시
```

#### 롤백 전략

```bash
# EAS Update로 OTA 업데이트 롤백
eas update --branch production --message "Rollback to v1.0.0"

# 심각한 문제 시: 이전 빌드 재배포
# 스토어에서 이전 버전 활성화 요청
```

### 8.4 호환성 요구사항

| 플랫폼 | 최소 버전 | 권장 버전 |
|--------|----------|----------|
| iOS | 13.0 | 15.0 이상 |
| Android | API 26 (8.0) | API 30 (11) 이상 |

---

## 9. 성능 최적화

### 9.1 이미지 최적화

#### Expo Image 사용

```typescript
import { Image } from 'expo-image';

// 이미지 컴포넌트
<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"  // 메모리 + 디스크 캐싱
  placeholder={blurhash}      // 로딩 중 블러 이미지
/>
```

#### 이미지 리사이징 (업로드 시)

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

const resizeImage = async (uri: string, maxWidth: number = 800) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};
```

### 9.2 리스트 최적화

#### FlatList 최적화

```typescript
<FlatList
  data={stores}
  renderItem={({ item }) => <StoreCard store={item} />}
  keyExtractor={(item) => item.id}

  // 성능 최적화 옵션
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}

  // 스크롤 성능
  getItemLayout={(data, index) => ({
    length: 120,
    offset: 120 * index,
    index,
  })}
/>
```

### 9.3 데이터 캐싱

#### React Query 사용 (향후 도입 권장)

```typescript
// 향후 도입 시 예시
import { useQuery } from '@tanstack/react-query';

const useStores = (options: StoreQueryOptions) => {
  return useQuery({
    queryKey: ['stores', options],
    queryFn: () => fetchStores(options),
    staleTime: 5 * 60 * 1000,  // 5분간 신선한 데이터로 취급
    cacheTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
};
```

### 9.4 네트워크 최적화

#### 필요한 필드만 선택 (Select)

```typescript
// BAD: 모든 필드 가져오기
const { data } = await supabase.from('stores').select('*');

// GOOD: 필요한 필드만 선택
const { data } = await supabase.from('stores').select(`
  id,
  name,
  address,
  thumbnail_url,
  average_rating
`);
```

#### 페이지네이션

```typescript
const getStores = async (page: number, pageSize: number = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from('stores')
    .select('*', { count: 'exact' })
    .range(from, to);

  return {
    data,
    hasMore: count ? from + pageSize < count : false,
  };
};
```

---

## 10. 향후 기술 계획

### 10.1 Phase 1 (현재 ~ 2주)

| 기술 | 작업 내용 | 우선순위 |
|------|----------|----------|
| 토스페이먼츠 | 캐시 충전 실결제 연동 | 높음 |
| 예약 취소 | 1시간 내 취소 + 환불 로직 | 높음 |
| 테스트 환경 | 테스트 계정, 테스트 시나리오 | 높음 |

### 10.2 Phase 2 (3~6주)

| 기술 | 작업 내용 | 우선순위 |
|------|----------|----------|
| 카카오맵 SDK | 지도 기반 업체 탐색 | 높음 |
| Expo Push | 예약/픽업 알림 | 중간 |
| Sentry | 에러 모니터링 | 중간 |
| 검색 강화 | 통합 검색, 필터링 | 중간 |

### 10.3 Phase 3 (7~12주)

| 기술 | 작업 내용 | 우선순위 |
|------|----------|----------|
| 카카오 알림톡 | 카톡 알림 발송 | 중간 |
| 소셜 로그인 | 카카오, 구글 로그인 | 낮음 |
| 운영자 대시보드 | 웹 관리자 페이지 | 중간 |
| 성능 모니터링 | Firebase Performance | 낮음 |

### 10.4 Phase 4 (12주 이후)

| 기술 | 작업 내용 | 우선순위 |
|------|----------|----------|
| 실시간 채팅 | Supabase Realtime | 낮음 |
| 쿠폰/프로모션 | 할인 쿠폰 시스템 | 낮음 |
| A/B 테스트 | Firebase Remote Config | 낮음 |
| 다국어 지원 | i18n | 낮음 |

---

## 11. 부록

### 11.1 자주 사용하는 명령어

```bash
# Expo 개발 서버 시작
npx expo start

# 의존성 설치
npm install

# TypeScript 타입 체크
npx tsc --noEmit

# ESLint 검사
npm run lint

# EAS 빌드
eas build --platform ios
eas build --platform android

# Git 커밋
git add -A
git commit -m "메시지"
git push origin master
```

### 11.2 Supabase SQL 실행 방법

1. https://supabase.com 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴 > SQL Editor
4. New Query 클릭
5. SQL 코드 붙여넣기
6. RUN 버튼 클릭

### 11.3 문제 해결 가이드

#### 로그인이 안 될 때

```
1. consumers 또는 stores 테이블에 user_id 레코드 확인
2. Supabase Auth > Users에서 이메일 인증 상태 확인
3. .env 파일의 Supabase URL/Key 확인
```

#### 예약이 안 될 때

```
1. 상품의 재고(stock_quantity - reserved_quantity) 확인
2. 업체의 캐시 잔액(cash_balance) 확인
3. 업체의 is_approved 상태 확인
```

#### 빌드 에러가 날 때

```
1. node_modules 삭제 후 npm install
2. .expo 폴더 삭제
3. npx expo start --clear
4. eas build --clear-cache --platform [ios|android]
```

### 11.4 관련 문서

| 문서 | 위치 |
|------|------|
| PRD (제품 요구사항) | `docs/PRD.md` |
| 프로젝트 분석 보고서 | `docs/PROJECT-ANALYSIS-REPORT.md` |
| 데이터베이스 스키마 | `project-analysis/repo-latest/docs/01-database-schema.md` |
| 시스템 아키텍처 | `project-analysis/repo-latest/docs/02-system-architecture.md` |
| API 설계 | `project-analysis/repo-latest/docs/03-api-design.md` |

### 11.5 연락처 및 참고 링크

| 서비스 | URL |
|--------|-----|
| Supabase 대시보드 | https://supabase.com/dashboard |
| Expo 문서 | https://docs.expo.dev |
| React Native 문서 | https://reactnative.dev |
| 토스페이먼츠 개발자센터 | https://developers.tosspayments.com |
| 카카오맵 API | https://apis.map.kakao.com |

---

**문서 작성**: TRD 에이전트
**검토일**: 2026-01-17
**다음 단계**: 테스트 계획서 작성

---

> 이 문서는 비전공자도 이해할 수 있도록 기술적 용어에 대한 설명을 포함하고, 실제 코드 예시를 제공하였습니다.
