import { useCallback, useEffect, useState } from "react";
import type {
  RouteCalculationResult,
  RouteProfile,
} from "@menu-digital/contracts";
import { fetchRestaurantRoute } from "../services/api";
import { fetchOsrmRouteDirect } from "../services/osrm";

export interface UseRouteCalculationProps {
  restaurantId?: string;
  restaurantCoords?: { latitude: number; longitude: number } | null;
  userCoords?: { latitude: number; longitude: number } | null;
  initialProfile?: RouteProfile;
  enabled?: boolean;
}

export interface UseRouteCalculationReturn {
  route: RouteCalculationResult | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  profile: RouteProfile;
  setProfile: (profile: RouteProfile) => void;
  recalculate: () => Promise<void>;
}

/**
 * Hook para gerenciar o cálculo de rota e tempo estimado até um restaurante (HU9).
 * Realiza tentativa inicial pelo backend e fallback resiliente cliente → OSRM / Haversine.
 */
export function useRouteCalculation({
  restaurantId,
  restaurantCoords,
  userCoords,
  initialProfile = "driving",
  enabled = true,
}: UseRouteCalculationProps): UseRouteCalculationReturn {
  const [profile, setProfile] = useState<RouteProfile>(initialProfile);
  const [route, setRoute] = useState<RouteCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    if (!enabled || !userCoords || !restaurantCoords) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Tenta calcular via backend
      if (restaurantId) {
        try {
          const res = await fetchRestaurantRoute(restaurantId, {
            lat: userCoords.latitude,
            lng: userCoords.longitude,
            profile,
          });
          setRoute(res.route);
          return;
        } catch {
          // Se o backend falhar, segue para fallback direto
        }
      }

      // 2. Fallback direto cliente → OSRM (com Haversine automático se OSRM falhar)
      const directRoute = await fetchOsrmRouteDirect({
        originLat: userCoords.latitude,
        originLng: userCoords.longitude,
        destLat: restaurantCoords.latitude,
        destLng: restaurantCoords.longitude,
        profile,
      });
      setRoute(directRoute);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Não foi possível calcular a rota neste momento."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    restaurantId,
    restaurantCoords?.latitude,
    restaurantCoords?.longitude,
    userCoords?.latitude,
    userCoords?.longitude,
    profile,
  ]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    route,
    isLoading,
    isError: Boolean(errorMessage),
    errorMessage,
    profile,
    setProfile,
    recalculate: calculate,
  };
}
