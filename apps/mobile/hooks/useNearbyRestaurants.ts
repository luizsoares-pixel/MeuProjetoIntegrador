import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchNearbyRestaurants,
  NearbyRestaurant,
} from "../services/api";
import { FRIENDLY_NETWORK_ERROR_MESSAGE } from "../constants/network";

type NearbyRestaurantsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: NearbyRestaurant[] }
  | { status: "empty" }
  | { status: "error"; message: string };

interface UseNearbyRestaurantsOptions {
  lat: number | null;
  lng: number | null;
  /** Raio em metros. Default: 5000 */
  radius?: number;
  /** Disparar a busca automaticamente quando lat/lng estiver disponível */
  enabled?: boolean;
}

interface UseNearbyRestaurantsReturn {
  state: NearbyRestaurantsState;
  restaurants: NearbyRestaurant[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  refetch: () => void;
}

/**
 * Hook que busca restaurantes próximos via API sempre que lat/lng mudam
 * (ou quando refetch() é chamado).
 *
 * Padrão: state machine explícita (idle | loading | success | empty | error)
 * em vez de múltiplos booleans independentes — evita estados impossíveis.
 */
export function useNearbyRestaurants({
  lat,
  lng,
  radius = 5000,
  enabled = true,
}: UseNearbyRestaurantsOptions): UseNearbyRestaurantsReturn {
  const [state, setState] = useState<NearbyRestaurantsState>({ status: "idle" });
  // Contador de triggers para forçar refetch sem precisar mudar lat/lng
  const [fetchTrigger, setFetchTrigger] = useState(0);
  // Evita setState em componentes desmontados
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || lat === null || lng === null) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      try {
        const restaurants = await fetchNearbyRestaurants({ lat: lat!, lng: lng!, radius });

        if (cancelled || !mountedRef.current) return;

        if (restaurants.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({ status: "success", data: restaurants });
        }
      } catch (error) {
        if (cancelled || !mountedRef.current) return;

        console.warn("Erro ao buscar restaurantes próximos:", error);

        setState({ status: "error", message: FRIENDLY_NETWORK_ERROR_MESSAGE });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // fetchTrigger permite refetch manual sem mudar lat/lng
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, radius, enabled, fetchTrigger]);

  const refetch = useCallback(() => {
    setFetchTrigger((n) => n + 1);
  }, []);

  return {
    state,
    restaurants: state.status === "success" ? state.data : [],
    isLoading: state.status === "loading",
    isError: state.status === "error",
    isEmpty: state.status === "empty",
    errorMessage: state.status === "error" ? state.message : null,
    refetch,
  };
}
