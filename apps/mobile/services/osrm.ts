import type {
  RouteCalculationResult,
  RouteCoordinate,
  RouteProfile,
} from "@menu-digital/contracts";

export interface CalculateRouteParams {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  profile?: RouteProfile;
}

const OSRM_PUBLIC_URL = "https://router.project-osrm.org";
const OSRM_USER_AGENT =
  "MenuDigital-Mobile/1.0 (CEUB ADS-PI-II; contact: menu-digital@ceub.br)";
const OSRM_TIMEOUT_MS = 8000;

/**
 * Formata o tempo de deslocamento em segundos para texto amigável.
 * Ex: < 60s → "Menos de 1 min", 480s → "8 min", 4200s → "1h 10 min".
 */
export function formatRouteDuration(seconds: number): string {
  if (seconds < 60) {
    return "Menos de 1 min";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (remMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remMinutes} min`;
}

/**
 * Formata a distância em metros para texto legível.
 * Ex: 850m → "850 m", 3200m → "3,2 km".
 */
export function formatRouteDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * Fórmula de Haversine pura para fallback em caso de indisponibilidade do OSRM.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcula distância euclidiana/esférica e estima duração caso OSRM falhe.
 * Velocidades médias padrão:
 * - driving: 30 km/h (8.33 m/s)
 * - walking: 5 km/h (1.39 m/s)
 */
export function calculateHaversineFallback(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  profile: RouteProfile = "driving",
  reason = "Serviço OSRM indisponível"
): RouteCalculationResult {
  const distanceInMeters = Math.round(
    haversineDistance(originLat, originLng, destLat, destLng)
  );
  const speedInMps = profile === "walking" ? 1.39 : 8.33;
  const durationInSeconds = Math.round(distanceInMeters / speedInMps);

  return {
    distanceInMeters,
    durationInSeconds,
    polylineCoordinates: [
      { latitude: originLat, longitude: originLng },
      { latitude: destLat, longitude: destLng },
    ],
    profile,
    isFallback: true,
    fallbackReason: reason,
  };
}

/**
 * Realiza requisição direta à API pública do OSRM (/route/v1/{profile}/{coords}).
 * Aplica timeout de 8 segundos e User-Agent customizado institucional.
 */
export async function fetchOsrmRouteDirect(
  params: CalculateRouteParams
): Promise<RouteCalculationResult> {
  const profile = params.profile || "driving";
  const coords = `${params.originLng},${params.originLat};${params.destLng},${params.destLat}`;
  const url = `${OSRM_PUBLIC_URL}/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": OSRM_USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM respondeu com status ${response.status}`);
    }

    const data = (await response.json()) as any;
    if (!data.routes || data.routes.length === 0) {
      throw new Error("Nenhuma rota viária encontrada");
    }

    const primaryRoute = data.routes[0];
    const polylineCoordinates: RouteCoordinate[] = (
      primaryRoute.geometry?.coordinates || []
    ).map(([lng, lat]: [number, number]) => ({
      latitude: lat,
      longitude: lng,
    }));

    return {
      distanceInMeters: Math.round(primaryRoute.distance),
      durationInSeconds: Math.round(primaryRoute.duration),
      polylineCoordinates,
      profile,
      isFallback: false,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return calculateHaversineFallback(
      params.originLat,
      params.originLng,
      params.destLat,
      params.destLng,
      profile,
      err?.name === "AbortError"
        ? "Tempo limite de conexão com OSRM excedido"
        : err?.message || "Falha ao calcular rota pelo OSRM"
    );
  }
}
