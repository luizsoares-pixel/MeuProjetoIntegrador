import {
  CreateRestaurantInput,
  NearbyRestaurantResponse,
  NearbyRestaurantsQuery,
  RestaurantResponse,
} from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Fórmula de Haversine — calcula a distância em metros entre dois pontos
 * geográficos (lat/lng em graus decimais).
 *
 * Referência: Sinnott, R.W. (1984). "Virtues of the Haversine."
 *             Sky and Telescope, 68(2), 158.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export class RestaurantService {
  /**
   * Retorna restaurantes próximos a uma coordenada, ordenados por distância crescente.
   * Filtra no banco pelo bounding box (otimização) e refina com Haversine no processo.
   *
   * @param query - Coordenadas e raio de busca validados
   * @returns Lista de restaurantes com `distanceInMeters`, ou lista vazia
   */
  async findNearby(query: NearbyRestaurantsQuery): Promise<NearbyRestaurantResponse[]> {
    const { lat, lng, radius } = query;

    // Bounding box aproximado para reduzir o número de registros trazidos do banco.
    // 1 grau de latitude ≈ 111 320 m; longitude varia por latitude (pior caso = equador).
    const latDelta = radius / 111_320;
    const lngDelta = radius / (111_320 * Math.cos((lat * Math.PI) / 180));

    const candidates = await prisma.restaurant.findMany({
      where: {
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
    });

    const results: NearbyRestaurantResponse[] = candidates
      .map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        cuisineType: restaurant.cuisineType,
        imageUrl: restaurant.imageUrl,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        ownerId: restaurant.ownerId,
        distanceInMeters: haversineDistance(
          lat,
          lng,
          restaurant.latitude,
          restaurant.longitude
        ),
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      }))
      .filter((r) => (r.distanceInMeters ?? 0) <= radius)
      .sort((a, b) => (a.distanceInMeters ?? 0) - (b.distanceInMeters ?? 0));

    return results;
  }

  /**
   * Cria um novo restaurante vinculado ao usuário autenticado (owner).
   *
   * @param data - Dados validados do restaurante
   * @param ownerId - UUID do usuário proprietário
   * @returns Restaurante criado
   */
  async create(
    data: CreateRestaurantInput,
    ownerId: string
  ): Promise<RestaurantResponse> {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        cuisineType: data.cuisineType,
        imageUrl: data.imageUrl ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        ownerId,
      },
    });

    return {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      cuisineType: restaurant.cuisineType,
      imageUrl: restaurant.imageUrl,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      ownerId: restaurant.ownerId,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }
}

export const restaurantService = new RestaurantService();
