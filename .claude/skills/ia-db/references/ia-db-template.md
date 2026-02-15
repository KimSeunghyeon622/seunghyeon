# IA & DB 설계 전체 템플릿

## Part 1: 정보 구조(IA) 점검 보고서

### 1. 사이트맵

```
홈 (/)
├── 인증
│   ├── 로그인 (/login)
│   ├── 회원가입 선택 (/signup)
│   ├── 소비자 회원가입 (/signup/consumer)
│   └── 업주 회원가입 (/signup/store)
├── 소비자 영역
│   ├── 업체 목록 (/stores)
│   ├── 업체 상세 (/stores/:id)
│   ├── 예약하기 (/stores/:id/reserve)
│   ├── 내 예약 (/my-reservations)
│   └── 마이페이지 (/mypage)
├── 업주 영역
│   ├── 대시보드 (/store/dashboard)
│   ├── 상품 관리 (/store/products)
│   ├── 예약 관리 (/store/reservations)
│   ├── 캐시 관리 (/store/cash)
│   └── 업체 정보 (/store/info)
└── 공통
    ├── 리뷰 작성 (/reviews/write)
    └── 설정 (/settings)
```

### 2. 네비게이션 구조

#### 2.1 소비자 GNB
| 메뉴 | 링크 | 권한 |
|------|------|------|
| 홈 | / | 모두 |
| 업체 목록 | /stores | 모두 |
| 내 예약 | /my-reservations | 로그인 |
| 마이페이지 | /mypage | 로그인 |

#### 2.2 업주 GNB
| 메뉴 | 링크 | 권한 |
|------|------|------|
| 대시보드 | /store/dashboard | 업주 |
| 상품 관리 | /store/products | 업주 |
| 예약 관리 | /store/reservations | 업주 |
| 캐시 관리 | /store/cash | 업주 |

### 3. 페이지 계층 분석

| Depth | 페이지 수 | 비고 |
|-------|----------|------|
| 1 (루트) | 4 | 홈, 로그인, 업체목록, 대시보드 |
| 2 | 10 | 주요 기능 페이지 |
| 3 | 4 | 상세/하위 페이지 |
| **총계** | **18** | |

### 4. IA 점검 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| 3클릭 규칙 | ✅ | 최대 3depth |
| 일관된 네이밍 | ✅ | |
| 브레드크럼 | ✅ | 2depth 이상 |
| 검색 기능 | ✅ | 헤더 |
| 404 페이지 | ✅ | |
| 접근성 | ✅ | ARIA |

---

## Part 2: DB 테이블 플로우

### 1. 사용자 등록 플로우
```
[소비자 회원가입]
Client → POST /auth/register
       → Validate (이메일 형식, 비밀번호 강도)
       → Hash Password
       → INSERT users
       → Return JWT

[업주 회원가입]
Client → POST /auth/register/store
       → Validate (사업자번호 등)
       → Hash Password
       → BEGIN TRANSACTION
         → INSERT users
         → INSERT stores (status: pending)
       → COMMIT
       → Return JWT
```

### 2. 예약 플로우
```
[예약 생성]
Client → POST /reservations
       → Validate (재고 확인)
       → BEGIN TRANSACTION
         → SELECT products FOR UPDATE (행 잠금)
         → UPDATE products (재고 차감)
         → INSERT reservations
         → UPDATE stores (캐시 차감 - 수수료)
       → COMMIT
       → Return Reservation
```

### 3. 예약 취소 플로우
```
[예약 취소]
Client → PATCH /reservations/:id/cancel
       → Validate (취소 가능 상태)
       → BEGIN TRANSACTION
         → UPDATE reservations (status: cancelled)
         → UPDATE products (재고 복구)
         → UPDATE stores (캐시 환불 - 수수료)
       → COMMIT
```

---

## Part 3: DB 스키마 SQL

```sql
-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users 테이블
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  encrypted_password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  profile_image VARCHAR(500),
  user_type VARCHAR(20) NOT NULL DEFAULT 'consumer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_user_type CHECK (user_type IN ('consumer', 'store_owner'))
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_user_type ON public.users(user_type);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. stores 테이블
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  cash_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_store_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_stores_owner ON public.stores(owner_id);
CREATE INDEX idx_stores_status ON public.stores(status);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 3. products 테이블
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  original_price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  pickup_start TIME NOT NULL,
  pickup_end TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_product_status CHECK (status IN ('available', 'sold_out', 'hidden')),
  CONSTRAINT valid_price CHECK (discount_price <= original_price)
);

CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_products_status ON public.products(status);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. reservations 테이블
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  pickup_time TIMESTAMPTZ NOT NULL,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_reservation_status CHECK (
    status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')
  )
);

CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_store ON public.reservations(store_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
```

---

## Part 4: 점검 체크리스트

| 항목 | 상태 |
|------|------|
| IA 사이트맵 완성 | ✅ |
| 네비게이션 구조 정의 | ✅ |
| 테이블 정의 완료 | ✅ |
| 관계 설정 완료 | ✅ |
| 인덱스 설계 완료 | ✅ |
| RLS 활성화 | ✅ |
| 마이그레이션 준비 | ✅ |
