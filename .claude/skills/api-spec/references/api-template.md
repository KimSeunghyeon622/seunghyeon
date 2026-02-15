# API 명세서 전체 템플릿

## 1. 개요
- **Base URL**: `https://api.example.com/v1`
- **API 버전**: v1
- **인증 방식**: Bearer Token (Supabase Auth)

## 2. 공통 사항

### 2.1 요청 헤더
| 헤더 | 필수 | 설명 |
|------|------|------|
| Authorization | O | Bearer {access_token} |
| Content-Type | O | application/json |

### 2.2 페이지네이션
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2.3 날짜 형식
- ISO 8601: `2024-01-15T09:30:00Z`

## 3. 인증 API

### POST /auth/register
- **설명**: 소비자 회원가입

**Request Body**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | O | 이메일 |
| password | string | O | 비밀번호 (8자 이상) |
| name | string | O | 이름 |
| phone | string | X | 전화번호 |

**Response (201)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "user_type": "consumer"
    },
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

### POST /auth/login
- **설명**: 로그인

**Request Body**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | O | 이메일 |
| password | string | O | 비밀번호 |

**Response (200)**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

## 4. 리소스 API 템플릿

### GET /resources
- **설명**: 목록 조회
- **인증**: 필요

**Query Parameters**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| page | number | X | 1 | 페이지 번호 |
| limit | number | X | 20 | 페이지당 개수 |
| sort | string | X | created_at | 정렬 기준 |
| order | string | X | desc | 정렬 순서 |

### GET /resources/:id
- **설명**: 단일 조회

**Path Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| id | uuid | 리소스 ID |

### POST /resources
- **설명**: 생성

### PUT /resources/:id
- **설명**: 전체 수정

### PATCH /resources/:id
- **설명**: 부분 수정

### DELETE /resources/:id
- **설명**: 삭제 (또는 소프트 삭제)

## 5. 데이터 모델

### User
```typescript
interface User {
  id: string;           // UUID
  email: string;
  name: string;
  phone?: string;
  profile_image?: string;
  user_type: 'consumer' | 'store_owner';
  created_at: string;   // ISO 8601
  updated_at: string;
}
```

### Store
```typescript
interface Store {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

### Reservation
```typescript
interface Reservation {
  id: string;
  user_id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  pickup_time: string;
  created_at: string;
}
```
