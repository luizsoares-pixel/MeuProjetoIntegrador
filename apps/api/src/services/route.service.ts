import type {
  RestaurantRouteQuery,
  RestaurantRouteResponse,
  RouteCalculationResult,
  RouteCoordinate,
  RouteProfile,
} from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";
import { haversineDistance } from "./restaurant.service";

const OSRM_DEFAULT_URL = "https://router.project-osrm.org";
const OSRM_USER_AGENT =
  "MenuDigital-API/1.0 (CEUB ADS-PI-II; contact: menu-digital@ceub.br)";
const OSRM_TIMEOUT_MS = 8000;

/**
 * Calcula a distância em linha reta e estima a duração caso o serviço OSRM falhe.
 * Velocidades médias estimadas para trânsito urbano:
 * - driving: ~30 km/h = 8.33 m/s
 * - walking: ~5 km/h = 1.39 m/s
 */
export function calculateHaversineFallback(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  profile: RouteProfile = "driving",
  fallbackReason = "Serviço OSRM indisponível"
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
    fallbackReason,
  };
}

export class RouteService {
  constructor(private prismaClient = prisma) {}

  /**
   * Calcula a rota e tempo estimado entre uma coordenada de origem e um restaurante (HU9).
   * Tenta primeiramente via OSRM demo server; caso ocorra timeout, erro de rede ou limite de taxa,
   * executa fallback gracioso para distância em linha reta com velocidade média estimada.
   */
  async calculateRestaurantRoute(
    restaurantId: string,
    query: RestaurantRouteQuery
  ): Promise<RestaurantRouteResponse | null> {
    const restaurant = await this.prismaClient.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!restaurant) {
      return null;
    }

    const profile: RouteProfile = query.profile || "driving";
    const osrmBaseUrl = process.env.OSRM_BASE_URL || OSRM_DEFAULT_URL;

    // Coordenadas no padrão OSRM: {longitude},{latitude};{longitude},{latitude}
    const coordinates = `${query.lng},${query.lat};${restaurant.longitude},${restaurant.latitude}`;
    const url = `${osrmBaseUrl}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`;

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
        throw new Error("Nenhuma rota viária encontrada pelo OSRM");
      }

      const primaryRoute = data.routes[0];
      const polylineCoordinates: RouteCoordinate[] = (
        primaryRoute.geometry?.coordinates || []
      ).map(([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));

      return {
        restaurantId,
        route: {
          distanceInMeters: Math.round(primaryRoute.distance),
          durationInSeconds: Math.round(primaryRoute.duration),
          polylineCoordinates,
          profile,
          isFallback: false,
        },
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      const reason =
        error?.name === "AbortError"
          ? "Tempo limite excedido ao contatar OSRM (timeout)"
          : error?.message || "Serviço de rotas OSRM indisponível";

      return {
        restaurantId,
        route: calculateHaversineFallback(
          query.lat,
          query.lng,
          restaurant.latitude,
          restaurant.longitude,
          profile,
          reason
        ),
      };
    }
  }
}

export const routeService = new RouteService();
