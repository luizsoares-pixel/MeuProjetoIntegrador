import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { colors } from "../theme";

export interface LeafletMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  cuisine?: string;
}

export interface LeafletMapRef {
  centerOn: (lat: number, lng: number, zoom?: number) => void;
  fitBounds: (coords: Array<{ latitude: number; longitude: number }>) => void;
}

export interface LeafletMapProps {
  initialCenter: { latitude: number; longitude: number };
  initialZoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  restaurants?: LeafletMarker[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }> | null;
  interactive?: boolean;
  onMarkerSelect?: (id: string) => void;
  onMapTap?: () => void;
  onReady?: () => void;
  onError?: () => void;
  style?: StyleProp<ViewStyle>;
}

function buildLeafletHtml({
  initialLat,
  initialLng,
  initialZoom,
  interactive,
}: {
  initialLat: number;
  initialLng: number;
  initialZoom: number;
  interactive: boolean;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    html, body, #map {
      width: 100%;
      height: 100%;
      background-color: #121214;
      overflow: hidden;
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255, 255, 255, 0.72) !important;
      padding: 1px 5px !important;
      color: #333 !important;
    }
    .leaflet-bar {
      display: none !important;
    }

    /* Pulsar de Localização do Usuário */
    .user-marker-container {
      width: 24px;
      height: 24px;
      position: relative;
    }
    .user-marker-pulse {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(33, 150, 243, 0.28);
      border: 2px solid rgba(33, 150, 243, 0.85);
      animation: userPulse 2s infinite ease-out;
    }
    .user-marker-dot {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #E6C07B;
      border: 2px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
    }
    @keyframes userPulse {
      0% { transform: scale(0.8); opacity: 1; }
      70% { transform: scale(1.6); opacity: 0; }
      100% { transform: scale(0.8); opacity: 0; }
    }

    /* Pin Personalizado de Restaurante */
    .restaurant-pin-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      cursor: pointer;
    }
    .restaurant-pin-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #E6C07B;
      border: 2px solid #2F0000;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.38);
      transition: transform 0.12s ease;
    }
    .restaurant-pin-wrapper:active .restaurant-pin-circle {
      transform: scale(0.9);
    }
    .restaurant-pin-point {
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 8px solid #E6C07B;
      margin-top: -1px;
    }
    .restaurant-pin-badge {
      position: absolute;
      top: 40px;
      background: rgba(47, 0, 0, 0.94);
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      white-space: nowrap;
      border: 1px solid #E6C07B;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
      pointer-events: none;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      var map;
      var restaurantMarkers = {};
      var userMarker = null;
      var routePolyline = null;
      var isInteractive = ${interactive};

      function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
      }

      function sendToNative(data) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      }

      function initMap() {
        if (typeof L === 'undefined') {
          setTimeout(initMap, 80);
          return;
        }

        map = L.map('map', {
          center: [${initialLat}, ${initialLng}],
          zoom: ${initialZoom},
          zoomControl: false,
          dragging: isInteractive,
          touchZoom: isInteractive,
          doubleClickZoom: isInteractive,
          scrollWheelZoom: isInteractive,
          boxZoom: isInteractive,
          keyboard: isInteractive,
          attributionControl: isInteractive
        });

        var voyagerTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        var osmTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        var tileLayer = L.tileLayer(voyagerTiles, {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        tileLayer.on('tileerror', function() {
          tileLayer.setUrl(osmTiles);
        });

        if (isInteractive) {
          map.on('click', function() {
            sendToNative({ type: 'MAP_TAP' });
          });
        }

        var userIcon = L.divIcon({
          className: 'custom-user-icon',
          html: '<div class="user-marker-container"><div class="user-marker-pulse"></div><div class="user-marker-dot"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        window.updateUser = function(lat, lng) {
          if (!map || lat == null || lng == null) return;
          if (userMarker) {
            userMarker.setLatLng([lat, lng]);
          } else {
            userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
          }
        };

        window.centerOn = function(lat, lng, zoom) {
          if (!map || lat == null || lng == null) return;
          map.flyTo([lat, lng], zoom || 15, { duration: 0.7 });
        };

        window.updateRestaurants = function(list) {
          if (!map) return;
          for (var id in restaurantMarkers) {
            if (restaurantMarkers.hasOwnProperty(id)) {
              map.removeLayer(restaurantMarkers[id]);
            }
          }
          restaurantMarkers = {};

          if (!list || !list.length) return;

          list.forEach(function(r) {
            if (r.latitude == null || r.longitude == null) return;

            var safeName = escapeHtml(r.name);
            var pinHtml = 
              '<div class="restaurant-pin-wrapper">' +
                '<div class="restaurant-pin-circle">' +
                  '<svg width="18" height="18" viewBox="0 0 24 24" fill="#2F0000">' +
                    '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>' +
                  '</svg>' +
                '</div>' +
                '<div class="restaurant-pin-point"></div>' +
                (isInteractive ? '<div class="restaurant-pin-badge">' + safeName + '</div>' : '') +
              '</div>';

            var icon = L.divIcon({
              className: 'custom-restaurant-pin',
              html: pinHtml,
              iconSize: [34, 42],
              iconAnchor: [17, 41]
            });

            var marker = L.marker([r.latitude, r.longitude], { icon: icon }).addTo(map);
            if (isInteractive) {
              marker.on('click', function(ev) {
                if (ev.originalEvent) {
                  ev.originalEvent.stopPropagation();
                }
                sendToNative({ type: 'MARKER_SELECT', id: r.id });
              });
            }

            restaurantMarkers[r.id] = marker;
          });
        };

        window.updateRoute = function(coords) {
          if (!map) return;
          if (routePolyline) {
            map.removeLayer(routePolyline);
            routePolyline = null;
          }
          if (!coords || !coords.length) return;

          var latLngs = coords.map(function(c) { return [c.latitude, c.longitude]; });
          routePolyline = L.polyline(latLngs, {
            color: '#E6C07B',
            weight: 5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          if (isInteractive) {
            map.fitBounds(routePolyline.getBounds(), {
              paddingTopLeft: [40, 90],
              paddingBottomRight: [40, 240],
              maxZoom: 16,
              animate: true
            });
          } else {
            map.fitBounds(routePolyline.getBounds(), {
              padding: [20, 20],
              maxZoom: 16,
              animate: false
            });
          }
        };

        window.clearRoute = function() {
          if (!map) return;
          if (routePolyline) {
            map.removeLayer(routePolyline);
            routePolyline = null;
          }
        };

        window.fitCoordinates = function(coords) {
          if (!map || !coords || !coords.length) return;
          var latLngs = coords.map(function(c) { return [c.latitude, c.longitude]; });
          map.fitBounds(L.latLngBounds(latLngs), {
            padding: [40, 40],
            maxZoom: 16,
            animate: true
          });
        };

        sendToNative({ type: 'READY' });
      }

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initMap();
      } else {
        document.addEventListener('DOMContentLoaded', initMap);
      }
    })();
  </script>
</body>
</html>`;
}

export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(
  function LeafletMap(
    {
      initialCenter,
      initialZoom = 13,
      userLocation,
      restaurants = [],
      routeCoordinates,
      interactive = true,
      onMarkerSelect,
      onMapTap,
      onReady,
      onError,
      style,
    },
    ref
  ) {
    const webViewRef = useRef<WebView>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    const htmlContent = useMemo(() => {
      return buildLeafletHtml({
        initialLat: initialCenter.latitude,
        initialLng: initialCenter.longitude,
        initialZoom,
        interactive,
      });
    }, [initialCenter.latitude, initialCenter.longitude, initialZoom, interactive]);

    useImperativeHandle(
      ref,
      () => ({
        centerOn: (lat: number, lng: number, zoom?: number) => {
          webViewRef.current?.injectJavaScript(
            `if (window.centerOn) { window.centerOn(${lat}, ${lng}, ${zoom || 15}); } true;`
          );
        },
        fitBounds: (coords: Array<{ latitude: number; longitude: number }>) => {
          webViewRef.current?.injectJavaScript(
            `if (window.fitCoordinates) { window.fitCoordinates(${JSON.stringify(coords)}); } true;`
          );
        },
      }),
      []
    );

    const syncAllData = useCallback(() => {
      if (userLocation) {
        webViewRef.current?.injectJavaScript(
          `if (window.updateUser) { window.updateUser(${userLocation.latitude}, ${userLocation.longitude}); } true;`
        );
      }

      if (restaurants && restaurants.length > 0) {
        const payload = restaurants.map((r) => ({
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          cuisine: r.cuisine,
        }));
        webViewRef.current?.injectJavaScript(
          `if (window.updateRestaurants) { window.updateRestaurants(${JSON.stringify(payload)}); } true;`
        );
      }

      if (routeCoordinates && routeCoordinates.length > 0) {
        webViewRef.current?.injectJavaScript(
          `if (window.updateRoute) { window.updateRoute(${JSON.stringify(routeCoordinates)}); } true;`
        );
      } else {
        webViewRef.current?.injectJavaScript(
          `if (window.clearRoute) { window.clearRoute(); } true;`
        );
      }
    }, [userLocation, restaurants, routeCoordinates]);

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === "READY") {
            setIsMapReady(true);
            syncAllData();
            onReady?.();
          } else if (data.type === "MARKER_SELECT") {
            onMarkerSelect?.(data.id);
          } else if (data.type === "MAP_TAP") {
            onMapTap?.();
          }
        } catch (err) {
          console.warn("LeafletMap: erro ao processar mensagem do WebView", err);
        }
      },
      [syncAllData, onReady, onMarkerSelect, onMapTap]
    );

    // Sincroniza usuário dinamicamente
    useEffect(() => {
      if (!isMapReady || !userLocation) return;
      webViewRef.current?.injectJavaScript(
        `if (window.updateUser) { window.updateUser(${userLocation.latitude}, ${userLocation.longitude}); } true;`
      );
    }, [userLocation, isMapReady]);

    // Sincroniza restaurantes dinamicamente
    useEffect(() => {
      if (!isMapReady) return;
      const payload = restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        cuisine: r.cuisine,
      }));
      webViewRef.current?.injectJavaScript(
        `if (window.updateRestaurants) { window.updateRestaurants(${JSON.stringify(payload)}); } true;`
      );
    }, [restaurants, isMapReady]);

    // Sincroniza rota ativa dinamicamente
    useEffect(() => {
      if (!isMapReady) return;
      if (routeCoordinates && routeCoordinates.length > 0) {
        webViewRef.current?.injectJavaScript(
          `if (window.updateRoute) { window.updateRoute(${JSON.stringify(routeCoordinates)}); } true;`
        );
      } else {
        webViewRef.current?.injectJavaScript(
          `if (window.clearRoute) { window.clearRoute(); } true;`
        );
      }
    }, [routeCoordinates, isMapReady]);

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          onMessage={handleMessage}
          onError={() => {
            onError?.();
          }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.background.soft,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background.soft,
  },
});
