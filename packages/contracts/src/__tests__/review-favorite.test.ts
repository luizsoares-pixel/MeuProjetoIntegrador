import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createReviewReplySchema,
  createReviewSchema,
  toggleFavoriteResponseSchema,
  userRoleEnum,
} from "../index";

describe("Review & Favorites Contracts Schema (Issue #79, #80, #82, #83)", () => {
  describe("userRoleEnum", () => {
    it("deve aceitar os papéis válidos: user, restaurant e admin", () => {
      assert.strictEqual(userRoleEnum.parse("user"), "user");
      assert.strictEqual(userRoleEnum.parse("restaurant"), "restaurant");
      assert.strictEqual(userRoleEnum.parse("admin"), "admin");
    });

    it("deve rejeitar papéis inválidos", () => {
      assert.throws(() => userRoleEnum.parse("guest"));
      assert.throws(() => userRoleEnum.parse("owner"));
    });
  });

  describe("createReviewSchema", () => {
    it("deve aceitar avaliação válida com nota e comentário", () => {
      const payload = {
        rating: 5,
        comment: "Excelente comida e ótimo atendimento!",
        photoUrls: ["https://example.com/foto1.jpg"],
      };

      const parsed = createReviewSchema.parse(payload);
      assert.strictEqual(parsed.rating, 5);
      assert.strictEqual(parsed.comment, "Excelente comida e ótimo atendimento!");
      assert.strictEqual(parsed.photoUrls?.length, 1);
    });

    it("deve aceitar avaliação mínima contendo apenas nota", () => {
      const payload = { rating: 4 };
      const parsed = createReviewSchema.parse(payload);
      assert.strictEqual(parsed.rating, 4);
      assert.strictEqual(parsed.photoUrls?.length, 0);
    });

    it("deve rejeitar notas fora do intervalo [1, 5] ou fracionárias", () => {
      assert.throws(() => createReviewSchema.parse({ rating: 0 }));
      assert.throws(() => createReviewSchema.parse({ rating: 6 }));
      assert.throws(() => createReviewSchema.parse({ rating: 4.5 }));
    });

    it("deve rejeitar comentários com mais de 1000 caracteres", () => {
      const longComment = "a".repeat(1001);
      assert.throws(() =>
        createReviewSchema.parse({ rating: 5, comment: longComment })
      );
    });

    it("deve rejeitar mais de 3 fotos", () => {
      const photos = [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
      ];
      assert.throws(() =>
        createReviewSchema.parse({ rating: 5, photoUrls: photos })
      );
    });

    it("deve rejeitar URLs inválidas de fotos", () => {
      assert.throws(() =>
        createReviewSchema.parse({
          rating: 5,
          photoUrls: ["not-a-valid-url"],
        })
      );
    });
  });

  describe("createReviewReplySchema", () => {
    it("deve aceitar resposta válida do restaurante", () => {
      const payload = { reply: "Muito obrigado pelo feedback!" };
      const parsed = createReviewReplySchema.parse(payload);
      assert.strictEqual(parsed.reply, "Muito obrigado pelo feedback!");
    });

    it("deve rejeitar resposta muito curta (< 2 caracteres) ou vazia", () => {
      assert.throws(() => createReviewReplySchema.parse({ reply: " " }));
      assert.throws(() => createReviewReplySchema.parse({ reply: "a" }));
    });

    it("deve rejeitar resposta excedendo 1000 caracteres", () => {
      assert.throws(() =>
        createReviewReplySchema.parse({ reply: "b".repeat(1001) })
      );
    });
  });

  describe("toggleFavoriteResponseSchema", () => {
    it("deve aceitar booleano isFavorite", () => {
      assert.strictEqual(
        toggleFavoriteResponseSchema.parse({ isFavorite: true }).isFavorite,
        true
      );
      assert.strictEqual(
        toggleFavoriteResponseSchema.parse({ isFavorite: false }).isFavorite,
        false
      );
    });

    it("deve rejeitar valores não booleanos", () => {
      assert.throws(() =>
        toggleFavoriteResponseSchema.parse({ isFavorite: "true" })
      );
    });
  });
});
