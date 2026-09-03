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
import type {
  CreateRestaurantInput,
  RestaurantResponse,
} from "@menu-digital/contracts";

function resolveApiBaseUrl(): string {
  const expoHost = Constants.expoConfig?.hostUri;
  if (expoHost) {
    const host = expoHost.includes(":")
      ? expoHost.substring(0, expoHost.lastIndexOf(":"))
      : expoHost;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:3333`;
    }
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
  cuisineType?: string | null;
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

/**
 * Cadastra um novo restaurante vinculado ao usuário autenticado.
 * Exige token JWT de autenticação.
 */
export async function createRestaurant(
  input: CreateRestaurantInput,
  token: string
): Promise<RestaurantResponse> {
  const url = `${API_BASE_URL}/restaurants`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `Erro ao cadastrar restaurante: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
      if (errorData.details && Array.isArray(errorData.details)) {
        const detailsMsg = errorData.details
          .map((d: any) => d.message)
          .join(" ");
        errorMessage = `${errorMessage} (${detailsMsg})`;
      }
    } catch {
      // Ignora erro ao parsear JSON
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.restaurant;
}
