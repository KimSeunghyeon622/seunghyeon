# 📱 업체 상세 페이지 개선 가이드

> **목표**: StoreDetail 페이지를 SaveIt 앱 스타일의 현대적인 UI로 업그레이드

---

## ✅ 새로 추가되는 기능

### 1. 시각적 개선
- ✅ **커버 이미지**: 상단 배너 이미지 (200px 높이)
- ✅ **업체 로고**: 원형 프로필 이미지 (커버 위에 겹쳐서)
- ✅ **상품 이미지**: 큰 카드 형태 (200px 높이)
- ✅ **할인율 뱃지**: 상품 이미지 위 우측 상단

### 2. 정보 추가
- ✅ **카테고리**: 베이커리, 카페, 레스토랑 등
- ✅ **평점 및 리뷰 개수**: ⭐ 4.5 (리뷰 32개)
- ✅ **영업시간**: 매일 09:00 - 21:00
- ✅ **픽업 시간**: 19:00 - 21:30
- ✅ **업체 설명**: 상세 소개 텍스트
- ✅ **환불 정책**: 취소/환불 규정
- ✅ **노쇼 정책**: 노쇼 시 제재 사항

### 3. UX 개선
- ✅ **전화 걸기**: 전화번호 클릭 시 바로 통화
- ✅ **큰 이미지**: 상품을 더 잘 보여주는 큰 이미지
- ✅ **카드 레이아웃**: 현대적인 카드 디자인
- ✅ **그림자 효과**: 입체감 있는 UI

---

## 🔧 설치 단계 (순서대로 진행하세요!)

### ⚠️ 중요: 반드시 1단계부터 순서대로 진행하세요!

---

## 📌 1단계: Supabase SQL 실행

### 1-1. Supabase 로그인
1. https://supabase.com 접속
2. 로그인
3. 프로젝트 선택 (qycwdncplofgzdrjtklb)
4. 왼쪽 메뉴: **SQL Editor** 클릭

### 1-2. SQL 스크립트 실행

**GitHub에서 SQL 파일 열기:**
```
https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/sql/07-store-detail-enhancements.sql
```

**실행 방법:**
1. 위 링크 클릭 → **Raw** 버튼 클릭
2. 전체 선택 (Ctrl+A) → 복사 (Ctrl+C)
3. Supabase SQL Editor → **New Query**
4. 붙여넣기 (Ctrl+V)
5. **RUN** 버튼 클릭 ▶️

**예상 결과:**
```
Success. No rows returned
```

### 1-3. 결과 확인

아래 SQL을 실행해서 새로운 컬럼들이 추가되었는지 확인:

```sql
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN (
    'cover_image_url',
    'logo_url',
    'description',
    'category',
    'opening_hours_text',
    'pickup_start_time',
    'pickup_end_time',
    'refund_policy',
    'no_show_policy',
    'review_count'
  )
ORDER BY column_name;
```

**예상 결과:** 10개의 컬럼이 조회되어야 함

---

## 📌 2단계: 테스트 데이터 업데이트 (선택사항)

테스트 업체에 샘플 데이터를 추가하고 싶다면:

**GitHub에서 SQL 파일 열기:**
```
https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/sql/08-update-test-store-data.sql
```

**실행 방법:**
1. 위 링크 클릭 → **Raw** 버튼 클릭
2. 전체 선택 (Ctrl+A) → 복사 (Ctrl+C)
3. Supabase SQL Editor → **New Query**
4. 붙여넣기 (Ctrl+V)
5. **업체 이름 확인** (WHERE name = '테스트 베이커리')
   - 만약 다른 이름이면 SQL 수정
6. **RUN** 버튼 클릭 ▶️

---

## 📌 3단계: React Native 코드 교체

### 3-1. StoreDetail.tsx 교체

**Windows PC에서 작업:**

1. GitHub 파일 열기:
   ```
   https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreDetail-ENHANCED.tsx
   ```

2. **Raw** 버튼 클릭

3. 전체 선택 (Ctrl+A) → 복사 (Ctrl+C)

4. VSCode에서 열기:
   ```
   C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\src\screens\StoreDetail.tsx
   ```

5. 전체 선택 (Ctrl+A) → 붙여넣기 (Ctrl+V)

6. 저장 (Ctrl+S)

### 3-2. Metro 재시작

CMD에서:
```bash
# Ctrl+C로 중지
npx expo start
```

---

## 📌 4단계: 테스트

### 4-1. 기본 동작 확인

1. ✅ 앱 실행 → 업체 리스트 → 업체 클릭
2. ✅ 커버 이미지 영역이 보이는지 (회색 플레이스홀더 또는 이미지)
3. ✅ 업체 로고가 커버 이미지 위에 겹쳐서 보이는지
4. ✅ 카테고리, 평점, 리뷰 개수가 보이는지
5. ✅ 영업시간, 픽업 시간, 주소, 전화번호가 보이는지
6. ✅ 업체 설명이 보이는지 (없으면 안 보임)
7. ✅ 환불/노쇼 정책이 보이는지
8. ✅ 상품 리스트가 큰 카드 형태로 보이는지
9. ✅ 상품 이미지 우측 상단에 할인율 뱃지가 보이는지
10. ✅ 예약하기 버튼이 작동하는지

### 4-2. 전화 걸기 테스트

1. 전화번호 클릭
2. 전화 앱이 열리는지 확인

### 4-3. 오류 확인

CMD 창에서 빨간 오류가 있는지 확인

---

## 📌 5단계: 이미지 업로드 (선택사항)

실제 이미지를 추가하고 싶다면:

### 5-1. Supabase Storage에 이미지 업로드

1. Supabase Dashboard → **Storage** 메뉴
2. **store-documents** 버킷 클릭
3. **Upload file** 버튼
4. 이미지 파일 선택 및 업로드
   - 커버 이미지: `covers/store1-cover.jpg` (권장 크기: 1200x400px)
   - 로고 이미지: `logos/store1-logo.jpg` (권장 크기: 200x200px)

### 5-2. 이미지 URL 복사

업로드된 파일 클릭 → **Copy URL** 버튼

예시:
```
https://qycwdncplofgzdrjtklb.supabase.co/storage/v1/object/public/store-documents/covers/store1-cover.jpg
```

### 5-3. SQL로 URL 업데이트

```sql
UPDATE stores
SET
  cover_image_url = '여기에_커버이미지_URL_붙여넣기',
  logo_url = '여기에_로고이미지_URL_붙여넣기'
WHERE name = '테스트 베이커리';
```

### 5-4. 앱 새로고침

앱에서 업체 목록 → 뒤로가기 → 다시 들어가기

---

## 🎨 디자인 사양

### 색상
- **주요 색상**: #FF6B6B (빨강)
- **배경색**: #F5F5F5 (연한 회색)
- **카드 배경**: #FFFFFF (흰색)
- **텍스트**: #333 (진한 회색), #666 (중간 회색), #999 (연한 회색)

### 크기
- **커버 이미지**: 전체 너비 × 200px
- **로고**: 80px × 80px (원형)
- **상품 이미지**: 전체 너비 × 200px
- **카드 모서리**: 16px 라운드
- **버튼 모서리**: 20px 라운드

### 아이콘
- 🕒 영업시간
- 📦 픽업 시간
- 📍 주소
- 📞 전화번호
- 💰 환불 정책
- ⚠️ 노쇼 정책
- ⭐ 평점

---

## ❌ 오류 해결

### 오류 1: "Cannot read property 'cover_image_url' of null"
**원인**: store 데이터를 불러오지 못함
**해결**:
```sql
-- stores 테이블에 데이터가 있는지 확인
SELECT id, name FROM stores;
```

### 오류 2: 이미지가 안 보임
**원인**: image_url이 null이거나 잘못된 URL
**해결**:
- 플레이스홀더(🍞 이모지)가 보이면 정상
- 실제 이미지를 보려면 5단계 진행

### 오류 3: TypeScript 오류
**원인**: src/lib/supabase.ts import 경로 문제
**해결**:
```typescript
// StoreDetail.tsx 파일 상단 확인
import { supabase } from '../lib/supabase';
// '../lib/supabase'가 맞는지 확인
```

---

## 📊 새로 추가된 데이터베이스 컬럼

| 컬럼명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| cover_image_url | TEXT | 커버 이미지 URL | NULL |
| logo_url | TEXT | 로고 이미지 URL | NULL |
| description | TEXT | 업체 설명 | NULL |
| category | TEXT | 카테고리 | '기타' |
| opening_hours | JSONB | 영업시간 (JSON) | NULL |
| opening_hours_text | TEXT | 영업시간 텍스트 | NULL |
| pickup_start_time | TIME | 픽업 시작 시간 | 09:00:00 |
| pickup_end_time | TIME | 픽업 종료 시간 | 21:00:00 |
| refund_policy | TEXT | 환불 정책 | 기본 정책 텍스트 |
| no_show_policy | TEXT | 노쇼 정책 | 기본 정책 텍스트 |
| review_count | INTEGER | 리뷰 개수 | 0 (자동 계산) |

---

## 🎯 다음 단계 (향후 개선)

### Phase 2
- [ ] 지도 보기 (구글/카카오 맵 연동)
- [ ] 리뷰 목록 보기
- [ ] 즐겨찾기 기능
- [ ] 공유 기능

### Phase 3
- [ ] 업체 영업시간 상세 (요일별)
- [ ] 다중 이미지 갤러리
- [ ] 추천 상품
- [ ] 쿠폰/프로모션

---

## 📞 문제 발생 시

1. **Supabase SQL 오류**
   - SQL Editor에서 오류 메시지 확인
   - 이미 존재하는 컬럼이면 무시 (IF NOT EXISTS 사용)

2. **React Native 오류**
   - CMD 창에서 빨간 오류 메시지 확인
   - Metro 재시작 (Ctrl+C → npx expo start)

3. **앱이 안 열림**
   - 휴대폰 Expo Go 앱 재실행
   - WiFi 연결 확인

---

**작성일**: 2026-01-11
**작성자**: Claude Code
**버전**: 1.0

> 이 가이드를 따라하면 업체 상세 페이지가 SaveIt 앱처럼 현대적인 디자인으로 업그레이드됩니다! 🎉
