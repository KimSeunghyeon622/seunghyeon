---
name: ia-db
description: IA(정보 구조) 점검 보고서 및 DB 스키마를 설계합니다. 다음에 사용: (1) 사이트맵 작성, (2) 네비게이션 구조 정의, (3) DB 테이블 플로우 설계, (4) SQL 스키마 생성, (5) 마이그레이션 스크립트 작성
---

# IA & DB 스키마 설계 스킬

정보 구조(IA) 점검 보고서와 DB 테이블 플로우, 스키마를 설계합니다.

## 실행 지침

1. PRD(`docs/PRD.md`), UX/UI, ERD 문서 참조
2. 정보 구조(IA) 분석 및 점검
3. DB 스키마 설계
4. `docs/IA-DB-Design.md`에 저장

## Part 1: 정보 구조(IA)

### 사이트맵 형식
```
홈 (/)
├── 인증
│   ├── 로그인 (/login)
│   └── 회원가입 (/register)
├── 메인 기능
│   ├── 목록 (/resources)
│   └── 상세 (/resources/:id)
└── 마이페이지 (/mypage)
```

### IA 점검 체크리스트
- [ ] 3클릭 규칙 준수 (최대 3depth)
- [ ] 일관된 네이밍
- [ ] 브레드크럼 제공 (2depth 이상)
- [ ] 검색 기능
- [ ] 404 페이지
- [ ] 접근성 (ARIA)

## Part 2: DB 테이블 플로우

### 데이터 흐름도 형식
```
[플로우명]
Client → API → Validate → DB Operation → Return
```

### 트랜잭션 흐름 형식
```
BEGIN TRANSACTION
  1. 첫 번째 작업
  2. 두 번째 작업
COMMIT
```

## Part 3: DB 스키마

### SQL 생성 원칙
```sql
-- 테이블 생성 기본 구조
CREATE TABLE public.테이블명 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- 컬럼들
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화 (필수)
ALTER TABLE public.테이블명 ENABLE ROW LEVEL SECURITY;
```

### 마이그레이션 파일 구조
```
migrations/
├── 001_create_users.sql
├── 002_create_stores.sql
└── 003_add_indexes.sql
```

## 상세 템플릿

전체 IA & DB 설계 템플릿은 [references/ia-db-template.md](references/ia-db-template.md) 참고

## 출력 위치

`docs/IA-DB-Design.md`
