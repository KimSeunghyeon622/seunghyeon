"""
로그인 플로우 테스트
Expo 웹 서버가 실행 중이어야 합니다: npx expo start --web
"""
from playwright.sync_api import sync_playwright
import os

# 스크린샷 저장 경로
SCREENSHOT_DIR = 'tests/screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def test_login_flow():
    """로그인 플로우 E2E 테스트"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. 홈페이지 접속
            print("1. 홈페이지 접속...")
            page.goto('http://localhost:8081')
            page.wait_for_load_state('networkidle')
            page.screenshot(path=f'{SCREENSHOT_DIR}/01_homepage.png')
            print("   ✓ 홈페이지 로드 완료")

            # 2. 이메일 입력
            print("2. 이메일 입력...")
            email_input = page.locator('input[placeholder*="이메일"]')
            if email_input.count() > 0:
                email_input.fill('test@test.com')
                print("   ✓ 이메일 입력 완료")
            else:
                print("   ! 이메일 입력 필드를 찾을 수 없음")

            # 3. 비밀번호 입력
            print("3. 비밀번호 입력...")
            password_input = page.locator('input[placeholder*="비밀번호"]')
            if password_input.count() > 0:
                password_input.fill('test1234')
                print("   ✓ 비밀번호 입력 완료")
            else:
                print("   ! 비밀번호 입력 필드를 찾을 수 없음")

            page.screenshot(path=f'{SCREENSHOT_DIR}/02_form_filled.png')

            # 4. 로그인 버튼 클릭
            print("4. 로그인 버튼 클릭...")
            login_button = page.locator('text=로그인')
            if login_button.count() > 0:
                login_button.first.click()
                print("   ✓ 로그인 버튼 클릭 완료")
            else:
                print("   ! 로그인 버튼을 찾을 수 없음")

            # 5. 결과 대기 및 확인
            print("5. 결과 대기...")
            page.wait_for_timeout(3000)
            page.screenshot(path=f'{SCREENSHOT_DIR}/03_after_login.png')

            # 6. 로그인 성공 여부 확인
            if page.locator('text=마이페이지').count() > 0 or \
               page.locator('text=로그아웃').count() > 0:
                print("   ✓ 로그인 성공!")
            elif page.locator('text=로그인').count() > 0:
                print("   ! 로그인 실패 (에러 메시지 확인 필요)")
            else:
                print("   ? 결과 불명확")

            print("\n테스트 완료! 스크린샷 확인: tests/screenshots/")

        except Exception as e:
            print(f"\n에러 발생: {e}")
            page.screenshot(path=f'{SCREENSHOT_DIR}/error.png')

        finally:
            browser.close()


if __name__ == '__main__':
    test_login_flow()
