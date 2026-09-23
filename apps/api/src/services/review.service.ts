import {
  CreateReviewInput,
  CreateReviewReplyInput,
  PaginatedReviewsResponse,
  ReviewResponse,
} from "@menu-digital/contracts";
import { prisma } from "../lib/prisma";
import { AuthenticatedUser } from "../middlewares/auth";

function formatReview(review: any): ReviewResponse {
  return {
    id: review.id,
    userId: review.userId,
    userEmail: review.user?.email ?? undefined,
    restaurantId: review.restaurantId ?? null,
    menuItemId: review.menuItemId ?? null,
    rating: review.rating,
    comment: review.comment ?? null,
    reply: review.reply ?? null,
    repliedAt: review.repliedAt ?? null,
    photos: (review.photos ?? []).map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      order: photo.order,
      createdAt: photo.createdAt,
    })),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export class ReviewService {
  /**
   * Cria avaliação para um item de cardápio (MenuItem) e recalcula atomicamente
   * a média e contagem do item e do restaurante via transação Prisma.
   */
  async createMenuItemReview(
    menuItemId: string,
    data: CreateReviewInput,
    actor: AuthenticatedUser
  ): Promise<ReviewResponse> {
    if (!actor?.id) {
      throw new Error("AUTH_REQUIRED");
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true, restaurantId: true },
    });

    if (!menuItem) {
      throw new Error("MENU_ITEM_NOT_FOUND");
    }

    // Valida se o usuário já avaliou este prato (constraint única userId + menuItemId)
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_menuItemId: {
          userId: actor.id,
          menuItemId,
        },
      },
    });

    if (existingReview) {
      throw new Error("REVIEW_ALREADY_EXISTS");
    }

    const createdReview = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId: actor.id,
          menuItemId,
          restaurantId: menuItem.restaurantId,
          rating: data.rating,
          comment: data.comment ?? null,
          photos:
            data.photoUrls && data.photoUrls.length > 0
              ? {
                  create: data.photoUrls.map((url, index) => ({
                    url,
                    order: index,
                  })),
                }
              : undefined,
        },
        include: {
          photos: { orderBy: { order: "asc" } },
          user: { select: { email: true } },
        },
      });

      // Recalcula média e total de avaliações do prato
      const dishStats = await tx.review.aggregate({
        where: { menuItemId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const avgDishRating =
        dishStats._avg.rating !== null
          ? Math.round(dishStats._avg.rating * 10) / 10
          : null;

      await tx.menuItem.update({
        where: { id: menuItemId },
        data: {
          rating: avgDishRating,
          reviewsCount: dishStats._count.rating,
        },
      });

      // Recalcula média e total do restaurante vinculado
      if (menuItem.restaurantId) {
        const restStats = await tx.review.aggregate({
          where: { restaurantId: menuItem.restaurantId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        const avgRestRating =
          restStats._avg.rating !== null
            ? Math.round(restStats._avg.rating * 10) / 10
            : null;

        await tx.restaurant.update({
          where: { id: menuItem.restaurantId },
          data: {
            rating: avgRestRating,
          },
        });
      }

      return review;
    });

    return formatReview(createdReview);
  }

  /**
   * Lista avaliações paginadas de um prato com metadados e histograma de distribuição.
   */
  async listMenuItemReviews(
    menuItemId: string,
    query?: { page?: number; limit?: number }
  ): Promise<PaginatedReviewsResponse> {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true, rating: true, reviewsCount: true },
    });

    if (!menuItem) {
      throw new Error("MENU_ITEM_NOT_FOUND");
    }

    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(50, Math.max(1, query?.limit ?? 10));
    const skip = (page - 1) * limit;

    // Utiliza o campo reviewsCount desnormalizado de MenuItem para evitar overhead de COUNT(*) a cada página
    const total = menuItem.reviewsCount ?? 0;

    const [reviews, distributionRaw] = await Promise.all([
      prisma.review.findMany({
        where: { menuItemId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          photos: { orderBy: { order: "asc" } },
          user: { select: { email: true } },
        },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { menuItemId },
        _count: { rating: true },
      }),
    ]);

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const entry of distributionRaw) {
      if (entry.rating in ratingDistribution) {
        ratingDistribution[entry.rating] = entry._count.rating;
      }
    }

    return {
      reviews: reviews.map(formatReview),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: skip + reviews.length < total,
      },
      averageRating: menuItem.rating ?? null,
      totalReviews: total,
      ratingDistribution,
    };
  }

  /**
   * Permite ao dono do restaurante responder a uma avaliação.
   * Valida ownership estrito: apenas actor com role="restaurant" e ID igual ao owner do restaurante.
   */
  async replyReview(
    reviewId: string,
    data: CreateReviewReplyInput,
    actor: AuthenticatedUser
  ): Promise<ReviewResponse> {
    if (!actor?.id) {
      throw new Error("AUTH_REQUIRED");
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        restaurant: { select: { ownerId: true } },
        menuItem: {
          include: {
            restaurant: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!review) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    const ownerId =
      review.restaurant?.ownerId ?? review.menuItem?.restaurant?.ownerId;

    if (actor.role !== "restaurant" || actor.id !== ownerId) {
      throw new Error("REVIEW_REPLY_FORBIDDEN");
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: data.reply,
        repliedAt: new Date(),
      },
      include: {
        photos: { orderBy: { order: "asc" } },
        user: { select: { email: true } },
      },
    });

    return formatReview(updated);
  }
}

export const reviewService = new ReviewService();
