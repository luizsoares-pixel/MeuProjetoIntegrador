import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  restaurantRouteQuerySchema,
  routeCalculationResultSchema,
  routeCoordinateSchema,
  routeProfileEnum,
} from "../index";

describe("Route Contracts Schema (Issue #54 / HU9)", () => {
  describe("routeProfileEnum", () => {
    it("should accept valid profiles driving and walking", () => {
      assert.equal(routeProfileEnum.parse("driving"), "driving");
      assert.equal(routeProfileEnum.parse("walking"), "walking");
    });

    it("should reject invalid profiles", () => {
      assert.throws(() => routeProfileEnum.parse("flying"));
      assert.throws(() => routeProfileEnum.parse(""));
      assert.throws(() => routeProfileEnum.parse(123));
    });
  });

  describe("routeCoordinateSchema", () => {
    it("should validate valid coordinates", () => {
      const coord = routeCoordinateSchema.parse({
        latitude: -15.7942,
        longitude: -47.8822,
      });
      assert.equal(coord.latitude, -15.7942);
      assert.equal(coord.longitude, -47.8822);
    });

    it("should reject out-of-range coordinates", () => {
      assert.throws(() =>
        routeCoordinateSchema.parse({ latitude: 91, longitude: -47.8822 })
      );
      assert.throws(() =>
        routeCoordinateSchema.parse({ latitude: -91, longitude: -47.8822 })
      );
      assert.throws(() =>
        routeCoordinateSchema.parse({ latitude: -15.7942, longitude: 181 })
      );
      assert.throws(() =>
        routeCoordinateSchema.parse({ latitude: -15.7942, longitude: -181 })
      );
    });
  });

  describe("restaurantRouteQuerySchema", () => {
    it("should parse valid lat and lng and default profile to driving", () => {
      const parsed = restaurantRouteQuerySchema.parse({
        lat: "-15.7942",
        lng: "-47.8822",
      });
      assert.equal(parsed.lat, -15.7942);
      assert.equal(parsed.lng, -47.8822);
      assert.equal(parsed.profile, "driving");
    });

    it("should accept walking as profile", () => {
      const parsed = restaurantRouteQuerySchema.parse({
        lat: "-15.7942",
        lng: "-47.8822",
        profile: "walking",
      });
      assert.equal(parsed.profile, "walking");
    });

    it("should accept driving as explicit profile", () => {
      const parsed = restaurantRouteQuerySchema.parse({
        lat: "-15.7942",
        lng: "-47.8822",
        profile: "driving",
      });
      assert.equal(parsed.profile, "driving");
    });

    it("should reject invalid profile in restaurantRouteQuerySchema", () => {
      assert.throws(() =>
        restaurantRouteQuerySchema.parse({
          lat: "-15.7942",
          lng: "-47.8822",
          profile: "cycling",
        })
      );
    });

    it("should reject missing lat or lng", () => {
      assert.throws(() => restaurantRouteQuerySchema.parse({ lng: "-47.8822" }));
      assert.throws(() => restaurantRouteQuerySchema.parse({ lat: "-15.7942" }));
      assert.throws(() => restaurantRouteQuerySchema.parse({}));
    });

    it("should reject non-numeric lat or lng", () => {
      assert.throws(() =>
        restaurantRouteQuerySchema.parse({ lat: "abc", lng: "-47.8822" })
      );
      assert.throws(() =>
        restaurantRouteQuerySchema.parse({ lat: "-15.7942", lng: "xyz" })
      );
    });

    it("should reject out of range lat or lng", () => {
      assert.throws(() =>
        restaurantRouteQuerySchema.parse({ lat: "95", lng: "-47.8822" })
      );
      assert.throws(() =>
        restaurantRouteQuerySchema.parse({ lat: "-15.7942", lng: "200" })
      );
    });
  });

  describe("routeCalculationResultSchema", () => {
    it("should parse valid route result", () => {
      const valid = {
        distanceInMeters: 3200,
        durationInSeconds: 480,
        polylineCoordinates: [
          { latitude: -15.7942, longitude: -47.8822 },
          { latitude: -15.795, longitude: -47.883 },
        ],
        profile: "driving" as const,
        isFallback: false,
      };
      const parsed = routeCalculationResultSchema.parse(valid);
      assert.equal(parsed.distanceInMeters, 3200);
      assert.equal(parsed.durationInSeconds, 480);
      assert.equal(parsed.polylineCoordinates.length, 2);
      assert.equal(parsed.isFallback, false);
    });

    it("should parse fallback route with fallbackReason", () => {
      const fallback = {
        distanceInMeters: 2500,
        durationInSeconds: 300,
        polylineCoordinates: [
          { latitude: -15.7942, longitude: -47.8822 },
          { latitude: -15.795, longitude: -47.883 },
        ],
        profile: "walking" as const,
        isFallback: true,
        fallbackReason: "OSRM timeout",
      };
      const parsed = routeCalculationResultSchema.parse(fallback);
      assert.equal(parsed.isFallback, true);
      assert.equal(parsed.fallbackReason, "OSRM timeout");
    });

    it("should reject negative distance or duration", () => {
      assert.throws(() =>
        routeCalculationResultSchema.parse({
          distanceInMeters: -10,
          durationInSeconds: 100,
          polylineCoordinates: [],
          profile: "driving",
        })
      );
      assert.throws(() =>
        routeCalculationResultSchema.parse({
          distanceInMeters: 100,
          durationInSeconds: -5,
          polylineCoordinates: [],
          profile: "driving",
        })
      );
    });
  });
});
