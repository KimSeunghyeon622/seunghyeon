# UI 디자인 문서: 판매 관리 화면 (StoreSalesManagement)

> **문서 버전**: 1.1
> **작성일**: 2026-02-10
> **최종 수정일**: 2026-02-12
> **상태**: 확정 (수정)

---

## 1. 화면 목적 및 사용자 시나리오

### 1.1 화면 목적
- 업주가 매출 현황을 한눈에 파악
- 시간대별 판매 패턴 분석
- 일자별/주간별 매출 추이 확인

### 1.2 타겟 사용자
- 40-50대 비전공자 사장님
- 디지털 기기 사용에 익숙하지 않음
- 복잡한 차트보다 큰 숫자와 명확한 색상 선호

### 1.3 사용자 시나리오
1. **저녁 마감 후 5분 체크**: "오늘 얼마 벌었지?" -> 오늘 매출 카드 확인
2. **어제와 비교**: "어제보다 나았나?" -> 성장률(+12%) 확인
3. **바쁜 시간대 파악**: "언제 손님이 많았지?" -> 시간 분석 탭
4. **매출 추이 확인**: "이번 주 매출이 어땠지?" -> 매출 분석 탭

---

## 2. 디자인 원칙

### 2.1 톤
**친근함 + 신뢰감** (미니멀 베이스)

### 2.2 색상 팔레트
```javascript
const colors = {
  primary: '#00D563',      // 브랜드 그린 (메인)
  primaryLight: '#E8F8EF', // 그린 연한 배경
  secondary: '#333333',    // 텍스트 다크
  accent: '#FF6B6B',       // 하락 표시 (빨강)
  success: '#00D563',      // 상승 표시 (그린)
  background: '#F5F5F5',   // 배경 그레이
  surface: '#FFFFFF',      // 카드 배경
  textPrimary: '#333333',  // 주 텍스트
  textSecondary: '#999999',// 보조 텍스트
  border: '#E0E0E0',       // 테두리
  tabActive: '#00D563',    // 활성 탭
  tabInactive: '#CCCCCC',  // 비활성 탭
};
```

### 2.3 폰트
- **금액/숫자**: 18-24px, Bold
- **라벨**: 13-14px, Regular
- **증감률**: 12-14px, SemiBold

---

## 3. 레이아웃 구조

```
+------------------------------------------+
|  [<] 판매 관리                            | <- 헤더 (고정)
+------------------------------------------+
|                                          |
|  +----------------+  +----------------+    | <- 요약 카드 섹션
|  |   오늘 매출      |  |    이번 주      |    |    (가로 스크롤 X, 2열)
|  |   52,000원      |  |   312,000원    |    |
|  |    +12%        |  |     -3%       |    |
|  +----------------+  +----------------+    |
|                                          |
|  [  시간 분석  ] [  매출 분석  ]           | <- 탭 네비게이션 (2개)
|  ========================================|    (활성 탭 밑줄)
|                                          |
|  +--------------------------------------+| <- 탭 콘텐츠 영역
|  |                                      ||    (스크롤 가능)
|  |  [콘텐츠]                             ||
|  |                                      ||
|  +--------------------------------------+|
|                                          |
+------------------------------------------+
```

---

## 4. 컴포넌트 명세

### 4.1 SummaryCard (매출 요약 카드)

```
+------------------+
|   오늘 매출       |  <- label (13px, #999)
|                  |
|   52,000원       |  <- amount (18px, Bold, #00D563)
|                  |
|     +12%        |  <- growth (12px, 상승:#00D563, 하락:#FF6B6B)
+------------------+

스타일:
- 배경: #FFFFFF
- 모서리: 12px
- 패딩: 16px
- 그림자: elevation 2
- 너비: 화면의 1/3 - 8px
- 높이: 자동 (콘텐츠에 맞춤)
```

**Props**:
```typescript
interface SummaryCardProps {
  label: string;           // "오늘 매출", "이번 주", "순수익"
  amount: number;          // 금액
  growth?: number;         // 성장률 (%, optional)
  suffix?: string;         // 접미사 ("(85%)" 등)
  isPrimary?: boolean;     // 순수익 카드 여부
}
```

### 4.2 TabNavigation (탭 네비게이션)

```
+------------------------------------------+
|  [  시간 분석  ]     [  매출 분석  ]        |
|  ============                            |
+------------------------------------------+

활성 탭:
- 텍스트: #333333, Bold
- 밑줄: #00D563, 높이 3px

비활성 탭:
- 텍스트: #999999, Regular
- 밑줄: 없음
```

**Props**:
```typescript
interface TabNavigationProps {
  tabs: string[];
  activeIndex: number;
  onTabChange: (index: number) => void;
}
```

### 4.3 HorizontalBarChart (시간대별 막대 그래프)

```
+------------------------------------------+
|  시간대별 판매                             |
|                                          |
|  09-12시 [====        ] 15,000원           |
|  12-15시 [=======     ] 22,000원           |
|  15-18시 [===         ]  8,000원           |
|  18-21시 [==========* ] 32,000원  피크!     |  <- 피크타임 강조
|  21-24시 [==          ]  5,000원           |
+------------------------------------------+

막대 스타일:
- 기본: #00D563 (연한)
- 피크: #00D563 (진한) + 별표(*)
- 높이: 24px
- 모서리: 6px
- 배경: #F5F5F5
```

**데이터 구조**:
```typescript
interface TimeSlotData {
  slot: string;      // '09-12', '12-15', '15-18', '18-21', '21-24'
  amount: number;    // 금액
  count: number;     // 건수
  isPeak: boolean;   // 피크타임 여부
}
```

### 4.4 InsightTip (인사이트 팁)

```
+------------------------------------------+
| TIP  오후 6-9시가 가장 바빠요!              |
+------------------------------------------+

스타일:
- 배경: #E8F8EF (연한 그린)
- 텍스트: #00D563
- 아이콘: 전구 또는 "TIP" 텍스트
- 패딩: 12px 16px
- 모서리: 8px
```

### 4.5 PeriodSelector (기간 선택)

```
+------------------------------------------+
|  [ 7일 ]  [ 30일 ]                        |
+------------------------------------------+

활성 버튼:
- 배경: #00D563
- 텍스트: #FFFFFF

비활성 버튼:
- 배경: #FFFFFF
- 텍스트: #666666
- 테두리: #E0E0E0
```

### 4.6 RevenueChart (매출 분석 그래프)

```
+------------------------------------------+
|  매출 분석 (최근 7일)                       |
|                                          |
|  총매출                        312,000원  |  <- 강조
|  ----------------------------------------|
|  일자별 매출                               |
|                                          |
|  2/6   [====        ] 42,000원           |
|  2/7   [=======     ] 58,000원           |
|  2/8   [===         ] 35,000원           |
|  2/9   [==========  ] 72,000원           |
|  2/10  [========    ] 55,000원           |
|  2/11  [=====       ] 38,000원           |
|  2/12  [==          ] 12,000원           |
+------------------------------------------+

30일 탭 선택 시: 주간별 매출 (최근 4주)
- 1/13~ [====        ] 280,000원
- 1/20~ [=======     ] 350,000원
- 1/27~ [========    ] 390,000원
- 2/3~  [=====       ] 312,000원

스타일:
- 총매출 행: 텍스트 #00D563 Bold, 24px
```

---

## 5. 상태별 UI

### 5.1 로딩 상태
```
+------------------------------------------+
|                                          |
|           [로딩 스피너]                    |
|                                          |
+------------------------------------------+

- ActivityIndicator (color: #00D563)
- 화면 중앙 배치
```

### 5.2 빈 상태 (데이터 없음)
```
+------------------------------------------+
|                                          |
|           데이터가 없습니다                 |
|                                          |
|     최소 7일 이상 데이터가 필요합니다       |
+------------------------------------------+

- 아이콘: 차트 아이콘 (회색)
- 텍스트: #999999
```

### 5.3 에러 상태
```
+------------------------------------------+
|                                          |
|        데이터를 불러올 수 없습니다          |
|                                          |
|          [ 다시 시도 ]                    |
+------------------------------------------+

- 버튼: 테두리 #00D563
```

---

## 6. 인터랙션 정의

### 6.1 탭 전환
- **동작**: 탭 터치
- **효과**: 밑줄 슬라이드 애니메이션 (200ms)
- **결과**: 탭 콘텐츠 변경

### 6.2 기간 선택 변경
- **동작**: 7일/30일 버튼 터치
- **효과**: 로딩 인디케이터 표시
- **결과**: 전체 데이터 갱신

### 6.3 당겨서 새로고침
- **동작**: 스크롤 영역에서 아래로 당기기
- **효과**: RefreshControl 표시
- **결과**: 데이터 갱신

### 6.4 뒤로가기
- **동작**: 헤더 좌측 화살표 터치
- **효과**: 없음
- **결과**: 이전 화면으로 이동

---

## 7. 화면별 상세 레이아웃

### 7.1 시간 분석 탭 (기본)
```
+------------------------------------------+
|  < 판매 관리                              |
+------------------------------------------+
|  +------------+  +------------+          |
|  |  오늘 매출  |  |  이번 주    |          |
|  |  52,000원  |  |  312,000원  |          |
|  |   +12%    |  |    -3%     |          |
|  +------------+  +------------+          |
|                                          |
|  [  시간 분석  ]  [  매출 분석  ]          |
|  ============                            |
|                                          |
|  시간대별 판매                             |
|                                          |
|  09-12시 |[====        ]| 15,000원       |
|  12-15시 |[=======     ]| 22,000원       |
|  15-18시 |[===         ]|  8,000원       |
|  18-21시 |[==========* ]| 32,000원 피크!  |
|  21-24시 |[==          ]|  5,000원       |
|                                          |
|  +--------------------------------------+|
|  | TIP  저녁 6-9시가 가장 바빠요!         ||
|  +--------------------------------------+|
|                                          |
+------------------------------------------+
```

### 7.2 매출 분석 탭
```
+------------------------------------------+
|  < 판매 관리                              |
+------------------------------------------+
|  +------------+  +------------+          |
|  |  오늘 매출  |  |  이번 주    |          |
|  |  52,000원  |  |  312,000원  |          |
|  |   +12%    |  |    -3%     |          |
|  +------------+  +------------+          |
|                                          |
|  [  시간 분석  ]  [  매출 분석  ]          |
|                   ============           |
|                                          |
|  [ 7일 ]  [ 30일 ]                        |
|                                          |
|  +--------------------------------------+|
|  | 매출 분석 (최근 7일)                    ||
|  |                                      ||
|  | 총매출                    312,000원   || <- 강조
|  | -------------------------------------|
|  | 일자별 매출                            ||
|  |                                      ||
|  | 2/6   |[====      ]|  42,000원       ||
|  | 2/7   |[=======   ]|  58,000원       ||
|  | 2/8   |[===       ]|  35,000원       ||
|  | 2/9   |[==========]|  72,000원       ||
|  | 2/10  |[========  ]|  55,000원       ||
|  | 2/11  |[=====     ]|  38,000원       ||
|  | 2/12  |[==        ]|  12,000원       ||
|  +--------------------------------------+|
|                                          |
+------------------------------------------+
```

---

## 8. 스타일 명세 (StyleSheet)

```javascript
const styles = StyleSheet.create({
  // 컨테이너
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // 헤더
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  // 요약 카드 섹션
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // 탭 네비게이션
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#00D563',
  },
  tabText: {
    fontSize: 15,
    color: '#999999',
  },
  tabTextActive: {
    color: '#333333',
    fontWeight: 'bold',
  },

  // 콘텐츠 영역
  contentContainer: {
    flex: 1,
    padding: 16,
  },

  // 막대 그래프
  barChartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 50,
    fontSize: 13,
    color: '#666666',
  },
  barTrack: {
    flex: 1,
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#00D563',
    borderRadius: 6,
  },
  barFillPeak: {
    backgroundColor: '#00B050', // 더 진한 그린
  },
  barAmount: {
    width: 80,
    fontSize: 13,
    color: '#333333',
    textAlign: 'right',
  },

  // 인사이트 팁
  tipContainer: {
    backgroundColor: '#E8F8EF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipLabel: {
    backgroundColor: '#00D563',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
  },
  tipText: {
    color: '#00D563',
    fontSize: 14,
  },

  // 매출 분석
  revenueContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  revenueRowHighlight: {
    backgroundColor: '#E8F8EF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666666',
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  revenueAmountHighlight: {
    color: '#00D563',
    fontWeight: 'bold',
  },
});
```

---

## 9. 참고 사항

### 9.1 기존 화면과의 일관성
- `StoreStatistics.tsx`의 스타일 패턴 유지
- 동일한 색상 팔레트 사용
- 헤더 레이아웃 동일

### 9.2 기술적 제약
- react-native-svg 사용 불가 -> View + 배경색으로 막대 구현
- 차트 라이브러리 사용 X

### 9.3 접근성
- 터치 영역 최소 44x44px
- 색상 대비 4.5:1 이상
- 숫자는 큰 폰트 사용

---

**다음 단계**: 이 디자인 문서를 기반으로 `StoreSalesManagement.tsx` 구현
