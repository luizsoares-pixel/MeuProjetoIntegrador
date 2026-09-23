import { z } from "zod";

// ── Restaurants ────────────────────────────────────────────────────────────────

export const nearbyRestaurantsSchema = z.object({
  lat: z
    .string({ required_error: "O parâmetro 'lat' é obrigatório." })
    .refine((v) => v.trim() !== "", { message: "O parâmetro 'lat' não pode ser vazio." })
    .transform(Number)
    .refine((v) => !isNaN(v) && v >= -90 && v <= 90, {
      message: "O parâmetro 'lat' deve ser um número entre -90 e 90.",
    }),
  lng: z
    .string({ required_error: "O parâmetro 'lng' é obrigatório." })
    .refine((v) => v.trim() !== "", { message: "O parâmetro 'lng' não pode ser vazio." })
    .transform(Number)
    .refine((v) => !isNaN(v) && v >= -180 && v <= 180, {
      message: "O parâmetro 'lng' deve ser um número entre -180 e 180.",
    }),
  radius: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? Number(v) : 5000))
    .refine((v) => !isNaN(v) && v > 0, {
      message: "O parâmetro 'radius' deve ser um número positivo (metros).",
    }),
});

export type NearbyRestaurantsQuery = z.infer<typeof nearbyRestaurantsSchema>;

// ── Restaurant Listing & Pagination (Issue #50) ──────────────────────────────

export const restaurantSortByEnum = z.enum([
  "distance",
  "rating",
  "priceAsc",
  "priceDesc",
]);
export type RestaurantSortBy = z.infer<typeof restaurantSortByEnum>;

export const listRestaurantsQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : 1))
      .refine((v) => !isNaN(v) && Number.isInteger(v) && v >= 1, {
        message: "O parâmetro 'page' deve ser um número inteiro maior ou igual a 1.",
      }),
    limit: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : 10))
      .refine((v) => !isNaN(v) && Number.isInteger(v) && v >= 1 && v <= 50, {
        message: "O parâmetro 'limit' deve ser um número inteiro entre 1 e 50.",
      }),
    search: z
      .string()
      .trim()
      .max(100, "O termo de busca não pode exceder 100 caracteres.")
      .optional(),
    cuisine: z
      .string()
      .trim()
      .max(50, "O filtro de culinária não pode exceder 50 caracteres.")
      .optional(),
    city: z
      .string()
      .trim()
      .max(100, "O filtro de cidade não pode exceder 100 caracteres.")
      .optional(),
    priceRange: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const raw = Array.isArray(val) ? val.join(",") : val;
        const items = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return items.length > 0 ? items : undefined;
      })
      .refine(
        (items) =>
          items === undefined ||
          items.every((item) => ["$", "$$", "$$$"].includes(item)),
        {
          message:
            "O parâmetro 'priceRange' deve conter apenas valores válidos: $, $$, $$$.",
        }
      )
      .transform((items) => items as ("$" | "$$" | "$$$")[] | undefined),
    minRating: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v >= 1 && v <= 5), {
        message: "O parâmetro 'minRating' deve ser um número entre 1 e 5.",
      }),
    maxDistance: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v > 0), {
        message: "O parâmetro 'maxDistance' deve ser um número positivo em metros.",
      }),
    openNow: z
      .union([z.string(), z.boolean()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === "") return undefined;
        if (typeof v === "boolean") return v;
        return v === "true";
      }),
    sortBy: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? v.trim() : undefined))
      .refine(
        (v) =>
          v === undefined ||
          ["distance", "rating", "priceAsc", "priceDesc"].includes(v),
        {
          message:
            "O parâmetro 'sortBy' deve ser um dos seguintes valores: distance, rating, priceAsc, priceDesc.",
        }
      )
      .transform((v) => v as RestaurantSortBy | undefined),
    lat: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v >= -90 && v <= 90), {
        message: "O parâmetro 'lat' deve ser entre -90 e 90.",
      }),
    lng: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v >= -180 && v <= 180), {
        message: "O parâmetro 'lng' deve ser entre -180 e 180.",
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.maxDistance !== undefined &&
      (data.lat === undefined || data.lng === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Os parâmetros 'lat' e 'lng' são obrigatórios quando 'maxDistance' for informado.",
        path: ["maxDistance"],
      });
    }

    if (
      data.sortBy === "distance" &&
      (data.lat === undefined || data.lng === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Os parâmetros 'lat' e 'lng' são obrigatórios quando 'sortBy=distance' for informado.",
        path: ["sortBy"],
      });
    }
  });

export type ListRestaurantsQuery = z.infer<typeof listRestaurantsQuerySchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ── Restaurant Profile Types & Schemas (Issue #49) ───────────────────────────


export const priceRangeEnum = z.enum(["$", "$$", "$$$"]);
export type PriceRange = z.infer<typeof priceRangeEnum>;

export const paymentMethodEnum = z.enum([
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "CASH",
  "MEAL_VOUCHER",
]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

export const timeShiftSchema = z.object({
  open: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário deve estar no formato HH:mm"),
  close: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário deve estar no formato HH:mm"),
});
export type TimeShift = z.infer<typeof timeShiftSchema>;

export const businessHoursDaySchema = z.array(timeShiftSchema);
export type BusinessHoursDay = z.infer<typeof businessHoursDaySchema>;

export const businessHoursSchema = z.object({
  monday: businessHoursDaySchema.optional(),
  tuesday: businessHoursDaySchema.optional(),
  wednesday: businessHoursDaySchema.optional(),
  thursday: businessHoursDaySchema.optional(),
  friday: businessHoursDaySchema.optional(),
  saturday: businessHoursDaySchema.optional(),
  sunday: businessHoursDaySchema.optional(),
});
export type BusinessHours = z.infer<typeof businessHoursSchema>;

export const socialLinksSchema = z.object({
  instagram: z.string().trim().optional().nullable(),
  facebook: z.string().trim().optional().nullable(),
  website: z.string().trim().url("URL do website inválida").optional().nullable(),
});
export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const restaurantPhotoSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url("URL da foto inválida"),
  order: z.number().int().nonnegative().default(0),
});
export type RestaurantPhotoInput = z.infer<typeof restaurantPhotoSchema>;

export interface RestaurantPhotoResponse {
  id: string;
  restaurantId?: string;
  url: string;
  order: number;
  createdAt?: Date | string;
}

export const updateRestaurantProfileSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}$/, "Telefone inválido")
    .optional()
    .nullable(),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos numéricos")
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .max(500, "A descrição não pode exceder 500 caracteres")
    .optional()
    .nullable(),
  cuisineType: z.string().trim().min(2, "Informe a culinária").optional().nullable(),
  priceRange: priceRangeEnum.optional().nullable(),
  businessHours: businessHoursSchema.optional().nullable(),
  paymentMethods: z.array(paymentMethodEnum).optional(),
  socialLinks: socialLinksSchema.optional().nullable(),
  imageUrl: z.string().url("URL de capa inválida").optional().nullable(),
  photos: z.array(z.string().url("URL de foto inválida")).optional(),
  address: z.string().trim().optional(),
  street: z.string().trim().optional().nullable(),
  number: z.string().trim().optional().nullable(),
  complement: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
    .optional()
    .nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type UpdateRestaurantProfileInput = z.infer<typeof updateRestaurantProfileSchema>;

export const createRestaurantSchema = z.object({
  name: z
    .string({ required_error: "O nome do restaurante é obrigatório." })
    .trim()
    .min(2, "O nome do restaurante deve ter pelo menos 2 caracteres."),
  address: z
    .string({ required_error: "O endereço é obrigatório." })
    .trim()
    .min(3, "O endereço deve ter pelo menos 3 caracteres."),
  cuisineType: z
    .string({ required_error: "O tipo de culinária é obrigatório." })
    .trim()
    .min(2, "Informe o tipo de culinária."),
  latitude: z
    .number({ required_error: "A latitude é obrigatória." })
    .min(-90, "Latitude deve ser entre -90 e 90.")
    .max(90, "Latitude deve ser entre -90 e 90."),
  longitude: z
    .number({ required_error: "A longitude é obrigatória." })
    .min(-180, "Longitude deve ser entre -180 e 180.")
    .max(180, "Longitude deve ser entre -180 e 180."),
  imageUrl: z
    .string()
    .url("A URL da imagem deve ser válida.")
    .nullable()
    .optional(),
  phone: z.string().trim().optional(),
  cnpj: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .max(500, "A descrição não pode exceder 500 caracteres")
    .optional()
    .nullable(),
  priceRange: priceRangeEnum.optional().nullable(),
  businessHours: businessHoursSchema.optional().nullable(),
  paymentMethods: z.array(paymentMethodEnum).optional(),
  socialLinks: socialLinksSchema.optional().nullable(),
  street: z.string().trim().optional().nullable(),
  number: z.string().trim().optional().nullable(),
  complement: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
    .optional()
    .nullable(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;

export interface RestaurantResponse {
  id: string;
  name: string;
  address: string;
  cuisineType?: string | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  distanceInMeters?: number;
  ownerId?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  description?: string | null;
  priceRange?: PriceRange | null;
  rating?: number | null;
  reviewsCount?: number;
  businessHours?: BusinessHours | null;
  paymentMethods?: PaymentMethod[];
  socialLinks?: SocialLinks | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  photos?: RestaurantPhotoResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedRestaurantsResponse {
  restaurants: RestaurantResponse[];
  pagination: PaginationMeta;
}

export interface NearbyRestaurantResponse extends RestaurantResponse {

  distanceInMeters: number;
}

// ── Digital Menu (HU11) ──────────────────────────────────────────────────────

export const createMenuItemSchema = z.object({
  category: z.string().trim().min(1, "A categoria é obrigatória.").max(80),
  name: z.string().trim().min(1, "O nome do item é obrigatório.").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.number().finite().nonnegative("O preço não pode ser negativo."),
  photoUrl: z.string().url("A URL da foto é inválida.").optional().nullable(),
  available: z.boolean().optional().default(true),
});
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const updateMenuItemSchema = createMenuItemSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "Informe pelo menos um campo para atualizar."
);
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

export interface MenuItemResponse {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  available: boolean;
  rating?: number | null;
  reviewsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const menuItemParamsSchema = z.object({
  id: z.string().uuid("ID do prato deve ser um UUID válido."),
});
export type MenuItemParams = z.infer<typeof menuItemParamsSchema>;

export const menuItemDetailResponseSchema = z.object({
  id: z.string().uuid("ID do prato deve ser um UUID válido."),
  restaurantId: z.string().uuid("ID do restaurante deve ser um UUID válido."),
  restaurantName: z.string().optional(),
  category: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number().finite().nonnegative("O preço não pode ser negativo."),
  photoUrl: z.string().url("A URL da foto é inválida.").nullable().optional(),
  available: z.boolean().default(true),
  rating: z.number().nullable().optional(),
  reviewsCount: z.number().int().nonnegative().default(0),
  isFavorite: z.boolean().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});
export type MenuItemDetailResponse = z.infer<typeof menuItemDetailResponseSchema>;

// ── Auth ───────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
  password: z.string({ required_error: "A senha é obrigatória." }).min(1, "A senha é obrigatória."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
  password: z
    .string({ required_error: "A senha é obrigatória." })
    .min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const registerRestaurantSchema = registerSchema.extend({
  restaurant: createRestaurantSchema.extend({
    phone: z
      .string({ required_error: "O telefone é obrigatório." })
      .trim()
      .regex(
        /^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}$/,
        "Informe um telefone válido."
      ),
    cnpj: z
      .string({ required_error: "O CNPJ é obrigatório." })
      .trim()
      .regex(/^\d{14}$/, "Informe um CNPJ válido com 14 dígitos.")
      .refine((value) => value !== value[0].repeat(14), "Informe um CNPJ válido."),
  }),
});

export type RegisterRestaurantInput = z.infer<typeof registerRestaurantSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z
      .string({ required_error: "A confirmação da senha é obrigatória." })
      .min(1, "Confirme a senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;

export const passwordRecoverySchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
});

export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: "A nova senha é obrigatória." })
      .min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z
      .string({ required_error: "A confirmação da senha é obrigatória." })
      .min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const userRoleEnum = z.enum(["user", "restaurant", "admin"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export interface UserResponse {
  id: string;
  email: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  role?: UserRole;
}

export function mapAuthErrorMessage(errorMessage?: string | null): string {
  if (!errorMessage) {
    return "Ocorreu um erro inesperado. Tente novamente.";
  }

  const msg = errorMessage.toLowerCase();

  if (
    msg.includes("cnpj_already_registered") ||
    msg.includes("cnpj já cadastrado")
  ) {
    return "CNPJ já cadastrado.";
  }

  if (
    msg.includes("user already registered") ||
    msg.includes("already registered") ||
    msg.includes("user_already_exists") ||
    msg.includes("duplicate key")
  ) {
    return "E-mail já cadastrado.";
  }

  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid_credentials") ||
    msg.includes("invalid grant")
  ) {
    return "Credenciais inválidas.";
  }

  if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
    return "E-mail ainda não confirmado.";
  }

  if (
    msg.includes("password should be at least") ||
    msg.includes("weak_password")
  ) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("connection") ||
    msg.includes("failed to fetch")
  ) {
    return "Falha de conexão com o servidor. Verifique sua internet.";
  }

  return errorMessage;
}

// ── Route & Travel Time Calculation (Issue #54 / HU9) ─────────────────────────

export const routeProfileEnum = z.enum(["driving", "walking"]);
export type RouteProfile = z.infer<typeof routeProfileEnum>;

export const routeCoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type RouteCoordinate = z.infer<typeof routeCoordinateSchema>;

export const restaurantRouteQuerySchema = z.object({
  lat: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= -90 && v <= 90, {
      message: "O parâmetro 'lat' deve ser um número válido entre -90 e 90.",
    }),
  lng: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= -180 && v <= 180, {
      message: "O parâmetro 'lng' deve ser um número válido entre -180 e 180.",
    }),
  profile: routeProfileEnum.optional().default("driving"),
});
export type RestaurantRouteQuery = z.infer<typeof restaurantRouteQuerySchema>;

export const routeCalculationResultSchema = z.object({
  distanceInMeters: z.number().nonnegative(),
  durationInSeconds: z.number().nonnegative(),
  polylineCoordinates: z.array(routeCoordinateSchema),
  profile: routeProfileEnum,
  isFallback: z.boolean().default(false),
  fallbackReason: z.string().optional(),
});
export type RouteCalculationResult = z.infer<typeof routeCalculationResultSchema>;

export interface RestaurantRouteResponse {
  restaurantId: string;
  route: RouteCalculationResult;
}

// ── Reviews & Ratings (Issue #79 & Issue #82) ─────────────────────────────────

export const createReviewSchema = z
  .object({
    restaurantId: z.string().uuid("ID do restaurante deve ser um UUID válido.").optional(),
    menuItemId: z.string().uuid("ID do prato deve ser um UUID válido.").optional(),
    rating: z
      .number({ required_error: "A nota é obrigatória." })
      .int("A nota deve ser um número inteiro.")
      .min(1, "A nota mínima é 1.")
      .max(5, "A nota máxima é 5."),
    comment: z
      .string()
      .trim()
      .max(1000, "O comentário deve ter no máximo 1000 caracteres.")
      .optional()
      .nullable(),
    photoUrls: z
      .array(z.string().url("A URL da foto é inválida."))
      .max(3, "Máximo de 3 fotos por avaliação.")
      .optional()
      .default([]),
  })
  .strict();
export type CreateReviewInput = z.input<typeof createReviewSchema>;
export type CreateReviewOutput = z.output<typeof createReviewSchema>;

export const updateReviewSchema = z
  .object({
    rating: z
      .number()
      .int("A nota deve ser um número inteiro.")
      .min(1, "A nota mínima é 1.")
      .max(5, "A nota máxima é 5.")
      .optional(),
    comment: z
      .string()
      .trim()
      .max(1000, "O comentário deve ter no máximo 1000 caracteres.")
      .optional()
      .nullable(),
    photoUrls: z
      .array(z.string().url("A URL da foto é inválida."))
      .max(3, "Máximo de 3 fotos por avaliação.")
      .optional(),
  })
  .strict();
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const reportReviewSchema = z.object({
  reason: z
    .string({ required_error: "O motivo da denúncia é obrigatório." })
    .trim()
    .min(3, "O motivo deve ter pelo menos 3 caracteres.")
    .max(500, "O motivo deve ter no máximo 500 caracteres."),
});
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;

export const getMyReviewQuerySchema = z
  .object({
    restaurantId: z.string().uuid("ID do restaurante deve ser um UUID válido.").optional(),
    menuItemId: z.string().uuid("ID do prato deve ser um UUID válido.").optional(),
  })
  .refine((data) => Boolean(data.restaurantId || data.menuItemId), {
    message: "Informe restaurantId ou menuItemId na consulta.",
  });
export type GetMyReviewQuery = z.infer<typeof getMyReviewQuerySchema>;

export const reviewReportResponseSchema = z.object({
  id: z.string().uuid(),
  reviewId: z.string().uuid(),
  reporterId: z.string().uuid(),
  reason: z.string(),
  status: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});
export type ReviewReportResponse = z.infer<typeof reviewReportResponseSchema>;

export const createReviewReplySchema = z.object({
  reply: z
    .string({ required_error: "A resposta é obrigatória." })
    .trim()
    .min(2, "A resposta deve ter no mínimo 2 caracteres.")
    .max(1000, "A resposta deve ter no máximo 1000 caracteres."),
});
export type CreateReviewReplyInput = z.infer<typeof createReviewReplySchema>;

export const reviewPhotoResponseSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  order: z.number().int(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});
export type ReviewPhotoResponse = z.infer<typeof reviewPhotoResponseSchema>;

export const reviewResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().optional(),
  restaurantId: z.string().nullable().optional(),
  menuItemId: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  reply: z.string().nullable().optional(),
  repliedAt: z.union([z.string(), z.date()]).nullable().optional(),
  photos: z.array(reviewPhotoResponseSchema),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;

export const listReviewsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .refine((v) => !isNaN(v) && v >= 1, "Página deve ser um número maior ou igual a 1."),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((v) => !isNaN(v) && v >= 1 && v <= 50, "Limite deve ser entre 1 e 50."),
});
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;

export interface PaginatedReviewsResponse {
  reviews: ReviewResponse[];
  pagination: PaginationMeta;
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution?: Record<number, number>;
}

// ── Favorites (Issue #80) ─────────────────────────────────────────────────────

export interface FavoriteRestaurantResponse {
  id: string;
  userId: string;
  restaurantId: string;
  restaurant: RestaurantResponse;
  createdAt: Date | string;
}

export interface FavoriteDishResponse {
  id: string;
  userId: string;
  menuItemId: string;
  dish: MenuItemResponse;
  createdAt: Date | string;
}

export interface UserFavoritesResponse {
  restaurants: RestaurantResponse[];
  dishes: (MenuItemResponse & { restaurantName?: string })[];
}

export const toggleFavoriteResponseSchema = z.object({
  isFavorite: z.boolean(),
});
export type ToggleFavoriteResponse = z.infer<typeof toggleFavoriteResponseSchema>;

// ── Upload & Storage (Presigned URLs) ─────────────────────────────────────────

export const uploadAllowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const uploadPresignedUrlRequestSchema = z.object({
  fileName: z
    .string({ required_error: "O nome do arquivo é obrigatório." })
    .trim()
    .min(1, "O nome do arquivo não pode ser vazio.")
    .max(255, "O nome do arquivo não pode exceder 255 caracteres."),
  contentType: z.enum(uploadAllowedContentTypes, {
    errorMap: () => ({
      message: "Tipo de arquivo inválido. Permitido apenas JPEG, PNG ou WebP.",
    }),
  }),
  contentLength: z
    .number({ required_error: "O tamanho do arquivo é obrigatório." })
    .int("O tamanho do arquivo deve ser um número inteiro.")
    .positive("O tamanho do arquivo deve ser positivo.")
    .max(10 * 1024 * 1024, "O tamanho do arquivo não pode exceder 10MB."),
  folder: z.string().trim().max(50).optional(),
});
export type UploadPresignedUrlRequest = z.infer<
  typeof uploadPresignedUrlRequestSchema
>;

export const uploadPresignedUrlResponseSchema = z.object({
  presignedUrl: z.string().url("A Presigned URL deve ser uma URL válida."),
  publicUrl: z.string().url("A URL pública deve ser uma URL válida."),
  key: z.string().optional(),
});
export type UploadPresignedUrlResponse = z.infer<
  typeof uploadPresignedUrlResponseSchema
>;



