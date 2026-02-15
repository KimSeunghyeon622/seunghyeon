# 픽업 시간 선택 UI 설계

## 디자인 컨셉

### 톤
- **직관적이고 명확함**: 시간 선택이 쉬워야 함
- **업체 영업시간 고려**: 선택 가능한 시간만 표시하여 사용자 실수 방지

### 색상 팔레트
```javascript
const colors = {
  primary: '#00D563',      // 브랜드 그린
  background: '#F5F5F5',   // 배경
  surface: '#FFFFFF',      // 모달 배경
  textPrimary: '#333333',  // 주요 텍스트
  textSecondary: '#666666', // 보조 텍스트
  border: '#E0E0E0',       // 구분선
  selected: '#00D563',     // 선택된 시간
  disabled: '#CCCCCC',     // 비활성화 (영업시간 외)
  overlay: 'rgba(0, 0, 0, 0.5)', // 오버레이
};
```

---

## UI 구조

### 1. 시간 입력 필드 (기존 TextInput 대체)

**현재**: TextInput으로 직접 입력

**변경 후**: 클릭 가능한 버튼 형태

```
┌─────────────────────────────────────┐
│  픽업 시간                          │
│  ┌───────────────────────────────┐ │
│  │  18:00                    ▼   │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**상세 스펙**:
- 배경색: `#F5F5F5`
- 테두리: `#E0E0E0`
- 오른쪽에 화살표 아이콘 (▼)
- 클릭 시 하단에서 시간 선택 모달 표시

### 2. 시간 선택 모달 (Bottom Sheet)

**위치**: 화면 하단에서 올라오는 모달

```
┌─────────────────────────────────────┐
│  [오버레이 - 반투명 검정]            │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  픽업 시간 선택          [X]   │  │
│  │  ────────────────────────────  │  │
│  │                              │  │
│  │  [09:00]                     │  │
│  │  [09:30]                     │  │
│  │  [10:00]                     │  │
│  │  [10:30]                     │  │
│  │  ...                         │  │
│  │  [18:00] ← 선택됨            │  │
│  │  [18:30]                     │  │
│  │  ...                         │  │
│  │  [21:00]                     │  │
│  │                              │  │
│  │  [확인]                      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**상세 스펙**:

1. **헤더**
   - 제목: "픽업 시간 선택"
   - 닫기 버튼 (X)
   - 업체 영업시간 표시 (예: "영업시간: 09:00 - 21:00")

2. **시간 리스트**
   - 스크롤 가능한 리스트
   - 30분 단위로 시간 표시
   - 영업시간 내 시간만 표시
   - 선택된 시간 하이라이트 (그린 배경)
   - 영업시간 외 시간은 비활성화 (회색, 클릭 불가)

3. **확인 버튼**
   - 하단 고정
   - 선택된 시간으로 확인

---

## 컴포넌트 구조

### TimePickerModal 컴포넌트

```typescript
interface TimePickerModalProps {
  visible: boolean;
  selectedTime: string; // "HH:MM" 형식
  storeId: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}
```

### 시간 생성 로직

```typescript
// 업체 영업시간 가져오기
const { openingTime, closingTime } = await getStoreOperatingHours(storeId);

// 30분 단위로 시간 생성
const generateTimeSlots = (openingTime: string, closingTime: string) => {
  // 예: "09:00" ~ "21:00"
  // 결과: ["09:00", "09:30", "10:00", ..., "21:00"]
};
```

---

## 스타일 가이드

### 시간 입력 필드
```javascript
timeInputContainer: {
  backgroundColor: '#F5F5F5',
  borderWidth: 1,
  borderColor: '#E0E0E0',
  borderRadius: 10,
  padding: 15,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
timeInputText: {
  fontSize: 16,
  color: '#333333',
  fontWeight: '500',
},
timeInputIcon: {
  fontSize: 16,
  color: '#666666',
},
```

### 모달 오버레이
```javascript
modalOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
},
```

### 모달 컨테이너
```javascript
modalContainer: {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingTop: 20,
  paddingBottom: 40,
  maxHeight: '70%',
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingBottom: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333333',
},
modalCloseButton: {
  padding: 5,
},
modalCloseText: {
  fontSize: 24,
  color: '#666666',
},
operatingHoursText: {
  fontSize: 14,
  color: '#666666',
  marginTop: 8,
  textAlign: 'center',
},
```

### 시간 리스트
```javascript
timeListContainer: {
  paddingHorizontal: 20,
  paddingVertical: 10,
  maxHeight: 400,
},
timeSlot: {
  paddingVertical: 15,
  paddingHorizontal: 20,
  marginVertical: 4,
  borderRadius: 10,
  backgroundColor: '#F5F5F5',
  borderWidth: 1,
  borderColor: '#E0E0E0',
},
timeSlotSelected: {
  backgroundColor: '#00D563',
  borderColor: '#00D563',
},
timeSlotDisabled: {
  backgroundColor: '#F5F5F5',
  opacity: 0.5,
},
timeSlotText: {
  fontSize: 16,
  color: '#333333',
  fontWeight: '500',
  textAlign: 'center',
},
timeSlotTextSelected: {
  color: '#FFFFFF',
},
timeSlotTextDisabled: {
  color: '#CCCCCC',
},
```

### 확인 버튼
```javascript
confirmButton: {
  backgroundColor: '#00D563',
  padding: 18,
  borderRadius: 12,
  alignItems: 'center',
  marginHorizontal: 20,
  marginTop: 20,
},
confirmButtonText: {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: 'bold',
},
```

---

## 인터랙션

### 시간 선택 플로우
1. **시간 입력 필드 클릭**
   - 모달이 하단에서 올라옴 (애니메이션)
   - 오버레이 표시

2. **시간 리스트 스크롤**
   - 스크롤 가능
   - 선택된 시간이 보이도록 자동 스크롤

3. **시간 선택**
   - 시간 클릭 시 즉시 선택 (하이라이트)
   - 이전 선택 해제

4. **확인 버튼 클릭**
   - 선택된 시간 저장
   - 모달 닫기
   - 입력 필드에 선택된 시간 표시

5. **닫기 버튼 클릭 또는 오버레이 클릭**
   - 모달 닫기
   - 변경사항 저장하지 않음

### 애니메이션
- 모달 등장: 하단에서 위로 슬라이드 (300ms)
- 모달 닫기: 위에서 아래로 슬라이드 (300ms)
- 시간 선택: 즉각적인 하이라이트

---

## 업체 영업시간 고려

### 영업시간 조회
```typescript
// store_operating_hours 테이블에서 오늘 요일의 영업시간 조회
const today = new Date().getDay(); // 0: 일요일, 6: 토요일
const operatingHours = await getStoreOperatingHours(storeId, today);

// 예시 결과
{
  isOpen: true,
  openTime: "09:00",
  closeTime: "21:00"
}
```

### 시간 슬롯 생성
```typescript
const generateTimeSlots = (openTime: string, closeTime: string) => {
  const slots = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin;
  
  while (
    currentHour < closeHour || 
    (currentHour === closeHour && currentMin <= closeMin)
  ) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeString);
    
    // 30분 추가
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }
  
  return slots;
};
```

### 영업시간 외 시간 처리
- 영업시간 외 시간은 리스트에 표시하지 않음
- 또는 표시하되 비활성화 (회색, 클릭 불가)

---

## 사용자 시나리오

### 시나리오 1: 정상적인 시간 선택
1. 예약 화면에서 "픽업 시간" 필드 클릭
2. 모달이 하단에서 올라옴
3. 업체 영업시간 확인 (예: "영업시간: 09:00 - 21:00")
4. 원하는 시간 선택 (예: "18:00")
5. "확인" 버튼 클릭
6. 모달 닫히고 선택된 시간이 입력 필드에 표시

### 시나리오 2: 영업시간 외 시간 선택 시도
1. 시간 선택 모달 열기
2. 영업시간 외 시간은 비활성화되어 있음
3. 비활성화된 시간 클릭 시 아무 동작 없음
4. 영업시간 내 시간만 선택 가능

---

## 반응형 고려사항

- 모바일 화면에 최적화
- 터치 영역: 최소 44x44px
- 시간 슬롯 높이: 50px
- 모달 최대 높이: 화면의 70%

---

## 접근성

- 시간 슬롯에 접근성 라벨 추가
- 키보드 네비게이션 지원 (웹)
- 색상 대비 비율 준수
- 스크린 리더 지원

---

## 구현 우선순위

1. **Phase 1**: 시간 선택 모달 기본 구조
2. **Phase 2**: 업체 영업시간 조회 로직
3. **Phase 3**: 30분 단위 시간 생성 로직
4. **Phase 4**: ReservationScreen에 적용
5. **Phase 5**: CartScreen에 적용

---

## 참고 디자인

- iOS 시간 선택기 (DatePicker)
- Android 시간 선택 다이얼로그
- 배달의민족 시간 선택 UI

**차별점**:
- 업체별 영업시간을 고려한 동적 시간 생성
- 30분 단위로 간단하고 명확한 선택
- 모바일 터치에 최적화된 UI
