import {
  loginSchema,
  passwordRecoverySchema,
  registerSchema,
  registerRestaurantSchema,
} from "@menu-digital/contracts";
import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { authController } from "../controllers/auth.controller";
import { prisma } from "../lib/prisma";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { validateRequest } from "../middleware/validateRequest";
import { authMiddleware } from "../middlewares/auth";
import { authService } from "../services/auth.service";

describe("Auth Layer - Refactored Verification Suite", () => {
  describe("Etapa 1: Prisma Schema e Model Definition", () => {
    it("deve exportar instância configurada do Prisma Client", () => {
      assert.ok(prisma);
    });
  });

  describe("Etapa 2: Supabase Client Configuration", () => {
    it("deve instanciar cliente público e admin", () => {
      assert.ok(supabase);
      assert.ok(supabaseAdmin);
      assert.notStrictEqual(supabase, supabaseAdmin);
      assert.ok(supabase.auth.signUp);
      assert.ok(supabase.auth.signInWithPassword);
    });
  });

  describe("Etapa 3: Validação de Payload com Zod", () => {
    it("deve rejeitar payload de registro com senha curta (< 8 caracteres)", async () => {
      const validator = validateRequest(registerSchema);
      const req = {
        body: { email: "valid@email.com", password: "123" },
      } as any;
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
      assert.strictEqual(
        responseBody.error,
        "Erro de validação nos dados enviados."
      );
      assert.ok(
        responseBody.details.some((d: any) => d.field === "password")
      );
    });

    it("deve rejeitar payload de login com e-mail inválido", async () => {
      const validator = validateRequest(loginSchema);
      const req = {
        body: { email: "not-an-email", password: "password123" },
      } as any;
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
        responseBody.details.some((d: any) => d.field === "email")
      );
    });

    it("deve aceitar payload válido e prosseguir no pipeline", async () => {
      const validator = validateRequest(registerSchema);
      const req = {
        body: { email: "  User@Example.COM  ", password: "password123" },
      } as any;
      const res = {} as any;

      let nextCalled = false;
      await validator(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.body.email, "User@Example.COM");
    });
  });

  describe("Etapa 3: POST /auth/register", () => {
    it("deve retornar sucesso diretamente após o signUp do Supabase", async () => {
      const mockUserId = "11111111-1111-1111-1111-111111111111";
      const mockEmail = "test@example.com";

      mock.method(supabase.auth, "signUp", async () => ({
        data: {
          user: { id: mockUserId, email: mockEmail },
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: 1800000000,
          },
        },
        error: null,
      }));

      const result = await authService.register({
        email: mockEmail,
        password: "password123",
      });

      assert.strictEqual(result.user.id, mockUserId);
      assert.strictEqual(result.user.email, mockEmail);
      assert.strictEqual(result.session?.accessToken, "mock-access-token");
      assert.strictEqual(result.session?.refreshToken, "mock-refresh-token");

      mock.reset();
    });

    it("AuthController.register deve retornar status 409 quando o usuário já estiver cadastrado", async () => {
      const mockReq = {
        body: { email: "exists@example.com", password: "password123" },
      } as any;

      let statusCode: number | null = null;
      let responseBody: any = null;

      const mockRes = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responseBody = data;
          return this;
        },
      } as any;

      mock.method(authService, "register", async () => {
        throw new Error("User already registered");
      });

      await authController.register(mockReq, mockRes, () => {});

      assert.strictEqual(statusCode, 409);
      assert.strictEqual(responseBody?.error, "E-mail já cadastrado.");

      mock.reset();
    });
  });

  describe("Etapa 3: POST /auth/login", () => {
    it("deve autenticar com sucesso e retornar tokens + dados do Prisma", async () => {
      const userId = "33333333-3333-3333-3333-333333333333";
      const email = "login@example.com";

      mock.method(supabase.auth, "signInWithPassword", async () => ({
        data: {
          user: { id: userId, email },
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: 1900000000,
          },
        },
        error: null,
      }));

      (prisma as any).user = {
        ...(prisma.user || {}),
        findUnique: async () => ({
          id: userId,
          email,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        }),
      };

      const result = await authService.login({
        email,
        password: "password123",
      });

      assert.strictEqual(result.user.id, userId);
      assert.strictEqual(result.user.email, email);
      assert.strictEqual(result.session.accessToken, "mock-access-token");
      assert.strictEqual(result.session.refreshToken, "mock-refresh-token");

      mock.reset();
    });

    it("deve lançar CREDENTIALS_INVALID quando login falhar no Supabase Auth", async () => {
      mock.method(supabase.auth, "signInWithPassword", async () => ({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", status: 400 } as any,
      }));

      await assert.rejects(
        async () => {
          await authService.login({
            email: "invalid@example.com",
            password: "wrong-password",
          });
        },
        {
          name: "Error",
          message: "CREDENTIALS_INVALID",
        }
      );

      mock.reset();
    });
  });

  describe("Etapa 3: POST /auth/password-recovery", () => {
    it("deve rejeitar solicitação com e-mail inválido", async () => {
      const validator = validateRequest(passwordRecoverySchema);
      const req = { body: { email: "invalid-email" } } as any;
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
      assert.ok(responseBody.details.some((d: any) => d.field === "email"));
    });

    it("deve enviar a solicitação com o e-mail normalizado", async () => {
      let receivedEmail = "";
      mock.method(supabase.auth, "resetPasswordForEmail", async (email: string) => {
        receivedEmail = email;
        return { data: {}, error: null } as any;
      });

      const result = await authService.requestPasswordRecovery({
        email: "  User@Example.COM  ",
      });

      assert.strictEqual(receivedEmail, "user@example.com");
      assert.match(result.message, /Se o e-mail estiver cadastrado/);

      mock.reset();
    });

    it("deve propagar falha da operação de recuperação", async () => {
      mock.method(supabase.auth, "resetPasswordForEmail", async () => ({
        data: {},
        error: { message: "Failed to fetch" },
      }) as any);

      await assert.rejects(
        () =>
          authService.requestPasswordRecovery({
            email: "user@example.com",
          }),
        { message: "Failed to fetch" }
      );

      mock.reset();
    });
  });

  describe("Etapa 4: Middleware de Autenticação (JWT Offline Verification)", () => {
    it("deve retornar 401 se cabeçalho Authorization estiver ausente ou sem Bearer", async () => {
      let statusCode: number | null = null;
      let responseBody: any = null;

      const mockReq = { headers: {} } as any;
      const mockRes = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responseBody = data;
          return this;
        },
      } as any;

      await authMiddleware(mockReq, mockRes, () => {});

      assert.strictEqual(statusCode, 401);
      assert.ok(responseBody?.error);
    });

    it("deve validar token offline via jwt.verify e anexar user no request", async () => {
      process.env.SUPABASE_JWT_SECRET = "test-secret";
      const validUserId = "44444444-4444-4444-4444-444444444444";
      const validEmail = "auth-user@example.com";

      mock.method(jwt, "verify", () => ({
        sub: validUserId,
        email: validEmail,
      }));

      const mockReq = {
        headers: { authorization: "Bearer valid-jwt-token" },
      } as any;

      let nextCalled = false;
      const mockRes = {} as any;

      await authMiddleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(mockReq.user?.id, validUserId);
      assert.strictEqual(mockReq.user?.email, validEmail);

      mock.reset();
    });

    it("deve rejeitar token com assinatura inválida e retornar 401", async () => {
      process.env.SUPABASE_JWT_SECRET = "test-secret";

      mock.method(jwt, "verify", () => {
        throw new Error("invalid signature");
      });

      const mockReq = {
        headers: { authorization: "Bearer invalid-jwt-token" },
      } as any;

      let statusCode: number | null = null;
      let responseBody: any = null;

      const mockRes = {
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
      await authMiddleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 401);
      assert.strictEqual(
        responseBody?.error,
        "Token de acesso inválido ou expirado."
      );

      mock.reset();
    });
  });

  describe("Etapa 5: GET /auth/me", () => {
    it("deve retornar o perfil do usuário autenticado a partir do Prisma", async () => {
      const userId = "55555555-5555-5555-5555-555555555555";
      const mockUser = {
        id: userId,
        email: "me@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mock.method(authService, "getProfile", async (id: string) => {
        assert.strictEqual(id, userId);
        return mockUser;
      });

      const mockReq = {
        user: { id: userId, email: "me@example.com" },
      } as any;

      let statusCode: number | null = null;
      let responseBody: any = null;

      const mockRes = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responseBody = data;
          return this;
        },
      } as any;

      await authController.me(mockReq, mockRes, () => {});

      assert.strictEqual(statusCode, 200);
      assert.strictEqual(responseBody?.user?.id, userId);
      assert.strictEqual(responseBody?.user?.email, "me@example.com");

      mock.reset();
    });

    it("deve retornar 404 se o usuário não for encontrado no Prisma", async () => {
      mock.method(authService, "getProfile", async () => null);

      const mockReq = {
        user: { id: "non-existent-id" },
      } as any;

      let statusCode: number | null = null;
      let responseBody: any = null;

      const mockRes = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responseBody = data;
          return this;
        },
      } as any;

      await authController.me(mockReq, mockRes, () => {});

      assert.strictEqual(statusCode, 404);
      assert.strictEqual(responseBody?.error, "Usuário não encontrado.");

      mock.reset();
    });
  });

  describe("Issue #48: Cadastro de Conta de Restaurante na Tela Inicial", () => {
    const validRestaurantPayload = {
      email: "dono@restaurante.com",
      password: "password123",
      restaurant: {
        name: "Restaurante Sabor & Arte",
        address: "Rua das Flores, 123",
        cuisineType: "Brasileira",
        latitude: -15.7942,
        longitude: -47.8822,
        phone: "61999998888",
        cnpj: "12345678000195",
      },
    };

    describe("Validação de Payload (registerRestaurantSchema)", () => {
      it("deve aceitar payload válido com todos os dados de conta e restaurante", () => {
        const result = registerRestaurantSchema.safeParse(validRestaurantPayload);
        assert.strictEqual(result.success, true);
      });

      it("deve rejeitar payload sem telefone do restaurante", () => {
        const payload = {
          ...validRestaurantPayload,
          restaurant: {
            ...validRestaurantPayload.restaurant,
            phone: "",
          },
        };
        const result = registerRestaurantSchema.safeParse(payload);
        assert.strictEqual(result.success, false);
      });

      it("deve rejeitar CNPJ com dígitos repetidos", () => {
        const payload = {
          ...validRestaurantPayload,
          restaurant: {
            ...validRestaurantPayload.restaurant,
            cnpj: "11111111111111",
          },
        };
        const result = registerRestaurantSchema.safeParse(payload);
        assert.strictEqual(result.success, false);
      });

      it("deve rejeitar CNPJ com tamanho diferente de 14 dígitos", () => {
        const payload = {
          ...validRestaurantPayload,
          restaurant: {
            ...validRestaurantPayload.restaurant,
            cnpj: "12345",
          },
        };
        const result = registerRestaurantSchema.safeParse(payload);
        assert.strictEqual(result.success, false);
      });
    });

    describe("authService.registerRestaurant", () => {
      it("deve rejeitar cadastro quando o CNPJ já estiver cadastrado", async () => {
        (prisma as any).restaurant = {
          findUnique: async () => ({
            id: "existing-restaurant",
            name: "Outro Restaurante",
          }),
        };

        await assert.rejects(
          async () => {
            await authService.registerRestaurant(validRestaurantPayload);
          },
          { message: "CNPJ_ALREADY_REGISTERED" }
        );
      });

      it("deve cadastrar usuário como role restaurant e vincular ao restaurante", async () => {
        const userId = "b90956b6-9bb2-4a0b-8d76-e17f739cbcd9";

        let upsertedUser: any = null;
        (prisma as any).restaurant = {
          findUnique: async () => null,
          create: async (args: any) => ({
            id: "rest-uuid",
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        };
        let rolePassedToUpsert: string | undefined = undefined;
        (prisma as any).user = {
          upsert: async (args: any) => {
            if (args.create?.role) {
              rolePassedToUpsert = args.create.role;
            }
            return { id: userId, email: validRestaurantPayload.email, role: "restaurant" };
          },
        };

        mock.method(supabase.auth, "signUp", async () => ({
          data: {
            user: { id: userId, email: validRestaurantPayload.email },
            session: {
              access_token: "mock-access-token",
              refresh_token: "mock-refresh-token",
              expires_at: 1234567890,
            },
          } as any,
          error: null,
        }));

        let updatedAppMetadata: any = null;
        Object.defineProperty(supabaseAdmin.auth, "admin", {
          value: {
            updateUserById: async (_id: string, attrs: any) => {
              updatedAppMetadata = attrs;
              return { data: { user: { id: userId } }, error: null };
            },
            deleteUser: async () => ({ data: {}, error: null }),
          },
          configurable: true,
        });

        const result = await authService.registerRestaurant(validRestaurantPayload);

        assert.strictEqual(result.user.id, userId);
        assert.strictEqual(result.user.role, "restaurant");
        assert.strictEqual(result.restaurant.name, validRestaurantPayload.restaurant.name);
        assert.strictEqual(rolePassedToUpsert, "restaurant");
        assert.strictEqual(updatedAppMetadata?.app_metadata?.role, "restaurant");

        mock.reset();
      });

      it("deve executar transação compensatória e deletar usuário se criação de restaurante falhar", async () => {
        const userId = "compensatory-user-id";

        (prisma as any).restaurant = {
          findUnique: async () => null,
          create: async () => {
            throw new Error("DB_WRITE_FAILED");
          },
        };
        (prisma as any).user = {
          upsert: async () => ({ id: userId }),
        };

        mock.method(supabase.auth, "signUp", async () => ({
          data: {
            user: { id: userId, email: validRestaurantPayload.email },
            session: null,
          } as any,
          error: null,
        }));

        let deletedUserId: string | null = null;
        Object.defineProperty(supabaseAdmin.auth, "admin", {
          value: {
            updateUserById: async () => ({ data: {}, error: null }),
            deleteUser: async (id: string) => {
              deletedUserId = id;
              return { data: {}, error: null };
            },
          },
          configurable: true,
        });

        await assert.rejects(
          async () => {
            await authService.registerRestaurant(validRestaurantPayload);
          },
          { message: "DB_WRITE_FAILED" }
        );

        assert.strictEqual(deletedUserId, userId);

        mock.reset();
      });
    });

    describe("authController.registerRestaurant", () => {
      it("deve retornar 201 com dados do restaurante em caso de sucesso", async () => {
        mock.method(authService, "registerRestaurant", async () => ({
          user: { id: "user-1", email: "dono@restaurante.com", role: "restaurant" as const },
          restaurant: { id: "rest-1", name: "Restaurante Sabor & Arte" } as any,
          session: null,
        }));

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

        await authController.registerRestaurant(
          { body: validRestaurantPayload } as any,
          res,
          () => {}
        );

        assert.strictEqual(statusCode, 201);
        assert.strictEqual(responseBody?.user?.role, "restaurant");
        assert.strictEqual(responseBody?.restaurant?.name, "Restaurante Sabor & Arte");

        mock.reset();
      });

      it("deve retornar 409 quando CNPJ já cadastrado", async () => {
        mock.method(authService, "registerRestaurant", async () => {
          throw new Error("CNPJ_ALREADY_REGISTERED");
        });

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

        await authController.registerRestaurant(
          { body: validRestaurantPayload } as any,
          res,
          () => {}
        );

        assert.strictEqual(statusCode, 409);
        assert.strictEqual(responseBody?.error, "CNPJ já cadastrado.");

        mock.reset();
      });
    });

    describe("authMiddleware com role: restaurant", () => {
      it("deve identificar role restaurant a partir do token JWT e anexar ao request", async () => {
        const secret = "test-jwt-secret-issue48";
        process.env.SUPABASE_JWT_SECRET = secret;

        const token = jwt.sign(
          {
            sub: "rest-owner-id",
            email: "dono@rest.com",
            app_metadata: { role: "restaurant" },
          },
          secret
        );

        const req = {
          headers: { authorization: `Bearer ${token}` },
        } as any;

        let nextCalled = false;
        await authMiddleware(req, {} as any, () => {
          nextCalled = true;
        });

        assert.strictEqual(nextCalled, true);
        assert.strictEqual(req.user?.id, "rest-owner-id");
        assert.strictEqual(req.user?.role, "restaurant");

        delete process.env.SUPABASE_JWT_SECRET;
      });
    });
  });
});
