---
name: erd
description: ERD(엔티티 관계 다이어그램)를 작성합니다. 다음에 사용: (1) 새 테이블 설계, (2) 테이블 간 관계 정의, (3) 인덱스 설계, (4) 데이터베이스 구조 문서화, (5) 마이그레이션 계획 수립
---

# ERD 작성 스킬

ERD(Entity Relationship Diagram)를 텍스트 기반으로 작성합니다.

## 실행 지침

1. PRD(`docs/PRD.md`)와 API 명세에서 필요한 엔티티 파악
2. 엔티티 정의 및 관계 설정
3. `docs/ERD.md`에 저장

## 엔티티 작성 형식

```markdown
### 테이블명 (한글명)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 |

**인덱스**
- PRIMARY KEY (id)
- INDEX (자주 조회하는 컬럼)
```

## 관계 표기법

```
1:1 관계: ──────
1:N 관계: ────<
N:M 관계: >───<
```

## 관계 다이어그램 예시

```
┌─────────────┐       ┌─────────────┐
│    users    │       │   stores    │
├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │
│ email       │  │    │ owner_id(FK)│
│ name        │  └───<│ name        │
└─────────────┘       └─────────────┘

관계: users (1) ──< stores (N)
```

## 설계 원칙

1. **정규화**: 최소 3NF까지
2. **인덱스**: 자주 조회되는 컬럼, FK에 설정
3. **소프트 삭제**: `deleted_at` 컬럼 활용
4. **타임스탬프**: `created_at`, `updated_at` 필수
5. **UUID**: 기본키로 UUID 권장 (보안, 분산 환경)

## ENUM 정의 형식

```markdown
### EnumName
- `value1`: 설명
- `value2`: 설명
```

## 상세 템플릿

전체 ERD 템플릿은 [references/erd-template.md](references/erd-template.md) 참고

## 출력 위치

`docs/ERD.md`
