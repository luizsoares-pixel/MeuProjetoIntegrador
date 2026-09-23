import {
  MenuItemResponse,
  RestaurantResponse,
  ToggleFavoriteResponse,
  UserFavoritesResponse,
} from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";
import { AuthenticatedUser } from "../middlewares/auth";

function formatRestaurant(restaurant: any): RestaurantResponse {
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

function formatMenuItem(item: any): MenuItemResponse {
  return {
    id: item.id,
    restaurantId: item.restaurantId,
    category: item.category,
    name: item.name,
    description: item.description ?? null,
    price: Number(item.price),
    photoUrl: item.photoUrl ?? null,
    available: item.available,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export class FavoriteService {
  /**
   * Alterna o estado de favorito de um restaurante para o usuário logado.
   * Trata concorrência capturando P2002 (já criado) e P2025 (já deletado).
   */
  async toggleRestaurantFavorite(
    restaurantId: string,
    actor: AuthenticatedUser
  ): Promise<ToggleFavoriteResponse> {
    if (!actor?.id) {
      throw new Error("AUTH_REQUIRED");
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new Error("RESTAURANT_NOT_FOUND");
    }

    const existing = await prisma.favoriteRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: actor.id,
          restaurantId,
        },
      },
    });

    if (existing) {
      try {
        await prisma.favoriteRestaurant.delete({
          where: {
            userId_restaurantId: {
              userId: actor.id,
              restaurantId,
            },
          },
        });
        return { isFavorite: false };
      } catch (err: any) {
        // Se já foi deletado por uma requisição concorrente simultânea
        if (err?.code === "P2025") {
          return { isFavorite: false };
        }
        throw err;
      }
    } else {
      try {
        await prisma.favoriteRestaurant.create({
          data: {
            userId: actor.id,
            restaurantId,
          },
        });
        return { isFavorite: true };
      } catch (err: any) {
        // Se já foi criado por uma requisição concorrente simultânea
        if (err?.code === "P2002") {
          return { isFavorite: true };
        }
        throw err;
      }
    }
  }

  /**
   * Alterna o estado de favorito de um prato (MenuItem) para o usuário logado.
   * Trata concorrência capturando P2002 (já criado) e P2025 (já deletado).
   */
  async toggleDishFavorite(
    menuItemId: string,
    actor: AuthenticatedUser
  ): Promise<ToggleFavoriteResponse> {
    if (!actor?.id) {
      throw new Error("AUTH_REQUIRED");
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true },
    });

    if (!menuItem) {
      throw new Error("MENU_ITEM_NOT_FOUND");
    }

    const existing = await prisma.favoriteDish.findUnique({
      where: {
        userId_menuItemId: {
          userId: actor.id,
          menuItemId,
        },
      },
    });

    if (existing) {
      try {
        await prisma.favoriteDish.delete({
          where: {
            userId_menuItemId: {
              userId: actor.id,
              menuItemId,
            },
          },
        });
        return { isFavorite: false };
      } catch (err: any) {
        if (err?.code === "P2025") {
          return { isFavorite: false };
        }
        throw err;
      }
    } else {
      try {
        await prisma.favoriteDish.create({
          data: {
            userId: actor.id,
            menuItemId,
          },
        });
        return { isFavorite: true };
      } catch (err: any) {
        if (err?.code === "P2002") {
          return { isFavorite: true };
        }
        throw err;
      }
    }
  }

  /**
   * Retorna os restaurantes e pratos favoritados pelo usuário logado.
   */
  async listUserFavorites(
    actor: AuthenticatedUser
  ): Promise<UserFavoritesResponse> {
    if (!actor?.id) {
      throw new Error("AUTH_REQUIRED");
    }

    const [favRestaurants, favDishes] = await Promise.all([
      prisma.favoriteRestaurant.findMany({
        where: { userId: actor.id },
        include: {
          restaurant: {
            include: {
              photos: { orderBy: { order: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.favoriteDish.findMany({
        where: { userId: actor.id },
        include: {
          menuItem: {
            include: {
              restaurant: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const restaurants: RestaurantResponse[] = favRestaurants
      .filter((fav) => fav.restaurant !== null)
      .map((fav) => formatRestaurant(fav.restaurant));

    const dishes: (MenuItemResponse & { restaurantName?: string })[] = favDishes
      .filter((fav) => fav.menuItem !== null)
      .map((fav) => ({
        ...formatMenuItem(fav.menuItem),
        restaurantName: fav.menuItem.restaurant?.name,
      }));

    return {
      restaurants,
      dishes,
    };
  }
}

export const favoriteService = new FavoriteService();
