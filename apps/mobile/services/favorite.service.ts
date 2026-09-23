import type {
  ToggleFavoriteResponse,
  UserFavoritesResponse,
} from "@menu-digital/contracts";
import { API_BASE_URL } from "./api";

/**
 * Alterna o estado de favorito de um restaurante para o usuário logado.
 */
export async function toggleRestaurantFavorite(
  restaurantId: string,
  token: string
): Promise<ToggleFavoriteResponse> {
  const url = `${API_BASE_URL}/favorites/restaurants/${restaurantId}/toggle`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao atualizar favorito: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Alterna o estado de favorito de um prato para o usuário logado.
 */
export async function toggleDishFavorite(
  menuItemId: string,
  token: string
): Promise<ToggleFavoriteResponse> {
  const url = `${API_BASE_URL}/favorites/dishes/${menuItemId}/toggle`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao atualizar favorito: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Obtém a lista consolidada de restaurantes e pratos favoritados pelo usuário.
 */
export async function fetchUserFavorites(
  token: string
): Promise<UserFavoritesResponse> {
  const url = `${API_BASE_URL}/favorites`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao buscar favoritos: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
