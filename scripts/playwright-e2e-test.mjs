/**
 * Playwright E2E 테스트 (Node.js)
 * 실행: npx playwright test scripts/playwright-e2e-test.mjs
 * 또는: node --experimental-vm-modules scripts/playwright-e2e-test.mjs
 *
 * 사전 조건: cd app && npx expo start --web (8081)
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:8081';
const SCREENSHOT_DIR = join(process.cwd(), 'tests', 'screenshots');

async function main() {
  if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('1. 홈페이지 접속...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: join(SCREENSHOT_DIR, '01_homepage.png') });
    console.log('   ✓ 홈페이지 로드 완료');

    console.log('2. 페이지 제목/내용 확인...');
    const title = await page.title();
    const hasRoot = (await page.locator('#root, [data-testid="root"], body').count()) > 0;
    console.log(`   ✓ title: ${title || '(없음)'}, root 렌더: ${hasRoot}`);

    console.log('3. 로그인 관련 요소 탐색...');
    const email = page.locator('input[type="email"], input[placeholder*="이메일"], input[name*="email"]');
    const password = page.locator('input[type="password"], input[placeholder*="비밀번호"]');
    const loginBtn = page.locator('button:has-text("로그인"), a:has-text("로그인"), [role="button"]:has-text("로그인")');
    console.log(`   ✓ 이메일 필드: ${await email.count()}, 비밀번호: ${await password.count()}, 로그인 버튼: ${await loginBtn.count()}`);

    if ((await email.count()) > 0 && (await password.count()) > 0) {
      await email.first().fill('test@test.com');
      await password.first().fill('test1234');
      await page.screenshot({ path: join(SCREENSHOT_DIR, '02_form_filled.png') });
      if ((await loginBtn.count()) > 0) {
        await loginBtn.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: join(SCREENSHOT_DIR, '03_after_login.png') });
        console.log('   ✓ 로그인 버튼 클릭 및 스크린샷 저장');
      }
    }

    console.log('\n✅ Playwright E2E 테스트 완료. 스크린샷: tests/screenshots/');
  } catch (e) {
    console.error('❌ 에러:', e.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'error.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
