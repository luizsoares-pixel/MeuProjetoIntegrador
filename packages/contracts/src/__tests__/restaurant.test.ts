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
});

