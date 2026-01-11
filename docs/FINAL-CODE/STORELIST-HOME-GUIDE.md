# 📱 업체 리스트를 홈 화면으로 개편 가이드

> **목표**: SaveIt 앱처럼 로그인 후 업체 리스트가 홈 화면으로 나오도록 개편

---

## ✅ 새로 추가되는 기능

### 1. 홈 화면 = 업체 리스트
- ✅ 로그인 후 자동으로 업체 리스트가 첫 화면
- ✅ 기존 HomeScreen 제거

### 2. 카테고리 필터
- ✅ 가로 스크롤 탭: 전체, 반찬, 제과, 식자재, 밀키트, 정육, 기타
- ✅ 선택한 카테고리만 필터링

### 3. 별점 필터
- ✅ "⭐ ★ 4.5" 버튼 클릭 시 드롭다운
- ✅ 선택 옵션: 전체, 4.5 이상, 4.0 이상, 3.5 이상, 3.0 이상

### 4. 정렬 필터
- ✅ "추천순 ▼" 버튼 클릭 시 드롭다운
- ✅ 선택 옵션: 추천순 (리뷰수 많은 순), 거리순 (추후 구현), 지도보기 (추후 구현)

### 5. 준비중 상태
- ✅ 업체가 어둡게 표시 + "준비중" 라벨
- ✅ 조건:
  - 캐시 잔액 10,000원 이하
  - 영업 설정 OFF (is_open = false)
  - 영업시간 외 (추후 구현)

### 6. 하단 네비게이션
- ✅ 🏠 홈 (업체 리스트)
- ✅ 🎁 주문/예약 (MyReservations)
- ✅ 👤 내 정보 (MyPage)

### 7. UI 개선
- ✅ SaveIt 앱 스타일 디자인
- ✅ 큰 이미지 카드 (200px)
- ✅ 할인율 뱃지 (~50% 할인)
- ✅ 하트 버튼 (즐겨찾기 - 추후 구현)

---

## 🔧 설치 단계 (순서대로 진행하세요!)

### ⚠️ 중요: 반드시 1단계부터 순서대로 진행하세요!

---

## **1단계: Supabase SQL 실행 (가장 먼저!)**

### 1-1. Supabase 로그인
1. https://supabase.com 접속
2. 프로젝트 선택 (qycwdncplofgzdrjtklb)
3. 왼쪽 메뉴: **SQL Editor** 클릭

### 1-2. SQL 파일 열기
GitHub에서 이 파일을 엽니다:
```
https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/sql/09-add-store-status.sql
```

### 1-3. SQL 실행
1. **Raw** 버튼 클릭
2. 전체 선택 (Ctrl+A) → 복사 (Ctrl+C)
3. Supabase SQL Editor → **New Query**
4. 붙여넣기 (Ctrl+V)
5. **RUN** 버튼 클릭 ▶️

예상 결과:
```
Success. No rows returned
```

### 1-4. 결과 확인
아래 SQL을 실행해서 컬럼이 추가되었는지 확인:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name = 'is_open';
```

**1개 컬럼이 조회되면 성공!**

---

## **2단계: 파일 2개 생성**

### 2-1. StoreListHome.tsx 생성

**Windows PC에서 작업:**

1. GitHub 파일 열기:
   ```
   https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/StoreList-HOME.tsx
   ```

2. **Raw** 버튼 클릭

3. 전체 선택 (Ctrl+A) → 복사 (Ctrl+C)

4. VSCode에서 **새 파일 만들기**:
   ```
   C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\src\screens\StoreListHome.tsx
   ```
   (파일명 주의: **StoreListHome.tsx** - 기존 StoreList.tsx와 다름!)

5. 붙여넣기 (Ctrl+V)

6. 저장 (Ctrl+S)

---

### 2-2. App.tsx 교체

1. GitHub 파일 열기:
   ```
   https://github.com/KimSeunghyeon622/seunghyeon/blob/claude/continue-platform-dev-GZurO/docs/FINAL-CODE/App-STORELIST-HOME.tsx
   ```

2. **Raw** 버튼 클릭

3. 전체 선택 (Ctrl+A) → 복사 (Ctrl+C)

4. VSCode에서 **기존 App.tsx 파일 열기**:
   ```
   C:\Users\user\OneDrive\바탕 화면\투굿투고\myapp\App.tsx
   ```

5. 전체 선택 (Ctrl+A) → 붙여넣기 (Ctrl+V)

6. 저장 (Ctrl+S)

---

## **3단계: Metro 재시작**

CMD에서:
```bash
# Ctrl+C로 중지
npx expo start
```

---

## **4단계: 테스트**

### 4-1. 로그인 후 화면 확인

1. ✅ 로그인 → 자동으로 **업체 리스트** 화면이 나옴 (기존 HomeScreen 대신)
2. ✅ 상단: "🛒 투굿투고" 로고 + 🔍 검색 버튼
3. ✅ 카테고리 탭: 전체, 반찬, 제과, 식자재, 밀키트, 정육, 기타 (가로 스크롤)
4. ✅ 필터 버튼: "추천순 ▼" (연두색), "⭐ 전체" (흰색)

### 4-2. 카테고리 필터 테스트

1. "반찬" 탭 클릭
2. 카테고리가 '반찬'인 업체만 표시되는지 확인
3. "전체" 탭 클릭 → 모든 업체 표시

### 4-3. 별점 필터 테스트

1. "⭐ 전체" 버튼 클릭
2. 드롭다운 표시: 전체, ⭐ 4.5 이상, ⭐ 4.0 이상, ⭐ 3.5 이상, ⭐ 3.0 이상
3. "⭐ 4.0 이상" 선택
4. 평점 4.0 이상인 업체만 표시되는지 확인

### 4-4. 정렬 필터 테스트

1. "추천순 ▼" 버튼 클릭
2. 드롭다운 표시: 추천순, 거리순, 지도보기
3. "거리순" 선택 (일단 이름순으로 정렬됨)
4. "지도보기" 선택 → "추후 구현 예정" 알림

### 4-5. 업체 카드 확인

1. ✅ 큰 이미지 (200px 높이) 또는 플레이스홀더 (🏪)
2. ✅ 우측 상단: 하트 버튼 (🤍)
3. ✅ 우측 하단: 할인율 뱃지 (~50% 할인) - 초록색
4. ✅ 업체명, 평점, 리뷰수, 주소

### 4-6. 준비중 상태 테스트

**테스트용 업체를 준비중으로 만들기:**

Supabase SQL Editor에서 실행:
```sql
-- 테스트 업체의 캐시를 5,000원으로 설정 (준비중 조건 충족)
UPDATE stores
SET cash_balance = 5000
WHERE name = '테스트 베이커리';
```

앱에서 확인:
1. 업체 리스트 새로고침 (뒤로가기 → 다시 들어가기)
2. ✅ 해당 업체가 어둡게 표시
3. ✅ "준비중" 라벨 표시
4. ✅ 클릭해도 상세 페이지로 이동 안 됨

**다시 영업 중으로 변경:**
```sql
UPDATE stores
SET cash_balance = 100000
WHERE name = '테스트 베이커리';
```

### 4-7. 하단 네비게이션 테스트

1. ✅ 🏠 홈 클릭 → 업체 리스트 화면 (현재 화면)
2. ✅ 🎁 주문/예약 클릭 → MyReservations 화면으로 이동
3. ✅ 👤 내 정보 클릭 → MyPage 화면으로 이동
4. ✅ 각 화면에서 뒤로가기 → 업체 리스트로 복귀

### 4-8. 업체 클릭 테스트

1. 업체 카드 클릭
2. StoreDetail 화면으로 이동
3. 뒤로가기 버튼 클릭
4. 업체 리스트로 복귀

---

## **5단계: 업체 카테고리 설정 (선택사항)**

현재 업체들의 카테고리가 설정되지 않았다면:

```sql
-- 테스트 업체 카테고리 설정
UPDATE stores
SET category = '베이커리'
WHERE name LIKE '%베이커리%';

UPDATE stores
SET category = '반찬'
WHERE name LIKE '%반찬%';

UPDATE stores
SET category = '정육'
WHERE name LIKE '%정육%';

-- 카테고리가 없는 업체는 '기타'로
UPDATE stores
SET category = '기타'
WHERE category IS NULL OR category = '';
```

---

## 🎨 디자인 특징

### 색상
- **주요 색상**: #00D563 (초록색 - SaveIt 스타일)
- **배경**: #F5F5F5 (연한 회색)
- **카드**: #FFFFFF (흰색)
- **텍스트**: #333 (진한 회색), #666 (중간), #999 (연한)

### 크기
- **헤더**: 상단 50px + 로고
- **카테고리 탭**: 가로 스크롤
- **업체 이미지**: 전체 너비 × 200px
- **카드 모서리**: 16px 라운드
- **하단 네비게이션**: 고정 하단

### 레이아웃
- SaveIt 앱 스타일의 클린한 디자인
- 큰 이미지로 음식 사진 강조
- 할인율 뱃지로 할인 혜택 강조

---

## 📋 추가된 데이터베이스 컬럼

| 컬럼명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| is_open | BOOLEAN | 영업 중 여부 (업주가 ON/OFF) | true |

---

## 🔄 변경 사항 요약

### 제거된 것
- ❌ HomeScreen.tsx (더 이상 사용 안 함)
- ❌ 로그인 후 HomeScreen이 첫 화면

### 추가된 것
- ✅ StoreListHome.tsx (새로운 홈 화면)
- ✅ 카테고리 필터 (7개 탭)
- ✅ 별점 필터 (드롭다운)
- ✅ 정렬 필터 (드롭다운)
- ✅ 준비중 상태 표시
- ✅ 하단 네비게이션 (3개 탭)
- ✅ stores.is_open 컬럼

### 변경된 것
- ✅ App.tsx: 기본 화면을 'storelist'로 변경
- ✅ 네비게이션 구조: StoreListHome이 루트

---

## 🚀 향후 구현 예정

### Phase 2
- [ ] 거리순 정렬 (사용자 위치 기반)
- [ ] 지도보기 (네이버/카카오 지도 연동)
- [ ] 검색 기능 (🔍 버튼)
- [ ] 즐겨찾기 (하트 버튼)

### Phase 3
- [ ] 영업시간 기반 준비중 표시
- [ ] 실시간 필터 업데이트
- [ ] 무한 스크롤
- [ ] 업체 리스트 캐싱

---

## ❌ 오류 해결

### 오류 1: "Cannot find module 'StoreListHome'"
**원인**: 파일 경로 또는 파일명 오류
**해결**:
- 파일명 확인: `StoreListHome.tsx` (대소문자 정확히)
- 경로 확인: `src/screens/StoreListHome.tsx`
- App.tsx import 확인: `import StoreListHome from './src/screens/StoreListHome';`

### 오류 2: 카테고리 필터가 작동 안 함
**원인**: 업체의 category 컬럼이 비어있음
**해결**:
```sql
-- 모든 업체에 기본 카테고리 설정
UPDATE stores
SET category = '기타'
WHERE category IS NULL OR category = '';
```

### 오류 3: 준비중 상태가 표시 안 됨
**원인**: is_open 컬럼이 없거나 cash_balance가 높음
**해결**:
- 1단계 SQL 다시 실행
- cash_balance 확인:
```sql
SELECT name, cash_balance, is_open
FROM stores;
```

### 오류 4: 하단 네비게이션이 안 보임
**원인**: StoreListHome.tsx 파일이 제대로 로드 안 됨
**해결**:
- Metro 재시작 (Ctrl+C → npx expo start)
- 캐시 삭제: `npx expo start -c`

---

## 📝 파일 구조

```
myapp/
├── App.tsx                          ← 교체됨 (StoreListHome이 기본 화면)
├── src/
│   └── screens/
│       ├── StoreListHome.tsx       ← 새로 생성 (홈 화면)
│       ├── StoreDetail.tsx         (기존)
│       ├── MyReservations.tsx      (기존)
│       ├── MyPageScreen.tsx        (기존)
│       └── ... (기타 화면들)
└── docs/
    └── sql/
        └── 09-add-store-status.sql ← 새로 생성
```

---

## ✅ 체크리스트

설치 완료 후 확인:

- [ ] 1단계: Supabase SQL 실행 완료
- [ ] 2단계: StoreListHome.tsx 파일 생성 완료
- [ ] 3단계: App.tsx 파일 교체 완료
- [ ] 4단계: Metro 재시작 완료
- [ ] 5단계: 로그인 후 업체 리스트가 첫 화면으로 나옴
- [ ] 카테고리 필터 작동 확인
- [ ] 별점 필터 작동 확인
- [ ] 정렬 필터 작동 확인
- [ ] 준비중 상태 표시 확인
- [ ] 하단 네비게이션 작동 확인
- [ ] 업체 클릭 → StoreDetail 이동 확인

---

**작성일**: 2026-01-11
**작성자**: Claude Code
**버전**: 1.0

> 이 가이드를 따라하면 로그인 후 SaveIt 스타일의 업체 리스트가 홈 화면으로 나옵니다! 🎉
