import {
  CreateRestaurantInput,
  ListRestaurantsQuery,
  NearbyRestaurantResponse,
  NearbyRestaurantsQuery,
  PaginatedRestaurantsResponse,
  RestaurantResponse,
  RestaurantSortBy,
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
    distanceInMeters:
      restaurant.distanceInMeters !== undefined
        ? Math.round(restaurant.distanceInMeters)
        : undefined,
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
export function haversineDistance(
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

const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function getBrasiliaDateParts(date: Date = new Date()): {
  dayOfWeek: string;
  previousDayOfWeek: string;
  currentTimeString: string;
} {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = dtf.formatToParts(date);
  const weekdayPart =
    parts.find((p) => p.type === "weekday")?.value?.toLowerCase() ?? "monday";
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minutePart = parts.find((p) => p.type === "minute")?.value ?? "00";

  const dayIndex = DAYS_OF_WEEK.indexOf(weekdayPart as any);
  const prevDayIndex = (dayIndex + 6) % 7;
  const currentDay = DAYS_OF_WEEK[dayIndex >= 0 ? dayIndex : 1];
  const previousDay = DAYS_OF_WEEK[prevDayIndex];

  const currentTimeString = `${hourPart.padStart(2, "0")}:${minutePart.padStart(2, "0")}`;

  return {
    dayOfWeek: currentDay,
    previousDayOfWeek: previousDay,
    currentTimeString,
  };
}

/**
 * Avalia se o restaurante está aberto no momento com base no horário de Brasília (UTC-3),
 * tratando múltiplos turnos por dia e turnos noturnos que cruzam a meia-noite (overnight shifts).
 */
export function isRestaurantOpen(
  businessHours: any,
  referenceDate: Date = new Date()
): boolean {
  if (!businessHours || typeof businessHours !== "object") {
    return false;
  }

  const { dayOfWeek, previousDayOfWeek, currentTimeString } =
    getBrasiliaDateParts(referenceDate);

  // 1. Turnos cadastrados para o dia corrente
  const todayShifts = businessHours[dayOfWeek];
  if (Array.isArray(todayShifts)) {
    for (const shift of todayShifts) {
      if (!shift || typeof shift.open !== "string" || typeof shift.close !== "string") {
        continue;
      }
      const { open, close } = shift;

      // 24 horas ininterruptas
      if (open === close) {
        return true;
      }

      // Turno regular no mesmo dia (ex: 11:30 às 15:00)
      if (open < close) {
        if (currentTimeString >= open && currentTimeString < close) {
          return true;
        }
      } else {
        // Turno noturno que vira a noite (ex: 18:00 às 02:00)
        // Durante a noite de hoje: a partir da abertura
        if (currentTimeString >= open) {
          return true;
        }
      }
    }
  }

  // 2. Turnos noturnos iniciados ontem que adentram a madrugada de hoje
  const yesterdayShifts = businessHours[previousDayOfWeek];
  if (Array.isArray(yesterdayShifts)) {
    for (const shift of yesterdayShifts) {
      if (!shift || typeof shift.open !== "string" || typeof shift.close !== "string") {
        continue;
      }
      const { open, close } = shift;

      // Se iniciou ontem e o fechamento é menor que a abertura (overnight)
      if (open > close) {
        if (currentTimeString < close) {
          return true;
        }
      }
    }
  }

  return false;
}

const PRICE_RANGE_WEIGHTS: Record<string, number> = {
  $: 1,
  CHEAP: 1,
  $$: 2,
  MODERATE: 2,
  $$$: 3,
  EXPENSIVE: 3,
};

/**
 * Ordena a lista de restaurantes em memória pelo critério informado (HU8).
 * Suporta distance, rating, priceAsc e priceDesc com desempate em createdAt decrescente.
 */
export function sortRestaurants<
  T extends {
    distanceInMeters?: number;
    rating?: number | null;
    priceRange?: string | null;
    createdAt: Date | string;
  },
>(items: T[], sortBy?: RestaurantSortBy): T[] {
  if (!sortBy) {
    return items;
  }

  return [...items].sort((a, b) => {
    if (sortBy === "distance") {
      const distA = a.distanceInMeters !== undefined ? a.distanceInMeters : Infinity;
      const distB = b.distanceInMeters !== undefined ? b.distanceInMeters : Infinity;
      if (distA !== distB) return distA - distB;
    } else if (sortBy === "rating") {
      const ratingA = a.rating !== null && a.rating !== undefined ? a.rating : -1;
      const ratingB = b.rating !== null && b.rating !== undefined ? b.rating : -1;
      if (ratingA !== ratingB) return ratingB - ratingA;
    } else if (sortBy === "priceAsc") {
      const weightA =
        a.priceRange && PRICE_RANGE_WEIGHTS[a.priceRange] !== undefined
          ? PRICE_RANGE_WEIGHTS[a.priceRange]
          : 999;
      const weightB =
        b.priceRange && PRICE_RANGE_WEIGHTS[b.priceRange] !== undefined
          ? PRICE_RANGE_WEIGHTS[b.priceRange]
          : 999;
      if (weightA !== weightB) return weightA - weightB;
    } else if (sortBy === "priceDesc") {
      const weightA =
        a.priceRange && PRICE_RANGE_WEIGHTS[a.priceRange] !== undefined
          ? PRICE_RANGE_WEIGHTS[a.priceRange]
          : -1;
      const weightB =
        b.priceRange && PRICE_RANGE_WEIGHTS[b.priceRange] !== undefined
          ? PRICE_RANGE_WEIGHTS[b.priceRange]
          : -1;
      if (weightA !== weightB) return weightB - weightA;
    }

    // Critério de desempate: mais recente primeiro
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA;
  });
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

    if (query.priceRange && query.priceRange.length > 0) {
      where.priceRange = { in: query.priceRange };
    }

    if (query.minRating !== undefined) {
      where.rating = { gte: query.minRating };
    }

    const hasDistanceFilter =
      query.maxDistance !== undefined &&
      query.lat !== undefined &&
      query.lng !== undefined;

    if (hasDistanceFilter) {
      const latDelta = query.maxDistance! / 111_320;
      const lngDelta =
        query.maxDistance! /
        (111_320 * Math.cos((query.lat! * Math.PI) / 180));

      where.latitude = {
        gte: query.lat! - latDelta,
        lte: query.lat! + latDelta,
      };
      where.longitude = {
        gte: query.lng! - lngDelta,
        lte: query.lng! + lngDelta,
      };
    }

    const needsInMemoryFiltering =
      query.openNow === true ||
      hasDistanceFilter ||
      query.sortBy === "distance";

    if (needsInMemoryFiltering) {
      const candidates = await prisma.restaurant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          photos: { orderBy: { order: "asc" } },
        },
      });

      let filtered: Array<
        (typeof candidates)[number] & { distanceInMeters?: number }
      > = candidates;

      if (query.lat !== undefined && query.lng !== undefined) {
        filtered = filtered.map((r) => ({
          ...r,
          distanceInMeters: haversineDistance(
            query.lat!,
            query.lng!,
            r.latitude,
            r.longitude
          ),
        }));
      }

      if (hasDistanceFilter) {
        filtered = filtered.filter(
          (r) => (r.distanceInMeters ?? Infinity) <= query.maxDistance!
        );
      }

      if (query.openNow === true) {
        filtered = filtered.filter((r) => isRestaurantOpen(r.businessHours));
      }

      if (query.sortBy) {
        filtered = sortRestaurants(filtered, query.sortBy);
      }

      const total = filtered.length;
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
      const hasMore = page < totalPages;
      const pagedSlice = filtered.slice(skip, skip + limit);

      return {
        restaurants: pagedSlice.map(formatRestaurantResponse),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      };
    }

    let orderBy: any = { createdAt: "desc" };
    if (query.sortBy === "rating") {
      orderBy = [{ rating: "desc" }, { createdAt: "desc" }];
    } else if (query.sortBy === "priceAsc") {
      orderBy = [{ priceRange: "asc" }, { createdAt: "desc" }];
    } else if (query.sortBy === "priceDesc") {
      orderBy = [{ priceRange: "desc" }, { createdAt: "desc" }];
    }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          photos: { orderBy: { order: "asc" } },
        },
      }),
      prisma.restaurant.count({ where }),
    ]);

    let results = restaurants;
    if (query.lat !== undefined && query.lng !== undefined) {
      results = results.map((r) => ({
        ...r,
        distanceInMeters: haversineDistance(
          query.lat!,
          query.lng!,
          r.latitude,
          r.longitude
        ),
      }));
    }

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      restaurants: results.map(formatRestaurantResponse),
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

