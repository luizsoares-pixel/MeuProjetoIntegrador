import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import type {
  MenuItemResponse,
  RestaurantResponse,
  UserFavoritesResponse,
} from "@menu-digital/contracts";
import { useAuth } from "../hooks/useAuth";
import {
  fetchUserFavorites,
  toggleDishFavorite,
  toggleRestaurantFavorite,
} from "../services/favorite.service";

export interface FavoritesContextData {
  favoriteRestaurantIds: Set<string>;
  favoriteDishIds: Set<string>;
  favoritesData: UserFavoritesResponse | null;
  isLoading: boolean;
  isRestaurantFavorite: (id: string) => boolean;
  isDishFavorite: (id: string) => boolean;
  toggleRestaurant: (restaurant: Partial<RestaurantResponse> & { id: string }) => Promise<void>;
  toggleDish: (dish: Partial<MenuItemResponse> & { id: string }) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextData | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<Set<string>>(
    new Set()
  );
  const [favoriteDishIds, setFavoriteDishIds] = useState<Set<string>>(new Set());
  const [favoritesData, setFavoritesData] = useState<UserFavoritesResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!token) {
      setFavoriteRestaurantIds(new Set());
      setFavoriteDishIds(new Set());
      setFavoritesData(null);
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetchUserFavorites(token);
      setFavoritesData(data);
      setFavoriteRestaurantIds(new Set(data.restaurants.map((r) => r.id)));
      setFavoriteDishIds(new Set(data.dishes.map((d) => d.id)));
    } catch {
      // Falha silenciosa no refresh de favoritos
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isRestaurantFavorite = useCallback(
    (id: string) => favoriteRestaurantIds.has(id),
    [favoriteRestaurantIds]
  );

  const isDishFavorite = useCallback(
    (id: string) => favoriteDishIds.has(id),
    [favoriteDishIds]
  );

  const toggleRestaurant = useCallback(
    async (restaurant: Partial<RestaurantResponse> & { id: string }) => {
      if (!token) {
        Alert.alert(
          "Login necessário",
          "Faça login na sua conta para salvar restaurantes favoritos."
        );
        return;
      }

      const id = restaurant.id;
      const wasFavorite = favoriteRestaurantIds.has(id);

      // Optimistic UI: atualiza o estado local imediatamente
      setFavoriteRestaurantIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      // Atualiza também os dados em cache para renderização instantânea
      setFavoritesData((prev) => {
        if (!prev) return prev;
        if (wasFavorite) {
          return {
            ...prev,
            restaurants: prev.restaurants.filter((r) => r.id !== id),
          };
        } else {
          const newRest = restaurant as RestaurantResponse;
          return {
            ...prev,
            restaurants: [newRest, ...prev.restaurants],
          };
        }
      });

      try {
        const res = await toggleRestaurantFavorite(id, token);
        // Confirma com o estado real devolvido pelo backend
        setFavoriteRestaurantIds((prev) => {
          const next = new Set(prev);
          if (res.isFavorite) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      } catch (err: any) {
        // Rollback em caso de erro
        setFavoriteRestaurantIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
        refreshFavorites();
        Alert.alert(
          "Erro ao favoritar",
          err?.message || "Não foi possível atualizar o favorito. Tente novamente."
        );
      }
    },
    [token, favoriteRestaurantIds, refreshFavorites]
  );

  const toggleDish = useCallback(
    async (dish: Partial<MenuItemResponse> & { id: string }) => {
      if (!token) {
        Alert.alert(
          "Login necessário",
          "Faça login na sua conta para salvar pratos favoritos."
        );
        return;
      }

      const id = dish.id;
      const wasFavorite = favoriteDishIds.has(id);

      // Optimistic UI: atualiza localmente
      setFavoriteDishIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      setFavoritesData((prev) => {
        if (!prev) return prev;
        if (wasFavorite) {
          return {
            ...prev,
            dishes: prev.dishes.filter((d) => d.id !== id),
          };
        } else {
          const newDish = dish as MenuItemResponse;
          return {
            ...prev,
            dishes: [newDish, ...prev.dishes],
          };
        }
      });

      try {
        const res = await toggleDishFavorite(id, token);
        setFavoriteDishIds((prev) => {
          const next = new Set(prev);
          if (res.isFavorite) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      } catch (err: any) {
        // Rollback
        setFavoriteDishIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
        refreshFavorites();
        Alert.alert(
          "Erro ao favoritar",
          err?.message || "Não foi possível atualizar o favorito. Tente novamente."
        );
      }
    },
    [token, favoriteDishIds, refreshFavorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteRestaurantIds,
        favoriteDishIds,
        favoritesData,
        isLoading,
        isRestaurantFavorite,
        isDishFavorite,
        toggleRestaurant,
        toggleDish,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
