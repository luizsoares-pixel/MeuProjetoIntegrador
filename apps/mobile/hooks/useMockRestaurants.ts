import { useMemo } from "react";
import type { NearbyRestaurant } from "../services/api";

/**
 * Gera restaurantes fictícios deterministicamente para validação de clustering.
 *
 * Disponível APENAS em modo desenvolvimento (__DEV__).
 * Em produção retorna sempre array vazio — nenhum dado falso em prod.
 *
 * Usa LCG (Linear Congruential Generator) com seed fixo para que o array
 * gerado seja idêntico entre renders (sem causar re-renders em cascata).
 *
 * Critério de aceite #35: mínimo 50 restaurantes fictícios para validação
 * de performance e comportamento de clustering.
 */
export function useMockRestaurants(
  centerLat: number | null,
  centerLng: number | null,
  count = 80
): NearbyRestaurant[] {
  return useMemo(() => {
    if (!__DEV__ || centerLat === null || centerLng === null) return [];

    // LCG determinístico — mesmo seed = mesmo resultado entre renders
    let state = 42;
    function lcgNext(): number {
      state = ((state * 1_664_525 + 1_013_904_223) >>> 0);
      return state / 0xffff_ffff;
    }

    const mockNames = [
      "Brasa & Bistrô",
      "Sabor do Bairro",
      "La Mesa",
      "Canto da Praça",
      "Ponto da Feira",
      "Aroma do Centro",
      "Bistro Verde",
      "Casa do Pão",
      "Vila Grill",
      "Sushi & Co",
      "Rota do Sabores",
      "Pátio Gourmet",
      "Taberna do Largo",
      "Fogão da Rua",
      "Café do Mercado",
    ];

    return Array.from({ length: count }, (_, i) => {
      // Distribui em uma área de ~13 km × 13 km ao redor do centro
      const latOffset = (lcgNext() - 0.5) * 0.12;
      const lngOffset = (lcgNext() - 0.5) * 0.12;
      const distance  = lcgNext() * 6_000;
      const name = mockNames[i % mockNames.length];
      const suffix = i >= mockNames.length ? ` ${Math.floor(i / mockNames.length) + 2}` : "";

      return {
        id: `mock-${i}`,
        name: `${name}${suffix}`,
        address: `Rua ${i + 12}, ${Math.floor(i / 4) + 1}º andar`,
        imageUrl: null,
        latitude:  centerLat + latOffset,
        longitude: centerLng + lngOffset,
        distanceInMeters: distance,
      } satisfies NearbyRestaurant;
    });
  }, [centerLat, centerLng, count]);
}
