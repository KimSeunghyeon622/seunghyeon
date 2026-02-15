# Kakao Map Debug Runbook

## Current implementation
- Map entry: `app/src/screens/StoreListHome.tsx` (`useNativeMap`)
- Wrapper: `app/src/components/MapPlaceholder.tsx`
- Active renderer: `app/src/components/KakaoMapWebView.tsx`
- Legacy fallback (not active): `app/src/components/KakaoStaticMap.tsx`

## Why map can stay gray
- JavaScript SDK key is missing in runtime env.
- Kakao app has Maps service disabled.
- Kakao Web platform domain does not include `EXPO_PUBLIC_KAKAO_WEB_BASE_URL`.
- JS key belongs to a different Kakao app than the one configured for map service.

## Required env vars
- `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY`
- `EXPO_PUBLIC_KAKAO_WEB_BASE_URL` (default: `http://localhost`)

## Kakao Developers console checklist
1. Open the Kakao app that owns `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY`.
2. Ensure Maps service is enabled for that app.
3. Add Web platform domain exactly matching `EXPO_PUBLIC_KAKAO_WEB_BASE_URL`.
4. Keep Android/iOS platform entries for:
   - Android package: `com.saveit.app`
   - iOS bundle id: `com.bbcareer.saveit`

## Build/test checklist
1. `npx tsc --noEmit`
2. Build new dev/test app including `react-native-webview`.
3. Open map screen and verify no native error card.
4. If error card appears, use shown message (`key/service/domain`) as direct action item.

## Notes
- The legacy Static Map URL in `KakaoStaticMap.tsx` currently returns HTTP 404 in this environment.
- Prefer WebView + JS SDK path while Kakao native module/Fabric integration is unresolved.
