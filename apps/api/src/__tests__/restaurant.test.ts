import {
  createRestaurantSchema,
  nearbyRestaurantsSchema,
} from "@menu-digital/contracts";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { restaurantController } from "../controllers/restaurant.controller";
import { prisma } from "../lib/prisma";
import { validateQuery } from "../middleware/validateQuery";
import { restaurantService, RestaurantService } from "../services/restaurant.service";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Fórmula de Haversine pura para comparação nos testes */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Mock de restaurante base para reutilização nos testes */
function mockRestaurant(
  id: string,
  lat: number,
  lng: number,
  name = "Restaurante " + id
) {
  return {
    id,
    name,
    address: "Endereço " + id,
    imageUrl: null,
    latitude: lat,
    longitude: lng,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe("Restaurants Layer - Issue #33", () => {
  // ── Etapa 1: Schema Zod ────────────────────────────────────────────────────

  describe("Etapa 1: Validação de query params (nearbyRestaurantsSchema)", () => {
    it("deve aceitar lat, lng e radius válidos e transformar para número", async () => {
      const result = await nearbyRestaurantsSchema.parseAsync({
        lat: "-15.77972",
        lng: "-47.92972",
        radius: "3000",
      });
      assert.strictEqual(result.lat, -15.77972);
      assert.strictEqual(result.lng, -47.92972);
      assert.strictEqual(result.radius, 3000);
    });

    it("deve aplicar radius padrão de 5000m quando omitido", async () => {
      const result = await nearbyRestaurantsSchema.parseAsync({
        lat: "-15.77972",
        lng: "-47.92972",
      });
      assert.strictEqual(result.radius, 5000);
    });

    it("deve rejeitar lat ausente", async () => {
      await assert.rejects(
        () => nearbyRestaurantsSchema.parseAsync({ lng: "-47.92972" }),
        (err: any) => {
          assert.ok(err.issues?.some((i: any) => i.path.includes("lat")));
          return true;
        }
      );
    });

    it("deve rejeitar lat fora do intervalo [-90, 90]", async () => {
      await assert.rejects(
        () => nearbyRestaurantsSchema.parseAsync({ lat: "91", lng: "-47.92972" }),
        (err: any) => {
          assert.ok(
            err.issues?.some(
              (i: any) =>
                i.path.includes("lat") &&
                i.message.includes("-90 e 90")
            )
          );
          return true;
        }
      );
    });

    it("deve rejeitar lng fora do intervalo [-180, 180]", async () => {
      await assert.rejects(
        () => nearbyRestaurantsSchema.parseAsync({ lat: "-15.77972", lng: "181" }),
        (err: any) => {
          assert.ok(
            err.issues?.some(
              (i: any) =>
                i.path.includes("lng") &&
                i.message.includes("-180 e 180")
            )
          );
          return true;
        }
      );
    });

    it("deve rejeitar radius não numérico", async () => {
      await assert.rejects(
        () =>
          nearbyRestaurantsSchema.parseAsync({
            lat: "-15.77972",
            lng: "-47.92972",
            radius: "abc",
          }),
        (err: any) => {
          assert.ok(err.issues?.some((i: any) => i.path.includes("radius")));
          return true;
        }
      );
    });
  });

  // ── Etapa 2: Haversine e lógica do Service ─────────────────────────────────

  describe("Etapa 2: RestaurantService.findNearby", () => {
    // Coordenada de referência: Plano Piloto, Brasília
    const originLat = -15.77972;
    const originLng = -47.92972;

    // Restaurante A: ~500 m do ponto de origem (dentro de 5 km)
    const restaurantA = mockRestaurant(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      -15.78418,  // ~500 m ao sul
      -47.92972,
      "Restaurante A (perto)"
    );

    // Restaurante B: ~2 km do ponto de origem (dentro de 5 km)
    const restaurantB = mockRestaurant(
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      -15.79767,  // ~2 km ao sul
      -47.92972,
      "Restaurante B (médio)"
    );

    // Restaurante C: ~10 km do ponto de origem (FORA de 5 km)
    const restaurantC = mockRestaurant(
      "cccccccc-cccc-cccc-cccc-cccccccccccc",
      -15.86967,  // ~10 km ao sul
      -47.92972,
      "Restaurante C (longe)"
    );

    it("deve retornar lista vazia quando não há restaurantes no raio", async () => {
      (prisma as any).restaurant = {
        findMany: async () => [],
      };

      const result = await restaurantService.findNearby({
        lat: originLat,
        lng: originLng,
        radius: 5000,
      });

      assert.deepStrictEqual(result, []);
    });

    it("deve retornar apenas restaurantes dentro do raio, ordenados por distância crescente", async () => {
      // O bounding box do service retornará A, B e C (todos no bbox de 10+ km),
      // mas o filtro Haversine com radius=5000 deve excluir C.
      (prisma as any).restaurant = {
        findMany: async () => [restaurantA, restaurantC, restaurantB],
      };

      const result = await restaurantService.findNearby({
        lat: originLat,
        lng: originLng,
        radius: 5000,
      });

      assert.strictEqual(result.length, 2);
      // Ordenação: A (mais perto) < B (mais longe)
      assert.strictEqual(result[0].id, restaurantA.id);
      assert.strictEqual(result[1].id, restaurantB.id);
      assert.ok(result[0].distanceInMeters < result[1].distanceInMeters);
    });

    it("deve incluir distanceInMeters com valor numérico positivo correto", async () => {
      (prisma as any).restaurant = {
        findMany: async () => [restaurantA],
      };

      const result = await restaurantService.findNearby({
        lat: originLat,
        lng: originLng,
        radius: 5000,
      });

      assert.strictEqual(result.length, 1);
      const expected = haversine(
        originLat,
        originLng,
        restaurantA.latitude,
        restaurantA.longitude
      );
      assert.ok(Math.abs(result[0].distanceInMeters - expected) < 1); // tolerância 1 m
    });

    it("deve retornar lista vazia quando todos os restaurantes do bbox estão fora do raio Haversine", async () => {
      (prisma as any).restaurant = {
        findMany: async () => [restaurantC],
      };

      const result = await restaurantService.findNearby({
        lat: originLat,
        lng: originLng,
        radius: 5000,
      });

      assert.deepStrictEqual(result, []);
    });

    it("deve incluir todos os campos do RestaurantResponse no retorno", async () => {
      (prisma as any).restaurant = {
        findMany: async () => [restaurantA],
      };

      const result = await restaurantService.findNearby({
        lat: originLat,
        lng: originLng,
        radius: 5000,
      });

      const r = result[0];
      assert.ok(r.id);
      assert.ok(r.name);
      assert.ok(r.address);
      assert.strictEqual(r.imageUrl, null);
      assert.ok(typeof r.latitude === "number");
      assert.ok(typeof r.longitude === "number");
      assert.ok(typeof r.distanceInMeters === "number");
      assert.ok(r.createdAt instanceof Date);
      assert.ok(r.updatedAt instanceof Date);
    });
  });

  // ── Etapa 3: validateQuery middleware ──────────────────────────────────────

  describe("Etapa 3: Middleware validateQuery com nearbyRestaurantsSchema", () => {
    it("deve retornar 400 quando lat está ausente", async () => {
      const validator = validateQuery(nearbyRestaurantsSchema);
      const req = { query: { lng: "-47.92972" } } as any;
      let statusCode = 0;
      let responseBody: any = null;
      const res = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responseBody = data;
          return this;
        },
      } as any;

      let nextCalled = false;
      await validator(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 400);
      assert.ok(
        responseBody.details.some((d: any) => d.field === "lat")
      );
    });

    it("deve retornar 400 quando lng está ausente", async () => {
      const validator = validateQuery(nearbyRestaurantsSchema);
      const req = { query: { lat: "-15.77972" } } as any;
      let statusCode = 0;
      const res = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(_: any) {
          return this;
        },
      } as any;

      await validator(req, res, () => {});
      assert.strictEqual(statusCode, 400);
    });

    it("deve popular req.parsedQuery com valores transformados quando válido", async () => {
      const validator = validateQuery(nearbyRestaurantsSchema);
      const req = {
        query: { lat: "-15.77972", lng: "-47.92972", radius: "1000" },
      } as any;
      const res = {} as any;

      await validator(req, res, () => {});

      assert.strictEqual(typeof req.parsedQuery.lat, "number");
      assert.strictEqual(req.parsedQuery.lat, -15.77972);
      assert.strictEqual(req.parsedQuery.radius, 1000);
    });
  });

  // ── Etapa 4: RestaurantController ─────────────────────────────────────────

  describe("Etapa 4: RestaurantController.findNearby", () => {
    it("deve retornar 200 com a lista de restaurantes do service", async () => {
      const mockRestaurants = [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          name: "Teste",
          address: "Addr",
          imageUrl: null,
          latitude: -15.78418,
          longitude: -47.92972,
          distanceInMeters: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mock.method(restaurantService, "findNearby", async () => mockRestaurants);

      const req = {
        parsedQuery: { lat: -15.77972, lng: -47.92972, radius: 5000 },
      } as any;

      let statusCode: number | null = null;
      let responseBody: any = null;
      const res = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responseBody = data;
          return this;
        },
      } as any;

      await restaurantController.findNearby(req, res, () => {});

      assert.strictEqual(statusCode, 200);
      assert.strictEqual(responseBody.restaurants.length, 1);
      assert.strictEqual(responseBody.restaurants[0].id, mockRestaurants[0].id);

      mock.reset();
    });

    it("deve retornar 200 com lista vazia quando não há restaurantes no raio", async () => {
      mock.method(restaurantService, "findNearby", async () => []);

      const req = {
        parsedQuery: { lat: -15.77972, lng: -47.92972, radius: 100 },
      } as any;

      let statusCode: number | null = null;
      let responseBody: any = null;
      const res = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responseBody = data;
          return this;
        },
      } as any;

      await restaurantController.findNearby(req, res, () => {});

      assert.strictEqual(statusCode, 200);
      assert.deepStrictEqual(responseBody.restaurants, []);

      mock.reset();
    });

    it("deve propagar erro ao next() quando o service lançar exceção", async () => {
      mock.method(restaurantService, "findNearby", async () => {
        throw new Error("DB error");
      });

      const req = {
        parsedQuery: { lat: -15.77972, lng: -47.92972, radius: 5000 },
      } as any;

      const res = {} as any;
      let nextError: any = null;
      await restaurantController.findNearby(req, res, (err) => {
        nextError = err;
      });

      assert.ok(nextError instanceof Error);
      assert.strictEqual(nextError.message, "DB error");

      mock.reset();
    });
  });

  // ── Issue #36: Cadastro Básico de Restaurante ───────────────────────────────

  describe("Issue #36: Cadastro Básico de Restaurante (POST /restaurants)", () => {
    describe("Validação de payload com createRestaurantSchema", () => {
      it("deve aceitar payload válido com todos os campos", async () => {
        const payload = {
          name: "Restaurante Sabor & Arte",
          address: "CLS 405 Bloco B, Asa Sul, Brasília - DF",
          cuisineType: "Brasileira",
          latitude: -15.8234,
          longitude: -47.9012,
          imageUrl: "https://example.com/foto.jpg",
        };

        const result = await createRestaurantSchema.parseAsync(payload);
        assert.strictEqual(result.name, payload.name);
        assert.strictEqual(result.address, payload.address);
        assert.strictEqual(result.cuisineType, payload.cuisineType);
        assert.strictEqual(result.latitude, payload.latitude);
        assert.strictEqual(result.longitude, payload.longitude);
      });

      it("deve rejeitar nome com menos de 2 caracteres", async () => {
        await assert.rejects(
          () =>
            createRestaurantSchema.parseAsync({
              name: "A",
              address: "Rua 1",
              cuisineType: "Italiana",
              latitude: -15.8,
              longitude: -47.9,
            }),
          (err: any) => {
            assert.ok(err.issues?.some((i: any) => i.path.includes("name")));
            return true;
          }
        );
      });

      it("deve rejeitar tipo de culinária vazio", async () => {
        await assert.rejects(
          () =>
            createRestaurantSchema.parseAsync({
              name: "Restaurante",
              address: "Rua 1",
              cuisineType: "",
              latitude: -15.8,
              longitude: -47.9,
            }),
          (err: any) => {
            assert.ok(err.issues?.some((i: any) => i.path.includes("cuisineType")));
            return true;
          }
        );
      });

      it("deve rejeitar latitude fora de [-90, 90]", async () => {
        await assert.rejects(
          () =>
            createRestaurantSchema.parseAsync({
              name: "Restaurante",
              address: "Rua 1",
              cuisineType: "Japonesa",
              latitude: 95,
              longitude: -47.9,
            }),
          (err: any) => {
            assert.ok(err.issues?.some((i: any) => i.path.includes("latitude")));
            return true;
          }
        );
      });
    });

    describe("RestaurantService.create", () => {
      it("deve criar restaurante vinculando ao ownerId", async () => {
        const ownerId = "11111111-1111-1111-1111-111111111111";
        const inputData = {
          name: "Bistrô Central",
          address: "Av. Paulista 1000",
          cuisineType: "Francesa",
          latitude: -23.56,
          longitude: -46.65,
          imageUrl: null,
        };

        (prisma as any).user = {
          upsert: async () => ({ id: ownerId, email: `${ownerId}@auth.supabase` }),
        };
        (prisma as any).restaurant = {
          create: async ({ data }: any) => ({
            id: "22222222-2222-2222-2222-222222222222",
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        };

        const result = await restaurantService.create(inputData, ownerId);

        assert.strictEqual(result.name, "Bistrô Central");
        assert.strictEqual(result.ownerId, ownerId);
        assert.strictEqual(result.cuisineType, "Francesa");
        assert.ok(result.id);
      });
    });

    describe("RestaurantController.create", () => {
      it("deve retornar 201 com o restaurante criado", async () => {
        const ownerId = "11111111-1111-1111-1111-111111111111";
        const createdRestaurant = {
          id: "rest-123",
          name: "Cantina da Nonna",
          address: "Rua das Flores 123",
          cuisineType: "Italiana",
          imageUrl: null,
          latitude: -15.8,
          longitude: -47.9,
          ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mock.method(restaurantService, "create", async () => createdRestaurant);

        const req = {
          user: { id: ownerId },
          body: {
            name: "Cantina da Nonna",
            address: "Rua das Flores 123",
            cuisineType: "Italiana",
            latitude: -15.8,
            longitude: -47.9,
          },
        } as any;

        let statusCode: number | null = null;
        let responseBody: any = null;
        const res = {
          status(code: number) {
            statusCode = code;
            return this;
          },
          json(data: any) {
            responseBody = data;
            return this;
          },
        } as any;

        await restaurantController.create(req, res, () => {});

        assert.strictEqual(statusCode, 201);
        assert.strictEqual(responseBody.restaurant.id, "rest-123");
        assert.strictEqual(responseBody.restaurant.ownerId, ownerId);

        mock.reset();
      });

      it("deve retornar 401 se user não estiver autenticado", async () => {
        const req = {
          body: { name: "Teste" },
        } as any;

        let statusCode: number | null = null;
        const res = {
          status(code: number) {
            statusCode = code;
            return this;
          },
          json() {
            return this;
          },
        } as any;

        await restaurantController.create(req, res, () => {});

        assert.strictEqual(statusCode, 401);
      });
    });
  });
});
