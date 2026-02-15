# 메인 홈 화면 배너 시스템 UI 설계

## 디자인 컨셉

### 톤
- **직관적이고 친근함**: 사용자가 자연스럽게 배너를 인지하고 클릭하도록 유도
- **신뢰감**: 공지사항/이벤트를 명확하게 전달
- **기존 앱과 일관성**: Save It 앱의 그린 톤앤매너 유지

### 색상 팔레트
```javascript
const colors = {
  // 브랜드
  primary: '#00D563',      // 메인 그린
  primaryLight: '#E8F8F0', // 라이트 그린 배경

  // 배너 전용
  bannerOverlay: 'rgba(0, 0, 0, 0.3)',  // 텍스트 가독성용 오버레이
  indicatorActive: '#FFFFFF',            // 활성 인디케이터
  indicatorInactive: 'rgba(255, 255, 255, 0.5)', // 비활성 인디케이터

  // 중립
  textPrimary: '#333333',
  textSecondary: '#666666',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  border: '#E0E0E0',

  // 포인트
  accent: '#FF6B6B',
};
```

---

## UI 구조

### 1. 메인 홈 화면 배너 영역

**위치**: 헤더 바로 아래, 카테고리/필터 위

**변경 전 (현재)**:
```
┌─────────────────────────────────────┐
│  [헤더: 로고 + 장바구니]              │
│  ────────────────────────────────  │
│  [카테고리 탭]                        │
│  [필터 버튼]                          │
│  ────────────────────────────────  │
│  [업체 리스트]                        │
└─────────────────────────────────────┘
```

**변경 후**:
```
┌─────────────────────────────────────┐
│  [헤더: 로고 + 장바구니]              │
│  ────────────────────────────────  │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │     [배너 이미지/내용]        │   │
│  │                             │   │
│  │     ● ○ ○ ○ (인디케이터)     │   │
│  └─────────────────────────────┘   │
│  ────────────────────────────────  │
│  [카테고리 탭]                        │
│  [필터 버튼]                          │
│  ────────────────────────────────  │
│  [업체 리스트]                        │
└─────────────────────────────────────┘
```

**배너 컨테이너 상세**:
```
┌─────────────────────────────────────────────┐
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  ┌─────────────────────────────────┐  │ │
│  │  │                                 │  │ │
│  │  │     [배너 이미지]                │  │ │
│  │  │                                 │  │ │
│  │  │  ┌─────────────────────────┐    │  │ │
│  │  │  │ [텍스트 오버레이]        │    │  │ │
│  │  │  │ 제목: 신년 할인 이벤트   │    │  │ │
│  │  │  │ 부제: 최대 50% 할인!     │    │  │ │
│  │  │  └─────────────────────────┘    │  │ │
│  │  └─────────────────────────────────┘  │ │
│  │                                        │ │
│  │           ● ○ ○ ○                      │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. 배너 슬라이드 스펙

| 항목 | 값 | 비고 |
|------|-----|------|
| 컨테이너 높이 | 160px | 적당한 크기 (너무 크지 않게) |
| 좌우 마진 | 0px | 전체 너비 사용 |
| 상하 마진 | 12px | 헤더/필터와 간격 |
| 모서리 반경 | 0px | 전체 너비 이미지 |
| 자동 슬라이드 | 4초 | 사용자 스와이프 시 일시 정지 |
| 인디케이터 위치 | 하단 중앙, 배너 내부 | 배너 바닥에서 12px 위 |

### 3. 배너 상세 페이지 (BannerDetail)

**접근 경로**: 배너 클릭 시 이동

```
┌─────────────────────────────────────┐
│  [<]  배너 상세              [X]    │
│  ────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │     [배너 전체 이미지]        │   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [제목]                             │
│  신년 할인 이벤트                    │
│                                     │
│  [기간]                             │
│  2025.01.01 ~ 2025.01.31           │
│                                     │
│  [내용]                             │
│  Save It에서 준비한 신년 맞이       │
│  특별 할인 이벤트!                   │
│  참여 업체에서 최대 50% 할인을       │
│  받아보세요.                        │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  [관련 업체 보러가기] (선택적)       │
│                                     │
└─────────────────────────────────────┘
```

**상세 스펙**:

| 요소 | 스타일 | 비고 |
|------|--------|------|
| 헤더 | 뒤로가기 + 제목 + 닫기 버튼 | 기존 앱 스타일 유지 |
| 이미지 | 전체 너비, 높이 200px | 비율 유지 |
| 제목 | 20px, bold, #333 | 패딩 20px |
| 기간 | 14px, #666 | 캘린더 아이콘 포함 가능 |
| 내용 | 16px, #333 | 줄간격 1.6 |

### 4. 관리자용 배너 관리 화면

**접근 경로**: 관리자 대시보드 > 배너 관리

#### 4-1. 배너 목록 화면 (BannerManagement)

```
┌─────────────────────────────────────┐
│  [<]  배너 관리              [+ 추가] │
│  ────────────────────────────────  │
│                                     │
│  [활성] [예정] [종료] [전체]          │
│  ────────────────────────────────  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [1] [썸네일]  신년 할인 이벤트  │  │
│  │              2025.01.01~01.31  │  │
│  │              [활성] [편집][삭제]│  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [2] [썸네일]  설 연휴 안내      │  │
│  │              2025.01.25~02.05  │  │
│  │              [예정] [편집][삭제]│  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [3] [썸네일]  크리스마스 이벤트 │  │
│  │              2024.12.15~12.25  │  │
│  │              [종료] [편집][삭제]│  │
│  └──────────────────────────────┘  │
│                                     │
│  [순서 변경 모드]                    │
│                                     │
└─────────────────────────────────────┘
```

**목록 아이템 스펙**:

| 요소 | 스펙 | 비고 |
|------|------|------|
| 순서 번호 | 원형, 24px, 그린 배경 | 드래그 핸들 겸용 |
| 썸네일 | 60x40px, radius 4px | 이미지 프리뷰 |
| 제목 | 16px, bold, 1줄 | 길면 말줄임 |
| 기간 | 13px, #666 | - |
| 상태 배지 | 활성(그린), 예정(노랑), 종료(회색) | - |
| 액션 버튼 | 편집, 삭제 | 삭제 시 확인 다이얼로그 |

#### 4-2. 배너 등록/수정 화면 (BannerForm)

```
┌─────────────────────────────────────┐
│  [<]  배너 등록              [저장]  │
│  ────────────────────────────────  │
│                                     │
│  [배너 이미지 *]                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │     [+] 이미지 업로드         │   │
│  │     (권장: 750x300px)        │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [제목 *]                           │
│  ┌─────────────────────────────┐   │
│  │ 신년 할인 이벤트               │   │
│  └─────────────────────────────┘   │
│                                     │
│  [부제목]                           │
│  ┌─────────────────────────────┐   │
│  │ 최대 50% 할인!                │   │
│  └─────────────────────────────┘   │
│                                     │
│  [상세 내용]                        │
│  ┌─────────────────────────────┐   │
│  │ Save It에서 준비한...        │   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [노출 기간 *]                      │
│  ┌──────────┐  ~  ┌──────────┐    │
│  │2025.01.01│     │2025.01.31│    │
│  └──────────┘     └──────────┘    │
│                                     │
│  [링크 타입]                        │
│  ○ 상세 페이지 (기본)                │
│  ○ 외부 링크                        │
│  ○ 특정 업체 페이지                  │
│                                     │
│  [외부 링크 URL] (링크 타입 선택 시)  │
│  ┌─────────────────────────────┐   │
│  │ https://...                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [활성화]                           │
│  [토글 스위치: ON/OFF]              │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  [미리보기]              [저장하기]  │
│                                     │
└─────────────────────────────────────┘
```

**폼 필드 스펙**:

| 필드 | 타입 | 필수 | 유효성 검사 |
|------|------|------|------------|
| 이미지 | 파일 업로드 | O | 최대 5MB, jpg/png |
| 제목 | 텍스트 | O | 최대 50자 |
| 부제목 | 텍스트 | X | 최대 100자 |
| 상세 내용 | 텍스트 (멀티라인) | X | 최대 1000자 |
| 시작일 | 날짜 선택 | O | 종료일 이전 |
| 종료일 | 날짜 선택 | O | 시작일 이후 |
| 링크 타입 | 라디오 버튼 | O | 기본값: 상세 페이지 |
| 외부 링크 | URL | 조건부 | 유효한 URL |
| 활성화 | 토글 | O | 기본값: ON |

---

## 컴포넌트 구조

### BannerCarousel 컴포넌트 (소비자용)

```typescript
interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_type: 'detail' | 'external' | 'store';
  link_url?: string;
  store_id?: string;
  start_date: string;
  end_date: string;
  display_order: number;
  is_active: boolean;
}

interface BannerCarouselProps {
  banners: Banner[];
  onBannerPress: (banner: Banner) => void;
  autoPlayInterval?: number; // 기본 4000ms
}
```

### BannerIndicator 컴포넌트

```typescript
interface BannerIndicatorProps {
  total: number;
  current: number;
  activeColor?: string;
  inactiveColor?: string;
}
```

### BannerDetailScreen 컴포넌트

```typescript
interface BannerDetailScreenProps {
  bannerId: string;
  onBack: () => void;
  onNavigateStore?: (storeId: string) => void;
}
```

### BannerManagementScreen 컴포넌트 (관리자용)

```typescript
interface BannerManagementScreenProps {
  onBack: () => void;
  onAddBanner: () => void;
  onEditBanner: (bannerId: string) => void;
}
```

### BannerFormScreen 컴포넌트 (관리자용)

```typescript
interface BannerFormScreenProps {
  bannerId?: string; // 수정 시 전달
  onBack: () => void;
  onSave: (banner: Partial<Banner>) => void;
}
```

---

## 스타일 가이드

### 배너 캐러셀

```javascript
const styles = StyleSheet.create({
  bannerContainer: {
    height: 160,
    backgroundColor: '#F5F5F5',
  },
  bannerSlide: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingHorizontal: 20,
    paddingBottom: 32,
    justifyContent: 'flex-end',
    // 그라데이션 오버레이 (LinearGradient 사용)
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 16, // 활성 인디케이터는 약간 더 길게
  },
});
```

### 배너 상세 페이지

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  detailImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 26,
  },
  actionButton: {
    backgroundColor: '#00D563',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

### 배너 관리 목록

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#00D563',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  bannerItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D563',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  thumbnail: {
    width: 60,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 13,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#E8F8F0',
  },
  statusScheduled: {
    backgroundColor: '#FFF8E1',
  },
  statusEnded: {
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#00D563',
  },
  statusTextScheduled: {
    color: '#F59E0B',
  },
  statusTextEnded: {
    color: '#999999',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
});
```

### 배너 등록/수정 폼

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 20,
  },
  required: {
    color: '#FF6B6B',
  },
  imageUploadBox: {
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  imageUploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageUploadText: {
    fontSize: 14,
    color: '#666666',
  },
  imageUploadHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  uploadedImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  textAreaInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dateSeparator: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#666666',
  },
  radioGroup: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00D563',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D563',
  },
  radioLabel: {
    fontSize: 15,
    color: '#333333',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#333333',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 40,
  },
  previewButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#00D563',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D563',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#00D563',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

---

## 인터랙션

### 배너 캐러셀

1. **자동 슬라이드**
   - 4초 간격으로 자동 전환
   - 마지막 슬라이드에서 첫 번째로 순환

2. **수동 스와이프**
   - 좌우 스와이프로 배너 이동
   - 스와이프 시 자동 슬라이드 5초간 일시 정지

3. **배너 클릭**
   - link_type에 따라 다른 동작
   - `detail`: 배너 상세 페이지로 이동
   - `external`: 외부 브라우저에서 URL 열기
   - `store`: 해당 업체 상세 페이지로 이동

4. **인디케이터**
   - 현재 배너 위치 시각적 표시
   - 인디케이터 탭 시 해당 배너로 이동 (선택적)

### 배너 관리

1. **필터 탭**
   - 활성/예정/종료/전체 필터링
   - 활성: 현재 노출 중인 배너
   - 예정: 시작일이 아직 안 된 배너
   - 종료: 종료일이 지난 배너

2. **순서 변경**
   - 드래그 앤 드롭으로 순서 변경
   - 순서 변경 후 자동 저장

3. **삭제**
   - 삭제 버튼 클릭 시 확인 다이얼로그
   - "이 배너를 삭제하시겠습니까?"

4. **폼 유효성 검사**
   - 필수 항목 미입력 시 저장 버튼 비활성화
   - 실시간 유효성 검사 피드백

---

## 상태 관리

### 배너 데이터 흐름

```
Supabase DB (banners 테이블)
       │
       ▼
  API 호출 (조회/등록/수정/삭제)
       │
       ▼
  로컬 상태 (useState 또는 Zustand)
       │
       ▼
  UI 렌더링
```

### 배너 상태 결정 로직

```typescript
const getBannerStatus = (banner: Banner): 'active' | 'scheduled' | 'ended' => {
  const now = new Date();
  const startDate = new Date(banner.start_date);
  const endDate = new Date(banner.end_date);

  if (!banner.is_active) return 'ended';
  if (now < startDate) return 'scheduled';
  if (now > endDate) return 'ended';
  return 'active';
};
```

### 활성 배너 조회 쿼리

```typescript
// 현재 활성화된 배너만 조회 (소비자용)
const fetchActiveBanners = async () => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('display_order', { ascending: true });

  return data;
};
```

---

## 빈 상태 UI

### 배너가 없을 때 (소비자용)
배너 영역을 완전히 숨김 (공간 차지 안 함)

### 배너 목록이 비었을 때 (관리자용)

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            [배너 아이콘]             │
│                                     │
│      등록된 배너가 없습니다          │
│   첫 번째 배너를 등록해보세요!        │
│                                     │
│      [+ 배너 등록하기]               │
│                                     │
└─────────────────────────────────────┘
```

---

## 에러 상태 UI

### 배너 로딩 실패
- 배너 영역에 에러 메시지 표시 안 함 (영역 숨김)
- 콘솔에만 에러 로깅

### 이미지 로드 실패
- 플레이스홀더 이미지 표시
- 그라데이션 배경 + 텍스트만 표시

---

## 반응형 고려사항

- 배너 높이 160px 고정 (모든 디바이스)
- 이미지 비율 유지 (resizeMode: 'cover')
- 텍스트는 2줄까지만 (말줄임 처리)
- 터치 영역: 전체 배너 영역 (탭 가능)

---

## 접근성

```javascript
<TouchableOpacity
  accessibilityLabel={`배너: ${banner.title}`}
  accessibilityHint="탭하여 자세히 보기"
  accessibilityRole="button"
>
  {/* 배너 내용 */}
</TouchableOpacity>

<View
  accessibilityLabel={`${current + 1}번째 배너, 총 ${total}개`}
  accessibilityRole="progressbar"
>
  {/* 인디케이터 */}
</View>
```

---

## 구현 우선순위

### Phase 1: 소비자 화면 (필수)
1. **Phase 1-1**: 배너 DB 테이블 설계 및 생성
2. **Phase 1-2**: BannerCarousel 컴포넌트 개발
3. **Phase 1-3**: StoreListHome에 배너 영역 추가
4. **Phase 1-4**: BannerDetailScreen 개발

### Phase 2: 관리자 화면
5. **Phase 2-1**: BannerManagementScreen 개발
6. **Phase 2-2**: BannerFormScreen 개발
7. **Phase 2-3**: 이미지 업로드 기능
8. **Phase 2-4**: 순서 변경 (드래그 앤 드롭)

### Phase 3: 고도화
9. **Phase 3-1**: 배너 클릭 통계 수집
10. **Phase 3-2**: A/B 테스트 지원 (선택적)

---

## 데이터베이스 스키마 (Supabase)

```sql
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(50) NOT NULL,
  subtitle VARCHAR(100),
  description TEXT,
  image_url TEXT NOT NULL,
  link_type VARCHAR(20) NOT NULL DEFAULT 'detail'
    CHECK (link_type IN ('detail', 'external', 'store')),
  link_url TEXT,
  store_id UUID REFERENCES stores(id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_banners_active ON banners (is_active, start_date, end_date);
CREATE INDEX idx_banners_order ON banners (display_order);

-- RLS 정책
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 배너 조회 가능
CREATE POLICY "Active banners are viewable by everyone"
  ON banners FOR SELECT
  USING (is_active = true AND start_date <= NOW() AND end_date >= NOW());

-- 관리자만 배너 관리 가능 (별도 admin 역할 필요)
-- CREATE POLICY "Admins can manage banners"
--   ON banners FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 테스트 데이터

```sql
-- 테스트 배너 데이터
INSERT INTO banners (title, subtitle, description, image_url, link_type, start_date, end_date, display_order, is_active)
VALUES
  ('신년 할인 이벤트', '최대 50% 할인!', 'Save It에서 준비한 신년 맞이 특별 할인 이벤트입니다.',
   'https://example.com/banner1.jpg', 'detail',
   '2025-01-01', '2025-01-31', 1, true),
  ('설 연휴 안내', '연휴 기간 영업시간 변경', '설 연휴 기간 동안 일부 업체의 영업시간이 변경됩니다.',
   'https://example.com/banner2.jpg', 'detail',
   '2025-01-25', '2025-02-05', 2, true),
  ('신규 입점 업체 소개', '새로운 맛집을 만나보세요', NULL,
   'https://example.com/banner3.jpg', 'store',
   '2025-01-15', '2025-02-15', 3, true);
```

---

## 참고 디자인

- 배달의민족 메인 배너
- 쿠팡이츠 이벤트 배너
- 당근마켓 공지 배너

**차별점**:
- 음식 할인에 초점을 맞춘 따뜻한 톤
- 간결하고 명확한 정보 전달
- 자연스러운 자동 슬라이드
