---
name: api-spec
description: RESTful API 명세서를 작성합니다. 다음에 사용: (1) 새 API 엔드포인트 설계, (2) 요청/응답 스키마 정의, (3) 인증 방식 문서화, (4) 에러 코드 체계화, (5) 기존 API 문서화
---

# API 명세서 작성 스킬

RESTful API 명세서를 작성합니다. PRD/TRD 기반으로 일관된 API를 설계합니다.

## 실행 지침

1. PRD(`docs/PRD.md`)와 TRD(`docs/TRD.md`)에서 필요한 기능 파악
2. 엔드포인트, 요청/응답 스키마, 에러 코드 정의
3. `docs/API-Specification.md`에 저장

## API 설계 원칙

### RESTful 규칙
- 리소스 중심 URL: `/users`, `/stores`, `/reservations`
- HTTP 메서드: GET(조회), POST(생성), PUT(전체수정), PATCH(부분수정), DELETE(삭제)
- 복수형 명사 사용: `/users` (O), `/user` (X)

### 응답 형식 (필수)
```json
{
  "success": true,
  "data": { },
  "message": "Success"
}
```

### 에러 응답 (필수)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 메시지"
  }
}
```

## 엔드포인트 작성 형식

```markdown
### [HTTP메서드] /경로
- **설명**: 무엇을 하는 API인가
- **인증**: 필요 여부

**Request**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|

**Response (상태코드)**
```json
{ }
```

**에러 케이스**
| 상황 | 코드 | 메시지 |
|------|------|--------|
```

## 공통 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| UNAUTHORIZED | 401 | 인증 실패 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| VALIDATION_ERROR | 400 | 입력값 오류 |
| CONFLICT | 409 | 중복/충돌 |
| INTERNAL_ERROR | 500 | 서버 오류 |

## 상세 템플릿

전체 API 명세서 템플릿은 [references/api-template.md](references/api-template.md) 참고

## 출력 위치

`docs/API-Specification.md`
