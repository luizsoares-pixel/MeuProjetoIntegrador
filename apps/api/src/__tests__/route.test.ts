import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { restaurantController } from "../controllers/restaurant.controller";
import {
  calculateHaversineFallback,
  RouteService,
  routeService,
} from "../services/route.service";

describe("Route Calculation Layer - Issue #54 (HU9)", () => {
  describe("calculateHaversineFallback", () => {
    it("deve calcular distância e duração estimada para perfil driving", () => {
      const originLat = -15.7942;
      const originLng = -47.8822;
      const destLat = -15.82;
      const destLng = -47.89;

      const result = calculateHaversineFallback(
        originLat,
        originLng,
        destLat,
        destLng,
        "driving"
      );

      assert.ok(result.distanceInMeters > 0);
      assert.ok(result.durationInSeconds > 0);
      assert.equal(result.profile, "driving");
      assert.equal(result.isFallback, true);
      assert.equal(result.polylineCoordinates.length, 2);
      assert.deepEqual(result.polylineCoordinates[0], {
        latitude: originLat,
        longitude: originLng,
      });
      assert.deepEqual(result.polylineCoordinates[1], {
        latitude: destLat,
        longitude: destLng,
      });
    });

    it("deve estimar maior duração para perfil walking em comparação com driving", () => {
      const originLat = -15.7942;
      const originLng = -47.8822;
      const destLat = -15.82;
      const destLng = -47.89;

      const drivingResult = calculateHaversineFallback(
        originLat,
        originLng,
        destLat,
        destLng,
        "driving"
      );

      const walkingResult = calculateHaversineFallback(
        originLat,
        originLng,
        destLat,
        destLng,
        "walking"
      );

      assert.equal(drivingResult.distanceInMeters, walkingResult.distanceInMeters);
      assert.ok(walkingResult.durationInSeconds > drivingResult.durationInSeconds);
      assert.equal(walkingResult.profile, "walking");
      assert.equal(walkingResult.isFallback, true);
    });
  });

  describe("RouteService.calculateRestaurantRoute", () => {
    it("deve retornar null quando restaurante não for encontrado", async () => {
      const mockPrisma: any = {
        restaurant: {
          findUnique: async () => null,
        },
      };
      const service = new RouteService(mockPrisma);

      const result = await service.calculateRestaurantRoute("rest-invalido", {
        lat: -15.7942,
        lng: -47.8822,
        profile: "driving",
      });

      assert.equal(result, null);
    });

    it("deve calcular rota com sucesso via OSRM quando API responder 200", async () => {
      const mockPrisma: any = {
        restaurant: {
          findUnique: async () => ({
            id: "rest-1",
            latitude: -15.8267,
            longitude: -47.9218,
          }),
        },
      };
      const service = new RouteService(mockPrisma);

      const osrmFakeResponse = {
        code: "Ok",
        routes: [
          {
            distance: 4321.8,
            duration: 540.2,
            geometry: {
              type: "LineString",
              coordinates: [
                [-47.8822, -15.7942],
                [-47.89, -15.805],
                [-47.9218, -15.8267],
              ],
            },
          },
        ],
      };

      const originalFetch = globalThis.fetch;
      let requestedUrl = "";
      let requestedHeaders: any = null;

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        requestedUrl = url.toString();
        requestedHeaders = init?.headers;
        return {
          ok: true,
          status: 200,
          json: async () => osrmFakeResponse,
        } as Response;
      }) as any;

      try {
        const result = await service.calculateRestaurantRoute("rest-1", {
          lat: -15.7942,
          lng: -47.8822,
          profile: "driving",
        });

        assert.ok(result);
        assert.equal(result.restaurantId, "rest-1");
        assert.equal(result.route.distanceInMeters, 4322);
        assert.equal(result.route.durationInSeconds, 540);
        assert.equal(result.route.isFallback, false);
        assert.equal(result.route.profile, "driving");
        assert.equal(result.route.polylineCoordinates.length, 3);
        assert.deepEqual(result.route.polylineCoordinates[0], {
          latitude: -15.7942,
          longitude: -47.8822,
        });

        // Valida convenção do OSRM: lng primeiro, depois lat
        assert.ok(
          requestedUrl.includes(
            "/route/v1/driving/-47.8822,-15.7942;-47.9218,-15.8267"
          )
        );
        assert.ok(requestedHeaders["User-Agent"].includes("MenuDigital-API"));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("deve calcular duração com base na velocidade de pedestre quando profile for walking", async () => {
      const mockPrisma: any = {
        restaurant: {
          findUnique: async () => ({
            id: "rest-1",
            latitude: -15.8267,
            longitude: -47.9218,
          }),
        },
      };
      const service = new RouteService(mockPrisma);

      const osrmFakeResponse = {
        code: "Ok",
        routes: [
          {
            distance: 1390,
            duration: 120, // Carro demoraria 120s
            geometry: {
              type: "LineString",
              coordinates: [
                [-47.8822, -15.7942],
                [-47.9218, -15.8267],
              ],
            },
          },
        ],
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => osrmFakeResponse,
      })) as any;

      try {
        const result = await service.calculateRestaurantRoute("rest-1", {
          lat: -15.7942,
          lng: -47.8822,
          profile: "walking",
        });

        assert.ok(result);
        assert.equal(result.route.distanceInMeters, 1390);
        // 1390 metros / 1.39 m/s = 1000 segundos (aproximadamente 16.6 minutos)
        assert.equal(result.route.durationInSeconds, 1000);
        assert.equal(result.route.profile, "walking");
        assert.equal(result.route.isFallback, false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("deve acionar fallback Haversine caso OSRM retorne erro HTTP ou timeout", async () => {
      const mockPrisma: any = {
        restaurant: {
          findUnique: async () => ({
            id: "rest-1",
            latitude: -15.8267,
            longitude: -47.9218,
          }),
        },
      };
      const service = new RouteService(mockPrisma);

      const originalFetch = globalThis.fetch;

      // Simula erro de conexão/timeout
      globalThis.fetch = (async () => {
        throw new Error("Connection timed out");
      }) as any;

      try {
        const result = await service.calculateRestaurantRoute("rest-1", {
          lat: -15.7942,
          lng: -47.8822,
          profile: "driving",
        });

        assert.ok(result);
        assert.equal(result.restaurantId, "rest-1");
        assert.equal(result.route.isFallback, true);
        assert.ok(result.route.distanceInMeters > 0);
        assert.ok(result.route.durationInSeconds > 0);
        assert.ok(result.route.fallbackReason?.includes("Connection timed out"));
        assert.equal(result.route.polylineCoordinates.length, 2);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("deve acionar fallback Haversine caso OSRM responda com status HTTP 429 ou 500", async () => {
      const mockPrisma: any = {
        restaurant: {
          findUnique: async () => ({
            id: "rest-1",
            latitude: -15.8267,
            longitude: -47.9218,
          }),
        },
      };
      const service = new RouteService(mockPrisma);

      const originalFetch = globalThis.fetch;

      globalThis.fetch = (async () => ({
        ok: false,
        status: 429,
        json: async () => ({ message: "Too Many Requests" }),
      })) as any;

      try {
        const result = await service.calculateRestaurantRoute("rest-1", {
          lat: -15.7942,
          lng: -47.8822,
          profile: "driving",
        });

        assert.ok(result);
        assert.equal(result.route.isFallback, true);
        assert.ok(result.route.fallbackReason?.includes("429"));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("RestaurantController.getRoute", () => {
    it("deve retornar 200 com a rota calculada", async () => {
      const mockResult = {
        restaurantId: "rest-1",
        route: {
          distanceInMeters: 2500,
          durationInSeconds: 300,
          polylineCoordinates: [
            { latitude: -15.7942, longitude: -47.8822 },
            { latitude: -15.8, longitude: -47.89 },
          ],
          profile: "driving" as const,
          isFallback: false,
        },
      };

      const req: any = {
        params: { id: "rest-1" },
        parsedQuery: { lat: -15.7942, lng: -47.8822, profile: "driving" },
      };

      let responseStatus = 0;
      let responseBody: any = null;

      const res: any = {
        status(s: number) {
          responseStatus = s;
          return this;
        },
        json(b: any) {
          responseBody = b;
          return this;
        },
      };

      mock.method(routeService, "calculateRestaurantRoute", async () => mockResult);

      try {
        await restaurantController.getRoute(req, res, () => {});
        assert.equal(responseStatus, 200);
        assert.equal(responseBody.restaurantId, "rest-1");
        assert.equal(responseBody.route.distanceInMeters, 2500);
      } finally {
        mock.reset();
      }
    });

    it("deve retornar 404 quando restaurante não for encontrado", async () => {
      mock.method(routeService, "calculateRestaurantRoute", async () => null);

      const req: any = {
        params: { id: "inexistente" },
        parsedQuery: { lat: -15.7942, lng: -47.8822, profile: "driving" },
      };

      let responseStatus = 0;
      let responseBody: any = null;

      const res: any = {
        status(s: number) {
          responseStatus = s;
          return this;
        },
        json(b: any) {
          responseBody = b;
          return this;
        },
      };

      try {
        await restaurantController.getRoute(req, res, () => {});
        assert.equal(responseStatus, 404);
        assert.equal(responseBody.error, "Restaurante não encontrado.");
      } finally {
        mock.reset();
      }
    });

    it("deve chamar next(error) caso o service dispare exceção", async () => {
      mock.method(routeService, "calculateRestaurantRoute", async () => {
        throw new Error("Erro fatal");
      });

      const req: any = {
        params: { id: "rest-1" },
        parsedQuery: { lat: -15.7942, lng: -47.8822, profile: "driving" },
      };

      let passedError: any = null;
      const res: any = {};

      try {
        await restaurantController.getRoute(req, res, (err) => {
          passedError = err;
        });
        assert.ok(passedError);
        assert.equal(passedError.message, "Erro fatal");
      } finally {
        mock.reset();
      }
    });
  });
});
