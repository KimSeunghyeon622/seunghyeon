# Supabase SQL 패턴 및 진단

## 1. 테이블 생성 패턴

### 기본 테이블
```sql
CREATE TABLE public.테이블명 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.테이블명 ENABLE ROW LEVEL SECURITY;
```

### 외래 키 포함
```sql
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  -- ...
);
```

### updated_at 자동 갱신 트리거
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.테이블명
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

## 2. RLS 정책 패턴

### 본인 데이터만 접근
```sql
-- 본인만 읽기
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 본인만 수정
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

### 공개 읽기 + 본인 수정
```sql
-- 모두 읽기
CREATE POLICY "stores_select_all" ON public.stores
  FOR SELECT USING (true);

-- 업주만 수정
CREATE POLICY "stores_update_owner" ON public.stores
  FOR UPDATE USING (auth.uid() = owner_id);
```

### 조건부 삽입
```sql
-- 예약 완료자만 리뷰 작성
CREATE POLICY "reviews_insert_completed" ON public.reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE user_id = auth.uid()
        AND store_id = NEW.store_id
        AND status = 'completed'
    )
  );
```

### 민감 컬럼 숨기기 (공개 뷰)
```sql
-- 민감 정보 제외한 공개 뷰
CREATE VIEW public.public_stores AS
SELECT id, name, description, address, category, status
FROM public.stores
WHERE status = 'approved';

-- 뷰에 RLS 적용 안 됨, 직접 테이블 접근 차단
REVOKE SELECT ON public.stores FROM anon;
GRANT SELECT ON public.public_stores TO anon;
```

---

## 3. 함수 패턴

### 예약 생성 (트랜잭션 + 행 잠금)
```sql
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_product_id UUID,
  p_quantity INT,
  p_pickup_time TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_reservation_id UUID;
  v_product RECORD;
  v_total_price DECIMAL;
BEGIN
  -- 1. 상품 조회 + 행 잠금
  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  -- 2. 금액 계산 (DB에서 수행!)
  v_total_price := v_product.discount_price * p_quantity;

  -- 3. 재고 차감
  UPDATE public.products
  SET quantity = quantity - p_quantity
  WHERE id = p_product_id;

  -- 4. 예약 생성
  INSERT INTO public.reservations (
    user_id, store_id, product_id, quantity, total_price, pickup_time
  ) VALUES (
    auth.uid(), v_product.store_id, p_product_id, p_quantity, v_total_price, p_pickup_time
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;
```

### 예약 취소 (환불 처리)
```sql
CREATE OR REPLACE FUNCTION public.cancel_reservation(
  p_reservation_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  -- 1. 예약 조회 + 잠금
  SELECT * INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id AND user_id = auth.uid()
  FOR UPDATE;

  IF v_reservation IS NULL THEN
    RAISE EXCEPTION 'Reservation not found or not yours';
  END IF;

  IF v_reservation.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Cannot cancel this reservation';
  END IF;

  -- 2. 재고 복구
  UPDATE public.products
  SET quantity = quantity + v_reservation.quantity
  WHERE id = v_reservation.product_id;

  -- 3. 예약 취소
  UPDATE public.reservations
  SET status = 'cancelled', cancel_reason = p_reason, updated_at = NOW()
  WHERE id = p_reservation_id;

  RETURN TRUE;
END;
$$;
```

---

## 4. 진단 SQL

### 테이블 목록
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

### RLS 정책 목록
```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### RLS 미적용 테이블
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
  );
```

### 함수 목록
```sql
SELECT routine_name, data_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

### 인덱스 확인
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';
```

---

## 5. 스토리지 설정

### 버킷 생성
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true);
```

### 스토리지 RLS
```sql
-- 업로드: 인증된 사용자
CREATE POLICY "products_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

-- 읽기: 모두
CREATE POLICY "products_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');
```

---

## 6. 보안 체크리스트

### 필수 확인 사항
- [ ] 모든 테이블에 RLS 활성화
- [ ] 민감 컬럼 접근 제한 (cash_balance, business_number 등)
- [ ] 함수에 `SET search_path = ''` 설정
- [ ] SECURITY INVOKER 사용 (DEFINER 지양)
- [ ] 가격/금액 계산은 DB 함수에서만
- [ ] FOR UPDATE 사용하여 동시성 문제 방지
- [ ] 공개 뷰로 민감 정보 제외
