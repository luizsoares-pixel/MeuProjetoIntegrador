/**
 * Serviço HTTP para consumo da API Menu Digital.
 * Issue #34 — Pins de Restaurantes no Mapa
 *
 * A URL deve ser configurada por EXPO_PUBLIC_API_URL para funcionar em emuladores,
 * aparelhos físicos e ambientes hospedados sem depender de um IP fixo.
 */

import type {
  CreateMenuItemInput,
  CreateRestaurantInput,
  MenuItemResponse,
  PaginatedRestaurantsResponse,
  RegisterRestaurantInput,
  RestaurantResponse,
  RestaurantRouteResponse,
  RouteProfile,
  UpdateMenuItemInput,
  UpdateRestaurantProfileInput,
  UploadPresignedUrlRequest,
  UploadPresignedUrlResponse,
} from "@menu-digital/contracts";
import { Platform } from "react-native";
import Constants from "expo-constants";

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // No navegador web, 10.0.2.2 não é roteável; usa localhost se não houver outra URL explícita
  if (Platform.OS === "web") {
    if (envUrl && !envUrl.includes("10.0.2.2")) {
      return envUrl.replace(/\/$/, "");
    }
    return "http://localhost:3333";
  }

  // Em celular físico via Expo Go, extrai dinamicamente o IP da máquina de desenvolvimento
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    if (hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1") {
      // Se a env aponta para o alias de emulador (10.0.2.2) mas o app roda em celular físico:
      if (!envUrl || envUrl.includes("10.0.2.2") || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
        return `http://${hostIp}:3333`;
      }
    }
  }

  if (!envUrl) {
    throw new Error("EXPO_PUBLIC_API_URL não está configurada.");
  }
  return envUrl.replace(/\/$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();

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

/**
 * Cadastra um novo item no cardápio do restaurante.
 * POST /restaurants/:id/menu
 */
export async function createMenuItem(
  restaurantId: string,
  input: CreateMenuItemInput,
  token: string
): Promise<MenuItemResponse> {
  const url = `${API_BASE_URL}/restaurants/${restaurantId}/menu`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `Erro ao cadastrar item: ${response.status}`;
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
  return data.item;
}

/**
 * Atualiza um item do cardápio existente.
 * PATCH /menu-items/:id
 */
export async function updateMenuItem(
  itemId: string,
  input: UpdateMenuItemInput,
  token: string
): Promise<MenuItemResponse> {
  const url = `${API_BASE_URL}/menu-items/${itemId}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `Erro ao atualizar item: ${response.status}`;
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
  return data.item;
}

/**
 * Exclui um item do cardápio.
 * DELETE /menu-items/:id
 */
export async function deleteMenuItem(
  itemId: string,
  token: string
): Promise<void> {
  const url = `${API_BASE_URL}/menu-items/${itemId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao remover item: ${response.status}`;
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

// ── Upload de Imagens com Presigned URLs (Supabase Storage) ────────────────────

/**
 * Solicita uma URL pré-assinada temporária para upload direto no Supabase Storage.
 * O binário da imagem NÃO trafega pelo Express — apenas a autorização é orquestrada.
 */
export async function requestPresignedUploadUrl(
  payload: UploadPresignedUrlRequest,
  token: string
): Promise<UploadPresignedUrlResponse> {
  const response = await fetch(`${API_BASE_URL}/upload/presigned-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Falha ao obter URL autorizada para upload (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }

  const data: UploadPresignedUrlResponse = await response.json();
  return data;
}

/**
 * Envia o binário da imagem diretamente para o bucket do Supabase usando PUT na Presigned URL.
 */
export async function uploadImageBinary(
  presignedUrl: string,
  blob: Blob,
  contentType: string
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(
      `Falha no upload direto para o Supabase Storage (${response.status}).`
    );
  }
}

/**
 * Pipeline completo de upload:
 * 1. Converte o URI local (file://, content://, etc.) em Blob nativo sem consumo de rede externa.
 * 2. Solicita a Presigned URL ao backend Express.
 * 3. Faz o upload via PUT diretamente ao Supabase Storage.
 * 4. Retorna a URL pública definitiva (CDN) pronta para salvar no banco e exibir com expo-image.
 */
export async function uploadImageFromUri(
  localUri: string,
  token: string,
  options?: {
    folder?: string;
    fileName?: string;
    contentType?: "image/jpeg" | "image/png" | "image/webp";
  }
): Promise<string> {
  // Se já for uma URL remota válida (http/https), retorna diretamente
  if (localUri.startsWith("http://") || localUri.startsWith("https://")) {
    return localUri;
  }

  // 1. Obtém o Blob local
  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();

  // 2. Determina MIME type válido
  let contentType: "image/jpeg" | "image/png" | "image/webp" =
    options?.contentType || "image/jpeg";

  if (blob.type && ["image/jpeg", "image/png", "image/webp"].includes(blob.type)) {
    contentType = blob.type as "image/jpeg" | "image/png" | "image/webp";
  } else if (localUri.toLowerCase().endsWith(".png")) {
    contentType = "image/png";
  } else if (localUri.toLowerCase().endsWith(".webp")) {
    contentType = "image/webp";
  }

  // 3. Determina nome do arquivo
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const rawName = options?.fileName || localUri.split("/").pop() || `photo-${Date.now()}`;
  const cleanName = rawName.includes(".") ? rawName : `${rawName}.${ext}`;

  // 4. Solicita a Presigned URL
  const presigned = await requestPresignedUploadUrl(
    {
      fileName: cleanName,
      contentType,
      contentLength: blob.size,
      folder: options?.folder ?? "uploads",
    },
    token
  );

  // 5. Envia o binário diretamente para o Supabase Storage via PUT
  await uploadImageBinary(presigned.presignedUrl, blob, contentType);

  // 6. Retorna a URL pública definitiva
  return presigned.publicUrl;
}




