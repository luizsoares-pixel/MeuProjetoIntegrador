import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  uploadPresignedUrlRequestSchema,
  uploadPresignedUrlResponseSchema,
} from "../index";

describe("Upload Contracts Schema (Presigned URLs)", () => {
  describe("uploadPresignedUrlRequestSchema", () => {
    it("deve validar payload correto para imagem JPEG", () => {
      const payload = {
        fileName: "prato-principal.jpg",
        contentType: "image/jpeg",
        contentLength: 1024 * 500, // 500 KB
      };

      const parsed = uploadPresignedUrlRequestSchema.parse(payload);
      assert.equal(parsed.fileName, "prato-principal.jpg");
      assert.equal(parsed.contentType, "image/jpeg");
      assert.equal(parsed.contentLength, 512000);
    });

    it("deve aceitar os tipos MIME permitidos: image/jpeg, image/png, image/webp", () => {
      const types = ["image/jpeg", "image/png", "image/webp"] as const;

      for (const contentType of types) {
        const parsed = uploadPresignedUrlRequestSchema.parse({
          fileName: "imagem.ext",
          contentType,
          contentLength: 1000,
        });
        assert.equal(parsed.contentType, contentType);
      }
    });

    it("deve rejeitar contentType não permitido (ex: image/gif, application/pdf)", () => {
      const invalidTypes = ["image/gif", "application/pdf", "image/svg+xml", "text/plain"];

      for (const contentType of invalidTypes) {
        assert.throws(
          () =>
            uploadPresignedUrlRequestSchema.parse({
              fileName: "teste.gif",
              contentType,
              contentLength: 1000,
            }),
          /Tipo de arquivo inválido/
        );
      }
    });

    it("deve rejeitar fileName vazio ou ausente", () => {
      assert.throws(
        () =>
          uploadPresignedUrlRequestSchema.parse({
            fileName: "",
            contentType: "image/png",
            contentLength: 1000,
          }),
        /O nome do arquivo não pode ser vazio/
      );

      assert.throws(
        () =>
          uploadPresignedUrlRequestSchema.parse({
            contentType: "image/png",
            contentLength: 1000,
          }),
        /O nome do arquivo é obrigatório/
      );
    });

    it("deve rejeitar contentLength negativo, zero ou maior que 10MB", () => {
      assert.throws(
        () =>
          uploadPresignedUrlRequestSchema.parse({
            fileName: "foto.png",
            contentType: "image/png",
            contentLength: 0,
          }),
        /O tamanho do arquivo deve ser positivo/
      );

      assert.throws(
        () =>
          uploadPresignedUrlRequestSchema.parse({
            fileName: "foto.png",
            contentType: "image/png",
            contentLength: -10,
          }),
        /O tamanho do arquivo deve ser positivo/
      );

      assert.throws(
        () =>
          uploadPresignedUrlRequestSchema.parse({
            fileName: "foto.png",
            contentType: "image/png",
            contentLength: 11 * 1024 * 1024, // 11MB
          }),
        /não pode exceder 10MB/
      );
    });

    it("deve aceitar parâmetro opcional folder e sanitizar espaços", () => {
      const parsed = uploadPresignedUrlRequestSchema.parse({
        fileName: "  meu-prato.png  ",
        contentType: "image/png",
        contentLength: 2048,
        folder: "menu-items",
      });

      assert.equal(parsed.fileName, "meu-prato.png");
      assert.equal(parsed.folder, "menu-items");
    });
  });

  describe("uploadPresignedUrlResponseSchema", () => {
    it("deve validar resposta com presignedUrl e publicUrl válidas", () => {
      const response = {
        presignedUrl: "https://xyz.supabase.co/storage/v1/object/upload/sign/bucket/photo.jpg?token=abc",
        publicUrl: "https://xyz.supabase.co/storage/v1/object/public/bucket/photo.jpg",
        key: "uploads/user-123/photo.jpg",
      };

      const parsed = uploadPresignedUrlResponseSchema.parse(response);
      assert.equal(parsed.presignedUrl, response.presignedUrl);
      assert.equal(parsed.publicUrl, response.publicUrl);
      assert.equal(parsed.key, response.key);
    });

    it("deve rejeitar URLs inválidas", () => {
      assert.throws(
        () =>
          uploadPresignedUrlResponseSchema.parse({
            presignedUrl: "invalid-url",
            publicUrl: "https://xyz.supabase.co/storage/v1/object/public/bucket/photo.jpg",
          }),
        /URL válida/
      );
    });
  });
});
