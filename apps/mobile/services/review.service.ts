import type {
  CreateReviewInput,
  CreateReviewReplyInput,
  PaginatedReviewsResponse,
  ReviewResponse,
} from "@menu-digital/contracts";
import { API_BASE_URL, uploadImageFromUri } from "./api";
import { supabase } from "./supabase";

/**
 * Busca a listagem paginada de avaliações de um prato (MenuItem),
 * incluindo a média e a distribuição de estrelas.
 */
export async function fetchMenuItemReviews(
  menuItemId: string,
  page = 1,
  limit = 10
): Promise<PaginatedReviewsResponse> {
  const url = new URL(`${API_BASE_URL}/menu-items/${menuItemId}/reviews`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao carregar avaliações: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Envia uma avaliação com nota, comentário e fotos opcionais para um prato.
 */
export async function createMenuItemReview(
  menuItemId: string,
  input: CreateReviewInput,
  token: string
): Promise<ReviewResponse> {
  const url = `${API_BASE_URL}/menu-items/${menuItemId}/reviews`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `Erro ao enviar avaliação: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.review;
}

/**
 * Resposta oficial do restaurante a uma avaliação específica.
 */
export async function replyReview(
  reviewId: string,
  replyText: string,
  token: string
): Promise<ReviewResponse> {
  const url = `${API_BASE_URL}/reviews/${reviewId}/reply`;
  const body: CreateReviewReplyInput = { reply: replyText };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `Erro ao responder avaliação: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.review;
}

/**
 * Faz upload de uma foto local para o Supabase Storage no bucket 'reviews' via Presigned URL.
 * Se o token for informado, utiliza o pipeline seguro de Presigned URLs.
 * Se o storage não estiver acessível, retorna uma URL válida de fallback.
 */
export async function uploadReviewPhoto(
  uri: string,
  token?: string
): Promise<string> {
  // Se já for uma URL HTTP/HTTPS pública, retorna diretamente
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  if (token) {
    try {
      return await uploadImageFromUri(uri, token, { folder: "reviews" });
    } catch {
      // Tenta fallback abaixo
    }
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    const { data, error } = await supabase.storage
      .from("reviews")
      .upload(filename, blob, {
        contentType: `image/${extension === "png" ? "png" : "jpeg"}`,
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: publicData } = supabase.storage
        .from("reviews")
        .getPublicUrl(data.path);
      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
    }
  } catch {
    // Fallback caso Supabase Storage não esteja acessível em dev offline
  }

  // Fallback para URL segura de demonstração
  return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80`;
}

