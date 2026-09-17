import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  businessHoursDaySchema,
  businessHoursSchema,
  createRestaurantSchema,
  listRestaurantsQuerySchema,
  paymentMethodEnum,
  priceRangeEnum,
  registerRestaurantSchema,
  restaurantPhotoSchema,
  restaurantSortByEnum,
  socialLinksSchema,
  timeShiftSchema,
  updateRestaurantProfileSchema,
} from "../index";

function expect<T>(actual: T) {
  return {
    toBe(expected: any) {
      assert.strictEqual(actual, expected);
    },
    toEqual(expected: any) {
      assert.deepStrictEqual(actual, expected);
    },
    toThrow() {
      assert.throws(actual as unknown as () => any);
    },
    toMatchObject(expected: any) {
      assert.ok(
        typeof actual === "object" && actual !== null,
        "Actual is not an object"
      );
      for (const key of Object.keys(expected)) {
        assert.deepStrictEqual((actual as any)[key], expected[key]);
      }
    },
  };
}

describe("Restaurant Contracts Schema", () => {
  it("should validate priceRangeEnum correctly", () => {
    expect(priceRangeEnum.parse("$")).toBe("$");
    expect(priceRangeEnum.parse("$$")).toBe("$$");
    expect(priceRangeEnum.parse("$$$")).toBe("$$$");
    expect(() => priceRangeEnum.parse("$$$$")).toThrow();
  });

  it("should validate paymentMethodEnum correctly", () => {
    expect(paymentMethodEnum.parse("PIX")).toBe("PIX");
    expect(paymentMethodEnum.parse("CREDIT_CARD")).toBe("CREDIT_CARD");
    expect(paymentMethodEnum.parse("DEBIT_CARD")).toBe("DEBIT_CARD");
    expect(paymentMethodEnum.parse("CASH")).toBe("CASH");
    expect(paymentMethodEnum.parse("MEAL_VOUCHER")).toBe("MEAL_VOUCHER");
    expect(() => paymentMethodEnum.parse("BITCOIN")).toThrow();
  });

  it("should validate timeShiftSchema correctly", () => {
    const validShift = { open: "11:30", close: "15:00" };
    expect(timeShiftSchema.parse(validShift)).toEqual(validShift);
    expect(() => timeShiftSchema.parse({ open: "25:00", close: "15:00" })).toThrow();
    expect(() => timeShiftSchema.parse({ open: "11:30", close: "12:60" })).toThrow();
  });

  it("should validate businessHoursDaySchema correctly", () => {
    const validDay = [
      { open: "11:30", close: "15:00" },
      { open: "18:00", close: "23:00" },
    ];
    expect(businessHoursDaySchema.parse(validDay)).toEqual(validDay);
  });

  it("should validate businessHoursSchema correctly", () => {
    const validHours = {
      monday: [
        { open: "11:30", close: "15:00" },
        { open: "18:00", close: "23:00" },
      ],
      sunday: [{ open: "12:00", close: "17:00" }],
    };
    expect(businessHoursSchema.parse(validHours)).toEqual(validHours);
  });

  it("should reject invalid business hours time format", () => {
    const invalidHours = {
      monday: [{ open: "25:00", close: "15:00" }],
    };
    expect(() => businessHoursSchema.parse(invalidHours)).toThrow();
  });

  it("should validate socialLinksSchema correctly", () => {
    const validLinks = {
      instagram: "@restauranteteste",
      facebook: "restauranteteste",
      website: "https://restaurante.com.br",
    };
    expect(socialLinksSchema.parse(validLinks)).toEqual(validLinks);
    expect(() => socialLinksSchema.parse({ website: "invalid-url" })).toThrow();
  });

  it("should validate restaurantPhotoSchema correctly", () => {
    const validPhoto = {
      url: "https://example.com/photo.jpg",
      order: 1,
    };
    expect(restaurantPhotoSchema.parse(validPhoto)).toEqual(validPhoto);
    expect(() => restaurantPhotoSchema.parse({ url: "not-a-url" })).toThrow();
  });

  it("should validate updateRestaurantProfileSchema with partial data", () => {
    const updateData = {
      description: "Restaurante aconchegante com opções vegetarianas.",
      priceRange: "$$" as const,
      paymentMethods: ["PIX" as const, "CREDIT_CARD" as const],
      postalCode: "70000-000",
      city: "Brasília",
      state: "DF",
    };
    expect(updateRestaurantProfileSchema.parse(updateData)).toMatchObject(updateData);
  });

  it("should reject description longer than 500 characters in updateRestaurantProfileSchema", () => {
    const invalidData = {
      description: "a".repeat(501),
    };
    expect(() => updateRestaurantProfileSchema.parse(invalidData)).toThrow();
  });

  it("should validate createRestaurantSchema with extended optional profile fields", () => {
    const restaurantData = {
      name: "Restaurante Completo",
      address: "Rua das Flores, 123",
      cuisineType: "Italiana",
      latitude: -15.78,
      longitude: -47.92,
      description: "Massas artesanais frescas",
      priceRange: "$$" as const,
      paymentMethods: ["PIX" as const],
      city: "Brasília",
      state: "DF",
      postalCode: "70000-000",
    };
    expect(createRestaurantSchema.parse(restaurantData)).toMatchObject(restaurantData);
  });

  it("should parse listRestaurantsQuerySchema with defaults", () => {
    const result = listRestaurantsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("should parse listRestaurantsQuerySchema with valid string numbers", () => {
    const result = listRestaurantsQuerySchema.parse({ page: "3", limit: "25" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(25);
  });

  it("should reject invalid page numbers in listRestaurantsQuerySchema", () => {
    expect(() => listRestaurantsQuerySchema.parse({ page: "0" })).toThrow();
    expect(() => listRestaurantsQuerySchema.parse({ page: "-5" })).toThrow();
    expect(() => listRestaurantsQuerySchema.parse({ page: "abc" })).toThrow();
  });

  it("should reject invalid limit numbers in listRestaurantsQuerySchema", () => {
    expect(() => listRestaurantsQuerySchema.parse({ limit: "0" })).toThrow();
    expect(() => listRestaurantsQuerySchema.parse({ limit: "51" })).toThrow();
    expect(() => listRestaurantsQuerySchema.parse({ limit: "-1" })).toThrow();
  });

  it("should parse listRestaurantsQuerySchema with search, cuisine, and city filters", () => {
    const result = listRestaurantsQuerySchema.parse({
      page: "1",
      limit: "10",
      search: "  Bistrô & Café  ",
      cuisine: "  Francesa ",
      city: " Brasília ",
    });
    expect(result.search).toBe("Bistrô & Café");
    expect(result.cuisine).toBe("Francesa");
    expect(result.city).toBe("Brasília");
  });

  it("should reject search query longer than 100 characters in listRestaurantsQuerySchema", () => {
    expect(() =>
      listRestaurantsQuerySchema.parse({ search: "a".repeat(101) })
    ).toThrow();
  });

  it("should reject cuisine longer than 50 characters in listRestaurantsQuerySchema", () => {
    expect(() =>
      listRestaurantsQuerySchema.parse({ cuisine: "c".repeat(51) })
    ).toThrow();
  });

  it("should reject city longer than 100 characters in listRestaurantsQuerySchema", () => {
    expect(() =>
      listRestaurantsQuerySchema.parse({ city: "b".repeat(101) })
    ).toThrow();
  });

  it("should parse priceRange with single value or comma-separated values", () => {
    const single = listRestaurantsQuerySchema.parse({ priceRange: "$$" });
    expect(single.priceRange).toEqual(["$$"]);

    const multiple = listRestaurantsQuerySchema.parse({ priceRange: "$,$$$" });
    expect(multiple.priceRange).toEqual(["$", "$$$"]);
  });

  it("should reject invalid priceRange values", () => {
    expect(() =>
      listRestaurantsQuerySchema.parse({ priceRange: "$$$$" })
    ).toThrow();
    expect(() =>
      listRestaurantsQuerySchema.parse({ priceRange: "$,INVALID" })
    ).toThrow();
  });

  it("should parse valid minRating and reject invalid values", () => {
    const parsed = listRestaurantsQuerySchema.parse({ minRating: "4.5" });
    expect(parsed.minRating).toBe(4.5);

    expect(() => listRestaurantsQuerySchema.parse({ minRating: "0.5" })).toThrow();
    expect(() => listRestaurantsQuerySchema.parse({ minRating: "5.5" })).toThrow();
    expect(() => listRestaurantsQuerySchema.parse({ minRating: "abc" })).toThrow();
  });

  it("should parse valid maxDistance when lat and lng are provided", () => {
    const parsed = listRestaurantsQuerySchema.parse({
      maxDistance: "5000",
      lat: "-15.7942",
      lng: "-47.8822",
    });
    expect(parsed.maxDistance).toBe(5000);
    expect(parsed.lat).toBe(-15.7942);
    expect(parsed.lng).toBe(-47.8822);
  });

  it("should reject maxDistance when lat or lng are missing", () => {
    expect(() =>
      listRestaurantsQuerySchema.parse({ maxDistance: "5000" })
    ).toThrow();
    expect(() =>
      listRestaurantsQuerySchema.parse({ maxDistance: "5000", lat: "-15.79" })
    ).toThrow();
    expect(() =>
      listRestaurantsQuerySchema.parse({ maxDistance: "5000", lng: "-47.88" })
    ).toThrow();
  });

  it("should reject invalid maxDistance, lat, or lng values", () => {
    expect(() =>
      listRestaurantsQuerySchema.parse({
        maxDistance: "-10",
        lat: "0",
        lng: "0",
      })
    ).toThrow();
    expect(() =>
      listRestaurantsQuerySchema.parse({
        maxDistance: "1000",
        lat: "95",
        lng: "0",
      })
    ).toThrow();
    expect(() =>
      listRestaurantsQuerySchema.parse({
        maxDistance: "1000",
        lat: "0",
        lng: "185",
      })
    ).toThrow();
  });

  it("should parse openNow correctly as boolean", () => {
    const trueParsed = listRestaurantsQuerySchema.parse({ openNow: "true" });
    expect(trueParsed.openNow).toBe(true);

    const falseParsed = listRestaurantsQuerySchema.parse({ openNow: "false" });
    expect(falseParsed.openNow).toBe(false);

    const boolParsed = listRestaurantsQuerySchema.parse({ openNow: true as any });
    expect(boolParsed.openNow).toBe(true);
  });

  it("should parse all advanced filters together with pagination and search", () => {
    const parsed = listRestaurantsQuerySchema.parse({
      page: "2",
      limit: "15",
      search: "Trattoria",
      cuisine: "Italiana",
      city: "Brasília",
      priceRange: "$,$$",
      minRating: "4",
      maxDistance: "3000",
      openNow: "true",
      lat: "-15.78",
      lng: "-47.88",
    });

    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(15);
    expect(parsed.search).toBe("Trattoria");
    expect(parsed.cuisine).toBe("Italiana");
    expect(parsed.city).toBe("Brasília");
    expect(parsed.priceRange).toEqual(["$", "$$"]);
    expect(parsed.minRating).toBe(4);
    expect(parsed.maxDistance).toBe(3000);
    expect(parsed.openNow).toBe(true);
    expect(parsed.lat).toBe(-15.78);
    expect(parsed.lng).toBe(-47.88);
  });

  it("should validate restaurantSortByEnum values", () => {
    expect(restaurantSortByEnum.parse("distance")).toBe("distance");
    expect(restaurantSortByEnum.parse("rating")).toBe("rating");
    expect(restaurantSortByEnum.parse("priceAsc")).toBe("priceAsc");
    expect(restaurantSortByEnum.parse("priceDesc")).toBe("priceDesc");
    expect(() => restaurantSortByEnum.parse("invalidSort")).toThrow();
  });

  it("should parse listRestaurantsQuerySchema with valid sortBy options", () => {
    const byRating = listRestaurantsQuerySchema.parse({ sortBy: "rating" });
    expect(byRating.sortBy).toBe("rating");

    const byPriceAsc = listRestaurantsQuerySchema.parse({ sortBy: "priceAsc" });
    expect(byPriceAsc.sortBy).toBe("priceAsc");

    const byPriceDesc = listRestaurantsQuerySchema.parse({ sortBy: "priceDesc" });
    expect(byPriceDesc.sortBy).toBe("priceDesc");

    const byDistance = listRestaurantsQuerySchema.parse({
      sortBy: "distance",
      lat: "-15.78",
      lng: "-47.88",
    });
    expect(byDistance.sortBy).toBe("distance");
    expect(byDistance.lat).toBe(-15.78);
    expect(byDistance.lng).toBe(-47.88);
  });

  it("should reject invalid sortBy in listRestaurantsQuerySchema", () => {
    expect(() =>
      listRestaurantsQuerySchema.parse({ sortBy: "unknownOrder" })
    ).toThrow();
  });

  it("should reject sortBy=distance when lat or lng are missing", () => {
    expect(() =>
      listRestaurantsQuerySchema.parse({ sortBy: "distance" })
    ).toThrow();
    expect(() =>
      listRestaurantsQuerySchema.parse({ sortBy: "distance", lat: "-15.78" })
    ).toThrow();
    expect(() =>
      listRestaurantsQuerySchema.parse({ sortBy: "distance", lng: "-47.88" })
    ).toThrow();
  });

  it("should parse sortBy together with all filters and pagination", () => {
    const parsed = listRestaurantsQuerySchema.parse({
      page: "1",
      limit: "10",
      sortBy: "distance",
      lat: "-15.79",
      lng: "-47.89",
      priceRange: "$$",
      minRating: "4.5",
      openNow: "true",
    });
    expect(parsed.sortBy).toBe("distance");
    expect(parsed.priceRange).toEqual(["$$"]);
    expect(parsed.minRating).toBe(4.5);
    expect(parsed.openNow).toBe(true);
  });
});

