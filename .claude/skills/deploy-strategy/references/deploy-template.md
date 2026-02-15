# 배포 전략 전체 템플릿

## 1. 인프라 아키텍처

### 1.1 클라우드 구성 (Vercel + Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Preview   │  │   Preview   │  │  Production │         │
│  │ (PR Branch) │  │  (Staging)  │  │   (Main)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Database   │  │    Auth     │  │   Storage   │         │
│  │ (Postgres)  │  │ (Supabase)  │  │  (Bucket)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 환경 변수 관리

| 변수 | Development | Staging | Production |
|------|------------|---------|------------|
| SUPABASE_URL | dev-project | staging-project | prod-project |
| SUPABASE_ANON_KEY | dev-key | staging-key | prod-key |
| SENTRY_DSN | - | staging-dsn | prod-dsn |

**관리 방법:**
- Vercel: Project Settings → Environment Variables
- Expo: EAS Secret 또는 app.config.js

---

## 2. CI/CD 파이프라인

### 2.1 GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 2.2 배포 단계

```
1. PR 생성
   └── Preview 자동 배포
   └── 테스트 자동 실행

2. PR 리뷰 & 승인

3. Main 머지
   └── 테스트 실행
   └── 빌드
   └── Production 배포

4. 배포 확인
   └── Health Check
   └── Smoke Test
```

---

## 3. 배포 전략

### 3.1 Blue-Green 배포 (Vercel 기본)

```
Before:
[Blue - v1.0] ← 트래픽 100%

During:
[Blue - v1.0] ← 트래픽 100%
[Green - v1.1] (준비 중)

After (성공):
[Green - v1.1] ← 트래픽 100%
[Blue - v1.0] (대기/롤백용)

Rollback:
[Blue - v1.0] ← 트래픽 100%
```

### 3.2 Feature Flag (선택)

```typescript
const featureFlags = {
  newCheckout: {
    enabled: true,
    rolloutPercentage: 10,
    allowedUsers: ['beta@example.com']
  }
};
```

---

## 4. 모니터링

### 4.1 도구

| 영역 | 도구 | 용도 |
|------|------|------|
| APM | Vercel Analytics | 성능 |
| Error | Sentry | 에러 추적 |
| Log | Vercel Logs | 로그 |
| Uptime | UptimeRobot | 가용성 |
| Analytics | PostHog | 사용자 분석 |

### 4.2 핵심 메트릭

| 메트릭 | 목표 | 알림 임계값 |
|--------|------|------------|
| 응답 시간 (p95) | < 500ms | > 1000ms |
| 에러율 | < 0.1% | > 1% |
| 가용성 | 99.9% | < 99% |
| Core Web Vitals | Good | Poor |

### 4.3 Sentry 설정

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

## 5. 롤백 계획

### 5.1 자동 롤백 조건
- 배포 후 5분 내 에러율 5% 초과
- Health Check 3회 연속 실패
- Critical 에러 10건 이상

### 5.2 수동 롤백

```bash
# Vercel CLI
vercel rollback [deployment-url]

# 대시보드
# 1. Vercel Dashboard → Deployments
# 2. 이전 배포 선택
# 3. "Promote to Production"
```

### 5.3 DB 롤백

```sql
-- 마이그레이션 롤백 (예시)
-- 실제로는 마이그레이션 도구 사용

-- 최후의 수단: 백업 복원
-- pg_restore -d database backup.dump
```

---

## 6. 배포 체크리스트

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 환경 변수 확인
- [ ] DB 마이그레이션 준비
- [ ] 롤백 계획 확인

### 배포 중
- [ ] 배포 상태 모니터링
- [ ] 에러 로그 확인
- [ ] Health Check 확인

### 배포 후
- [ ] Smoke Test 수행
- [ ] 핵심 기능 확인
- [ ] 메트릭 정상 확인
- [ ] 팀 공지

---

## 7. 비상 연락망

| 역할 | 담당 | 연락처 |
|------|------|--------|
| 1차 대응 | 개발팀 | Slack #dev-alerts |
| 2차 대응 | DevOps | Slack #ops |
| 의사결정 | PM | 직접 연락 |
