# 배너 관리 가이드

## 개요
홈 화면 상단에 표시되는 배너를 관리하는 방법입니다.

---

## 배너 관리 (Supabase Dashboard)

### 1. Supabase Dashboard 접속
- URL: https://supabase.com/dashboard/project/qycwdncplofgzdrjtklb
- 좌측 메뉴에서 **Table Editor** > **banners** 선택

### 2. 배너 추가
**Table Editor**에서 **Insert row** 버튼 클릭 후 아래 필드 입력:

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `title` | 배너 제목 (필수) | "오픈 기념 이벤트" |
| `subtitle` | 부제목 | "최대 50% 할인!" |
| `description` | 상세 설명 | "자세한 내용..." |
| `image_url` | 배너 이미지 URL (필수) | "https://example.com/banner.jpg" |
| `link_type` | 클릭 시 동작 (필수) | detail / external / store |
| `external_url` | 외부 링크 (link_type이 external일 때) | "https://naver.com" |
| `store_id` | 업체 ID (link_type이 store일 때) | "uuid..." |
| `display_order` | 표시 순서 (숫자 작을수록 앞) | 1 |
| `is_active` | 활성화 여부 | true / false |
| `start_date` | 시작일 (선택) | "2026-02-01 00:00:00" |
| `end_date` | 종료일 (선택) | "2026-02-28 23:59:59" |

### 3. link_type 설명
- **detail**: 배너 클릭 시 배너 상세 페이지로 이동
- **external**: 외부 웹사이트로 이동 (external_url 필수)
- **store**: 특정 업체 상세 페이지로 이동 (store_id 필수)

### 4. 배너 수정
1. **banners** 테이블에서 수정할 행 클릭
2. 필드 값 변경
3. **Save** 클릭

### 5. 배너 삭제
- **방법 1 (비활성화)**: `is_active`를 `false`로 변경 (권장)
- **방법 2 (완전 삭제)**: 행 선택 후 **Delete** 클릭

### 6. 배너 순서 변경
- `display_order` 값을 변경 (숫자 작을수록 먼저 표시)

---

## SQL로 직접 관리하기

### 배너 추가
```sql
INSERT INTO banners (title, subtitle, image_url, link_type, display_order, is_active)
VALUES ('제목', '부제목', 'https://이미지URL', 'detail', 1, true);
```

### 배너 비활성화
```sql
UPDATE banners SET is_active = false WHERE id = '배너ID';
```

### 배너 순서 변경
```sql
UPDATE banners SET display_order = 2 WHERE id = '배너ID';
```

### 활성 배너 목록 조회
```sql
SELECT id, title, display_order, is_active
FROM banners
WHERE is_active = true
ORDER BY display_order;
```

### 배너 삭제
```sql
DELETE FROM banners WHERE id = '배너ID';
```

---

## 주의사항
- `image_url`은 반드시 공개적으로 접근 가능한 URL이어야 함
- 이미지 권장 크기: **800 x 400px** (가로:세로 = 2:1)
- `start_date`와 `end_date`를 설정하면 해당 기간에만 배너가 표시됨
- 배너가 없거나 모든 배너가 비활성화되면 홈 화면에 배너 영역이 표시되지 않음
