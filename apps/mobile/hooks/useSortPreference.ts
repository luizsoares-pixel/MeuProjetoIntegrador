import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SortByOption = "distance" | "rating" | "priceAsc" | "priceDesc";

export const SORT_STORAGE_KEY = "@menu-digital:sort_by";

export const SORT_OPTIONS: {
  value: SortByOption;
  label: string;
  icon: "map-marker-distance" | "star" | "currency-usd" | "diamond-stone";
  requiresLocation?: boolean;
}[] = [
  { value: "distance", label: "Mais próximos", icon: "map-marker-distance", requiresLocation: true },
  { value: "rating", label: "Melhor avaliados", icon: "star" },
  { value: "priceAsc", label: "Menor preço", icon: "currency-usd" },
  { value: "priceDesc", label: "Maior preço", icon: "diamond-stone" },
];

type Listener = (val: SortByOption) => void;
const listeners = new Set<Listener>();

export function notifySortPreferenceChange(newSort: SortByOption) {
  listeners.forEach((listener) => listener(newSort));
}

interface UseSortPreferenceReturn {
  sortBy: SortByOption;
  setSortBy: (option: SortByOption) => Promise<void>;
  isLoaded: boolean;
}

/**
 * Hook para gerenciar e persistir a preferência de ordenação do usuário entre telas (HU8).
 * Padrão: 'distance' se a localização estiver disponível e autorizada, senão 'rating'.
 * Mantém todas as instâncias montadas sincronizadas em tempo real via pub/sub interno.
 */
export function useSortPreference(hasLocation: boolean = false): UseSortPreferenceReturn {
  const defaultSort: SortByOption = hasLocation ? "distance" : "rating";
  const [sortBy, setSortByState] = useState<SortByOption>(defaultSort);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const listener: Listener = (val) => {
      if (val === "distance" && !hasLocation) {
        setSortByState("rating");
      } else {
        setSortByState(val);
      }
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [hasLocation]);

  useEffect(() => {
    let isMounted = true;

    async function loadPreference() {
      try {
        const stored = await AsyncStorage.getItem(SORT_STORAGE_KEY);
        if (!isMounted) return;

        if (
          stored &&
          (stored === "distance" ||
            stored === "rating" ||
            stored === "priceAsc" ||
            stored === "priceDesc")
        ) {
          // Se estava salvo como distance mas não há permissão/localização, faz fallback para rating
          if (stored === "distance" && !hasLocation) {
            setSortByState("rating");
          } else {
            setSortByState(stored as SortByOption);
          }
        } else {
          setSortByState(hasLocation ? "distance" : "rating");
        }
      } catch {
        if (isMounted) {
          setSortByState(hasLocation ? "distance" : "rating");
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, [hasLocation]);

  const setSortBy = useCallback(async (newSort: SortByOption) => {
    setSortByState(newSort);
    notifySortPreferenceChange(newSort);
    try {
      await AsyncStorage.setItem(SORT_STORAGE_KEY, newSort);
    } catch (err) {
      console.warn("Erro ao salvar preferência de ordenação:", err);
    }
  }, []);

  return {
    sortBy,
    setSortBy,
    isLoaded,
  };
}
