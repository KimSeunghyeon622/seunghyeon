# 리뷰 목록 UI 설계 (StoreDetail 페이지)

## 디자인 컨셉

### 톤
- **친근함 + 신뢰감**: 사용자가 다른 고객의 경험을 신뢰할 수 있도록
- **읽기 쉬운 레이아웃**: 리뷰 내용을 빠르게 스캔할 수 있도록

### 색상 팔레트
```javascript
const colors = {
  primary: '#00D563',      // 브랜드 그린 (신뢰감)
  background: '#F5F5F5',   // 배경
  surface: '#FFFFFF',      // 카드 배경
  textPrimary: '#333333',  // 주요 텍스트
  textSecondary: '#666666', // 보조 텍스트
  textTertiary: '#999999', // 3차 텍스트
  star: '#FFD700',         // 별점 색상
  border: '#E0E0E0',       // 구분선
  accent: '#FF6B6B',       // 포인트 (업주 답글)
};
```

### 폰트
- 제목/별점: 시스템 기본 (bold)
- 본문: 시스템 기본 (regular)
- 날짜: 시스템 기본 (light)

---

## UI 구조

### 1. 리뷰 섹션 헤더

**위치**: 업체 정보 섹션과 상품 리스트 사이

**구성 요소**:
- 섹션 제목: "리뷰 (29개)"
- 평균 별점 표시 (이미 있음)
- "리뷰 전체보기" 버튼 (선택사항 - 나중에 확장 가능)

**레이아웃**:
```
┌─────────────────────────────────────┐
│  리뷰 (29개)              ⭐ 4.3   │
│  ────────────────────────────────  │
└─────────────────────────────────────┘
```

### 2. 리뷰 카드 디자인

**각 리뷰 카드 구성**:

```
┌─────────────────────────────────────┐
│  👤 닉네임              ⭐⭐⭐⭐⭐  │
│  📅 2024.01.15                      │
│  ────────────────────────────────  │
│  리뷰 내용이 여기에 표시됩니다...   │
│  긴 리뷰의 경우 3줄까지만 표시하고  │
│  "더보기" 버튼으로 전체 내용 확인   │
│  ────────────────────────────────  │
│  💚 업주 답글 (있는 경우만 표시)    │
│  "감사합니다! 다음에도..."          │
└─────────────────────────────────────┘
```

**상세 스펙**:

1. **리뷰 헤더**
   - 왼쪽: 프로필 이미지 (원형, 40x40) 또는 기본 아바타
   - 중앙: 닉네임 (bold, 15px)
   - 오른쪽: 별점 (5개 별, 16px)
   - 하단: 작성일 (light, 13px, 회색)

2. **리뷰 내용**
   - 최대 3줄 표시
   - 3줄 초과 시 "더보기" 버튼 표시
   - 클릭 시 전체 내용 표시

3. **업주 답글** (있는 경우만)
   - 초록색 배경 박스
   - "💚 업주 답글" 라벨
   - 답글 내용

### 3. 빈 상태 처리

리뷰가 없을 때:
```
┌─────────────────────────────────────┐
│                                     │
│            💬                        │
│                                     │
│      아직 리뷰가 없습니다           │
│   첫 번째 리뷰를 작성해주세요!      │
│                                     │
└─────────────────────────────────────┘
```

---

## 컴포넌트 구조

### ReviewCard 컴포넌트

```typescript
interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    content: string;
    created_at: string;
    reply?: string;
    reply_at?: string;
    consumers: {
      nickname: string;
      profile_image_url?: string;
    };
  };
}
```

### ReviewSection 컴포넌트

```typescript
interface ReviewSectionProps {
  storeId: string;
  reviewCount: number;
  averageRating: number;
}
```

---

## 스타일 가이드

### 리뷰 섹션 헤더
```javascript
reviewSectionHeader: {
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
},
reviewSectionTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333333',
  marginBottom: 8,
},
```

### 리뷰 카드
```javascript
reviewCard: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 20,
  marginBottom: 12,
  padding: 16,
  borderRadius: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
},
reviewHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},
profileImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 12,
  backgroundColor: '#F0F0F0',
},
reviewerName: {
  flex: 1,
  fontSize: 15,
  fontWeight: '600',
  color: '#333333',
},
reviewDate: {
  fontSize: 13,
  color: '#999999',
  marginTop: 4,
},
starContainer: {
  flexDirection: 'row',
  gap: 2,
},
reviewContent: {
  fontSize: 14,
  color: '#666666',
  lineHeight: 20,
  marginBottom: 12,
},
replyContainer: {
  backgroundColor: '#F0F9F4',
  padding: 12,
  borderRadius: 8,
  marginTop: 8,
  borderLeftWidth: 3,
  borderLeftColor: '#00D563',
},
replyLabel: {
  fontSize: 12,
  fontWeight: '600',
  color: '#00D563',
  marginBottom: 4,
},
replyText: {
  fontSize: 14,
  color: '#333333',
  lineHeight: 20,
},
```

---

## 인터랙션

1. **리뷰 더보기**
   - 3줄 초과 시 "더보기" 버튼 표시
   - 클릭 시 전체 내용 표시, 버튼은 "접기"로 변경

2. **스크롤**
   - 리뷰가 많을 경우 스크롤 가능
   - 최대 5개만 표시하고 "리뷰 전체보기" 버튼으로 확장 가능 (선택사항)

3. **로딩 상태**
   - 리뷰 로딩 중 스켈레톤 UI 또는 로딩 인디케이터

---

## 반응형 고려사항

- 모바일 화면에 최적화
- 텍스트 크기: 최소 14px
- 터치 영역: 최소 44x44px
- 카드 간격: 12px

---

## 접근성

- 별점은 텍스트로도 표시 (예: "5점 만점에 4점")
- 색상 대비 비율 준수 (WCAG AA)
- 터치 영역 충분한 크기

---

## 구현 우선순위

1. **Phase 1-1**: 기본 리뷰 카드 표시
2. **Phase 1-2**: 업주 답글 표시
3. **Phase 1-3**: 더보기 기능
4. **Phase 1-4**: 빈 상태 처리
5. **Phase 1-5**: 로딩 상태 처리

---

## 참고 디자인

- 배달의민족 리뷰 섹션
- 쿠팡 상품 리뷰
- 네이버 플레이스 리뷰

**차별점**: 
- 더 친근하고 읽기 쉬운 레이아웃
- 업주 답글이 눈에 띄게 표시
- 음식 관련 앱에 맞는 따뜻한 톤
