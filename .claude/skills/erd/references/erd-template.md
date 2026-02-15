# ERD 전체 템플릿

## 1. 엔티티 목록

### 1.1 users (사용자)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 |
| encrypted_password | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| name | VARCHAR(100) | NOT NULL | 이름 |
| phone | VARCHAR(20) | NULL | 전화번호 |
| profile_image | VARCHAR(500) | NULL | 프로필 이미지 URL |
| user_type | ENUM | NOT NULL | 사용자 유형 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일시 |
| deleted_at | TIMESTAMPTZ | NULL | 삭제일시 (소프트 삭제) |

**인덱스**
- PRIMARY KEY (id)
- UNIQUE INDEX (email)
- INDEX (user_type)
- INDEX (created_at)

### 1.2 stores (업체)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| owner_id | UUID | FK, NOT NULL | 업주 ID |
| name | VARCHAR(200) | NOT NULL | 업체명 |
| description | TEXT | NULL | 업체 설명 |
| address | VARCHAR(500) | NOT NULL | 주소 |
| phone | VARCHAR(20) | NOT NULL | 연락처 |
| category | VARCHAR(50) | NOT NULL | 카테고리 |
| status | ENUM | NOT NULL, DEFAULT 'pending' | 상태 |
| cash_balance | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | 캐시 잔액 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일시 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일시 |

**인덱스**
- PRIMARY KEY (id)
- FOREIGN KEY (owner_id) REFERENCES users(id)
- INDEX (status)
- INDEX (category)

### 1.3 products (상품)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| store_id | UUID | FK, NOT NULL | 업체 ID |
| name | VARCHAR(200) | NOT NULL | 상품명 |
| description | TEXT | NULL | 상품 설명 |
| original_price | DECIMAL(10,2) | NOT NULL | 원가 |
| discount_price | DECIMAL(10,2) | NOT NULL | 할인가 |
| quantity | INT | NOT NULL, DEFAULT 0 | 재고 수량 |
| image_url | VARCHAR(500) | NULL | 상품 이미지 |
| pickup_start | TIME | NOT NULL | 픽업 시작 시간 |
| pickup_end | TIME | NOT NULL | 픽업 종료 시간 |
| status | ENUM | NOT NULL, DEFAULT 'available' | 상태 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일시 |

**인덱스**
- PRIMARY KEY (id)
- FOREIGN KEY (store_id) REFERENCES stores(id)
- INDEX (status)

### 1.4 reservations (예약)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK, NOT NULL | 예약자 ID |
| store_id | UUID | FK, NOT NULL | 업체 ID |
| product_id | UUID | FK, NOT NULL | 상품 ID |
| quantity | INT | NOT NULL | 예약 수량 |
| total_price | DECIMAL(10,2) | NOT NULL | 총 금액 |
| status | ENUM | NOT NULL, DEFAULT 'pending' | 상태 |
| pickup_time | TIMESTAMPTZ | NOT NULL | 픽업 예정 시간 |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일시 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일시 |

**인덱스**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id)
- FOREIGN KEY (store_id) REFERENCES stores(id)
- FOREIGN KEY (product_id) REFERENCES products(id)
- INDEX (status)
- INDEX (pickup_time)

## 2. 관계 다이어그램

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   stores    │       │  products   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │──┐    │ id (PK)     │
│ email       │  │    │ owner_id(FK)│  │    │ store_id(FK)│
│ name        │  └───<│ name        │  └───<│ name        │
│ user_type   │       │ category    │       │ price       │
└─────────────┘       └─────────────┘       └─────────────┘
       │                    │                      │
       │                    │                      │
       │              ┌─────┴──────────────────────┘
       │              │
       │              ▼
       │        ┌─────────────┐
       │        │ reservations│
       │        ├─────────────┤
       └───────>│ user_id(FK) │
                │ store_id(FK)│
                │ product_id  │
                │ status      │
                └─────────────┘
```

## 3. 관계 상세

| 관계 | 카디널리티 | 설명 |
|------|-----------|------|
| users - stores | 1:N | 업주는 여러 업체 소유 가능 |
| stores - products | 1:N | 업체는 여러 상품 등록 가능 |
| users - reservations | 1:N | 사용자는 여러 예약 가능 |
| products - reservations | 1:N | 상품은 여러 예약에 포함 |

## 4. ENUM 정의

### UserType
- `consumer`: 소비자
- `store_owner`: 업주

### StoreStatus
- `pending`: 승인 대기
- `approved`: 승인됨
- `rejected`: 거절됨

### ProductStatus
- `available`: 판매중
- `sold_out`: 품절
- `hidden`: 숨김

### ReservationStatus
- `pending`: 대기
- `confirmed`: 확정
- `completed`: 완료
- `cancelled`: 취소

## 5. 제약 조건

1. **사용자 삭제**: 소프트 삭제 (deleted_at 설정)
2. **업체 삭제**: CASCADE로 연관 상품도 삭제
3. **예약 취소**: 상태 변경만, 삭제 안 함
4. **금액 계산**: DB 함수에서 수행 (프론트 계산 금지)
