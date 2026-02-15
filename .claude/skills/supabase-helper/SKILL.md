---
name: supabase-helper
description: Supabase DB 관리를 도와줍니다. 다음에 사용: (1) 새 테이블 생성, (2) RLS 정책 설정, (3) DB 함수/트리거 생성, (4) 마이그레이션 SQL 작성, (5) 스토리지 버킷 설정, (6) DB 문제 진단
---

# Supabase Helper 스킬

Supabase 데이터베이스 관리 작업을 자동화합니다.

## 실행 지침

1. 사용자 요청 파악 (테이블, RLS, 함수 등)
2. TRD의 DB 설계 참조 (`docs/TRD.md` 4장)
3. 최적화된 SQL 생성
4. **MCP를 활용하여 직접 실행** (필수!)
5. 실행 결과 확인 및 검증
6. `docs/supabase/` 폴더에 저장 (참고용)

## MCP 활용 및 직접 실행 원칙 (필수 준수)

**사용자가 직접 실행하는 것을 최소화하기 위해, 모든 SQL은 MCP를 통해 직접 실행합니다.**

### 핵심 원칙
1. **SQL 직접 실행**: `mcp_supabase_execute_sql` 또는 `mcp_supabase_apply_migration` 사용
2. **프로젝트 ID 자동 확인**: `mcp_supabase_list_projects`로 프로젝트 확인
3. **스키마 확인**: `mcp_supabase_list_tables`로 실제 스키마 확인
4. **실행 후 검증**: 쿼리 실행 후 결과 확인 쿼리 실행
5. **사용자에게 SQL 파일만 제공하지 않음**: 반드시 실행하고 결과 보고

### 작업 프로세스
```
1. 사용자 요청 파악
   ↓
2. 프로젝트 ID 확인 (mcp_supabase_list_projects)
   ↓
3. 현재 스키마 확인 (mcp_supabase_list_tables)
   ↓
4. SQL 작성
   ↓
5. SQL 직접 실행 (mcp_supabase_execute_sql 또는 mcp_supabase_apply_migration)
   ↓
6. 실행 결과 확인
   ↓
7. 검증 쿼리 실행 (필요시)
   ↓
8. 결과 보고 (실행 완료, 생성된 레코드 수 등)
```

### 예시: 테이블 생성
```typescript
// 1. 프로젝트 확인
const projects = await mcp_supabase_list_projects();
const projectId = projects[0].id;

// 2. 현재 스키마 확인
const tables = await mcp_supabase_list_tables({ project_id: projectId });

// 3. SQL 작성
const sql = `
  CREATE TABLE public.new_table (...);
  ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
`;

// 4. 직접 실행
await mcp_supabase_apply_migration({
  project_id: projectId,
  name: 'create_new_table',
  query: sql
});

// 5. 검증
const newTables = await mcp_supabase_list_tables({ project_id: projectId });
// new_table이 생성되었는지 확인
```

### 예시: 데이터 생성
```typescript
// 1. SQL 작성
const sql = `
  INSERT INTO reviews (...)
  VALUES (...);
`;

// 2. 직접 실행
const result = await mcp_supabase_execute_sql({
  project_id: projectId,
  query: sql
});

// 3. 검증 쿼리 실행
const verifySql = `
  SELECT COUNT(*) as count
  FROM reviews
  WHERE store_id = '...';
`;
const verifyResult = await mcp_supabase_execute_sql({
  project_id: projectId,
  query: verifySql
});

// 4. 결과 보고
// "리뷰 3개 생성 완료. 검증 결과: 3개 확인됨"
```

### 필요한 도구가 없을 때
- **명확한 요청**: "Supabase MCP가 필요합니다. 설치해주세요."
- **설치 방법 제공**: 가능하면 설치 방법도 함께 제공
- **대안 제시**: MCP가 없을 경우 대안 방법 제시

**절대 금지**:
- SQL 파일만 제공하고 실행하지 않음
- "사용자가 Supabase에서 실행해주세요"라고 요청
- 검증 없이 SQL만 제출

## 테이블 생성

```sql
CREATE TABLE public.테이블명 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- 컬럼들
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화 (필수!)
ALTER TABLE public.테이블명 ENABLE ROW LEVEL SECURITY;
```

## RLS 정책 패턴

```sql
-- SELECT: 누가 읽을 수 있는가
CREATE POLICY "테이블_select" ON public.테이블
  FOR SELECT USING (조건);

-- INSERT: 누가 생성할 수 있는가
CREATE POLICY "테이블_insert" ON public.테이블
  FOR INSERT WITH CHECK (조건);

-- UPDATE: 누가 수정할 수 있는가
CREATE POLICY "테이블_update" ON public.테이블
  FOR UPDATE USING (조건);

-- DELETE: 누가 삭제할 수 있는가
CREATE POLICY "테이블_delete" ON public.테이블
  FOR DELETE USING (조건);
```

### 자주 쓰는 조건
```sql
-- 본인 데이터만
auth.uid() = user_id

-- 로그인 사용자 모두
auth.role() = 'authenticated'

-- 모두 (공개)
true

-- 업주만
EXISTS (SELECT 1 FROM stores WHERE owner_id = auth.uid())
```

## 함수 생성 (보안 패턴)

```sql
CREATE OR REPLACE FUNCTION public.함수명(파라미터)
RETURNS 반환타입
LANGUAGE plpgsql
SECURITY INVOKER  -- DEFINER 대신 INVOKER 권장
SET search_path = ''  -- 보안 필수!
AS $$
BEGIN
  -- 로직
END;
$$;
```

## 보안 체크리스트

- [ ] 모든 테이블에 RLS 활성화
- [ ] 함수에 `SET search_path = ''`
- [ ] SECURITY INVOKER 사용
- [ ] 민감 컬럼 접근 제한 (cash_balance 등)
- [ ] 가격 계산은 DB 함수에서만

## 상세 패턴

SQL 패턴과 진단 쿼리는 [references/supabase-patterns.md](references/supabase-patterns.md) 참고

## 출력 위치

- SQL: `docs/supabase/[작업명].sql`
- 마이그레이션: `docs/supabase/migrations/[날짜]_[설명].sql`
