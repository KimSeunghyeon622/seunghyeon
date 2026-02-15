---
name: deploy-strategy
description: 배포 전략을 수립합니다. 다음에 사용: (1) 인프라 아키텍처 설계, (2) CI/CD 파이프라인 구성, (3) 환경 변수 관리, (4) 모니터링 설정, (5) 롤백 계획 수립, (6) 배포 체크리스트 작성
---

# 배포 전략 수립 스킬

포괄적인 배포 전략을 수립합니다. 인프라, CI/CD, 모니터링, 롤백 계획을 포함합니다.

## 실행 지침

1. TRD(`docs/TRD.md`)와 테스트 계획 참조
2. 인프라 및 배포 전략 정의
3. `docs/Deploy-Strategy.md`에 저장

## 배포 환경

| 환경 | 용도 | 배포 주기 |
|------|------|----------|
| Development | 개발 테스트 | 수시 (PR마다) |
| Staging | QA/통합 테스트 | PR 머지 시 |
| Production | 실서비스 | 승인 후 |

## 인프라 구성 (Vercel + Supabase)

```
┌─────────────────────────────────────────┐
│               Vercel                     │
│  [Preview] [Staging] [Production]       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           Supabase                       │
│  [Database] [Auth] [Storage]            │
└─────────────────────────────────────────┘
```

## CI/CD 파이프라인

```
PR 생성 → Lint/Type Check → Test → Build → Preview Deploy
      ↓
PR 승인 → Main 머지 → Test → Build → Production Deploy
      ↓
배포 후 → Health Check → Smoke Test → 완료
```

## 롤백 전략

### 자동 롤백 조건
- 에러율 5% 초과 (5분 내)
- Health Check 3회 연속 실패
- Critical 에러 10건 이상

### 수동 롤백
```bash
# Vercel
vercel rollback [deployment-url]

# 또는 대시보드에서 이전 배포 "Promote to Production"
```

## 배포 체크리스트

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 환경 변수 확인
- [ ] DB 마이그레이션 준비
- [ ] 롤백 계획 확인

### 배포 후
- [ ] Health Check 확인
- [ ] Smoke Test 수행
- [ ] 메트릭 정상 확인

## 상세 템플릿

전체 배포 전략 템플릿은 [references/deploy-template.md](references/deploy-template.md) 참고

## 출력 위치

`docs/Deploy-Strategy.md`
