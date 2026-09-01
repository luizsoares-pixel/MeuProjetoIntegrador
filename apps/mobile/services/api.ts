/**
 * Serviço HTTP para consumo da API Menu Digital.
 * Issue #34 — Pins de Restaurantes no Mapa
 *
 * Em Expo, o host real do dev server pode ser diferente de localhost ou 10.0.2.2.
 * Em aparelhos físicos, por exemplo, a URL correta normalmente é o IP da máquina.
 * Por isso a API tenta usar o host do Expo primeiro e só usa o fallback estático se
 * não houver host de desenvolvimento disponível.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiBaseUrl(): string {
  const expoHost = Constants.expoConfig?.hostUri;
  if (expoHost) {
    const host = expoHost.split(":")[0];
    return `http://${host}:3333`;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  return Platform.OS === "android" ? "http://10.0.2.2:3333" : "http://127.0.0.1:3333";
}

const API_BASE_URL = resolveApiBaseUrl();

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
