# UI 디자인 문서: 업주 마감할인 상품 등록 알림 설정

## 1. 개요

### 1.1 화면 목적
업주가 마감할인 상품 등록을 잊지 않도록 설정한 시간에 푸시 알림을 받을 수 있는 설정 화면

### 1.2 사용자 시나리오
```
1. 바쁜 업주가 마감할인 상품 등록을 자주 잊음
2. 사장님 페이지 > "상품 등록 알림 설정" 메뉴 진입
3. 알림 받고 싶은 시간 설정 (예: 오후 4시, 6시)
4. 요일별 알림 여부 설정 (매일/평일만/특정 요일)
5. 설정 완료 후 해당 시간에 푸시 알림 수신
6. 알림 클릭 시 상품 관리 화면으로 바로 이동
```

### 1.3 접근 경로
- 사장님 페이지(StoreDashboard) > 빠른 관리 그리드 또는 설정 메뉴 > 상품 등록 알림 설정

---

## 2. 디자인 시스템

### 2.1 톤 & 무드
**친근함 + 신뢰감** - 기존 Save It 앱 스타일 유지

### 2.2 색상 팔레트
```javascript
const colors = {
  primary: '#00D563',       // 브랜드 그린
  primaryLight: '#E8F5E9',  // 연한 그린 배경
  primaryDark: '#1B5E20',   // 진한 그린 텍스트
  background: '#F5F5F5',    // 화면 배경
  surface: '#FFFFFF',       // 카드 배경
  text: '#333333',          // 주요 텍스트
  textSecondary: '#666666', // 보조 텍스트
  textTertiary: '#999999',  // 힌트 텍스트
  border: '#E0E0E0',        // 테두리
  disabled: '#D0D0D0',      // 비활성화
  error: '#FF5252',         // 에러/삭제
  warning: '#FFA726',       // 경고
};
```

### 2.3 폰트
```javascript
// 시스템 폰트 사용 (기존 앱과 동일)
const typography = {
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  body: { fontSize: 14, color: '#666' },
  caption: { fontSize: 12, color: '#999' },
  button: { fontSize: 15, fontWeight: '600' },
};
```

---

## 3. 레이아웃 구조

### 3.1 전체 화면 구조
```
+------------------------------------------+
|  < 상품 등록 알림 설정                     |  <- 헤더
+------------------------------------------+
|                                          |
|  [알림 마스터 스위치 카드]                  |
|  +--------------------------------------+|
|  |  알림 받기                    [토글] ||
|  |  설정한 시간에 상품 등록 알림을 받아요   ||
|  +--------------------------------------+|
|                                          |
|  알림 시간 설정                           |  <- 섹션 타이틀
|  +--------------------------------------+|
|  |  + 알림 시간 추가                     ||  <- 시간 추가 버튼
|  +--------------------------------------+|
|  |  [시간 카드 1]  오후 4:00      [삭제] ||
|  |  [시간 카드 2]  오후 6:00      [삭제] ||
|  +--------------------------------------+|
|                                          |
|  알림 받을 요일                           |  <- 섹션 타이틀
|  +--------------------------------------+|
|  | [월][화][수][목][금][토][일]          ||  <- 요일 선택 버튼
|  | 매일 | 평일만 | 주말만                 ||  <- 프리셋 버튼
|  +--------------------------------------+|
|                                          |
|  알림 메시지 미리보기                      |
|  +--------------------------------------+|
|  | "마감할인 상품 등록 시간이에요!         ||
|  |  오늘의 할인 상품을 등록해주세요."      ||
|  +--------------------------------------+|
|                                          |
|  [알림 테스트 보내기]                      |  <- 테스트 버튼
|                                          |
+------------------------------------------+
```

### 3.2 반응형 고려사항
- 최소 화면 너비: 320px
- 시간 카드는 세로 스크롤로 확장
- 요일 버튼은 가로 균등 배치 (flex: 1)

---

## 4. 컴포넌트 명세

### 4.1 헤더
```javascript
// 스타일
header: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF',
  paddingHorizontal: 20,
  paddingTop: 50,
  paddingBottom: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
}
```
- 좌측: 뒤로가기 버튼 (<-)
- 중앙: 화면 제목 "상품 등록 알림 설정"

### 4.2 알림 마스터 스위치 카드
```javascript
// 구조
<View style={masterSwitchCard}>
  <View style={switchRow}>
    <View>
      <Text style={switchLabel}>알림 받기</Text>
      <Text style={switchDescription}>설정한 시간에 상품 등록 알림을 받아요</Text>
    </View>
    <Switch value={isEnabled} onValueChange={toggleEnabled} />
  </View>
</View>

// 스타일
masterSwitchCard: {
  backgroundColor: '#E8F5E9',
  padding: 20,
  borderRadius: 16,
  marginHorizontal: 20,
  marginTop: 20,
  borderWidth: 1,
  borderColor: '#00D563',
}
```

### 4.3 알림 시간 추가 버튼
```javascript
// 구조
<TouchableOpacity style={addTimeButton} onPress={openTimePicker}>
  <Text style={addIcon}>+</Text>
  <Text style={addText}>알림 시간 추가</Text>
</TouchableOpacity>

// 스타일
addTimeButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFF',
  paddingVertical: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E0E0E0',
  borderStyle: 'dashed',
  gap: 8,
}
addIcon: {
  fontSize: 24,
  color: '#00D563',
  fontWeight: '300',
}
addText: {
  fontSize: 15,
  color: '#00D563',
  fontWeight: '600',
}
```

### 4.4 알림 시간 카드
```javascript
// 구조
<View style={timeCard}>
  <View style={timeIconContainer}>
    <Text style={timeIcon}>bell</Text>  // 알림 아이콘
  </View>
  <View style={timeInfo}>
    <Text style={timeText}>오후 4:00</Text>
    <Text style={timeStatus}>매일 알림</Text>
  </View>
  <TouchableOpacity onPress={() => deleteTime(id)}>
    <Text style={deleteIcon}>X</Text>
  </TouchableOpacity>
</View>

// 스타일
timeCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF',
  padding: 16,
  borderRadius: 12,
  marginBottom: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
}
timeIconContainer: {
  width: 44,
  height: 44,
  backgroundColor: '#E8F5E9',
  borderRadius: 22,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
}
timeText: {
  fontSize: 18,
  fontWeight: '600',
  color: '#333',
}
timeStatus: {
  fontSize: 12,
  color: '#999',
  marginTop: 2,
}
deleteIcon: {
  fontSize: 20,
  color: '#FF5252',
  padding: 8,
}
```

### 4.5 요일 선택 버튼 그룹
```javascript
// 구조
<View style={dayButtonsContainer}>
  {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
    <TouchableOpacity
      key={day}
      style={[dayButton, selectedDays.includes(index) && dayButtonActive]}
      onPress={() => toggleDay(index)}
    >
      <Text style={[dayText, selectedDays.includes(index) && dayTextActive]}>
        {day}
      </Text>
    </TouchableOpacity>
  ))}
</View>

// 프리셋 버튼
<View style={presetContainer}>
  <TouchableOpacity style={presetButton} onPress={selectAllDays}>
    <Text style={presetText}>매일</Text>
  </TouchableOpacity>
  <TouchableOpacity style={presetButton} onPress={selectWeekdays}>
    <Text style={presetText}>평일만</Text>
  </TouchableOpacity>
  <TouchableOpacity style={presetButton} onPress={selectWeekend}>
    <Text style={presetText}>주말만</Text>
  </TouchableOpacity>
</View>

// 스타일
dayButtonsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
}
dayButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#F5F5F5',
  justifyContent: 'center',
  alignItems: 'center',
}
dayButtonActive: {
  backgroundColor: '#00D563',
}
dayText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#666',
}
dayTextActive: {
  color: '#FFF',
}
presetContainer: {
  flexDirection: 'row',
  gap: 8,
}
presetButton: {
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 20,
  backgroundColor: '#F5F5F5',
}
presetText: {
  fontSize: 13,
  color: '#666',
}
```

### 4.6 알림 메시지 미리보기
```javascript
// 구조
<View style={previewCard}>
  <Text style={previewTitle}>알림 미리보기</Text>
  <View style={previewContent}>
    <Text style={previewIcon}>bell</Text>
    <View>
      <Text style={previewAppName}>Save It</Text>
      <Text style={previewMessage}>마감할인 상품 등록 시간이에요!</Text>
      <Text style={previewSubMessage}>오늘의 할인 상품을 등록해주세요.</Text>
    </View>
  </View>
</View>

// 스타일
previewCard: {
  backgroundColor: '#FFF',
  padding: 16,
  borderRadius: 12,
  marginHorizontal: 20,
  marginTop: 20,
}
previewTitle: {
  fontSize: 14,
  color: '#999',
  marginBottom: 12,
}
previewContent: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
  padding: 12,
  backgroundColor: '#F8F8F8',
  borderRadius: 8,
}
previewMessage: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
}
previewSubMessage: {
  fontSize: 13,
  color: '#666',
  marginTop: 2,
}
```

### 4.7 테스트 버튼
```javascript
// 구조
<TouchableOpacity style={testButton} onPress={sendTestNotification}>
  <Text style={testButtonText}>알림 테스트 보내기</Text>
</TouchableOpacity>

// 스타일
testButton: {
  backgroundColor: '#FFF',
  marginHorizontal: 20,
  marginTop: 20,
  marginBottom: 40,
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#00D563',
}
testButtonText: {
  fontSize: 16,
  color: '#00D563',
  fontWeight: '600',
}
```

---

## 5. 상태별 UI

### 5.1 로딩 상태
```javascript
<View style={loadingContainer}>
  <ActivityIndicator size="large" color="#00D563" />
</View>
```

### 5.2 알림 비활성화 상태
- 마스터 스위치 OFF 시 아래 설정 영역 비활성화
- 투명도 0.5 적용
- 터치 불가 (pointerEvents: 'none')

```javascript
<View style={[settingsContainer, !isEnabled && disabledContainer]}>
  ...
</View>

disabledContainer: {
  opacity: 0.5,
  pointerEvents: 'none',
}
```

### 5.3 빈 상태 (알림 시간 없음)
```javascript
<View style={emptyState}>
  <Text style={emptyIcon}>bell-off</Text>
  <Text style={emptyText}>설정된 알림이 없습니다</Text>
  <Text style={emptySubText}>+ 버튼을 눌러 알림 시간을 추가하세요</Text>
</View>
```

### 5.4 에러 상태
```javascript
<View style={errorContainer}>
  <Text style={errorIcon}>!</Text>
  <Text style={errorText}>알림 설정을 불러올 수 없습니다</Text>
  <TouchableOpacity style={retryButton} onPress={retry}>
    <Text style={retryText}>다시 시도</Text>
  </TouchableOpacity>
</View>
```

### 5.5 저장 완료 토스트
```javascript
// 설정 변경 시 자동 저장 후 표시
<Toast message="알림 설정이 저장되었습니다" />
```

---

## 6. 인터랙션 정의

### 6.1 시간 선택 (Time Picker)
- "알림 시간 추가" 버튼 클릭
- 네이티브 Time Picker 모달 표시 (iOS: DateTimePickerIOS, Android: TimePickerAndroid)
- 15분 단위 선택 권장 (사용자 편의)
- 선택 완료 시 시간 카드 추가

### 6.2 시간 삭제
- 시간 카드의 X 버튼 클릭
- 확인 Alert 표시 ("이 알림을 삭제하시겠습니까?")
- 확인 시 삭제, 취소 시 유지

### 6.3 요일 선택
- 개별 요일 버튼 토글 (탭 시 선택/해제)
- 프리셋 버튼 클릭 시 해당 요일 일괄 선택
- 최소 1개 이상 선택 필수

### 6.4 테스트 알림
- 버튼 클릭 즉시 테스트 푸시 알림 발송
- 성공 시 토스트 메시지 표시
- 실패 시 에러 메시지 및 알림 권한 확인 안내

### 6.5 자동 저장
- 설정 변경 시 자동 저장 (debounce 500ms)
- 저장 중 작은 인디케이터 표시
- 저장 완료 시 토스트 메시지

---

## 7. 애니메이션

### 7.1 시간 카드 추가/삭제
```javascript
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

<Animated.View
  entering={FadeInUp.duration(300)}
  exiting={FadeOutUp.duration(200)}
>
  <TimeCard />
</Animated.View>
```

### 7.2 요일 버튼 선택
```javascript
// 스케일 애니메이션 (탭 피드백)
transform: [{ scale: isPressed ? 0.95 : 1 }]
```

### 7.3 스위치 토글
- 기본 Switch 컴포넌트 애니메이션 사용

---

## 8. 접근성 고려사항

### 8.1 시각 접근성
- 색상 대비 WCAG AA 기준 충족 (4.5:1 이상)
- 터치 영역 최소 44x44dp
- 폰트 크기 14px 이상

### 8.2 스크린 리더
```javascript
// 예시
<TouchableOpacity
  accessibilityLabel="오후 4시 알림 삭제"
  accessibilityRole="button"
  accessibilityHint="이 알림 시간을 삭제합니다"
>
```

### 8.3 키보드 접근성
- Tab 순서 논리적 배치
- 포커스 스타일 명확히 표시

---

## 9. 알림 메시지 예시

### 9.1 기본 알림
```
제목: Save It
메시지: 마감할인 상품 등록 시간이에요! 오늘의 할인 상품을 등록해주세요.
```

### 9.2 리마인드 알림 (2차 알림)
```
제목: Save It
메시지: 오늘 남은 재고가 있나요? 마감할인으로 손실을 줄여보세요!
```

### 9.3 격려 알림 (옵션)
```
제목: Save It
메시지: 좋아요! 오늘도 음식 폐기를 줄여주세요.
```

---

## 10. 데이터 구조 (참고)

### 10.1 알림 설정 저장 구조
```typescript
interface NotificationSettings {
  enabled: boolean;            // 알림 활성화 여부
  times: NotificationTime[];   // 알림 시간 목록
  days: number[];              // 선택된 요일 (0: 일, 1: 월, ... 6: 토)
}

interface NotificationTime {
  id: string;
  hour: number;    // 0-23
  minute: number;  // 0-59
}
```

### 10.2 저장 위치
- Supabase `store_notification_settings` 테이블 또는
- AsyncStorage (로컬 저장, 오프라인 지원)

---

## 11. 화면 네비게이션

### 11.1 진입점
- StoreDashboard > 설정 또는 빠른 관리 영역에 "상품 등록 알림" 메뉴 추가

### 11.2 알림 클릭 시 동작
- 푸시 알림 클릭 > 앱 실행 > StoreProductManagement 화면으로 이동

---

## 12. 구현 참고사항

### 12.1 푸시 알림 구현
- expo-notifications 라이브러리 사용
- 로컬 스케줄링 (Notification.scheduleNotificationAsync)
- 백그라운드에서도 동작 필요

### 12.2 권한 처리
- 앱 최초 실행 시 알림 권한 요청
- 권한 거부 시 설정 화면으로 안내

### 12.3 시간대 처리
- 사용자 로컬 시간 기준
- 일광 절약 시간 고려

---

## 13. 체크리스트

- [ ] 미적 방향: 친근함 + 신뢰감 (기존 앱 스타일)
- [ ] 색상 팔레트: 그린 계열 (#00D563, #E8F5E9)
- [ ] 폰트: 시스템 폰트 (기존과 동일)
- [ ] 핵심 컴포넌트: 마스터 스위치, 시간 카드, 요일 선택
- [ ] 애니메이션: 카드 추가/삭제 페이드 애니메이션
- [ ] 접근성: 터치 영역, 색상 대비, 스크린 리더 지원

---

## 14. 버전 히스토리

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-02-07 | frontend-design | 초안 작성 |
