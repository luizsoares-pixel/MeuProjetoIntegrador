import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "../lib/prisma";
import { MenuService, menuService } from "../services/menu.service";
import { menuController } from "../controllers/menu.controller";

const restaurantId = "11111111-1111-1111-1111-111111111111";
const ownerId = "22222222-2222-2222-2222-222222222222";
const itemId = "33333333-3333-3333-3333-333333333333";

function menuItem(overrides: Record<string, unknown> = {}) {
  return {
    id: itemId,
    restaurantId,
    category: "Pratos principais",
    name: "Feijoada",
    description: "Feijoada da casa",
    price: 39.9,
    photoUrl: "https://example.com/feijoada.jpg",
    available: true,
    createdAt: new Date("2026-09-17T12:00:00Z"),
    updatedAt: new Date("2026-09-17T12:00:00Z"),
    ...overrides,
  };
}

describe("MenuService", () => {
  it("permite criar item somente para o owner com role restaurant", async () => {
    (prisma as any).restaurant = {
      findUnique: async () => ({ ownerId }),
    };
    (prisma as any).menuItem = {
      create: async () => menuItem(),
    };

    const result = await new MenuService().create(
      restaurantId,
      {
        category: "Pratos principais",
        name: "Feijoada",
        description: "Feijoada da casa",
        price: 39.9,
        photoUrl: "https://example.com/feijoada.jpg",
        available: true,
      },
      { id: ownerId, role: "restaurant" }
    );

    assert.equal(result.id, itemId);
    assert.equal(result.price, 39.9);
  });

  it("nega edição quando outro owner tenta alterar o cardápio", async () => {
    (prisma as any).menuItem = {
      findUnique: async () => ({
        ...menuItem(),
        restaurant: { ownerId },
      }),
    };

    await assert.rejects(
      () =>
        new MenuService().update(
          itemId,
          { available: false },
          { id: "44444444-4444-4444-4444-444444444444", role: "restaurant" }
        ),
      (error: Error) => error.message === "MENU_ITEM_FORBIDDEN"
    );
  });

  it("nega criação para usuário sem role restaurant mesmo sendo owner", async () => {
    (prisma as any).restaurant = {
      findUnique: async () => ({ ownerId }),
    };

    await assert.rejects(
      () =>
        new MenuService().create(
          restaurantId,
          { category: "Bebidas", name: "Água", price: 5, available: true },
          { id: ownerId, role: "user" }
        ),
      (error: Error) => error.message === "MENU_ITEM_FORBIDDEN"
    );
  });

  it("retorna todos os itens, inclusive indisponíveis, agrupáveis por categoria", async () => {
    (prisma as any).menuItem = {
      findMany: async () => [menuItem(), menuItem({ id: "44444444-4444-4444-4444-444444444444", category: "Bebidas", available: false })],
    };

    const result = await new MenuService().list(restaurantId);

    assert.equal(result.length, 2);
    assert.equal(result[1].available, false);
  });

  it("permite exclusao de item pelo owner com role restaurant", async () => {
    let deletedId: string | null = null;
    (prisma as any).menuItem = {
      findUnique: async () => ({
        ...menuItem(),
        restaurant: { ownerId },
      }),
      delete: async ({ where }: { where: { id: string } }) => {
        deletedId = where.id;
        return menuItem();
      },
    };

    await new MenuService().delete(itemId, { id: ownerId, role: "restaurant" });
    assert.equal(deletedId, itemId);
  });

  it("nega exclusao quando outro usuario tenta deletar o item", async () => {
    (prisma as any).menuItem = {
      findUnique: async () => ({
        ...menuItem(),
        restaurant: { ownerId },
      }),
    };

    await assert.rejects(
      () =>
        new MenuService().delete(itemId, {
          id: "44444444-4444-4444-4444-444444444444",
          role: "restaurant",
        }),
      (error: Error) => error.message === "MENU_ITEM_FORBIDDEN"
    );
  });

  it("lanca MENU_ITEM_NOT_FOUND ao tentar atualizar item inexistente", async () => {
    (prisma as any).menuItem = {
      findUnique: async () => null,
    };

    await assert.rejects(
      () =>
        new MenuService().update(
          "inexistente",
          { available: false },
          { id: ownerId, role: "restaurant" }
        ),
      (error: Error) => error.message === "MENU_ITEM_NOT_FOUND"
    );
  });

  describe("MenuService.getById", () => {
    it("retorna dados completos do prato com rating, reviewsCount e restaurantName", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => ({
          ...menuItem({
            rating: 4.7,
            reviewsCount: 12,
          }),
          restaurant: { id: restaurantId, name: "Cantina Bella" },
        }),
      };

      const result = await new MenuService().getById(itemId);

      assert.ok(result);
      assert.equal(result.id, itemId);
      assert.equal(result.name, "Feijoada");
      assert.equal(result.rating, 4.7);
      assert.equal(result.reviewsCount, 12);
      assert.equal(result.restaurantName, "Cantina Bella");
      assert.equal(result.price, 39.9);
    });

    it("calcula media e contagem via agregacao no banco se rating e reviewsCount estiverem vazios", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => ({
          ...menuItem({
            rating: null,
            reviewsCount: 0,
          }),
          restaurant: { id: restaurantId, name: "Cantina Bella" },
        }),
      };
      (prisma as any).review = {
        aggregate: async () => ({
          _avg: { rating: 4.666 },
          _count: { rating: 3 },
        }),
      };

      const result = await new MenuService().getById(itemId);

      assert.ok(result);
      assert.equal(result.rating, 4.7);
      assert.equal(result.reviewsCount, 3);
    });

    it("retorna null quando o prato nao for encontrado", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => null,
      };

      const result = await new MenuService().getById("inexistente");
      assert.equal(result, null);
    });
  });

  describe("MenuController.getById", () => {
    it("deve responder 200 com item quando encontrado", async () => {
      const fakeItem = {
        id: itemId,
        restaurantId,
        category: "Massas",
        name: "Lasanha",
        description: null,
        price: 45.0,
        photoUrl: null,
        available: true,
        rating: 4.5,
        reviewsCount: 10,
        restaurantName: "Cantina",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (menuService as any).getById = async () => fakeItem;

      let statusCode = 0;
      let body: any = null;

      const req: any = { params: { id: itemId } };
      const res: any = {
        status(s: number) {
          statusCode = s;
          return this;
        },
        json(b: any) {
          body = b;
          return this;
        },
      };

      await menuController.getById(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(body.item.id, itemId);
      assert.equal(body.item.name, "Lasanha");
    });

    it("deve responder 404 quando o prato nao existe", async () => {
      (menuService as any).getById = async () => null;

      let statusCode = 0;
      let body: any = null;

      const req: any = { params: { id: "inexistente" } };
      const res: any = {
        status(s: number) {
          statusCode = s;
          return this;
        },
        json(b: any) {
          body = b;
          return this;
        },
      };

      await menuController.getById(req, res, () => {});

      assert.equal(statusCode, 404);
      assert.equal(body.error, "Prato não encontrado.");
    });
  });
});