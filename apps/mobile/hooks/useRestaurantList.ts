import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationMeta, RestaurantResponse } from "@menu-digital/contracts";
import { fetchRestaurants } from "../services/api";

interface UseRestaurantListOptions {
  limit?: number;
  autoLoad?: boolean;
}

interface UseRestaurantListReturn {
  restaurants: RestaurantResponse[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

/**
 * Hook para gerenciar o feed paginado de restaurantes (HU5).
 * Suporta carregamento inicial com skeleton, scroll infinito,
 * pull-to-refresh e recuperação de erros de rede com retry.
 */
export function useRestaurantList({
  limit = 10,
  autoLoad = true,
}: UseRestaurantListOptions = {}): UseRestaurantListReturn {
  const [restaurants, setRestaurants] = useState<RestaurantResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadFirstPage = useCallback(
    async (isRefreshOperation = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isRefreshOperation) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const response = await fetchRestaurants({ page: 1, limit });
        if (!mountedRef.current) return;

        setRestaurants(response.restaurants);
        setPagination(response.pagination);
      } catch (err: any) {
        if (!mountedRef.current) return;
        setErrorMessage(
          err?.message || "Não foi possível conectar ao servidor. Tente novamente."
        );
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
        isFetchingRef.current = false;
      }
    },
    [limit]
  );

  const loadMore = useCallback(async () => {
    if (
      isFetchingRef.current ||
      isLoading ||
      isLoadingMore ||
      isRefreshing ||
      !pagination?.hasMore
    ) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const nextPage = pagination.page + 1;
      const response = await fetchRestaurants({ page: nextPage, limit });
      if (!mountedRef.current) return;

      setRestaurants((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newUnique = response.restaurants.filter(
          (r) => !existingIds.has(r.id)
        );
        return [...prev, ...newUnique];
      });
      setPagination(response.pagination);
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.warn("Erro ao carregar mais restaurantes:", err?.message);
    } finally {
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
      isFetchingRef.current = false;
    }
  }, [isLoading, isLoadingMore, isRefreshing, pagination, limit]);

  const refresh = useCallback(async () => {
    await loadFirstPage(true);
  }, [loadFirstPage]);

  const retry = useCallback(async () => {
    await loadFirstPage(false);
  }, [loadFirstPage]);

  useEffect(() => {
    if (autoLoad) {
      loadFirstPage(false);
    }
  }, [autoLoad, loadFirstPage]);

  const isEmpty = !isLoading && !errorMessage && restaurants.length === 0;
  const isError = !isLoading && !!errorMessage && restaurants.length === 0;
  const hasMore = Boolean(pagination?.hasMore);

  return {
    restaurants,
    pagination,
    isLoading,
    isLoadingMore,
    isRefreshing,
    isError,
    isEmpty,
    errorMessage,
    hasMore,
    refresh,
    loadMore,
    retry,
  };
}
