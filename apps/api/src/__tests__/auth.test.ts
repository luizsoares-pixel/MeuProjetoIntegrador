import {
  loginSchema,
  mapAuthErrorMessage,
  registerSchema,
} from "@menu-digital/contracts";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { authController } from "../controllers/auth.controller";
import { prisma } from "../lib/prisma";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { validateRequest } from "../middleware/validateRequest";
import { authMiddleware } from "../middlewares/auth";
import { authService } from "../services/auth.service";

describe("Auth Layer - Issue #2 Comprehensive Verification Suite", () => {
  describe("Etapa 1: Prisma Schema e Model Definition", () => {
    it("deve exportar instância configurada do Prisma Client", () => {
      assert.ok(prisma, "Prisma client deve estar instanciado");
    });
  });

  describe("Etapa 2: Supabase Privilege Isolation", () => {
    it("deve instanciar cliente público e admin separadamente com privilégios isolados", () => {
      assert.ok(supabase, "Cliente público deve existir");
      assert.ok(supabaseAdmin, "Cliente admin deve existir");
      assert.notStrictEqual(
        supabase,
        supabaseAdmin,
        "Cliente público e admin devem ser instâncias isoladas"
      );
      assert.ok(
        supabase.auth.signUp,
        "Cliente público deve ter método signUp"
      );
      assert.ok(
        supabase.auth.signInWithPassword,
        "Cliente público deve ter método signInWithPassword"
      );
      assert.ok(
        supabase.auth.getUser,
        "Cliente público deve ter método getUser"
      );
      assert.ok(
        supabaseAdmin.auth.admin.deleteUser,
        "Cliente admin deve ter método admin.deleteUser"
      );
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

  describe("Etapa 3: POST /auth/register & Dual Write Problem (Compensating Transaction)", () => {
    it("deve registrar usuário com sucesso e persistir no Prisma", async () => {
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

      (prisma as any).user = {
        ...(prisma.user || {}),
        create: async () => ({
          id: mockUserId,
          email: mockEmail,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      const result = await authService.register({
        email: mockEmail,
        password: "password123",
      });

      assert.strictEqual(result.user.id, mockUserId);
      assert.strictEqual(result.user.email, mockEmail);
      assert.strictEqual(
        result.session?.accessToken,
        "mock-access-token"
      );

      mock.reset();
    });

    it("DEVE EXECUTAR TRANSAÇÃO COMPENSATÓRIA (deleteUser) quando a criação no Prisma falhar", async () => {
      const orphanUserId = "22222222-2222-2222-2222-222222222222";
      const orphanEmail = "orphan@example.com";
      let deleteUserCalledWith: string | null = null;

      // 1. Supabase Auth cria o usuário com sucesso
      mock.method(supabase.auth, "signUp", async () => ({
        data: {
          user: { id: orphanUserId, email: orphanEmail },
          session: null,
        },
        error: null,
      }));

      // 2. Prisma falha (ex: constraint violation, timeout, conexão indisponível)
      (prisma as any).user = {
        ...(prisma.user || {}),
        create: async () => {
          throw new Error("Prisma connection error / constraint violation");
        },
      };

      // 3. Monitora se o SupabaseAdmin executa a exclusão compensatória
      mock.method(
        supabaseAdmin.auth.admin,
        "deleteUser",
        async (userId: string) => {
          deleteUserCalledWith = userId;
          return { data: { user: null }, error: null };
        }
      );

      await assert.rejects(
        async () => {
          await authService.register({
            email: orphanEmail,
            password: "password123",
          });
        },
        {
          name: "Error",
          message: "DUAL_WRITE_FAILED",
        }
      );

      // Validação inegociável da regra de negócio:
      assert.strictEqual(
        deleteUserCalledWith,
        orphanUserId,
        "A transação compensatória DEVE chamar deleteUser com o ID do usuário órfão!"
      );

      mock.reset();
    });

    it("AuthController.register deve retornar status 500 informando falha e reversão quando DUAL_WRITE_FAILED ocorrer", async () => {
      const mockReq = {
        body: { email: "fail@example.com", password: "password123" },
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

      const mockNext = () => {};

      mock.method(authService, "register", async () => {
        throw new Error("DUAL_WRITE_FAILED");
      });

      await authController.register(mockReq, mockRes, mockNext);

      assert.strictEqual(statusCode, 500);
      assert.ok(
        responseBody?.error?.includes("revertida"),
        "Mensagem de erro deve informar reversão da criação"
      );

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
      assert.strictEqual(
        result.session.accessToken,
        "mock-access-token"
      );
      assert.strictEqual(
        result.session.refreshToken,
        "mock-refresh-token"
      );

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

  describe("Etapa 4: Middleware de Autenticação", () => {
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

    it("deve validar token remotamente via supabase.auth.getUser e anexar user no request", async () => {
      const validUserId = "44444444-4444-4444-4444-444444444444";
      const validEmail = "auth-user@example.com";

      mock.method(supabase.auth, "getUser", async (token: string) => {
        assert.strictEqual(token, "valid-jwt-token");
        return {
          data: {
            user: { id: validUserId, email: validEmail },
          },
          error: null,
        } as any;
      });

      const mockReq = {
        headers: { authorization: "Bearer valid-jwt-token" },
      } as any;

      let nextCalled = false;
      const mockRes = {} as any;

      await authMiddleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, "next() deve ter sido chamado");
      assert.strictEqual(mockReq.user?.id, validUserId);
      assert.strictEqual(mockReq.user?.email, validEmail);

      mock.reset();
    });

    it("deve retornar 401 se o token for revogado remotamente ou inválido", async () => {
      mock.method(supabase.auth, "getUser", async () => ({
        data: { user: null },
        error: { message: "Session revoked", status: 401 } as any,
      }));

      const mockReq = {
        headers: { authorization: "Bearer revoked-jwt-token" },
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

      assert.strictEqual(nextCalled, false, "NÃO deve chamar next()");
      assert.strictEqual(statusCode, 401);
      assert.ok(responseBody?.error);

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
});
