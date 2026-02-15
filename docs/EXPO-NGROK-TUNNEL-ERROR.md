# Expo ngrok 터널 연결 오류 해결 가이드

## 오류 메시지

```
CommandError: ngrok tunnel took too long to connect.
```

## 원인

1. **ngrok 서비스 일시적 문제**: Expo의 ngrok 서버가 과부하 상태이거나 일시적으로 다운
2. **네트워크 연결 문제**: 인터넷 연결이 불안정하거나 느림
3. **방화벽/프록시**: 회사/학교 네트워크의 방화벽이나 프록시가 ngrok 연결을 차단
4. **VPN**: VPN 사용 시 ngrok 연결이 느려지거나 실패할 수 있음
5. **Expo CLI 버전**: 오래된 Expo CLI 버전의 버그

---

## 해결 방법 (우선순위 순)

### 1. LAN 모드로 시도 (가장 빠른 해결) ⭐⭐⭐

**조건**: PC와 모바일 기기가 같은 Wi-Fi에 연결되어 있어야 합니다.

```powershell
cd app
npx expo start --lan
```

**장점**:
- 터널 설정 불필요 (즉시 시작)
- 더 빠른 연결 속도
- 안정적

**단점**:
- 같은 Wi-Fi 네트워크 필요
- 방화벽 문제가 있을 수 있음

---

### 2. 캐시 정리 후 터널 모드 재시도 ⭐⭐

```powershell
cd app
# 기존 서버 중지 (Ctrl+C)
npx expo start --tunnel --clear
```

`--clear` 옵션은 Metro bundler 캐시를 정리하여 깨끗한 상태로 시작합니다.

---

### 3. Expo CLI 업데이트

오래된 Expo CLI 버전의 버그일 수 있습니다.

```powershell
# Expo CLI 업데이트
npm install -g @expo/cli@latest

# 또는
npm install -g expo-cli@latest
```

업데이트 후 다시 시도:

```powershell
cd app
npx expo start --tunnel
```

---

### 4. 네트워크 환경 확인

#### 인터넷 연결 확인
```powershell
# 인터넷 연결 테스트
ping google.com
```

#### 방화벽/프록시 확인
- 회사/학교 네트워크라면 IT 관리자에게 문의
- 방화벽이 ngrok 연결을 차단하는지 확인

#### VPN 확인
- VPN 사용 중이라면 일시적으로 끄고 시도
- VPN이 ngrok 연결을 방해할 수 있음

---

### 5. 잠시 후 재시도

ngrok 서비스가 일시적으로 과부하 상태일 수 있습니다.

**권장**: 5-10분 후 다시 시도해보세요.

---

### 6. 대안: 웹에서 테스트

터널 연결 없이 웹에서 테스트할 수 있습니다.

```powershell
cd app
npx expo start --web
```

웹에서 정상 작동하면 네트워크/터널 문제일 가능성이 높습니다.

---

## package.json 설정 권장사항

터널 모드가 자주 실패하는 경우, LAN 모드를 기본으로 사용하는 것을 권장합니다:

```json
{
  "scripts": {
    "start": "expo start --lan",
    "start:tunnel": "expo start --tunnel",
    "start:web": "expo start --web"
  }
}
```

이렇게 하면:
- `npm start` → LAN 모드 (빠르고 안정적)
- `npm run start:tunnel` → 터널 모드 (필요 시)

---

## 상황별 권장 방법

### 같은 Wi-Fi 네트워크에 있는 경우
→ **LAN 모드 사용** (`npx expo start --lan`)
- 가장 빠르고 안정적
- 터널 설정 불필요

### 다른 네트워크이거나 방화벽 문제가 있는 경우
→ **터널 모드 사용** (`npx expo start --tunnel`)
- 네트워크 제약 없음
- ngrok 연결 실패 시 위의 해결 방법 시도

### 터널 모드가 계속 실패하는 경우
→ **LAN 모드 + USB 디버깅** (Android)
- Android 기기: USB로 연결 후 `adb reverse tcp:8081 tcp:8081`
- iOS 기기: 같은 Wi-Fi 필요

---

## 추가 문제 해결

### 문제: LAN 모드도 작동하지 않음

**해결**:
1. PC와 모바일이 같은 Wi-Fi에 연결되어 있는지 확인
2. 방화벽이 포트 8081을 차단하지 않는지 확인
3. Windows 방화벽 설정에서 Node.js 허용 확인

### 문제: 터널 모드가 계속 실패함

**해결**:
1. Expo CLI 최신 버전으로 업데이트
2. 다른 네트워크에서 시도 (예: 모바일 핫스팟)
3. Expo 계정 로그인 확인 (`npx expo login`)

---

## 예방 방법

1. **LAN 모드를 기본으로 사용**: 같은 네트워크에서 개발 시
2. **터널 모드는 필요할 때만**: 네트워크 문제가 있을 때만 사용
3. **정기적으로 Expo CLI 업데이트**: 최신 버그 수정 적용

---

## 요약

**가장 빠른 해결책**: LAN 모드 사용 (`npx expo start --lan`)

**터널 모드가 필요한 경우**: 위의 해결 방법들을 순서대로 시도

**지속적인 문제**: Expo CLI 업데이트 또는 네트워크 환경 확인
