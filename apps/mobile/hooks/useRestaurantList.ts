import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationMeta, RestaurantResponse } from "@menu-digital/contracts";
import { fetchRestaurants } from "../services/api";
import { FRIENDLY_NETWORK_ERROR_MESSAGE } from "../constants/network";

interface UseRestaurantListOptions {
  limit?: number;
  search?: string;
  cuisine?: string | null;
  city?: string | null;
  priceRange?: string | string[] | null;
  minRating?: number | null;
  maxDistance?: number | null;
  openNow?: boolean | null;
  sortBy?: string | null;
  lat?: number | null;
  lng?: number | null;
  autoLoad?: boolean;
  debounceMs?: number;
}

interface UseRestaurantListReturn {
  restaurants: RestaurantResponse[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isError: boolean;
  isEmpty: boolean;
  isSearching: boolean;
  activeFilterCount: number;
  errorMessage: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

/**
 * Hook para gerenciar o feed paginado de restaurantes com busca e filtros avançados (HU5, HU6 & HU7).
 * Suporta debounce automático de 400ms para o termo de busca, scroll infinito,
 * pull-to-refresh e prevenção contra race conditions na digitação.
 */
export function useRestaurantList({
  limit = 10,
  search = "",
  cuisine = null,
  city = null,
  priceRange = null,
  minRating = null,
  maxDistance = null,
  openNow = null,
  sortBy = null,
  lat = null,
  lng = null,
  autoLoad = true,
  debounceMs = 400,
}: UseRestaurantListOptions = {}): UseRestaurantListReturn {
  const [restaurants, setRestaurants] = useState<RestaurantResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Termo com debounce
  const [debouncedSearch, setDebouncedSearch] = useState<string>(search);

  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Aplica debounce no termo search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [search, debounceMs]);

  const loadFirstPage = useCallback(
    async (isRefreshOperation = false) => {
      const currentSeq = ++requestSeqRef.current;

      if (isRefreshOperation) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const response = await fetchRestaurants({
          page: 1,
          limit,
          search: debouncedSearch.trim() || undefined,
          cuisine: cuisine?.trim() || undefined,
          city: city?.trim() || undefined,
          priceRange: priceRange || undefined,
          minRating: minRating ?? undefined,
          maxDistance: maxDistance ?? undefined,
          openNow: openNow ?? undefined,
          sortBy: sortBy?.trim() || undefined,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        });

        // Ignora respostas desatualizadas caso uma nova requisição tenha sido disparada
        if (!mountedRef.current || currentSeq !== requestSeqRef.current) return;

        setRestaurants(response.restaurants);
        setPagination(response.pagination);
      } catch (error) {
        if (!mountedRef.current || currentSeq !== requestSeqRef.current) return;

        if (__DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_RESTAURANTS === "true") {
          setRestaurants([]);
          setPagination(null);
          return;
        }

        console.warn("Erro ao carregar restaurantes:", error);
        setErrorMessage(FRIENDLY_NETWORK_ERROR_MESSAGE);
      } finally {
        if (mountedRef.current && currentSeq === requestSeqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      limit,
      debouncedSearch,
      cuisine,
      city,
      priceRange,
      minRating,
      maxDistance,
      openNow,
      sortBy,
      lat,
      lng,
    ]
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
      const response = await fetchRestaurants({
        page: nextPage,
        limit,
        search: debouncedSearch.trim() || undefined,
        cuisine: cuisine?.trim() || undefined,
        city: city?.trim() || undefined,
        priceRange: priceRange || undefined,
        minRating: minRating ?? undefined,
        maxDistance: maxDistance ?? undefined,
        openNow: openNow ?? undefined,
        sortBy: sortBy?.trim() || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
      });

      if (!mountedRef.current) return;

      setRestaurants((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newUnique = response.restaurants.filter(
          (r) => !existingIds.has(r.id)
        );
        return [...prev, ...newUnique];
      });
      setPagination(response.pagination);
    } catch (error) {
      if (!mountedRef.current) return;
      console.warn("Erro ao carregar mais restaurantes:", error);
    } finally {
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
      isFetchingRef.current = false;
    }
  }, [
    isLoading,
    isLoadingMore,
    isRefreshing,
    pagination,
    limit,
    debouncedSearch,
    cuisine,
    city,
    priceRange,
    minRating,
    maxDistance,
    openNow,
    sortBy,
    lat,
    lng,
  ]);

  const refresh = useCallback(async () => {
    await loadFirstPage(true);
  }, [loadFirstPage]);

  const retry = useCallback(async () => {
    await loadFirstPage(false);
  }, [loadFirstPage]);

  // Dispara busca inicial ou sempre que os filtros/busca debounced mudarem
  useEffect(() => {
    if (autoLoad) {
      loadFirstPage(false);
    }
  }, [autoLoad, loadFirstPage]);

  // Contagem de filtros ativos
  const hasPriceFilter = Boolean(
    priceRange &&
      (Array.isArray(priceRange) ? priceRange.length > 0 : priceRange.trim() !== "")
  );
  const hasRatingFilter = minRating !== undefined && minRating !== null;
  const hasDistanceFilter = maxDistance !== undefined && maxDistance !== null;
  const hasOpenNowFilter = openNow === true;

  const activeFilterCount =
    (cuisine && cuisine.trim() !== "" ? 1 : 0) +
    (city && city.trim() !== "" ? 1 : 0) +
    (hasPriceFilter ? 1 : 0) +
    (hasRatingFilter ? 1 : 0) +
    (hasDistanceFilter ? 1 : 0) +
    (hasOpenNowFilter ? 1 : 0);

  const isSearching = Boolean(
    (debouncedSearch && debouncedSearch.trim() !== "") || activeFilterCount > 0
  );

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
    isSearching,
    activeFilterCount,
    errorMessage,
    hasMore,
    refresh,
    loadMore,
    retry,
  };
}
