import Supercluster from "supercluster";
import type { ClusterFeature, ClusterOrPoint } from "supercluster";
import { useMemo } from "react";
import type { Region } from "react-native-maps";
import type { NearbyRestaurant } from "../services/api";

/** Propriedades injetadas em cada ponto individual pelo supercluster */
export interface RestaurantProperties {
  restaurant: NearbyRestaurant;
}

/**
 * Type guard que identifica se uma feature é um agrupamento de pontos (cluster)
 * ou um restaurante individual, garantindo narrowing estrito de tipos.
 */
export function isCluster(
  feature: ClusterOrPoint<RestaurantProperties>
): feature is ClusterFeature {
  return Boolean(feature.properties.cluster);
}

/**
 * Converte o latitudeDelta do react-native-maps para nível de zoom inteiro (0-20).
 * Fórmula inversa de: latitudeDelta ≈ 360 / 2^zoom
 *
 * Inclui guard clause defensivo contra valores <= 0 ou NaN gerados
 * durante inicialização rápida ou transições de layout no Android.
 */
function regionToZoom(latitudeDelta: number): number {
  if (!latitudeDelta || latitudeDelta <= 0 || Number.isNaN(latitudeDelta)) {
    return 15;
  }
  return Math.min(20, Math.max(0, Math.round(Math.log2(360 / latitudeDelta))));
}

/**
 * Hook que calcula clusters de restaurantes para a região e zoom atuais do mapa.
 *
 * Dois useMemo em níveis separados (SRP — cada memo tem uma responsabilidade):
 *  - Nível 1: supercluster.load() → O(n log n), roda apenas quando `restaurants` muda.
 *  - Nível 2: getClusters()       → O(k), roda em cada pan/zoom do usuário.
 *
 * Referência: supercluster (Mapbox) — https://github.com/mapbox/supercluster
 */
export function useMapClusters(
  restaurants: NearbyRestaurant[],
  region: Region
) {
  // ── Nível 1: indexação — recria só quando os dados mudam ─────────────────
  const sc = useMemo(() => {
    const instance = new Supercluster<RestaurantProperties>({
      radius: 48,   // raio de agrupamento em pixels de tile
      maxZoom: 16,  // zoom máximo em que clusters são formados
      minZoom: 1,
      minPoints: 2, // mínimo de pontos para formar um cluster
    });

    instance.load(
      restaurants.map((r) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [r.longitude, r.latitude],
        },
        properties: { restaurant: r },
      }))
    );

    return instance;
  }, [restaurants]);

  // ── Nível 2: consulta — recalcula a cada mudança de região/zoom ──────────
  const clusters = useMemo(() => {
    const zoom = regionToZoom(region.latitudeDelta);

    const bbox: [number, number, number, number] = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude  - region.latitudeDelta  / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude  + region.latitudeDelta  / 2,
    ];

    return sc.getClusters(bbox, zoom);
  }, [sc, region]);

  /**
   * Retorna o zoom de expansão necessário para revelar os pins individuais
   * de um cluster. Usado para animar o mapa ao tocar num cluster.
   */
  function expandCluster(clusterId: number): number {
    return sc.getClusterExpansionZoom(clusterId);
  }

  return { clusters, expandCluster };
}
