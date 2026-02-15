import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface KakaoMapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface KakaoMapWebViewProps {
  markers: KakaoMapMarker[];
  selectedId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelect?: (id: string) => void;
  onBackgroundPress?: () => void;
  onError?: (message: string) => void;
  style?: StyleProp<ViewStyle>;
  initialZoomLevel?: number;
}

const KAKAO_JS_APP_KEY =
  process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY ?? process.env.EXPO_PUBLIC_KAKAO_JS_KEY ?? '';
const KAKAO_WEB_BASE_URL = process.env.EXPO_PUBLIC_KAKAO_WEB_BASE_URL ?? 'http://localhost';

export default function KakaoMapWebView({
  markers,
  selectedId,
  userLocation,
  onSelect,
  onBackgroundPress,
  onError,
  style,
  initialZoomLevel = 5,
}: KakaoMapWebViewProps) {
  const errorReportedRef = useRef(false);
  const webViewRef = useRef<WebView>(null);

  const reportError = useCallback(
    (message: string) => {
      if (errorReportedRef.current) {
        return;
      }
      errorReportedRef.current = true;
      onError?.(message);
    },
    [onError]
  );

  const initialCenter = useMemo(() => {
    if (userLocation) {
      return { lat: userLocation.latitude, lng: userLocation.longitude };
    }

    if (markers.length === 0) {
      return { lat: 37.5665, lng: 126.978 };
    }

    const sumLat = markers.reduce((acc, m) => acc + m.latitude, 0);
    const sumLng = markers.reduce((acc, m) => acc + m.longitude, 0);
    return {
      lat: sumLat / markers.length,
      lng: sumLng / markers.length,
    };
  }, [markers, userLocation]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'markerClick') {
          onSelect?.(data.id);
          return;
        }
        if (data.type === 'mapClick') {
          onBackgroundPress?.();
          return;
        }
        if (data.type === 'error') {
          const message = typeof data.message === 'string' ? data.message : 'Unknown map error';
          reportError(message);
        }
      } catch {
        reportError('Failed to parse map message from WebView');
      }
    },
    [onSelect, onBackgroundPress, reportError]
  );

  const htmlContent = useMemo(() => {
    const markersJson = JSON.stringify(
      markers.map((m) => ({
        id: m.id,
        name: m.name,
        lat: m.latitude,
        lng: m.longitude,
      }))
    );
    const userLocationJson = userLocation
      ? JSON.stringify({ lat: userLocation.latitude, lng: userLocation.longitude })
      : 'null';

    const appKey = KAKAO_JS_APP_KEY;
    const appKeyPreview = appKey ? `${appKey.slice(0, 6)}...` : '(missing)';
    const escapedBaseUrl = KAKAO_WEB_BASE_URL.replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #e9edf3; }
    #loading {
      position: absolute;
      inset: 0;
      background: #e9edf3;
      color: #7a8699;
      font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    #loading.hidden { display: none; }
    .custom-marker {
      width: 26px;
      height: 26px;
      border-radius: 13px;
      border: 2px solid #00d563;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
    }
    .custom-marker.selected {
      background: #00d563;
      border-color: #00a84d;
    }
    .custom-marker::after {
      content: "●";
      color: #00d563;
      font-size: 9px;
      line-height: 1;
    }
    .custom-marker.selected::after {
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div id="loading">Loading map...</div>
  <div id="map"></div>
  <script>
    var mapInitialized = false;
    var map = null;
    var markers = ${markersJson};
    var selectedId = null;
    var userLocation = ${userLocationJson};
    var overlays = [];
    var userOverlay = null;
    var centerBeforeSelection = null;
    var errorSent = false;

    function sendMessage(type, data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, ...data }));
      }
    }

    function sendError(message) {
      if (errorSent) return;
      errorSent = true;
      var href = (window.location && window.location.href) ? window.location.href : 'unknown';
      sendMessage('error', { message: message + ' | href=' + href });
    }

    function hideLoading() {
      var loading = document.getElementById('loading');
      if (loading) loading.classList.add('hidden');
    }

    function clearOverlays() {
      overlays.forEach(function(overlay) { overlay.setMap(null); });
      overlays = [];
    }

    function renderUserLocation() {
      if (!mapInitialized) return;
      if (userOverlay) {
        userOverlay.setMap(null);
        userOverlay = null;
      }
      if (!userLocation) return;

      var content = document.createElement('div');
      content.style.width = '14px';
      content.style.height = '14px';
      content.style.borderRadius = '7px';
      content.style.background = '#1d4ed8';
      content.style.border = '2px solid #ffffff';
      content.style.boxShadow = '0 0 0 4px rgba(29, 78, 216, 0.2)';

      userOverlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
        content: content,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 20
      });
      userOverlay.setMap(map);
    }

    function renderMarkers() {
      clearOverlays();
      markers.forEach(function(markerData) {
        var position = new kakao.maps.LatLng(markerData.lat, markerData.lng);
        var isSelected = markerData.id === selectedId;
        var content = document.createElement('div');
        content.className = 'custom-marker' + (isSelected ? ' selected' : '');
        content.dataset.id = markerData.id;
        content.addEventListener('click', function(event) {
          event.stopPropagation();
          sendMessage('markerClick', { id: markerData.id });
        });
        var overlay = new kakao.maps.CustomOverlay({
          position: position,
          content: content,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: isSelected ? 10 : 1
        });
        overlay.setMap(map);
        overlays.push(overlay);
      });
    }

    function initMap() {
      if (mapInitialized) return;
      try {
        map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(${initialCenter.lat}, ${initialCenter.lng}),
          level: ${initialZoomLevel}
        });
        mapInitialized = true;
        kakao.maps.event.addListener(map, 'click', function() {
          sendMessage('mapClick', {});
        });
        renderMarkers();
        renderUserLocation();
        hideLoading();
      } catch (error) {
        sendError('Map initialization failed: ' + (error && error.message ? error.message : 'unknown'));
        hideLoading();
      }
    }

    window.updateSelectedMarker = function(newSelectedId) {
      var hadSelection = !!selectedId;
      var willSelect = !!newSelectedId;

      if (!hadSelection && willSelect && mapInitialized) {
        centerBeforeSelection = map.getCenter();
      }

      selectedId = newSelectedId;
      if (!mapInitialized) return;
      renderMarkers();
      if (selectedId) {
        var selectedMarker = markers.find(function(m) { return m.id === selectedId; });
        if (selectedMarker) {
          map.panTo(new kakao.maps.LatLng(selectedMarker.lat, selectedMarker.lng));
        }
        return;
      }

      if (hadSelection && centerBeforeSelection) {
        map.panTo(centerBeforeSelection);
        centerBeforeSelection = null;
      }
    };

    window.updateUserLocation = function(newUserLocation) {
      userLocation = newUserLocation;
      if (!mapInitialized) return;
      renderUserLocation();
    };

    var sdkTimer = setTimeout(function() {
      if (!mapInitialized) {
        sendError('Kakao Maps SDK load timeout. key=${appKeyPreview}, baseUrl=${escapedBaseUrl}');
        hideLoading();
      }
    }, 10000);

    function bootKakaoSdk() {
      if (!"${appKey}") {
        clearTimeout(sdkTimer);
        sendError('Missing EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY');
        hideLoading();
        return;
      }

      var sdkScript = document.createElement('script');
      sdkScript.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false";
      sdkScript.async = true;
      sdkScript.onerror = function() {
        clearTimeout(sdkTimer);
        sendError('Failed to load Kakao Maps SDK. Check key/service/domain. key=${appKeyPreview}, baseUrl=${escapedBaseUrl}');
        hideLoading();
      };
      sdkScript.onload = function() {
        try {
          if (typeof kakao === 'undefined' || !kakao.maps || typeof kakao.maps.load !== 'function') {
            clearTimeout(sdkTimer);
            sendError('Kakao SDK loaded but kakao.maps is unavailable. key=${appKeyPreview}, baseUrl=${escapedBaseUrl}');
            hideLoading();
            return;
          }
          kakao.maps.load(function() {
            clearTimeout(sdkTimer);
            initMap();
          });
        } catch (error) {
          clearTimeout(sdkTimer);
          sendError('Kakao SDK onload failed: ' + (error && error.message ? error.message : 'unknown'));
          hideLoading();
        }
      };
      document.head.appendChild(sdkScript);
    }

    bootKakaoSdk();
  </script>
</body>
</html>`;
  }, [initialCenter, initialZoomLevel, markers, userLocation]);

  const bridgeScript = useMemo(() => {
    const selectedLiteral = JSON.stringify(selectedId ?? null);
    const userLocationLiteral = userLocation
      ? JSON.stringify({ lat: userLocation.latitude, lng: userLocation.longitude })
      : 'null';
    return `
      if (window.updateSelectedMarker) { window.updateSelectedMarker(${selectedLiteral}); }
      if (window.updateUserLocation) { window.updateUserLocation(${userLocationLiteral}); }
      true;
    `;
  }, [selectedId, userLocation]);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(bridgeScript);
  }, [bridgeScript]);

  const webViewSource = useMemo(
    () => ({ html: htmlContent, baseUrl: KAKAO_WEB_BASE_URL }),
    [htmlContent]
  );

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={webViewSource}
        style={styles.webView}
        onMessage={handleMessage}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(bridgeScript);
        }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        cacheEnabled
        startInLoadingState
        onHttpError={(event: { nativeEvent: { statusCode: number } }) => {
          reportError(`WebView HTTP error: ${event.nativeEvent.statusCode}`);
        }}
        onError={() => {
          reportError('WebView failed to render map document');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  webView: {
    flex: 1,
    backgroundColor: '#e9edf3',
  },
});
