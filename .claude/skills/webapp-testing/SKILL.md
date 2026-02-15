---
name: webapp-testing
description: Playwright를 사용해 웹 앱을 테스트합니다. 다음에 사용: (1) Expo 웹 빌드 테스트, (2) E2E 사용자 플로우 테스트, (3) UI 검증, (4) 스크린샷 캡처, (5) 회귀 테스트, (6) 자동화된 품질 검증
---

# Web Application Testing 스킬

Playwright를 사용하여 웹 애플리케이션을 테스트합니다. Expo 웹 빌드를 통해 React Native 앱도 테스트할 수 있습니다.

## 사전 요구사항

```bash
# Playwright 설치
pip install playwright
playwright install chromium

# Expo 웹 서버 시작
cd app && npx expo start --web
```

## 테스트 의사결정 트리

```
요청 → 서버 실행 중인가?
├─ No → npx expo start --web
└─ Yes → 정찰 후 행동:
   1. 페이지 이동 + networkidle 대기
   2. 스크린샷/DOM 검사
   3. 셀렉터 파악
   4. 액션 실행
```

## 기본 테스트 구조

```python
from playwright.sync_api import sync_playwright

def test_기능명():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. 페이지 이동
        page.goto('http://localhost:8081')
        page.wait_for_load_state('networkidle')  # 중요!

        # 2. 액션 수행
        page.fill('input[placeholder*="이메일"]', 'test@test.com')
        page.click('text=로그인')

        # 3. 검증
        page.wait_for_timeout(2000)
        page.screenshot(path='screenshots/result.png')

        browser.close()
```

## 핵심 셀렉터

```python
# 텍스트로 찾기
page.click('text=로그인')
page.locator('text=예약하기').click()

# placeholder로 찾기
page.fill('input[placeholder*="이메일"]', 'value')

# role로 찾기
page.click('role=button[name="제출"]')

# CSS 셀렉터
page.click('.btn-primary')
page.fill('#email-input', 'value')
```

## 흔한 실수

```python
# ❌ 잘못됨: JS 실행 전 DOM 검사
page.goto('http://localhost:8081')
content = page.content()  # 빈 DOM!

# ✅ 올바름: networkidle 후 검사
page.goto('http://localhost:8081')
page.wait_for_load_state('networkidle')
content = page.content()  # 완전한 DOM
```

## 베스트 프랙티스

1. **항상 `sync_playwright()` 사용**
2. **브라우저 종료 필수**: `browser.close()`
3. **networkidle 대기**: JS 렌더링 완료 대기
4. **스크린샷으로 디버깅**: 각 단계 캡처
5. **명확한 셀렉터**: `text=`, `role=`, CSS

## 테스트 스크립트

미리 작성된 테스트 스크립트는 [scripts/](scripts/) 폴더 참고:
- `test_login.py`: 로그인 플로우
- `test_reservation.py`: 예약 플로우

## 출력 위치

```
tests/
├── test_*.py
└── screenshots/
    ├── homepage.png
    └── after_login.png
```
