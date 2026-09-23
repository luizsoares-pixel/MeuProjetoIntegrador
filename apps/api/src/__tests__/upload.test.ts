import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UploadService } from "../services/upload.service";
import { uploadController } from "../controllers/upload.controller";

describe("Upload Layer (Presigned URLs)", () => {
  const userId = "11111111-1111-1111-1111-111111111111";

  describe("UploadService.generatePresignedUrl", () => {
    it("deve gerar Presigned URL e Public URL com sucesso quando o Supabase Storage responde OK", async () => {
      let createdPath = "";
      let createdOptions: any = null;

      const mockSupabase: any = {
        storage: {
          from: (bucket: string) => {
            assert.equal(bucket, "test-bucket");
            return {
              createSignedUploadUrl: async (path: string, options: any) => {
                createdPath = path;
                createdOptions = options;
                return {
                  data: {
                    signedUrl: `https://mock.supabase.co/storage/v1/object/upload/sign/test-bucket/${path}?token=mock-token-xyz`,
                    path,
                    token: "mock-token-xyz",
                  },
                  error: null,
                };
              },
              getPublicUrl: (path: string) => {
                return {
                  data: {
                    publicUrl: `https://mock.supabase.co/storage/v1/object/public/test-bucket/${path}`,
                  },
                };
              },
            };
          },
        },
      };

      const service = new UploadService(mockSupabase, "test-bucket");
      const result = await service.generatePresignedUrl({
        fileName: "minha foto prato!.png",
        contentType: "image/png",
        contentLength: 2048,
        userId,
        folder: "menu-items",
      });

      assert.ok(result.presignedUrl.includes("mock-token-xyz"));
      assert.ok(result.publicUrl.includes("test-bucket"));
      assert.ok(result.key.startsWith("menu-items/11111111-1111-1111-1111-111111111111/"));
      // Verifica sanitização do nome do arquivo (espaço e exclamação substituídos por _)
      assert.ok(result.key.endsWith("_png") || result.key.endsWith(".png"));
      assert.ok(!result.key.includes(" "));
      assert.ok(!result.key.includes("!"));
      assert.equal(createdOptions?.upsert, true);
    });

    it("deve lançar exceção descritiva quando o Supabase Storage falha", async () => {
      const mockSupabase: any = {
        storage: {
          from: () => ({
            createSignedUploadUrl: async () => ({
              data: null,
              error: { message: "Bucket não encontrado ou permissão negada." },
            }),
            getPublicUrl: () => ({ data: { publicUrl: "" } }),
          }),
        },
      };

      const service = new UploadService(mockSupabase, "test-bucket");

      await assert.rejects(
        async () => {
          await service.generatePresignedUrl({
            fileName: "foto.jpg",
            contentType: "image/jpeg",
            contentLength: 1024,
            userId,
          });
        },
        /Bucket não encontrado ou permissão negada/
      );
    });

    it("deve usar a pasta padrão 'uploads' caso 'folder' não seja informada", async () => {
      const mockSupabase: any = {
        storage: {
          from: () => ({
            createSignedUploadUrl: async (path: string) => ({
              data: {
                signedUrl: `https://mock.supabase.co/${path}`,
                path,
                token: "token",
              },
              error: null,
            }),
            getPublicUrl: (path: string) => ({
              data: { publicUrl: `https://mock.supabase.co/${path}` },
            }),
          }),
        },
      };

      const service = new UploadService(mockSupabase, "test-bucket");
      const result = await service.generatePresignedUrl({
        fileName: "restaurante.webp",
        contentType: "image/webp",
        contentLength: 4096,
        userId,
      });

      assert.ok(result.key.startsWith("uploads/11111111-1111-1111-1111-111111111111/"));
    });
  });

  describe("UploadController.getPresignedUrl", () => {
    it("deve retornar 401 caso a requisição não possua usuário autenticado", async () => {
      const req: any = {
        body: {
          fileName: "foto.jpg",
          contentType: "image/jpeg",
          contentLength: 1024,
        },
        user: undefined,
      };

      let statusCode = 0;
      let jsonBody: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              jsonBody = body;
            },
          };
        },
      };

      await uploadController.getPresignedUrl(req, res, () => {});

      assert.equal(statusCode, 401);
      assert.ok(jsonBody.error.includes("Token") || jsonBody.error.includes("autenticado"));
    });

    it("deve retornar 200 com presignedUrl e publicUrl para requisição autenticada e válida", async () => {
      const req: any = {
        body: {
          fileName: "perfil.jpg",
          contentType: "image/jpeg",
          contentLength: 5000,
          folder: "restaurants",
        },
        user: { id: userId, email: "chef@restaurante.com" },
      };

      let statusCode = 0;
      let jsonBody: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              jsonBody = body;
            },
          };
        },
      };

      // Mock temporário no service usado pelo controller
      const originalService = (uploadController as any).uploadService;
      (uploadController as any).uploadService = {
        generatePresignedUrl: async () => ({
          presignedUrl: "https://storage.supabase.co/signed/upload.jpg?token=123",
          publicUrl: "https://storage.supabase.co/public/upload.jpg",
          key: "restaurants/11111111-1111-1111-1111-111111111111/uuid-perfil.jpg",
        }),
      };

      try {
        await uploadController.getPresignedUrl(req, res, () => {});
        assert.equal(statusCode, 200);
        assert.ok(jsonBody.presignedUrl);
        assert.ok(jsonBody.publicUrl);
        assert.ok(jsonBody.key);
      } finally {
        (uploadController as any).uploadService = originalService;
      }
    });
  });
});
