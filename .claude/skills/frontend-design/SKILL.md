---
name: frontend-design
description: 고품질 프론트엔드 UI를 디자인합니다. 다음에 사용: (1) 새 화면 UI 설계, (2) 컴포넌트 스타일링, (3) 색상/폰트 팔레트 정의, (4) 애니메이션 구현, (5) 디자인 시스템 구축. React Native/Expo 앱에 최적화.
---

# Frontend Design 스킬

고품질의 프론트엔드 인터페이스를 생성합니다. 일반적인 "AI 스타일" 미학을 피하고, 독창적이고 세련된 UI를 구현합니다.

## 디자인 프로세스

### 1. 톤 선택 (하나를 명확히)

| 톤 | 특징 | 예시 |
|---|------|------|
| **미니멀** | 여백 중심, 절제 | 노션, 애플 |
| **플레이풀** | 밝고 장난스러운 | 슬랙, 노션 아이콘 |
| **럭셔리** | 고급스럽고 세련된 | 명품 브랜드 |
| **오가닉** | 자연적, 유기적 형태 | 환경 앱 |

### 2. 색상 팔레트 (3-5색)
```javascript
const colors = {
  primary: '#00D563',    // 브랜드 메인
  secondary: '#1A1A2E',  // 보조
  accent: '#FF6B6B',     // 포인트
  background: '#FAFAFA', // 배경
  surface: '#FFFFFF',    // 표면
};
```

### 3. 폰트 조합 (2개)
```javascript
// expo-google-fonts 사용
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Nunito_400Regular } from '@expo-google-fonts/nunito';

// 디스플레이: Poppins, Montserrat
// 본문: Nunito, Lato, Open Sans
```

## 절대 피할 것

```
❌ 일반적인 AI 미학:
- Inter, Roboto, Arial (시스템 폰트)
- 흰 배경 + 보라색 그라데이션
- 예측 가능한 좌우 대칭 레이아웃
- 맥락 없는 쿠키커터 디자인
```

## 핵심 스타일링

### 그림자 (깊이감)
```javascript
const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 5,
};
```

### 애니메이션 (react-native-reanimated)
```javascript
import Animated, { FadeInUp } from 'react-native-reanimated';

<Animated.View entering={FadeInUp.delay(100).duration(400)}>
  <Title />
</Animated.View>
```

## 프로젝트별 스타일

### 재고 할인 중개 플랫폼
```
톤: 친근함 + 신뢰감
색상: 그린(#00D563), 따뜻한 톤
폰트: 둥근 산세리프
특징: 할인율 강조, 음식 사진 중심
```

## 체크리스트

- [ ] 미적 방향 결정
- [ ] 색상 팔레트 (3-5색)
- [ ] 폰트 조합 (2개)
- [ ] 핵심 컴포넌트 스타일링
- [ ] 애니메이션
- [ ] 접근성 확인

## 상세 가이드

스타일 예제와 컴포넌트 패턴은 [references/design-patterns.md](references/design-patterns.md) 참고
