import {
  createReviewReplySchema,
  createReviewSchema,
} from "@menu-digital/contracts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { favoriteController } from "../controllers/favorite.controller";
import { reviewController } from "../controllers/review.controller";
import { prisma } from "../lib/prisma";
import { FavoriteService } from "../services/favorite.service";
import { ReviewService } from "../services/review.service";

const userId = "11111111-1111-1111-1111-111111111111";
const ownerId = "22222222-2222-2222-2222-222222222222";
const restaurantId = "33333333-3333-3333-3333-333333333333";
const menuItemId = "44444444-4444-4444-4444-444444444444";
const reviewId = "55555555-5555-5555-5555-555555555555";

function mockReview(overrides: Record<string, unknown> = {}) {
  return {
    id: reviewId,
    userId,
    menuItemId,
    restaurantId,
    rating: 5,
    comment: "Excelente prato!",
    reply: null,
    repliedAt: null,
    photos: [
      {
        id: "p1",
        url: "https://example.com/foto1.jpg",
        order: 0,
        createdAt: new Date(),
      },
    ],
    user: { email: "cliente@teste.com" },
    createdAt: new Date("2026-09-23T10:00:00Z"),
    updatedAt: new Date("2026-09-23T10:00:00Z"),
    ...overrides,
  };
}

describe("Reviews & Favorites Layer — Issues #79, #80 e #83", () => {
  // ── 1. Validação de Schemas Zod ───────────────────────────────────────────

  describe("Validação de Schemas (createReviewSchema e createReviewReplySchema)", () => {
    it("deve aceitar review válida com nota 5, comentário e 2 fotos", () => {
      const parsed = createReviewSchema.parse({
        rating: 5,
        comment: "Prato muito bem servido e saboroso.",
        photoUrls: [
          "https://example.com/foto1.jpg",
          "https://example.com/foto2.jpg",
        ],
      });
      assert.equal(parsed.rating, 5);
      assert.equal(parsed.photoUrls?.length, 2);
    });

    it("deve rejeitar nota fracionária ou fora do intervalo [1, 5]", () => {
      assert.throws(() => createReviewSchema.parse({ rating: 0 }));
      assert.throws(() => createReviewSchema.parse({ rating: 6 }));
      assert.throws(() => createReviewSchema.parse({ rating: 4.5 }));
    });

    it("deve rejeitar mais de 3 fotos em uma avaliação", () => {
      assert.throws(() =>
        createReviewSchema.parse({
          rating: 4,
          photoUrls: [
            "https://example.com/1.jpg",
            "https://example.com/2.jpg",
            "https://example.com/3.jpg",
            "https://example.com/4.jpg",
          ],
        })
      );
    });

    it("deve rejeitar resposta de review menor que 2 caracteres ou maior que 1000", () => {
      assert.throws(() => createReviewReplySchema.parse({ reply: "A" }));
      assert.throws(() =>
        createReviewReplySchema.parse({ reply: "A".repeat(1001) })
      );
    });
  });

  // ── 2. ReviewService: Criação e Recálculo Atômico ─────────────────────────

  describe("ReviewService.createMenuItemReview", () => {
    it("deve rejeitar criação sem usuário autenticado", async () => {
      const service = new ReviewService();
      await assert.rejects(
        () =>
          service.createMenuItemReview(
            menuItemId,
            { rating: 5 },
            {} as any
          ),
        /AUTH_REQUIRED/
      );
    });

    it("deve rejeitar criação se menuItem não for encontrado", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => null,
      };

      const service = new ReviewService();
      await assert.rejects(
        () =>
          service.createMenuItemReview(
            menuItemId,
            { rating: 5 },
            { id: userId, role: "user" }
          ),
        /MENU_ITEM_NOT_FOUND/
      );
    });

    it("deve rejeitar avaliação duplicada pelo mesmo usuário no mesmo prato", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => ({ id: menuItemId, restaurantId }),
      };
      (prisma as any).review = {
        findUnique: async () => mockReview(),
      };

      const service = new ReviewService();
      await assert.rejects(
        () =>
          service.createMenuItemReview(
            menuItemId,
            { rating: 5 },
            { id: userId, role: "user" }
          ),
        /REVIEW_ALREADY_EXISTS/
      );
    });

    it("deve criar review e recalcular atomicamente as médias via prisma.$transaction", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => ({ id: menuItemId, restaurantId }),
      };
      (prisma as any).review = {
        findUnique: async () => null,
      };

      let txUpdatedDishRating: number | null = null;
      let txUpdatedDishCount: number | null = null;
      let txUpdatedRestRating: number | null = null;

      (prisma as any).$transaction = async (
        callback: (tx: any) => Promise<any>
      ) => {
        const txMock = {
          review: {
            create: async () => mockReview({ rating: 4 }),
            aggregate: async ({ where }: any) => {
              if (where.menuItemId) {
                // Simula 3 avaliações: 5, 4 e a nova 4 -> média 4.333 -> arredonda para 4.3
                return {
                  _avg: { rating: 4.33333 },
                  _count: { rating: 3 },
                };
              }
              if (where.restaurantId) {
                return {
                  _avg: { rating: 4.5 },
                  _count: { rating: 10 },
                };
              }
              return { _avg: { rating: null }, _count: { rating: 0 } };
            },
          },
          menuItem: {
            update: async ({ data }: any) => {
              txUpdatedDishRating = data.rating;
              txUpdatedDishCount = data.reviewsCount;
            },
          },
          restaurant: {
            update: async ({ data }: any) => {
              txUpdatedRestRating = data.rating;
            },
          },
        };
        return callback(txMock);
      };

      const service = new ReviewService();
      const result = await service.createMenuItemReview(
        menuItemId,
        {
          rating: 4,
          comment: "Muito bom!",
          photoUrls: ["https://example.com/foto1.jpg"],
        },
        { id: userId, role: "user" }
      );

      assert.equal(result.id, reviewId);
      assert.equal(result.rating, 4);
      assert.equal(txUpdatedDishRating, 4.3);
      assert.equal(txUpdatedDishCount, 3);
      assert.equal(txUpdatedRestRating, 4.5);
    });
  });

  // ── 3. ReviewService: Listagem e Distribuição de Notas ─────────────────────

  describe("ReviewService.listMenuItemReviews", () => {
    it("deve listar reviews com paginação e histograma de distribuição", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => ({
          id: menuItemId,
          rating: 4.2,
          reviewsCount: 4,
        }),
      };
      (prisma as any).review = {
        findMany: async () => [
          mockReview({ rating: 5 }),
          mockReview({ rating: 4 }),
          mockReview({ rating: 5 }),
          mockReview({ rating: 3 }),
        ],
        count: async () => 4,
        groupBy: async () => [
          { rating: 5, _count: { rating: 2 } },
          { rating: 4, _count: { rating: 1 } },
          { rating: 3, _count: { rating: 1 } },
        ],
      };

      const service = new ReviewService();
      const response = await service.listMenuItemReviews(menuItemId, {
        page: 1,
        limit: 10,
      });

      assert.equal(response.totalReviews, 4);
      assert.equal(response.averageRating, 4.2);
      assert.equal(response.pagination.totalPages, 1);
      assert.equal(response.pagination.hasMore, false);
      assert.deepEqual(response.ratingDistribution, {
        1: 0,
        2: 0,
        3: 1,
        4: 1,
        5: 2,
      });
    });
  });

  // ── 4. ReviewService: Resposta de Review e Ownership ───────────────────────

  describe("ReviewService.replyReview (Ownership)", () => {
    it("deve bloquear resposta de usuário sem role restaurant", async () => {
      (prisma as any).review = {
        findUnique: async () => ({
          ...mockReview(),
          restaurant: { ownerId },
        }),
      };

      const service = new ReviewService();
      await assert.rejects(
        () =>
          service.replyReview(
            reviewId,
            { reply: "Obrigado pela visita!" },
            { id: ownerId, role: "user" }
          ),
        /REVIEW_REPLY_FORBIDDEN/
      );
    });

    it("deve bloquear resposta de proprietário de outro restaurante", async () => {
      (prisma as any).review = {
        findUnique: async () => ({
          ...mockReview(),
          restaurant: { ownerId },
        }),
      };

      const service = new ReviewService();
      const otherOwnerId = "99999999-9999-9999-9999-999999999999";
      await assert.rejects(
        () =>
          service.replyReview(
            reviewId,
            { reply: "Obrigado pela visita!" },
            { id: otherOwnerId, role: "restaurant" }
          ),
        /REVIEW_REPLY_FORBIDDEN/
      );
    });

    it("deve permitir resposta quando actor for o dono do restaurante", async () => {
      (prisma as any).review = {
        findUnique: async () => ({
          ...mockReview(),
          restaurant: { ownerId },
        }),
        update: async ({ data }: any) =>
          mockReview({
            reply: data.reply,
            repliedAt: data.repliedAt,
          }),
      };

      const service = new ReviewService();
      const result = await service.replyReview(
        reviewId,
        { reply: "Agradecemos o seu feedback!" },
        { id: ownerId, role: "restaurant" }
      );

      assert.equal(result.reply, "Agradecemos o seu feedback!");
      assert.ok(result.repliedAt);
    });
  });

  // ── 5. FavoriteService: Alternância e Resiliência a Concorrência ────────────

  describe("FavoriteService.toggleRestaurantFavorite", () => {
    it("deve adicionar aos favoritos quando ainda não favoritado", async () => {
      (prisma as any).restaurant = {
        findUnique: async () => ({ id: restaurantId }),
      };
      (prisma as any).favoriteRestaurant = {
        findUnique: async () => null,
        create: async () => ({ id: "fav1", userId, restaurantId }),
      };

      const service = new FavoriteService();
      const result = await service.toggleRestaurantFavorite(restaurantId, {
        id: userId,
      });

      assert.equal(result.isFavorite, true);
    });

    it("deve remover dos favoritos quando já favoritado", async () => {
      (prisma as any).restaurant = {
        findUnique: async () => ({ id: restaurantId }),
      };
      (prisma as any).favoriteRestaurant = {
        findUnique: async () => ({ id: "fav1", userId, restaurantId }),
        delete: async () => ({ id: "fav1" }),
      };

      const service = new FavoriteService();
      const result = await service.toggleRestaurantFavorite(restaurantId, {
        id: userId,
      });

      assert.equal(result.isFavorite, false);
    });

    it("deve lidar com concorrência P2002 na criação retornando isFavorite: true", async () => {
      (prisma as any).restaurant = {
        findUnique: async () => ({ id: restaurantId }),
      };
      (prisma as any).favoriteRestaurant = {
        findUnique: async () => null,
        create: async () => {
          const err: any = new Error("Unique constraint failed");
          err.code = "P2002";
          throw err;
        },
      };

      const service = new FavoriteService();
      const result = await service.toggleRestaurantFavorite(restaurantId, {
        id: userId,
      });

      assert.equal(result.isFavorite, true);
    });

    it("deve lidar com concorrência P2025 na deleção retornando isFavorite: false", async () => {
      (prisma as any).restaurant = {
        findUnique: async () => ({ id: restaurantId }),
      };
      (prisma as any).favoriteRestaurant = {
        findUnique: async () => ({ id: "fav1" }),
        delete: async () => {
          const err: any = new Error("Record to delete does not exist");
          err.code = "P2025";
          throw err;
        },
      };

      const service = new FavoriteService();
      const result = await service.toggleRestaurantFavorite(restaurantId, {
        id: userId,
      });

      assert.equal(result.isFavorite, false);
    });
  });

  // ── 6. FavoriteService: Pratos e Listagem Consolidada ──────────────────────

  describe("FavoriteService.toggleDishFavorite e listUserFavorites", () => {
    it("deve alternar favorito de prato corretamente", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => ({ id: menuItemId }),
      };
      (prisma as any).favoriteDish = {
        findUnique: async () => null,
        create: async () => ({ id: "favDish1", userId, menuItemId }),
      };

      const service = new FavoriteService();
      const result = await service.toggleDishFavorite(menuItemId, {
        id: userId,
      });

      assert.equal(result.isFavorite, true);
    });

    it("deve listar todos os favoritos consolidados do usuário", async () => {
      (prisma as any).favoriteRestaurant = {
        findMany: async () => [
          {
            id: "fr1",
            restaurant: {
              id: restaurantId,
              name: "Sabor de Casa",
              address: "Rua 1, 100",
              rating: 4.8,
              photos: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
      };
      (prisma as any).favoriteDish = {
        findMany: async () => [
          {
            id: "fd1",
            menuItem: {
              id: menuItemId,
              name: "Feijoada Completa",
              category: "Pratos Principais",
              price: 49.9,
              restaurant: { name: "Sabor de Casa" },
              available: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
      };

      const service = new FavoriteService();
      const result = await service.listUserFavorites({ id: userId });

      assert.equal(result.restaurants.length, 1);
      assert.equal(result.restaurants[0].name, "Sabor de Casa");
      assert.equal(result.dishes.length, 1);
      assert.equal(result.dishes[0].name, "Feijoada Completa");
      assert.equal(result.dishes[0].restaurantName, "Sabor de Casa");
    });
  });

  // ── 7. Controllers: Mapeamento de Status HTTP ──────────────────────────────

  describe("Controladores HTTP (ReviewController e FavoriteController)", () => {
    it("ReviewController deve retornar 409 quando review já existir", async () => {
      (prisma as any).menuItem = {
        findUnique: async () => ({ id: menuItemId, restaurantId }),
      };
      (prisma as any).review = {
        findUnique: async () => mockReview(),
      };

      const req: any = {
        params: { id: menuItemId },
        body: { rating: 5 },
        user: { id: userId, role: "user" },
      };

      let statusCode: number | null = null;
      let jsonBody: any = null;

      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              jsonBody = body;
            },
          };
        },
      };

      await reviewController.createMenuItemReview(req, res, () => {});

      assert.equal(statusCode, 409);
      assert.ok(jsonBody.error.includes("já enviou uma avaliação"));
    });

    it("ReviewController deve retornar 403 quando usuário não for dono ao responder", async () => {
      (prisma as any).review = {
        findUnique: async () => ({
          ...mockReview(),
          restaurant: { ownerId },
        }),
      };

      const req: any = {
        params: { id: reviewId },
        body: { reply: "Obrigado!" },
        user: { id: userId, role: "user" },
      };

      let statusCode: number | null = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: () => {},
          };
        },
      };

      await reviewController.reply(req, res, () => {});

      assert.equal(statusCode, 403);
    });

    it("FavoriteController deve retornar 200 com status de favorito", async () => {
      (prisma as any).restaurant = {
        findUnique: async () => ({ id: restaurantId }),
      };
      (prisma as any).favoriteRestaurant = {
        findUnique: async () => null,
        create: async () => ({ id: "fav1" }),
      };

      const req: any = {
        params: { id: restaurantId },
        user: { id: userId },
      };

      let statusCode: number | null = null;
      let jsonBody: any = null;

      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              jsonBody = body;
            },
          };
        },
      };

      await favoriteController.toggleRestaurant(req, res, () => {});

      assert.equal(statusCode, 200);
      assert.equal(jsonBody.isFavorite, true);
    });
  });

  // ── 7. Issue #79: ReviewService — getMyReview, createRestaurantReview, update, delete e report ──

  describe("Issue #79: ReviewService & Controller — Ciclo Completo de Avaliações", () => {
    it("ReviewService.getMyReview deve retornar a avaliação existente do usuário para restaurante", async () => {
      (prisma as any).review = {
        findUnique: async () => mockReview({ restaurantId, menuItemId: null }),
      };

      const service = new ReviewService();
      const result = await (service as any).getMyReview(
        { id: userId, role: "user" },
        { restaurantId }
      );

      assert.ok(result);
      assert.equal(result.restaurantId, restaurantId);
      assert.equal(result.rating, 5);
    });

    it("ReviewService.getMyReview deve retornar null quando usuário não avaliou", async () => {
      (prisma as any).review = {
        findUnique: async () => null,
      };

      const service = new ReviewService();
      const result = await (service as any).getMyReview(
        { id: userId, role: "user" },
        { restaurantId }
      );

      assert.equal(result, null);
    });

    it("ReviewService.createRestaurantReview deve criar review e recalcular média do restaurante", async () => {
      (prisma as any).restaurant = {
        findUnique: async () => ({ id: restaurantId }),
      };
      (prisma as any).review = {
        findUnique: async () => null,
      };

      let txUpdatedRating: number | null = null;
      let txUpdatedCount: number | null = null;

      (prisma as any).$transaction = async (callback: any) => {
        const txMock = {
          review: {
            create: async () =>
              mockReview({ restaurantId, menuItemId: null, rating: 5 }),
            aggregate: async () => ({
              _avg: { rating: 4.8 },
              _count: { rating: 12 },
            }),
          },
          restaurant: {
            update: async ({ data }: any) => {
              txUpdatedRating = data.rating;
              txUpdatedCount = data.reviewsCount;
            },
          },
        };
        return callback(txMock);
      };

      const service = new ReviewService();
      const result = await (service as any).createReview(
        { restaurantId, rating: 5, comment: "Excelente ambiente!" },
        { id: userId, role: "user" }
      );

      assert.equal(result.restaurantId, restaurantId);
      assert.equal(result.rating, 5);
      assert.equal(txUpdatedRating, 4.8);
      assert.equal(txUpdatedCount, 12);
    });

    it("ReviewService.createReview deve lançar 409 caso avaliação de restaurante já exista", async () => {
      (prisma as any).restaurant = {
        findUnique: async () => ({ id: restaurantId }),
      };
      (prisma as any).review = {
        findUnique: async () => mockReview({ restaurantId, menuItemId: null }),
      };

      const service = new ReviewService();
      await assert.rejects(
        () =>
          (service as any).createReview(
            { restaurantId, rating: 5 },
            { id: userId, role: "user" }
          ),
        /REVIEW_ALREADY_EXISTS/
      );
    });

    it("ReviewService.updateReview deve validar assertOwner (403 para usuário não autor)", async () => {
      (prisma as any).review = {
        findUnique: async () => mockReview({ userId: "outro-usuario" }),
      };

      const service = new ReviewService();
      await assert.rejects(
        () =>
          (service as any).updateReview(
            reviewId,
            { rating: 3, comment: "Atualizado" },
            { id: userId, role: "user" }
          ),
        /REVIEW_FORBIDDEN/
      );
    });

    it("ReviewService.updateReview deve atualizar nota e recalcular médias via $transaction", async () => {
      (prisma as any).review = {
        findUnique: async () =>
          mockReview({ userId, restaurantId, menuItemId: null }),
      };

      let txUpdatedRating: number | null = null;
      let txUpdatedCount: number | null = null;

      (prisma as any).$transaction = async (callback: any) => {
        const txMock = {
          reviewPhoto: {
            deleteMany: async () => {},
            createMany: async () => {},
          },
          review: {
            update: async () =>
              mockReview({ restaurantId, menuItemId: null, rating: 4 }),
            aggregate: async () => ({
              _avg: { rating: 4.6 },
              _count: { rating: 12 },
            }),
          },
          restaurant: {
            update: async ({ data }: any) => {
              txUpdatedRating = data.rating;
              txUpdatedCount = data.reviewsCount;
            },
          },
        };
        return callback(txMock);
      };

      const service = new ReviewService();
      const updated = await (service as any).updateReview(
        reviewId,
        { rating: 4, comment: "Nota ajustada" },
        { id: userId, role: "user" }
      );

      assert.equal(updated.rating, 4);
      assert.equal(txUpdatedRating, 4.6);
      assert.equal(txUpdatedCount, 12);
    });

    it("ReviewService.deleteReview deve validar assertOwner e recalcular médias ao excluir", async () => {
      (prisma as any).review = {
        findUnique: async () =>
          mockReview({ userId, restaurantId, menuItemId: null }),
      };

      let deletedReviewId: string | null = null;
      let txUpdatedRating: number | null = null;
      let txUpdatedCount: number | null = null;

      (prisma as any).$transaction = async (callback: any) => {
        const txMock = {
          review: {
            delete: async ({ where }: any) => {
              deletedReviewId = where.id;
            },
            aggregate: async () => ({
              _avg: { rating: 4.5 },
              _count: { rating: 11 },
            }),
          },
          restaurant: {
            update: async ({ data }: any) => {
              txUpdatedRating = data.rating;
              txUpdatedCount = data.reviewsCount;
            },
          },
        };
        return callback(txMock);
      };

      const service = new ReviewService();
      await (service as any).deleteReview(reviewId, {
        id: userId,
        role: "user",
      });

      assert.equal(deletedReviewId, reviewId);
      assert.equal(txUpdatedRating, 4.5);
      assert.equal(txUpdatedCount, 11);
    });

    it("ReviewService.reportReview deve registrar denúncia de terceiros com status PENDING", async () => {
      (prisma as any).review = {
        findUnique: async () => ({ id: reviewId, userId: "outro-usuario" }),
      };
      (prisma as any).reviewReport = {
        create: async ({ data }: any) => ({
          id: "rep1",
          reviewId: data.reviewId,
          reporterId: data.reporterId,
          reason: data.reason,
          status: data.status,
          createdAt: new Date(),
        }),
      };

      const service = new ReviewService();
      const report = await (service as any).reportReview(
        reviewId,
        { reason: "Linguagem abusiva no comentário." },
        { id: userId, role: "user" }
      );

      assert.equal(report.id, "rep1");
      assert.equal(report.reviewId, reviewId);
      assert.equal(report.reporterId, userId);
      assert.equal(report.status, "PENDING");
    });

    it("ReviewService.reportReview deve rejeitar denúncia da própria avaliação", async () => {
      (prisma as any).review = {
        findUnique: async () => ({ id: reviewId, userId }),
      };

      const service = new ReviewService();
      await assert.rejects(
        () =>
          (service as any).reportReview(
            reviewId,
            { reason: "Motivo qualquer" },
            { id: userId, role: "user" }
          ),
        /CANNOT_REPORT_OWN_REVIEW/
      );
    });
  });
});

