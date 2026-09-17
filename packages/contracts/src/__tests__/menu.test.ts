import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createMenuItemSchema,
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
});
