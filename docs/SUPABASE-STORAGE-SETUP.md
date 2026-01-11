# Supabase Storage 설정 가이드

## 사업자등록증 업로드를 위한 스토리지 설정

사업자 회원가입 시 사업자등록증 이미지를 업로드하려면 Supabase Storage 버킷을 생성해야 합니다.

---

## 1단계: Supabase 대시보드 접속

1. https://supabase.com 접속
2. 로그인
3. 프로젝트 선택 (`qycwdncplofgzdrjtklb`)

---

## 2단계: Storage 버킷 생성

1. 왼쪽 메뉴에서 **Storage** 클릭
2. 우측 상단의 **New bucket** 버튼 클릭
3. 다음 정보 입력:
   - **Name**: `store-documents`
   - **Public bucket**: **체크 ✓** (체크하세요!)
   - **Allowed MIME types**: 비워두기 (모든 타입 허용)
   - **File size limit**: `5 MB`
4. **Create bucket** 클릭

---

## 3단계: 버킷 정책 설정 (RLS)

버킷 생성 후, 정책을 설정해야 합니다.

### 방법 1: UI에서 설정

1. `store-documents` 버킷 클릭
2. **Policies** 탭 클릭
3. **New policy** 클릭

#### 정책 1: 업로드 허용 (INSERT)
- **Policy name**: `Allow authenticated users to upload`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  true
  ```

#### 정책 2: 읽기 허용 (SELECT)
- **Policy name**: `Allow public read access`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
  ```sql
  true
  ```

### 방법 2: SQL Editor에서 설정

왼쪽 메뉴 **SQL Editor** → **New query**에서 다음 SQL 실행:

```sql
-- 1. 인증된 사용자 업로드 허용
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-documents');

-- 2. 모든 사용자 읽기 허용 (Public)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-documents');

-- 3. 본인이 업로드한 파일 삭제 허용
CREATE POLICY "Allow users to delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'store-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 4단계: 확인

1. Storage → `store-documents` 버킷 확인
2. **Policies** 탭에서 3개의 정책이 있는지 확인:
   - ✅ Allow authenticated users to upload
   - ✅ Allow public read access
   - ✅ Allow users to delete own files

---

## 완료!

이제 사업자 회원가입 시 사업자등록증 이미지가 정상적으로 업로드됩니다.

### 업로드된 파일 확인 방법

1. Supabase Dashboard → Storage
2. `store-documents` 버킷 클릭
3. `business-registrations/` 폴더에 파일이 저장됩니다

### 파일 구조 예시
```
store-documents/
  └── business-registrations/
      ├── abc123_1234567890.jpg
      ├── def456_1234567891.jpg
      └── ...
```

---

## 문제 해결

### 업로드 실패 시
- Storage 버킷이 `store-documents` 이름으로 생성되었는지 확인
- Public bucket으로 설정했는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 이미지가 보이지 않을 때
- Public bucket인지 확인
- "Allow public read access" 정책이 있는지 확인
