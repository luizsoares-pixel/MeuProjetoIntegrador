import {
  CreateMenuItemInput,
  MenuItemResponse,
  UpdateMenuItemInput,
} from "@menu-digital/contracts";
import { AuthenticatedUser } from "../middlewares/auth";
import { prisma } from "../lib/prisma";

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

export class MenuService {
  private assertOwner(actor: AuthenticatedUser, ownerId: string | null | undefined) {
    if (actor.role !== "restaurant" || actor.id !== ownerId) {
      throw new Error("MENU_ITEM_FORBIDDEN");
    }
  }

  async list(restaurantId: string): Promise<MenuItemResponse[]> {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return items.map(formatMenuItem);
  }

  async create(
    restaurantId: string,
    data: CreateMenuItemInput,
    actor: AuthenticatedUser
  ): Promise<MenuItemResponse> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    });
    if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");
    this.assertOwner(actor, restaurant.ownerId);

    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        category: data.category,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        photoUrl: data.photoUrl ?? null,
        available: data.available ?? true,
      },
    });
    return formatMenuItem(item);
  }

  async update(
    id: string,
    data: UpdateMenuItemInput,
    actor: AuthenticatedUser
  ): Promise<MenuItemResponse> {
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: { select: { ownerId: true } } },
    });
    if (!item) throw new Error("MENU_ITEM_NOT_FOUND");
    this.assertOwner(actor, item.restaurant.ownerId);

    const updated = await prisma.menuItem.update({ where: { id }, data });
    return formatMenuItem(updated);
  }

  async delete(id: string, actor: AuthenticatedUser): Promise<void> {
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: { select: { ownerId: true } } },
    });
    if (!item) throw new Error("MENU_ITEM_NOT_FOUND");
    this.assertOwner(actor, item.restaurant.ownerId);
    await prisma.menuItem.delete({ where: { id } });
  }
}

export const menuService = new MenuService();