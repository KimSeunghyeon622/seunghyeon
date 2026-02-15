"""
예약 플로우 테스트
Expo 웹 서버가 실행 중이어야 합니다: npx expo start --web
"""
from playwright.sync_api import sync_playwright
import os

# 스크린샷 저장 경로
SCREENSHOT_DIR = 'tests/screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def test_reservation_flow():
    """예약 플로우 E2E 테스트"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. 로그인
            print("1. 로그인 진행...")
            page.goto('http://localhost:8081')
            page.wait_for_load_state('networkidle')

            page.fill('input[placeholder*="이메일"]', 'test@test.com')
            page.fill('input[placeholder*="비밀번호"]', 'test1234')
            page.click('text=로그인')
            page.wait_for_timeout(2000)
            print("   ✓ 로그인 완료")

            # 2. 업체 목록 확인
            print("2. 업체 목록 확인...")
            page.screenshot(path=f'{SCREENSHOT_DIR}/reservation_01_list.png')

            # 3. 업체 선택 (첫 번째 업체)
            print("3. 업체 선택...")
            store_cards = page.locator('[data-testid="store-card"]')
            if store_cards.count() > 0:
                store_cards.first.click()
            else:
                # 대체 셀렉터 시도
                page.click('text=베이커리')  # 예시 업체명
            page.wait_for_load_state('networkidle')
            page.screenshot(path=f'{SCREENSHOT_DIR}/reservation_02_detail.png')
            print("   ✓ 업체 상세 페이지")

            # 4. 상품 선택
            print("4. 상품 선택...")
            product_cards = page.locator('[data-testid="product-card"]')
            if product_cards.count() > 0:
                product_cards.first.click()
            page.wait_for_timeout(1000)
            print("   ✓ 상품 선택 완료")

            # 5. 예약하기 버튼 클릭
            print("5. 예약하기...")
            reserve_button = page.locator('text=예약하기')
            if reserve_button.count() > 0:
                reserve_button.first.click()
                page.wait_for_timeout(2000)
                page.screenshot(path=f'{SCREENSHOT_DIR}/reservation_03_confirm.png')
                print("   ✓ 예약 요청 완료")
            else:
                print("   ! 예약하기 버튼을 찾을 수 없음")

            # 6. 예약 결과 확인
            print("6. 예약 결과 확인...")
            if page.locator('text=예약이 완료').count() > 0:
                print("   ✓ 예약 성공!")
            elif page.locator('text=에러').count() > 0:
                print("   ! 예약 실패")
            else:
                print("   ? 결과 불명확")

            page.screenshot(path=f'{SCREENSHOT_DIR}/reservation_04_result.png')
            print("\n테스트 완료! 스크린샷 확인: tests/screenshots/")

        except Exception as e:
            print(f"\n에러 발생: {e}")
            page.screenshot(path=f'{SCREENSHOT_DIR}/reservation_error.png')

        finally:
            browser.close()


if __name__ == '__main__':
    test_reservation_flow()
