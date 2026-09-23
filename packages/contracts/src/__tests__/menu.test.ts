import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createMenuItemSchema,
  menuItemDetailResponseSchema,
  menuItemParamsSchema,
  updateMenuItemSchema,
} from "../index";

describe("Menu Contracts Schema", () => {
  it("valida criacao de item de cardapio valido com campos obrigatorios", () => {
    const payload = {
      category: "Pratos Principais",
      name: "Feijoada Completa",
      price: 49.9,
    };

    const parsed = createMenuItemSchema.parse(payload);
    assert.strictEqual(parsed.category, "Pratos Principais");
    assert.strictEqual(parsed.name, "Feijoada Completa");
    assert.strictEqual(parsed.price, 49.9);
    assert.strictEqual(parsed.available, true);
    assert.strictEqual(parsed.description, undefined);
  });

  it("valida criacao de item com todos os campos preenchidos", () => {
    const payload = {
      category: "Sobremesas",
      name: "Pudim de Leite",
      description: "Pudim artesanal com calda de caramelo",
      price: 15.0,
      photoUrl: "https://example.com/pudim.jpg",
      available: false,
    };

    const parsed = createMenuItemSchema.parse(payload);
    assert.strictEqual(parsed.available, false);
    assert.strictEqual(parsed.photoUrl, "https://example.com/pudim.jpg");
    assert.strictEqual(parsed.description, "Pudim artesanal com calda de caramelo");
  });

  it("rejeita preco negativo", () => {
    assert.throws(() => {
      createMenuItemSchema.parse({
        category: "Bebidas",
        name: "Suco",
        price: -5,
      });
    });
  });

  it("rejeita categoria e nome vazios", () => {
    assert.throws(() => {
      createMenuItemSchema.parse({
        category: "   ",
        name: "Suco",
        price: 8,
      });
    });

    assert.throws(() => {
      createMenuItemSchema.parse({
        category: "Bebidas",
        name: "",
        price: 8,
      });
    });
  });

  it("rejeita URL de foto invalida", () => {
    assert.throws(() => {
      createMenuItemSchema.parse({
        category: "Bebidas",
        name: "Refrigerante",
        price: 6,
        photoUrl: "not-a-valid-url",
      });
    });
  });

  it("valida atualizacao parcial de item", () => {
    const parsed = updateMenuItemSchema.parse({
      available: false,
    });
    assert.strictEqual(parsed.available, false);
    assert.strictEqual(parsed.name, undefined);
  });

  it("rejeita atualizacao sem nenhum campo", () => {
    assert.throws(() => {
      updateMenuItemSchema.parse({});
    });
  });

  describe("menuItemParamsSchema", () => {
    it("deve validar UUID valido de prato", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const parsed = menuItemParamsSchema.parse({ id: validUuid });
      assert.strictEqual(parsed.id, validUuid);
    });

    it("deve rejeitar ID que nao seja UUID", () => {
      assert.throws(() => menuItemParamsSchema.parse({ id: "123" }));
      assert.throws(() => menuItemParamsSchema.parse({ id: "" }));
      assert.throws(() => menuItemParamsSchema.parse({}));
    });
  });

  describe("menuItemDetailResponseSchema", () => {
    it("deve validar objeto completo de detalhe de prato com avaliacoes", () => {
      const payload = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        restaurantId: "987fcdeb-51a2-43f7-9876-543210987654",
        restaurantName: "Cantina Bella",
        category: "Massas",
        name: "Lasanha Bolonhesa",
        description: "Massa fresca artesanal com molho bolonhesa",
        price: 45.5,
        photoUrl: "https://example.com/lasanha.jpg",
        available: true,
        rating: 4.8,
        reviewsCount: 15,
        isFavorite: true,
        createdAt: "2026-09-23T12:00:00.000Z",
        updatedAt: "2026-09-23T12:00:00.000Z",
      };

      const parsed = menuItemDetailResponseSchema.parse(payload);
      assert.strictEqual(parsed.name, "Lasanha Bolonhesa");
      assert.strictEqual(parsed.rating, 4.8);
      assert.strictEqual(parsed.reviewsCount, 15);
      assert.strictEqual(parsed.restaurantName, "Cantina Bella");
      assert.strictEqual(parsed.isFavorite, true);
    });

    it("deve aceitar prato sem avaliacoes (rating null e reviewsCount default 0)", () => {
      const payload = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        restaurantId: "987fcdeb-51a2-43f7-9876-543210987654",
        category: "Bebidas",
        name: "Agua Mineral",
        description: null,
        price: 5.0,
        photoUrl: null,
        available: true,
        rating: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const parsed = menuItemDetailResponseSchema.parse(payload);
      assert.strictEqual(parsed.rating, null);
      assert.strictEqual(parsed.reviewsCount, 0);
      assert.strictEqual(parsed.description, null);
      assert.strictEqual(parsed.photoUrl, null);
    });

    it("deve rejeitar preco negativo ou UUID invalido", () => {
      assert.throws(() =>
        menuItemDetailResponseSchema.parse({
          id: "invalido",
          restaurantId: "987fcdeb-51a2-43f7-9876-543210987654",
          category: "Massas",
          name: "Item",
          price: -10,
          available: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    });
  });
});
