/**
 * Serviço HTTP para consumo da API Menu Digital.
 * Issue #34 — Pins de Restaurantes no Mapa
 *
 * A URL base é lida de EXPO_PUBLIC_API_URL (env pública do Expo).
 * Fallback para localhost para desenvolvimento local.
 */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3333";

export interface NearbyRestaurant {
  id: string;
  name: string;
  address: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  distanceInMeters: number;
}

export interface NearbyRestaurantsParams {
  lat: number;
  lng: number;
  /** Raio em metros. Default da API: 5000 */
  radius?: number;
}

export interface NearbyRestaurantsResponse {
  restaurants: NearbyRestaurant[];
}

/**
 * Busca restaurantes próximos à coordenada informada.
 * Lança um erro com mensagem legível em caso de falha de rede ou status HTTP não-ok.
 */
export async function fetchNearbyRestaurants(
  params: NearbyRestaurantsParams
): Promise<NearbyRestaurant[]> {
  const { lat, lng, radius = 5000 } = params;

  const url = new URL(`${API_BASE_URL}/restaurants/nearby`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("radius", String(radius));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar restaurantes: ${response.status} ${response.statusText}`
    );
  }

  const data: NearbyRestaurantsResponse = await response.json();
  return data.restaurants;
}
