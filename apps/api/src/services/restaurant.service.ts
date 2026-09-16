import {
  CreateRestaurantInput,
  ListRestaurantsQuery,
  NearbyRestaurantResponse,
  NearbyRestaurantsQuery,
  PaginatedRestaurantsResponse,
  RestaurantResponse,
  UpdateRestaurantProfileInput,
} from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";

const EARTH_RADIUS_METERS = 6_371_000;

function formatRestaurantResponse(restaurant: any): RestaurantResponse {
  return {
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    cuisineType: restaurant.cuisineType,
    imageUrl: restaurant.imageUrl,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    ownerId: restaurant.ownerId,
    phone: restaurant.phone,
    cnpj: restaurant.cnpj,
    description: restaurant.description,
    priceRange: restaurant.priceRange,
    rating: restaurant.rating ?? null,
    businessHours: restaurant.businessHours,
    paymentMethods: restaurant.paymentMethods,
    socialLinks: restaurant.socialLinks,
    street: restaurant.street,
    number: restaurant.number,
    complement: restaurant.complement,
    neighborhood: restaurant.neighborhood,
    city: restaurant.city,
    state: restaurant.state,
    postalCode: restaurant.postalCode,
    photos: restaurant.photos
      ? restaurant.photos.map((p: any) => ({
          id: p.id,
          restaurantId: p.restaurantId,
          url: p.url,
          order: p.order,
          createdAt: p.createdAt,
        }))
      : undefined,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt,
  };
}

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
    if (ownerId) {
      await prisma.user.upsert({
        where: { id: ownerId },
        update: {},
        create: {
          id: ownerId,
          email: `${ownerId}@auth.supabase`,
        },
      });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        cuisineType: data.cuisineType,
        imageUrl: data.imageUrl ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        ownerId,
        phone: data.phone ?? null,
        cnpj: data.cnpj ?? null,
      },
    });

    return formatRestaurantResponse(restaurant);
  }

  /**
   * Recupera o perfil do restaurante do proprietário autenticado.
   */
  async getProfile(ownerId: string): Promise<RestaurantResponse | null> {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId },
      include: {
        photos: { orderBy: { order: "asc" } },
      },
    });

    if (!restaurant) return null;
    return formatRestaurantResponse(restaurant);
  }

  /**
   * Atualiza as informações cadastrais, de perfil e galeria de fotos do restaurante.
   */
  async updateProfile(
    ownerId: string,
    data: UpdateRestaurantProfileInput
  ): Promise<RestaurantResponse> {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId },
    });

    if (!restaurant) {
      throw new Error("RESTAURANT_NOT_FOUND");
    }

    if (data.photos !== undefined) {
      await prisma.restaurantPhoto.deleteMany({
        where: { restaurantId: restaurant.id },
      });
      if (data.photos.length > 0) {
        await prisma.restaurantPhoto.createMany({
          data: data.photos.map((url, index) => ({
            restaurantId: restaurant.id,
            url,
            order: index,
          })),
        });
      }
    }

    const { photos, ...restaurantFields } = data;

    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        ...(restaurantFields as any),
      },
      include: {
        photos: { orderBy: { order: "asc" } },
      },
    });

    return formatRestaurantResponse(updated);
  }

  /**
   * Recupera um restaurante por ID com seus dados completos e galeria de fotos.
   */
  async getById(id: string): Promise<RestaurantResponse | null> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { order: "asc" } },
      },
    });

    if (!restaurant) return null;
    return formatRestaurantResponse(restaurant);
  }

  /**
   * Retorna a listagem paginada de restaurantes ordenada pelos mais recentes primeiro.
   *
   * @param query - Parâmetros validados com page e limit
   * @returns Restaurantes formatados e metadados de paginação
   */
  async list(query: ListRestaurantsQuery): Promise<PaginatedRestaurantsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.cuisine && query.cuisine.trim() !== "") {
      where.cuisineType = {
        contains: query.cuisine.trim(),
        mode: "insensitive",
      };
    }

    if (query.city && query.city.trim() !== "") {
      where.city = {
        contains: query.city.trim(),
        mode: "insensitive",
      };
    }

    if (query.search && query.search.trim() !== "") {
      const searchTerm = query.search.trim();
      let matchedIds: string[] | null = null;

      try {
        if (typeof (prisma as any).$queryRaw === "function") {
          const rawResult = await (prisma as any).$queryRaw`
            SELECT id FROM "restaurants"
            WHERE unaccent("name") ILIKE unaccent(${`%${searchTerm}%`})
          `;
          if (Array.isArray(rawResult)) {
            matchedIds = rawResult.map((r: any) => r.id);
          }
        }
      } catch {
        matchedIds = null;
      }

      if (matchedIds !== null) {
        where.id = { in: matchedIds };
      } else {
        where.name = {
          contains: searchTerm,
          mode: "insensitive",
        };
      }
    }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          photos: { orderBy: { order: "asc" } },
        },
      }),
      prisma.restaurant.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      restaurants: restaurants.map(formatRestaurantResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };
  }
}

export const restaurantService = new RestaurantService();

