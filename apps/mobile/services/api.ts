/**
 * Serviço HTTP para consumo da API Menu Digital.
 * Issue #34 — Pins de Restaurantes no Mapa
 *
 * A URL deve ser configurada por EXPO_PUBLIC_API_URL para funcionar em emuladores,
 * aparelhos físicos e ambientes hospedados sem depender de um IP fixo.
 */

import type {
  CreateRestaurantInput,
  MenuItemResponse,
  PaginatedRestaurantsResponse,
  RegisterRestaurantInput,
  RestaurantResponse,
  RestaurantRouteResponse,
  RouteProfile,
  UpdateRestaurantProfileInput,
} from "@menu-digital/contracts";

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!envUrl) {
    throw new Error("EXPO_PUBLIC_API_URL não está configurada.");
  }
  return envUrl.replace(/\/$/, "");
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

/**
 * Cadastra uma conta de usuário e o restaurante em etapa unificada.
 */
export async function registerRestaurant(
  input: RegisterRestaurantInput
): Promise<void> {
  const url = `${API_BASE_URL}/auth/register/restaurant`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `Erro ao cadastrar conta de restaurante: ${response.status}`;
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
}

/**
 * Recupera o perfil do restaurante do usuário logado.
 */
export async function getRestaurantProfile(
  token: string
): Promise<RestaurantResponse> {
  const url = `${API_BASE_URL}/restaurants/me`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao carregar perfil do restaurante: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignora erro ao parsear JSON
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.restaurant;
}

/**
 * Atualiza os dados de perfil do restaurante do usuário logado.
 */
export async function updateRestaurantProfile(
  input: UpdateRestaurantProfileInput,
  token: string
): Promise<RestaurantResponse> {
  const url = `${API_BASE_URL}/restaurants/me`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `Erro ao atualizar perfil do restaurante: ${response.status}`;
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

/**
 * Busca restaurante por ID.
 */
export async function getRestaurantById(
  id: string
): Promise<RestaurantResponse> {
  const url = `${API_BASE_URL}/restaurants/${id}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao carregar restaurante: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignora erro ao parsear JSON
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.restaurant;
}

export interface FetchRestaurantsParams {
  page?: number;
  limit?: number;
  search?: string;
  cuisine?: string;
  city?: string;
  priceRange?: string | string[];
  minRating?: number;
  maxDistance?: number;
  openNow?: boolean;
  sortBy?: string;
  lat?: number;
  lng?: number;
}

/**
 * Busca a listagem paginada de restaurantes com suporte a busca, filtros avançados e ordenação (HU5, HU6, HU7 & HU8).
 * GET /restaurants?page=&limit=&search=&cuisine=&city=&priceRange=&minRating=&maxDistance=&openNow=&sortBy=&lat=&lng=
 */
export async function fetchRestaurants(
  params?: FetchRestaurantsParams
): Promise<PaginatedRestaurantsResponse> {
  const url = new URL(`${API_BASE_URL}/restaurants`);
  if (params?.page !== undefined) {
    url.searchParams.set("page", String(params.page));
  }
  if (params?.limit !== undefined) {
    url.searchParams.set("limit", String(params.limit));
  }
  if (params?.search && params.search.trim() !== "") {
    url.searchParams.set("search", params.search.trim());
  }
  if (params?.cuisine && params.cuisine.trim() !== "") {
    url.searchParams.set("cuisine", params.cuisine.trim());
  }
  if (params?.city && params.city.trim() !== "") {
    url.searchParams.set("city", params.city.trim());
  }
  if (params?.priceRange) {
    const priceStr = Array.isArray(params.priceRange)
      ? params.priceRange.join(",")
      : params.priceRange;
    if (priceStr.trim() !== "") {
      url.searchParams.set("priceRange", priceStr.trim());
    }
  }
  if (params?.minRating !== undefined) {
    url.searchParams.set("minRating", String(params.minRating));
  }
  if (params?.maxDistance !== undefined) {
    url.searchParams.set("maxDistance", String(params.maxDistance));
  }
  if (params?.openNow !== undefined) {
    url.searchParams.set("openNow", String(params.openNow));
  }
  if (params?.sortBy && params.sortBy.trim() !== "") {
    url.searchParams.set("sortBy", params.sortBy.trim());
  }
  if (params?.lat !== undefined) {
    url.searchParams.set("lat", String(params.lat));
  }
  if (params?.lng !== undefined) {
    url.searchParams.set("lng", String(params.lng));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao carregar restaurantes: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignora erro ao parsear JSON
    }
    throw new Error(errorMessage);
  }

  const data: PaginatedRestaurantsResponse = await response.json();
  return data;
}

/**
 * Busca os dados completos de um restaurante por ID.
 * GET /restaurants/:id
 */
export async function fetchRestaurantById(
  id: string
): Promise<RestaurantResponse> {
  const url = `${API_BASE_URL}/restaurants/${id}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao carregar restaurante: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignora erro
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.restaurant;
}

/** Busca o cardápio completo de um restaurante, incluindo itens indisponíveis. */
export async function fetchRestaurantMenu(id: string): Promise<MenuItemResponse[]> {
  const response = await fetch(`${API_BASE_URL}/restaurants/${id}/menu`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let message = `Erro ao carregar cardápio: ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {
      // Mantém a mensagem HTTP quando a API não retorna JSON.
    }
    throw new Error(message);
  }

  const data: { items: MenuItemResponse[] } = await response.json();
  return data.items;
}

export interface FetchRestaurantRouteParams {
  lat: number;
  lng: number;
  profile?: RouteProfile;
}

/**
 * Calcula a rota e tempo estimado até o restaurante (HU9).
 * GET /restaurants/:id/route?lat=&lng=&profile=
 */
export async function fetchRestaurantRoute(
  id: string,
  params: FetchRestaurantRouteParams
): Promise<RestaurantRouteResponse> {
  const url = new URL(`${API_BASE_URL}/restaurants/${id}/route`);
  url.searchParams.set("lat", String(params.lat));
  url.searchParams.set("lng", String(params.lng));
  if (params.profile) {
    url.searchParams.set("profile", params.profile);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao calcular rota: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignora erro
    }
    throw new Error(errorMessage);
  }

  const data: RestaurantRouteResponse = await response.json();
  return data;
}



