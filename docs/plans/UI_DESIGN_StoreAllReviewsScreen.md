# UI 디자인: StoreAllReviewsScreen (업체 전체 리뷰 화면)

> **작성일**: 2026-02-02
> **목적**: 업체 상세페이지에서 '리뷰 더 보기' 클릭 시 해당 업체의 모든 리뷰를 확인하는 화면
> **톤**: 친근함 + 신뢰감
> **프레임워크**: React Native / Expo

---

## 1. 화면 목적 및 사용자 시나리오

### 사용자 시나리오
1. 소비자가 업체 상세페이지에서 리뷰 섹션 하단의 **"리뷰 더 보기"** 버튼 클릭
2. 해당 업체의 모든 리뷰를 최신순으로 확인
3. 정렬 옵션으로 별점순/최신순 변경 가능
4. 각 리뷰의 상세 내용, 이미지, 업주 답글 확인
5. 뒤로가기로 업체 상세페이지 복귀

### 핵심 기능
- 전체 리뷰 목록 (무한 스크롤 또는 전체 로드)
- 평균 평점 및 리뷰 통계 요약
- 별점 분포 시각화
- 정렬 옵션 (최신순 / 별점 높은순 / 별점 낮은순)
- 리뷰 이미지 표시 및 확대 보기

---

## 2. 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  ← 뒤로가기    [업체명] 리뷰             │  ← 헤더
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⭐ 4.2  |  리뷰 47개            │   │  ← 평점 요약
│  │                                  │   │
│  │  ★★★★★ ████████████  32   │   │  ← 별점 분포
│  │  ★★★★☆ ████████      10   │   │
│  │  ★★★☆☆ ███            3   │   │
│  │  ★★☆☆☆ █              1   │   │
│  │  ★☆☆☆☆ █              1   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [최신순 ▼]  정렬                        │  ← 정렬 버튼
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 닉네임         ⭐⭐⭐⭐⭐    │   │  ← 리뷰 카드
│  │    2026.01.25                   │   │
│  │                                  │   │
│  │ 리뷰 내용 텍스트...              │   │
│  │                                  │   │
│  │ [📷][📷]                        │   │  ← 리뷰 이미지
│  │                                  │   │
│  │ ┌────────────────────────────┐ │   │
│  │ │ 💚 업주 답글               │ │   │  ← 업주 답글
│  │ │ 감사합니다~                │ │   │
│  │ └────────────────────────────┘ │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 닉네임2        ⭐⭐⭐⭐☆    │   │  ← 다음 리뷰
│  │    ...                          │   │
│  └─────────────────────────────────┘   │
│                                         │
│           [ 하단 여백 ]                 │
└─────────────────────────────────────────┘
```

---

## 3. 컴포넌트 명세

### 3.1 헤더 (Header)
```typescript
interface HeaderProps {
  storeName: string;
  onBack: () => void;
}
```

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `height: 56px`, `backgroundColor: #FFFFFF`, `borderBottom: 1px #E0E0E0` |
| 뒤로가기 버튼 | `fontSize: 24px`, `padding: 12px`, 터치 영역 44x44 |
| 제목 | `fontSize: 18px`, `fontWeight: 600`, `color: #333333` |

### 3.2 평점 요약 섹션 (RatingSummary)
```typescript
interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
```

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `backgroundColor: #FFFFFF`, `padding: 20px`, `borderRadius: 16px`, `margin: 16px`, 그림자 |
| 평균 평점 | `fontSize: 36px`, `fontWeight: bold`, `color: #333333` |
| 총 리뷰 수 | `fontSize: 14px`, `color: #666666` |
| 분포 바 | `height: 8px`, `backgroundColor: #00D563`, `borderRadius: 4px` |
| 분포 숫자 | `fontSize: 13px`, `color: #999999` |

### 3.3 정렬 버튼 (SortButton)
```typescript
type SortType = 'latest' | 'rating_high' | 'rating_low';

interface SortButtonProps {
  currentSort: SortType;
  onSortChange: (sort: SortType) => void;
}
```

| 요소 | 스타일 |
|------|--------|
| 버튼 | `backgroundColor: #F5F5F5`, `paddingHorizontal: 16px`, `paddingVertical: 10px`, `borderRadius: 20px` |
| 텍스트 | `fontSize: 14px`, `color: #333333`, `fontWeight: 500` |
| 드롭다운 | `backgroundColor: #FFFFFF`, `borderRadius: 12px`, 그림자, `zIndex: 100` |

### 3.4 리뷰 카드 (ReviewCard)
```typescript
interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    content: string;
    imageUrls?: string[];
    createdAt: string;
    consumer: {
      nickname: string;
      avatarUrl?: string;
    };
    reply?: string;
  };
}
```

| 요소 | 스타일 |
|------|--------|
| 카드 컨테이너 | `backgroundColor: #FFFFFF`, `borderRadius: 12px`, `padding: 16px`, `marginHorizontal: 16px`, `marginBottom: 12px`, 그림자 |
| 프로필 이미지 | `width: 40px`, `height: 40px`, `borderRadius: 20px` |
| 닉네임 | `fontSize: 15px`, `fontWeight: 600`, `color: #333333` |
| 날짜 | `fontSize: 13px`, `color: #999999` |
| 별점 | `fontSize: 16px` (⭐/☆) |
| 리뷰 내용 | `fontSize: 14px`, `color: #666666`, `lineHeight: 20px` |
| 이미지 썸네일 | `width: 80px`, `height: 80px`, `borderRadius: 8px`, `marginRight: 8px` |
| 업주 답글 컨테이너 | `backgroundColor: #F0F9F4`, `padding: 12px`, `borderRadius: 8px`, `borderLeftWidth: 3px`, `borderLeftColor: #00D563` |
| 답글 라벨 | `fontSize: 12px`, `fontWeight: 600`, `color: #00D563` |
| 답글 내용 | `fontSize: 14px`, `color: #333333` |

---

## 4. 색상 팔레트

```javascript
const colors = {
  // 기본 색상 (기존 프로젝트와 동일)
  primary: '#00D563',      // 메인 그린
  primaryLight: '#E8F5E9', // 연한 그린 배경
  primaryDark: '#00A84D',  // 진한 그린

  accent: '#FF6B6B',       // 포인트 레드

  // 텍스트
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',

  // 배경
  background: '#F5F5F5',
  surface: '#FFFFFF',

  // 구분선
  border: '#E0E0E0',
  divider: '#F0F0F0',

  // 별점
  starFilled: '#FFD700',
  starEmpty: '#E0E0E0',
};
```

---

## 5. 타이포그래피

```javascript
const typography = {
  // 제목
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },

  // 큰 숫자 (평균 평점)
  largeNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
  },

  // 본문
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },

  // 작은 텍스트
  caption: {
    fontSize: 13,
    color: '#999999',
  },

  // 강조
  emphasis: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
};
```

---

## 6. 상태별 UI

### 6.1 로딩 상태
```
┌─────────────────────────────────────────┐
│  ← 뒤로가기    [업체명] 리뷰             │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│           [ActivityIndicator]           │
│              로딩 중...                  │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```
- `ActivityIndicator` 색상: `#00D563`
- 로딩 텍스트: `fontSize: 14px`, `color: #999999`

### 6.2 빈 상태 (리뷰 없음)
```
┌─────────────────────────────────────────┐
│  ← 뒤로가기    [업체명] 리뷰             │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                 💬                       │
│                                         │
│         아직 리뷰가 없습니다              │
│      첫 번째 리뷰를 작성해주세요!         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```
- 이모지: `fontSize: 48px`
- 메인 텍스트: `fontSize: 16px`, `fontWeight: 600`, `color: #666666`
- 서브 텍스트: `fontSize: 14px`, `color: #999999`

### 6.3 에러 상태
```
┌─────────────────────────────────────────┐
│  ← 뒤로가기    [업체명] 리뷰             │
├─────────────────────────────────────────┤
│                                         │
│                 ⚠️                       │
│                                         │
│      리뷰를 불러오는데 실패했습니다       │
│                                         │
│           [ 다시 시도 ]                  │
│                                         │
└─────────────────────────────────────────┘
```
- 다시 시도 버튼: `backgroundColor: #00D563`, `color: #FFFFFF`, `borderRadius: 8px`

---

## 7. 인터랙션 정의

### 7.1 터치 피드백
- 리뷰 카드: 터치 시 `opacity: 0.7` (0.1s)
- 정렬 버튼: 터치 시 `backgroundColor` 약간 어둡게
- 뒤로가기 버튼: 터치 시 `opacity: 0.6`

### 7.2 정렬 드롭다운
```
1. 정렬 버튼 터치
2. 드롭다운 메뉴 표시 (fade in 0.2s)
3. 옵션 선택
4. 드롭다운 닫힘 (fade out 0.15s)
5. 리뷰 목록 재정렬
```

### 7.3 이미지 확대 보기
```
1. 리뷰 이미지 썸네일 터치
2. 전체 화면 이미지 모달 표시
3. 좌우 스와이프로 다른 이미지 보기
4. 배경 터치 또는 닫기 버튼으로 닫기
```

---

## 8. Props 인터페이스

```typescript
interface StoreAllReviewsScreenProps {
  storeId: string;
  storeName: string;
  onBack: () => void;
}
```

---

## 9. 구현 체크리스트

- [ ] 헤더 컴포넌트 (뒤로가기, 제목)
- [ ] 평점 요약 섹션 (평균, 분포 바)
- [ ] 정렬 버튼 및 드롭다운
- [ ] 리뷰 카드 컴포넌트
- [ ] 리뷰 이미지 표시 (ReviewImages 컴포넌트 재사용)
- [ ] 업주 답글 표시
- [ ] 로딩 상태 UI
- [ ] 빈 상태 UI
- [ ] 에러 상태 UI
- [ ] 무한 스크롤 또는 전체 로드

---

## 10. 기존 컴포넌트 재사용

| 컴포넌트 | 경로 | 용도 |
|---------|------|------|
| `ReviewImages` | `src/components/ReviewImages.tsx` | 리뷰 이미지 표시 |
| `fetchStoreReviews` | `src/api/reviewApi.ts` | 리뷰 데이터 조회 |

---

## 11. 스타일 예시 코드

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },

  // 평점 요약
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666666',
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  distributionStars: {
    width: 70,
    fontSize: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: '#00D563',
    borderRadius: 4,
  },
  distributionCount: {
    width: 30,
    fontSize: 13,
    color: '#999999',
    textAlign: 'right',
  },

  // 정렬 버튼
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },

  // 리뷰 카드
  reviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerInfo: {
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  reviewDate: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  reviewStars: {
    fontSize: 16,
  },
  reviewContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },

  // 업주 답글
  replyContainer: {
    backgroundColor: '#F0F9F4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
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

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
  },
});
```

---

**작성 완료**: 이 문서를 기반으로 `StoreAllReviewsScreen.tsx` 화면을 구현합니다.
