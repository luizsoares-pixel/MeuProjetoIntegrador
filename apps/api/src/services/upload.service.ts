import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabase";

export interface GeneratePresignedUrlParams {
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  contentLength: number;
  userId: string;
  folder?: string;
}

export interface PresignedUrlResult {
  presignedUrl: string;
  publicUrl: string;
  key: string;
}

export class UploadService {
  constructor(
    private supabase: SupabaseClient = supabaseAdmin,
    private bucketName: string = process.env.SUPABASE_STORAGE_BUCKET ||
      "menu-digital-images"
  ) {}

  async generatePresignedUrl(
    params: GeneratePresignedUrlParams
  ): Promise<PresignedUrlResult> {
    const { fileName, userId, folder = "uploads" } = params;

    // Sanitiza o nome do arquivo substituindo caracteres especiais e espaços por underline
    const sanitizedFileName = fileName
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_");

    const uniqueId = randomUUID();
    const filePath = `${folder}/${userId}/${uniqueId}-${sanitizedFileName}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUploadUrl(filePath, { upsert: true });

    if (error || !data?.signedUrl) {
      throw new Error(
        `Falha ao gerar URL pré-assinada: ${
          error?.message || "Erro desconhecido no Supabase Storage."
        }`
      );
    }

    const { data: publicData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return {
      presignedUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
      key: filePath,
    };
  }
}

export const uploadService = new UploadService();
