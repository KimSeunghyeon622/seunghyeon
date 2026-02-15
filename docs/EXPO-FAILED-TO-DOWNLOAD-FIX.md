# "Failed to download remote update" 오류 해결 가이드

## 오류 메시지

```
Uncaught Error: java.io.IOException: Failed to download remote update
09:05:36 Fatal Error
```

## 원인

이 오류는 Expo Go가 개발 서버에서 JavaScript 번들을 다운로드하는 데 실패했다는 의미입니다. 주로 네트워크 연결 문제로 발생합니다.

---

## 해결 방법 (우선순위 순)

### 1. 터널 모드로 실행 (가장 효과적) ⭐⭐⭐

**이전에 성공했던 방법입니다.**

```powershell
cd app
npx expo start --tunnel --clear
```

**장점**:
- 네트워크 제약 없음
- 방화벽 문제 우회
- 안정적인 연결

**단점**:
- 초기 연결이 약간 느릴 수 있음 (10-30초)
- ngrok 서버 의존

---

### 2. Expo Go 앱 완전 재시작 ⭐⭐

**중요**: 단순히 앱을 닫는 것이 아니라 완전히 종료해야 합니다.

#### Android
1. 최근 앱 목록에서 Expo Go 스와이프하여 완전 종료
2. 또는 설정 → 앱 → Expo Go → 강제 종료
3. 앱 다시 열기
4. QR 코드 스캔

#### iOS
1. 앱 스와이프하여 완전 종료
2. 앱 다시 열기
3. QR 코드 스캔

---

### 3. 개발 서버 완전 재시작

```powershell
# 1. 기존 서버 완전 종료 (Ctrl+C)
# 2. 모든 Node.js 프로세스 확인 및 종료 (필요시)
# 3. 캐시 정리 후 재시작
cd app
npx expo start --tunnel --clear
```

---

### 4. 네트워크 환경 확인

#### 같은 Wi-Fi 네트워크 확인
- PC와 모바일 기기가 같은 Wi-Fi에 연결되어 있는지 확인
- 다른 네트워크라면 터널 모드 사용

#### 방화벽 확인
- Windows 방화벽이 포트 8081을 차단하지 않는지 확인
- 방화벽 설정에서 Node.js 허용 확인

#### VPN 확인
- VPN 사용 중이라면 일시적으로 끄고 시도
- VPN이 네트워크 연결을 방해할 수 있음

---

### 5. Expo Go 앱 재설치 (최후의 수단)

앱이 손상되었을 수 있습니다.

1. Expo Go 앱 삭제
2. 앱 스토어에서 다시 설치
3. 터널 모드로 서버 실행
4. QR 코드 스캔

---

### 6. 대안: 웹에서 테스트

터널/LAN 모드가 모두 실패하는 경우:

```powershell
cd app
npx expo start --web
```

웹에서 정상 작동하면 네트워크/Expo Go 연결 문제일 가능성이 높습니다.

---

## 상황별 권장 방법

### 같은 Wi-Fi 네트워크
→ **터널 모드 사용** (`npx expo start --tunnel`)
- LAN 모드가 실패해도 터널 모드는 작동할 수 있음
- 이전에 성공했던 방법

### 다른 네트워크 또는 방화벽 문제
→ **터널 모드 사용** (`npx expo start --tunnel`)
- 네트워크 제약 없음
- 가장 안정적

### 터널 모드도 실패하는 경우
1. Expo Go 앱 완전 재시작
2. 개발 서버 완전 재시작 (`--clear` 옵션)
3. 잠시 후 재시도 (5-10분)
4. Expo CLI 업데이트

---

## 체크리스트

문제 해결 시 다음을 순서대로 확인하세요:

- [ ] 터널 모드로 실행 (`npx expo start --tunnel --clear`)
- [ ] Expo Go 앱 완전 재시작
- [ ] 개발 서버 완전 재시작
- [ ] 같은 Wi-Fi 네트워크 확인 (LAN 모드 사용 시)
- [ ] 방화벽 설정 확인
- [ ] VPN 끄고 시도
- [ ] Expo CLI 업데이트
- [ ] Expo Go 앱 재설치 (최후의 수단)

---

## 예방 방법

1. **터널 모드를 기본으로 사용**: `package.json`에서 `"start": "expo start --tunnel"` 설정
2. **정기적으로 캐시 정리**: `--clear` 옵션 사용
3. **안정적인 네트워크 환경**: 가능하면 안정적인 Wi-Fi 사용

---

## 요약

**가장 빠른 해결책**: 터널 모드 사용 (`npx expo start --tunnel --clear`)

**지속적인 문제**: Expo Go 앱 완전 재시작 + 개발 서버 재시작

**최후의 수단**: Expo Go 앱 재설치
