# Frontend Design 패턴 가이드

## 1. 색상 시스템

### 재고 할인 플랫폼 팔레트
```javascript
export const colors = {
  // 브랜드
  primary: '#00D563',      // 메인 그린
  primaryDark: '#00B854',  // 다크 그린
  primaryLight: '#E8F8F0', // 라이트 그린 배경

  // 중립
  text: '#1A1A2E',         // 메인 텍스트
  textSecondary: '#6B7280', // 보조 텍스트
  border: '#E5E7EB',       // 테두리
  background: '#F9FAFB',   // 페이지 배경
  surface: '#FFFFFF',      // 카드 배경

  // 시맨틱
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // 할인 강조
  discount: '#FF6B6B',
  discountBg: '#FEF2F2',
};
```

### 다크 모드
```javascript
export const darkColors = {
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  background: '#111827',
  surface: '#1F2937',
  border: '#374151',
};
```

---

## 2. 타이포그래피

### 폰트 스케일
```javascript
export const typography = {
  h1: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
};
```

### 폰트 로딩 (Expo)
```javascript
import {
  useFonts,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
} from '@expo-google-fonts/nunito';

const [fontsLoaded] = useFonts({
  Poppins_600SemiBold,
  Poppins_700Bold,
  Nunito_400Regular,
  Nunito_600SemiBold,
});
```

---

## 3. 간격 시스템

```javascript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

---

## 4. 그림자 시스템

```javascript
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
```

---

## 5. 컴포넌트 패턴

### 카드 컴포넌트
```javascript
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.md,
  },
});
```

### 버튼 컴포넌트
```javascript
const Button = ({ title, variant = 'primary', onPress, disabled }) => (
  <TouchableOpacity
    style={[
      styles.button,
      styles[variant],
      disabled && styles.disabled,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.buttonText, styles[`${variant}Text`]]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    ...typography.body,
    fontFamily: 'Nunito_600SemiBold',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

### 할인 배지
```javascript
const DiscountBadge = ({ percent }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{percent}% OFF</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.discount,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

---

## 6. 애니메이션 패턴

### 진입 애니메이션 (Stagger)
```javascript
import Animated, {
  FadeInUp,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';

const Screen = () => (
  <View>
    <Animated.View entering={FadeInUp.delay(0).duration(400)}>
      <Header />
    </Animated.View>
    <Animated.View entering={FadeInUp.delay(100).duration(400)}>
      <SearchBar />
    </Animated.View>
    <Animated.View entering={FadeInUp.delay(200).duration(400)}>
      <StoreList />
    </Animated.View>
  </View>
);
```

### 버튼 프레스 애니메이션
```javascript
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedButton = ({ children, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
```

---

## 7. 레이아웃 패턴

### 비대칭 그리드
```javascript
const AsymmetricGrid = ({ items }) => (
  <View style={styles.grid}>
    <View style={styles.leftColumn}>
      {items.filter((_, i) => i % 2 === 0).map(renderItem)}
    </View>
    <View style={[styles.rightColumn, { marginTop: 32 }]}>
      {items.filter((_, i) => i % 2 === 1).map(renderItem)}
    </View>
  </View>
);
```

### 카드 오버랩
```javascript
const OverlappingCard = () => (
  <View>
    <Image source={...} style={styles.image} />
    <View style={styles.overlappingContent}>
      <Text>Content overlapping image</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  image: {
    height: 200,
    borderRadius: 16,
  },
  overlappingContent: {
    backgroundColor: colors.surface,
    marginTop: -40,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    ...shadows.md,
  },
});
```

---

## 8. 접근성

```javascript
// 터치 영역 최소 44x44
const styles = StyleSheet.create({
  touchable: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// 접근성 라벨
<TouchableOpacity
  accessibilityLabel="예약하기 버튼"
  accessibilityRole="button"
  accessibilityHint="이 상품을 예약합니다"
>
  <Text>예약하기</Text>
</TouchableOpacity>
```
