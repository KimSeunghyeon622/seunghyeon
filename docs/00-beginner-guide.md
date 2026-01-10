# 🎓 초보자를 위한 개발 시작 가이드

> **개발 경험이 없는 분들을 위한 단계별 실습 가이드**
>
> - 이 문서는 프로그래밍 경험이 없어도 따라할 수 있도록 작성되었습니다
> - 각 단계마다 스크린샷과 함께 상세한 설명이 포함되어 있습니다
> - 막히는 부분이 있으면 언제든 질문하세요!

---

## 📋 목차

1. [학습 로드맵](#학습-로드맵)
2. [개발 환경 설정 (Day 1-2)](#개발-환경-설정-day-1-2)
3. [Hello World 앱 만들기 (Day 3-4)](#hello-world-앱-만들기-day-3-4)
4. [첫 번째 기능: 로그인 화면 (Day 5-7)](#첫-번째-기능-로그인-화면-day-5-7)
5. [Supabase 연결 (Day 8-10)](#supabase-연결-day-8-10)
6. [다음 단계](#다음-단계)

---

## 학습 로드맵

### 전체 학습 계획 (8-12주)

```
Week 1-2:  개발 환경 설정 + 기본 개념 학습
Week 3-4:  첫 화면 만들기 + Supabase 연결
Week 5-6:  인증 시스템 완성
Week 7-8:  업체 리스트 화면
Week 9-10: 예약 기능
Week 11-12: 리뷰 기능
```

### 이 가이드에서 배울 내용

- [x] 개발 도구 설치 및 설정
- [x] React Native 기본 개념
- [x] 첫 번째 앱 만들기
- [x] 화면 디자인 기초
- [x] 데이터베이스 연결

---

## 개발 환경 설정 (Day 1-2)

### Step 1: Node.js 설치 (10분)

**Node.js란?** JavaScript를 실행할 수 있게 해주는 프로그램입니다.

#### Windows 사용자

1. https://nodejs.org 접속
2. "LTS" 버전 다운로드 (왼쪽 큰 버튼)
3. 다운로드한 파일 실행
4. "Next" 계속 클릭하여 설치
5. 설치 완료 후 재부팅

#### macOS 사용자

```bash
# Terminal 앱 열기 (Spotlight에서 "terminal" 검색)

# Homebrew 설치 (없는 경우)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 설치
brew install node
```

#### 설치 확인

```bash
# 터미널(Windows는 PowerShell)을 열고 입력:
node --version
# 출력 예: v18.19.0

npm --version
# 출력 예: 10.2.3
```

✅ 버전 번호가 나오면 성공!

---

### Step 2: Git 설치 (10분)

**Git이란?** 코드 변경 사항을 저장하고 관리하는 도구입니다.

#### Windows

1. https://git-scm.com/download/win 접속
2. 다운로드 후 설치
3. 모든 옵션은 기본값으로 설정

#### macOS

```bash
# Terminal에서
brew install git
```

#### 설치 확인

```bash
git --version
# 출력 예: git version 2.39.0
```

---

### Step 3: Visual Studio Code 설치 (10분)

**VS Code란?** 코드를 작성하는 에디터입니다 (메모장의 고급 버전).

1. https://code.visualstudio.com 접속
2. 다운로드 후 설치
3. VS Code 실행

#### 필수 확장 프로그램 설치

VS Code 왼쪽 메뉴에서 Extensions (블록 아이콘) 클릭 후 검색하여 설치:

1. **ESLint** - 코드 오류 찾기
2. **Prettier** - 코드 자동 정리
3. **React Native Tools** - React Native 개발 도구
4. **Korean Language Pack** - 한글 인터페이스 (선택)

---

### Step 4: Expo CLI 설치 (5분)

**Expo란?** React Native 앱을 쉽게 만들 수 있게 해주는 도구입니다.

```bash
# 터미널에서
npm install -g expo-cli eas-cli

# 설치 확인
expo --version
eas --version
```

---

### Step 5: 스마트폰에 Expo Go 설치 (5분)

앱을 테스트하려면 스마트폰에 Expo Go 앱이 필요합니다.

- **iOS**: App Store에서 "Expo Go" 검색 후 설치
- **Android**: Play Store에서 "Expo Go" 검색 후 설치

✅ **Day 1-2 완료!** 모든 도구가 설치되었습니다.

---

## Hello World 앱 만들기 (Day 3-4)

### Step 1: 첫 프로젝트 생성 (10분)

```bash
# 1. 프로젝트를 저장할 폴더로 이동
cd Desktop  # 또는 원하는 위치

# 2. Expo 프로젝트 생성 (약 2-3분 소요)
npx create-expo-app my-first-app

# 3. 프로젝트 폴더로 이동
cd my-first-app

# 4. VS Code로 프로젝트 열기
code .
```

**폴더 구조 설명:**
```
my-first-app/
├── App.js          ← 메인 코드 파일 (여기서 작업)
├── app.json        ← 앱 설정 파일
├── package.json    ← 설치된 패키지 목록
└── node_modules/   ← 라이브러리 파일들 (건드리지 마세요!)
```

---

### Step 2: 앱 실행하기 (5분)

```bash
# 터미널에서 (VS Code 내부 터미널 사용 가능)
npm start
```

**화면에 QR 코드가 나타납니다!**

#### 스마트폰으로 확인

1. **iOS**: 카메라 앱으로 QR 코드 스캔
2. **Android**: Expo Go 앱에서 "Scan QR Code" 탭

**스마트폰에 앱이 실행됩니다!** 🎉

---

### Step 3: 첫 번째 코드 수정 (10분)

**VS Code에서 `App.js` 파일을 열어보세요.**

기존 코드:
```javascript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**코드 설명:**
- `View`: 박스 같은 컨테이너
- `Text`: 텍스트를 표시
- `styles`: 디자인 (색상, 크기 등)

#### 실습: 텍스트 바꾸기

`App.js`를 다음과 같이 수정:

```javascript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>안녕하세요!</Text>
      <Text style={styles.subtitle}>재고 할인 플랫폼</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
});
```

**저장하면 스마트폰에서 자동으로 업데이트됩니다!**

---

### Step 4: 버튼 추가하기 (15분)

버튼을 눌렀을 때 텍스트가 바뀌도록 만들어봅시다.

```javascript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react'; // ← 추가!

export default function App() {
  // 상태(state) 만들기 - 버튼 클릭 횟수 저장
  const [count, setCount] = useState(0);

  // 버튼 클릭 함수
  const handlePress = () => {
    setCount(count + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>안녕하세요!</Text>
      <Text style={styles.subtitle}>재고 할인 플랫폼</Text>

      {/* 버튼 추가 */}
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>클릭하세요!</Text>
      </TouchableOpacity>

      {/* 클릭 횟수 표시 */}
      <Text style={styles.countText}>클릭 횟수: {count}</Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: 16,
    color: '#333',
    marginTop: 20,
  },
});
```

**버튼을 누를 때마다 숫자가 올라갑니다!**

**개념 설명:**
- `useState`: 값을 저장하고 변경할 수 있게 해줌
- `onPress`: 버튼 클릭 이벤트
- `{count}`: JavaScript 변수를 화면에 표시

✅ **Day 3-4 완료!** 첫 번째 인터랙티브 앱을 만들었습니다!

---

## 첫 번째 기능: 로그인 화면 (Day 5-7)

이제 실제 프로젝트를 시작합니다!

### Step 1: 실제 프로젝트 생성 (10분)

```bash
# 1. 프로젝트 폴더로 돌아가기
cd ..

# 2. 실제 프로젝트 생성
npx create-expo-app discount-marketplace --template expo-template-blank-typescript

# 3. 프로젝트 열기
cd discount-marketplace
code .
```

**TypeScript를 사용하는 이유:**
- 코드 오류를 미리 찾아줌
- 자동 완성이 더 잘 됨
- 큰 프로젝트에 유리

---

### Step 2: 폴더 구조 만들기 (10분)

VS Code 왼쪽 파일 탐색기에서 다음 폴더들을 만들어주세요:

```
discount-marketplace/
├── src/
│   ├── screens/        ← 화면 파일들
│   ├── components/     ← 재사용 컴포넌트
│   ├── lib/           ← 라이브러리 설정
│   └── types/         ← TypeScript 타입
├── assets/            ← 이미지 등
├── App.tsx           ← 메인 파일
└── package.json
```

**폴더 만드는 법:**
1. VS Code 왼쪽 파일 탐색기에서 "New Folder" 아이콘 클릭
2. 폴더 이름 입력
3. Enter

---

### Step 3: 첫 화면 파일 만들기 (20분)

#### 1. 로그인 화면 파일 생성

`src/screens/LoginScreen.tsx` 파일 생성:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function LoginScreen() {
  // 이메일과 비밀번호 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 로그인 버튼 클릭
  const handleLogin = () => {
    console.log('로그인 시도:', email);
    // TODO: 나중에 실제 로그인 기능 추가
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 제목 */}
      <View style={styles.header}>
        <Text style={styles.title}>재고 할인</Text>
        <Text style={styles.subtitle}>플랫폼</Text>
      </View>

      {/* 입력 폼 */}
      <View style={styles.form}>
        {/* 이메일 입력 */}
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* 비밀번호 입력 */}
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* 로그인 버튼 */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>

        {/* 회원가입 링크 */}
        <TouchableOpacity style={styles.signupLink}>
          <Text style={styles.signupText}>계정이 없으신가요? 회원가입</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 24,
    color: '#666',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
```

#### 2. App.tsx 수정

프로젝트 루트의 `App.tsx`를 수정:

```typescript
import React from 'react';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  return <LoginScreen />;
}
```

#### 3. 실행하기

```bash
npm start
```

**스마트폰에서 확인하면 로그인 화면이 나타납니다!** 🎉

---

### Step 4: 화면 설명 (이해하기)

방금 만든 코드를 분석해봅시다:

#### 1. useState (상태 관리)

```typescript
const [email, setEmail] = useState('');
```

**의미:**
- `email`: 현재 값 (읽기)
- `setEmail`: 값을 변경하는 함수 (쓰기)
- `useState('')`: 초기값은 빈 문자열

**왜 필요한가?**
- 사용자가 입력한 텍스트를 저장하기 위해

#### 2. TextInput (입력 필드)

```typescript
<TextInput
  value={email}           // 현재 값
  onChangeText={setEmail} // 변경될 때 실행
  placeholder="이메일"    // 안내 텍스트
/>
```

**동작 원리:**
1. 사용자가 입력
2. `onChangeText`가 `setEmail` 호출
3. `email` 상태 업데이트
4. 화면 다시 그리기

#### 3. StyleSheet (스타일)

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,              // 전체 화면 차지
    backgroundColor: '#fff',
    padding: 20,          // 안쪽 여백
  },
});
```

**CSS와 비슷하지만 다른 점:**
- `backgroundColor` (camelCase)
- 숫자는 픽셀 단위

✅ **Day 5-7 완료!** 로그인 화면을 만들었습니다!

---

## Supabase 연결 (Day 8-10)

이제 실제로 회원가입/로그인이 작동하도록 만들어봅시다!

### Step 1: Supabase 프로젝트 생성 (15분)

#### 1. Supabase 가입

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 가입

#### 2. 새 프로젝트 생성

1. "New Project" 클릭
2. 정보 입력:
   - **Project name**: discount-marketplace
   - **Database Password**: 안전한 비밀번호 (메모해두세요!)
   - **Region**: Northeast Asia (Seoul)
3. "Create new project" 클릭 (약 2분 소요)

#### 3. API Keys 복사

프로젝트 생성 후:
1. 왼쪽 메뉴 → "Settings" → "API"
2. 다음 정보 복사:
   - **Project URL**
   - **anon public** key

---

### Step 2: 환경 변수 설정 (10분)

#### 1. .env 파일 생성

프로젝트 루트에 `.env` 파일 생성:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**주의:** 위의 값들을 실제 값으로 교체하세요!

#### 2. .gitignore 확인

`.gitignore` 파일에 다음이 있는지 확인:

```
.env
.env.local
```

**이유:** API 키를 GitHub에 올리면 안 됩니다!

---

### Step 3: Supabase 패키지 설치 (5분)

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

**각 패키지 설명:**
- `@supabase/supabase-js`: Supabase 연결
- `async-storage`: 로그인 정보 저장
- `url-polyfill`: URL 처리 (React Native 호환)

---

### Step 4: Supabase 클라이언트 설정 (10분)

`src/lib/supabase.ts` 파일 생성:

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 환경 변수에서 가져오기
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**코드 설명:**
- `createClient`: Supabase 연결
- `storage: AsyncStorage`: 로그인 정보를 폰에 저장
- `autoRefreshToken`: 자동으로 로그인 유지

---

### Step 5: 회원가입 기능 추가 (30분)

#### 1. 회원가입 화면 생성

`src/screens/SignupScreen.tsx` 파일 생성:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  // 회원가입 함수
  const handleSignup = async () => {
    // 입력 검증
    if (!email || !password || !nickname) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. 성공 메시지
      Alert.alert(
        '가입 완료!',
        '이메일을 확인하여 인증을 완료해주세요.',
        [{ text: '확인' }]
      );

      console.log('회원가입 성공:', authData);
    } catch (error: any) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>회원가입</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="닉네임"
          value={nickname}
          onChangeText={setNickname}
        />

        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '처리 중...' : '가입하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

#### 2. App.tsx 임시 수정 (테스트용)

```typescript
import React from 'react';
import SignupScreen from './src/screens/SignupScreen';

export default function App() {
  return <SignupScreen />;
}
```

#### 3. 테스트하기

```bash
npm start
```

**회원가입을 시도해보세요!**

1. 닉네임, 이메일, 비밀번호 입력
2. "가입하기" 클릭
3. "이메일을 확인하여 인증을 완료해주세요" 메시지 확인
4. 이메일함에서 인증 링크 클릭

**Supabase 대시보드 확인:**
1. Supabase → Authentication → Users
2. 방금 가입한 사용자가 보입니다!

✅ **축하합니다!** 실제로 작동하는 회원가입 기능을 만들었습니다! 🎉

---

### Step 6: 로그인 기능 추가 (20분)

`src/screens/LoginScreen.tsx` 수정:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 로그인 함수
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert('로그인 성공!', `환영합니다, ${email}님!`);
      console.log('로그인 데이터:', data);
    } catch (error: any) {
      Alert.alert('로그인 실패', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>재고 할인</Text>
        <Text style={styles.subtitle}>플랫폼</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '로그인 중...' : '로그인'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 24,
    color: '#666',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

**테스트:**
1. App.tsx를 LoginScreen으로 변경
2. 방금 가입한 이메일/비밀번호로 로그인
3. "로그인 성공!" 메시지 확인

✅ **Day 8-10 완료!** 실제 데이터베이스와 연결했습니다!

---

## 다음 단계

### 지금까지 배운 것

- ✅ 개발 환경 설정
- ✅ React Native 기본 개념
- ✅ 화면 만들기 (UI)
- ✅ 사용자 입력 처리
- ✅ Supabase 연결
- ✅ 회원가입/로그인 기능

### 다음에 배울 것

#### Week 3: 화면 네비게이션

로그인 후 다른 화면으로 이동하는 방법을 배웁니다.

```
[로그인 화면] → (로그인 성공) → [홈 화면]
                                    ├─ [업체 리스트]
                                    ├─ [예약 내역]
                                    └─ [마이페이지]
```

#### Week 4: 업체 리스트 화면

```typescript
// 배울 내용:
- 데이터 가져오기 (Supabase에서)
- 리스트 표시하기
- 무한 스크롤
- 로딩 상태 처리
```

#### Week 5-6: 예약 기능

```typescript
// 배울 내용:
- 상품 선택
- 수량 입력
- 예약 생성
- 실시간 재고 차감
```

---

## 🆘 막힐 때 해결 방법

### 1. 에러 메시지 읽기

```bash
# 에러 예시:
Error: Cannot find module '@supabase/supabase-js'

# 해결:
npm install @supabase/supabase-js
```

**팁:** 에러 메시지를 Google에 검색하면 대부분 해결 방법이 나옵니다!

### 2. 자주 발생하는 문제

#### Metro bundler 오류

```bash
# 해결:
npm start -- --reset-cache
```

#### 앱이 로딩되지 않음

1. 컴퓨터와 스마트폰이 같은 Wi-Fi에 연결되어 있는지 확인
2. Expo Go 앱 다시 시작
3. 터미널에서 `npm start` 다시 실행

#### TypeScript 오류

```typescript
// 빨간 밑줄이 나타나면:
// 1. 파일 저장 (Cmd/Ctrl + S)
// 2. VS Code 재시작
```

### 3. 학습 리소스

#### 무료 강의
- **React Native 공식 문서**: https://reactnative.dev/docs/getting-started
- **Expo 공식 문서**: https://docs.expo.dev/
- **Supabase 튜토리얼**: https://supabase.com/docs/guides/getting-started/tutorials

#### 커뮤니티
- **React Native 한국 사용자 그룹** (Facebook)
- **Stack Overflow**: 영어로 질문하면 답변이 빠름

---

## 📝 체크리스트

### Week 1-2 완료 체크

- [ ] Node.js 설치 완료
- [ ] Git 설치 완료
- [ ] VS Code 설치 및 확장 프로그램 설치
- [ ] Expo CLI 설치
- [ ] 스마트폰에 Expo Go 설치
- [ ] Hello World 앱 실행 성공
- [ ] 버튼 클릭 카운터 만들기 성공

### Week 3 완료 체크

- [ ] 실제 프로젝트 생성
- [ ] 로그인 화면 UI 완성
- [ ] 회원가입 화면 UI 완성
- [ ] Supabase 프로젝트 생성
- [ ] Supabase 연결 성공
- [ ] 회원가입 기능 작동
- [ ] 로그인 기능 작동

---

## 💪 다음 실습 가이드

다음 단계가 준비되면 **`docs/01-navigation-guide.md`** 파일을 생성하겠습니다.

내용:
1. React Navigation 설치
2. 로그인/홈 화면 전환
3. 탭 네비게이션 (홈, 예약, 프로필)
4. 스택 네비게이션 (화면 이동)

---

**축하합니다! 첫 단계를 완료했습니다! 🎉**

다음 가이드가 필요하면 언제든 말씀해주세요!
