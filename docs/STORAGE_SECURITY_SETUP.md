# Storage 버킷 보안 설정 가이드

## 개요
리뷰 이미지 버킷(`review-images`)을 private으로 설정하여 보안을 강화합니다.

## 설정 방법

### 1. Supabase Dashboard 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `KimSeunghyeon622's Project`
3. 좌측 메뉴에서 **Storage** 클릭

### 2. 버킷 설정 변경

#### review-images 버킷
1. `review-images` 버킷 클릭
2. 우측 상단 **Settings** (톱니바퀴 아이콘) 클릭
3. **Public bucket** 토글을 **OFF**로 변경
4. **Save** 클릭

### 3. Storage Policy 설정

버킷을 private으로 변경한 후, 다음 정책을 설정합니다:

```sql
-- 1. 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. 본인이 업로드한 이미지만 삭제 가능
CREATE POLICY "Users can delete own review images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. 인증된 사용자는 모든 리뷰 이미지 조회 가능 (signed URL 필요)
CREATE POLICY "Authenticated users can view review images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'review-images');
```

### 4. Dashboard에서 Policy 설정

1. Storage > Policies 탭 클릭
2. `review-images` 버킷 선택
3. **New Policy** 클릭
4. 위 SQL 정책들을 하나씩 추가

## 추가 설정: EXPO_ACCESS_TOKEN (선택)

푸시 알림 발송량이 많을 경우 Expo Access Token을 설정하면 Rate Limit이 완화됩니다.

### 설정 방법
1. [Expo Dashboard](https://expo.dev) 접속
2. Account Settings > Access Tokens
3. **Create Token** 클릭
4. Token 복사

### Supabase에 설정
1. Supabase Dashboard > Edge Functions
2. `send-push-notification` 함수 선택
3. **Secrets** 탭 클릭
4. **New Secret** 클릭
5. Name: `EXPO_ACCESS_TOKEN`
6. Value: [복사한 토큰]
7. **Save** 클릭

## 확인 사항

- [ ] `review-images` 버킷이 private으로 설정됨
- [ ] Storage Policy가 적용됨
- [ ] 기존 이미지가 signed URL로 정상 조회됨
- [ ] (선택) EXPO_ACCESS_TOKEN이 설정됨
