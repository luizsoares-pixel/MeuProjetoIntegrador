import type {
  CreateReviewInput,
  CreateReviewReplyInput,
  PaginatedReviewsResponse,
  ReportReviewInput,
  ReviewReportResponse,
  ReviewResponse,
  UpdateReviewInput,
} from "@menu-digital/contracts";
import { API_BASE_URL, uploadImageFromUri } from "./api";

/**
 * Consulta se o usuário autenticado já possui uma avaliação ativa
 * para um restaurante ou prato específico.
 */
export async function fetchMyReview(
  token: string,
  query: { restaurantId?: string; menuItemId?: string }
): Promise<ReviewResponse | null> {
  const url = new URL(`${API_BASE_URL}/reviews/me`);
  if (query.restaurantId) url.searchParams.set("restaurantId", query.restaurantId);
  if (query.menuItemId) url.searchParams.set("menuItemId", query.menuItemId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.review ?? null;
}

/**
 * Criação genérica de avaliação (Restaurante ou Prato).
 */
export async function createReview(
  input: CreateReviewInput,
  token: string
): Promise<ReviewResponse> {
  const url = `${API_BASE_URL}/reviews`;

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
 * Atualiza nota, comentário ou fotos de uma avaliação existente.
 */
export async function updateReview(
  reviewId: string,
  input: UpdateReviewInput,
  token: string
): Promise<ReviewResponse> {
  const url = `${API_BASE_URL}/reviews/${reviewId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `Erro ao atualizar avaliação: ${response.status}`;
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
 * Exclui a avaliação própria do usuário.
 */
export async function deleteReview(
  reviewId: string,
  token: string
): Promise<void> {
  const url = `${API_BASE_URL}/reviews/${reviewId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Erro ao excluir avaliação: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }
}

/**
 * Denuncia uma avaliação de terceiros para revisão manual pela moderação.
 */
export async function reportReview(
  reviewId: string,
  reason: string,
  token: string
): Promise<ReviewReportResponse> {
  const url = `${API_BASE_URL}/reviews/${reviewId}/report`;
  const body: ReportReviewInput = { reason };

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
    let errorMessage = `Erro ao denunciar avaliação: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // Ignora erro de parsing
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.report;
}

/**
 * Busca a listagem paginada de avaliações de um restaurante.
 */
export async function fetchRestaurantReviews(
  restaurantId: string,
  page = 1,
  limit = 10
): Promise<PaginatedReviewsResponse> {
  const url = new URL(`${API_BASE_URL}/restaurants/${restaurantId}/reviews`);
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
    let errorMessage = `Erro ao carregar avaliações do restaurante: ${response.status}`;
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
 * Requer token de autenticação válido (obtido via authMiddleware / Supabase Auth).
 *
 * Lança exceção em caso de falha — os erros são sempre visíveis ao usuário via Alert no ReviewModal.
 * Não usa fallback silencioso: fotos com falha no upload não devem ser salvas como URLs de terceiros.
 */
export async function uploadReviewPhoto(
  uri: string,
  token?: string
): Promise<string> {
  // Se já for uma URL HTTP/HTTPS pública (foto existente em edição), retorna diretamente
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  if (!token) {
    throw new Error(
      "Autenticação necessária para enviar fotos. Faça login e tente novamente."
    );
  }

  // Upload autenticado via pipeline seguro de Presigned URLs (ADR 0013)
  // Qualquer falha propaga a exceção ao chamador (ReviewModal.handleSubmit)
  return await uploadImageFromUri(uri, token, { folder: "reviews" });
}
