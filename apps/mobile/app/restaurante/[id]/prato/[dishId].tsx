import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  MenuItemDetailResponse,
  ReviewResponse,
} from "@menu-digital/contracts";
import { fetchMenuItemById } from "../../../../services/api";
import {
  createMenuItemReview,
  fetchMenuItemReviews,
} from "../../../../services/review.service";
import { useAuth } from "../../../../hooks/useAuth";
import { useFavorites } from "../../../../hooks/useFavorites";
import { FavoriteButton } from "../../../../components/FavoriteButton";
import { StarRating } from "../../../../components/StarRating";
import { ReviewCard } from "../../../../components/ReviewCard";
import { ReviewModal } from "../../../../components/ReviewModal";
import { colors, spacing, typography } from "../../../../theme";

export default function DishDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id, dishId } = useLocalSearchParams<{ id: string; dishId: string }>();

  const restaurantId = Array.isArray(id) ? id[0] : id;
  const menuItemId = Array.isArray(dishId) ? dishId[0] : dishId;

  const { session } = useAuth();
  const { isDishFavorite, toggleDish } = useFavorites();

  const [dish, setDish] = useState<MenuItemDetailResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewsPage, setReviewsPage] = useState<number>(1);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(false);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  const [isLoadingDish, setIsLoadingDish] = useState<boolean>(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isReviewModalVisible, setIsReviewModalVisible] = useState<boolean>(false);

  const isFavorite = menuItemId ? isDishFavorite(menuItemId) : false;

  const loadDish = useCallback(async () => {
    if (!menuItemId) return;
    try {
      setIsLoadingDish(true);
      setError(null);
      const data = await fetchMenuItemById(menuItemId);
      setDish(data);
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar os detalhes do prato.");
    } finally {
      setIsLoadingDish(false);
    }
  }, [menuItemId]);

  const loadReviews = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (!menuItemId) return;
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoadingReviews(true);
        }

        const data = await fetchMenuItemReviews(menuItemId, pageToLoad, 5);

        setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
        setReviewsPage(data.pagination.page);
        setHasMoreReviews(data.pagination.hasMore);
        setTotalReviews(data.totalReviews);
      } catch {
        // Falha silenciosa em avaliações secundárias
      } finally {
        setIsLoadingReviews(false);
        setIsLoadingMore(false);
      }
    },
    [menuItemId]
  );

  useEffect(() => {
    loadDish();
    loadReviews(1, false);
  }, [loadDish, loadReviews]);

  const handleToggleFavorite = () => {
    if (!dish) return;
    toggleDish({
      id: dish.id,
      restaurantId: dish.restaurantId,
      name: dish.name,
      category: dish.category,
      price: dish.price,
      photoUrl: dish.photoUrl,
      description: dish.description,
      available: dish.available,
    });
  };

  const handleOpenReviewModal = () => {
    const token = session?.access_token || (session as any)?.token;
    if (!token) {
      Alert.alert(
        "Login necessário",
        "Faça login na sua conta para avaliar este prato."
      );
      return;
    }
    setIsReviewModalVisible(true);
  };

  const handleReviewSubmit = async (data: any) => {
    const token = session?.access_token || (session as any)?.token;
    if (!token || !menuItemId) return;

    await createMenuItemReview(menuItemId, data, token);
    Alert.alert("Avaliação enviada", "Obrigado por avaliar este prato!");

    // Recarrega os dados do prato e a lista de avaliações atualizada
    loadDish();
    loadReviews(1, false);
  };

  const handleLoadMoreReviews = () => {
    if (!isLoadingMore && hasMoreReviews) {
      loadReviews(reviewsPage + 1, true);
    }
  };

  // ── Estado de Loading Inicial ──────────────────────────────────────────────
  if (isLoadingDish) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Carregando detalhes do prato...</Text>
      </View>
    );
  }

  // ── Estado de Erro (404 / Falha) ───────────────────────────────────────────
  if (error || !dish) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={56}
          color={colors.accent.redSoft}
          accessible={false}
        />
        <Text style={styles.errorTitle}>Prato não encontrado</Text>
        <Text style={styles.errorSubtitle}>
          {error || "O prato solicitado não está mais disponível no cardápio."}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao cardápio"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={18}
            color={colors.background.primary}
            accessible={false}
          />
          <Text style={styles.backButtonText}>Voltar ao Cardápio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const effectiveRating = dish.rating ?? null;
  const effectiveCount = dish.reviewsCount ?? totalReviews;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Barra Superior de Navegação ──────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.touchableTarget}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.accent.white}
            accessible={false}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {dish.restaurantName || "Detalhes do Prato"}
        </Text>

        <View style={styles.touchableTarget}>
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={handleToggleFavorite}
            size={24}
            colorActive={colors.accent.redSoft}
            colorInactive={colors.accent.white}
            accessibilityLabel={
              isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"
            }
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Imagem Principal em Alta Resolução ───────────────────────────── */}
        <View style={styles.heroImageContainer}>
          {dish.photoUrl ? (
            <Image
              source={{ uri: dish.photoUrl }}
              style={styles.heroImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={300}
              accessibilityLabel={`Foto do prato ${dish.name}`}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={64}
                color={colors.accent.goldMuted}
                accessible={false}
              />
              <Text style={styles.noImageText}>Sem foto disponível</Text>
            </View>
          )}

          {/* Badge de Disponibilidade */}
          {!dish.available ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>ESGOTADO</Text>
            </View>
          ) : null}
        </View>

        {/* ── Informações Primárias do Prato ───────────────────────────────── */}
        <View style={styles.dishInfoCard}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>
                {dish.category.toUpperCase()}
              </Text>
            </View>
            {dish.available ? (
              <View style={styles.availableChip}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Disponível</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.dishName}>{dish.name}</Text>

          <Text style={styles.dishPrice}>
            R$ {dish.price.toFixed(2).replace(".", ",")}
          </Text>

          {dish.description ? (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionHeaderTitle}>Descrição</Text>
              <Text style={styles.dishDescription}>{dish.description}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Resumo de Avaliações (Nota e Contagem) ───────────────────────── */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingRow}>
            <View style={styles.scoreContainer}>
              <Text style={styles.ratingScore}>
                {effectiveRating !== null ? effectiveRating.toFixed(1) : "—"}
              </Text>
              <StarRating rating={effectiveRating ?? 0} size={18} />
              <Text style={styles.ratingCountText}>
                {effectiveCount > 0
                  ? `${effectiveCount} ${
                      effectiveCount === 1 ? "avaliação" : "avaliações"
                    }`
                  : "Sem avaliações ainda"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.evaluateButton}
              onPress={handleOpenReviewModal}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Avaliar este prato"
            >
              <MaterialCommunityIcons
                name="comment-star-outline"
                size={18}
                color={colors.background.primary}
                accessible={false}
              />
              <Text style={styles.evaluateButtonText}>Avaliar Prato</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Lista de Avaliações dos Clientes ─────────────────────────────── */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsSectionHeader}>
            <MaterialCommunityIcons
              name="comment-text-multiple-outline"
              size={20}
              color={colors.accent.gold}
              accessible={false}
            />
            <Text style={styles.reviewsSectionTitle}>
              Avaliações dos Clientes
            </Text>
          </View>

          {isLoadingReviews ? (
            <View style={styles.loadingReviewsBox}>
              <ActivityIndicator size="small" color={colors.accent.gold} />
              <Text style={styles.loadingReviewsText}>
                Carregando comentários...
              </Text>
            </View>
          ) : reviews.length === 0 ? (
            /* ── Estado Vazio de Avaliações ── */
            <View style={styles.emptyReviewsCard}>
              <MaterialCommunityIcons
                name="star-outline"
                size={38}
                color={colors.accent.goldMuted}
                accessible={false}
              />
              <Text style={styles.emptyReviewsTitle}>
                Nenhuma avaliação ainda
              </Text>
              <Text style={styles.emptyReviewsSubtitle}>
                Experimente este prato e compartilhe sua experiência com outros
                clientes!
              </Text>
              <TouchableOpacity
                style={styles.emptyReviewActionBtn}
                onPress={handleOpenReviewModal}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Escrever primeira avaliação"
              >
                <Text style={styles.emptyReviewActionText}>
                  Seja o primeiro a avaliar
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {reviews.map((rev) => (
                <ReviewCard key={rev.id} review={rev} />
              ))}

              {hasMoreReviews ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMoreReviews}
                  disabled={isLoadingMore}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Carregar mais avaliações"
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color={colors.accent.gold} />
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>
                        Carregar mais avaliações
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={18}
                        color={colors.accent.gold}
                        accessible={false}
                      />
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Modal de Criação de Avaliação ──────────────────────────────────── */}
      {dish ? (
        <ReviewModal
          visible={isReviewModalVisible}
          targetName={dish.name}
          onClose={() => setIsReviewModalVisible(false)}
          onSubmit={handleReviewSubmit}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
  },
  touchableTarget: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.bodyBold,
    color: colors.accent.white,
    flex: 1,
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  heroImageContainer: {
    width: "100%",
    height: 260,
    backgroundColor: colors.background.secondary,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.secondary,
  },
  noImageText: {
    ...typography.caption,
    color: colors.accent.goldMuted,
    marginTop: spacing.sm,
  },
  soldOutBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(224, 86, 75, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  soldOutText: {
    ...typography.captionBold,
    color: colors.accent.white,
    letterSpacing: 1,
  },
  dishInfoCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.md,
    marginTop: -spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    boxShadow: "0px 6px 14px rgba(0, 0, 0, 0.4)",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  categoryChipText: {
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  availableChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  availableText: {
    ...typography.caption,
    color: "#4CAF50",
    fontWeight: "600",
  },
  dishName: {
    ...typography.h2,
    color: colors.accent.white,
    marginTop: spacing.xs,
  },
  dishPrice: {
    ...typography.h1,
    color: colors.accent.gold,
    fontSize: 26,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  descriptionSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  sectionHeaderTitle: {
    ...typography.captionBold,
    color: colors.accent.goldMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  dishDescription: {
    ...typography.body,
    color: colors.accent.whiteSoft,
    lineHeight: 22,
  },
  ratingCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreContainer: {
    alignItems: "flex-start",
    gap: 4,
  },
  ratingScore: {
    ...typography.h1,
    color: colors.accent.gold,
    fontSize: 28,
    lineHeight: 32,
  },
  ratingCountText: {
    ...typography.caption,
    color: colors.accent.whiteLight,
    marginTop: 2,
  },
  evaluateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
  },
  evaluateButtonText: {
    ...typography.bodyBold,
    color: colors.background.primary,
    fontSize: 13,
  },
  reviewsSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  reviewsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  reviewsSectionTitle: {
    ...typography.h3,
    color: colors.accent.white,
    fontSize: 18,
  },
  loadingReviewsBox: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingReviewsText: {
    ...typography.caption,
    color: colors.accent.whiteSoft,
  },
  emptyReviewsCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.12)",
    borderStyle: "dashed",
    gap: spacing.xs,
  },
  emptyReviewsTitle: {
    ...typography.bodyBold,
    color: colors.accent.white,
    marginTop: spacing.xs,
  },
  emptyReviewsSubtitle: {
    ...typography.caption,
    color: colors.accent.whiteSoft,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.md,
    marginTop: 2,
  },
  emptyReviewActionBtn: {
    marginTop: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderWidth: 1,
    borderColor: colors.accent.goldTint,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyReviewActionText: {
    ...typography.captionBold,
    color: colors.accent.gold,
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    marginTop: spacing.xs,
    minHeight: 44,
  },
  loadMoreText: {
    ...typography.bodyBold,
    color: colors.accent.gold,
    fontSize: 13,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.accent.gold,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.accent.white,
    marginTop: spacing.md,
    textAlign: "center",
  },
  errorSubtitle: {
    ...typography.body,
    color: colors.accent.whiteSoft,
    textAlign: "center",
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    backgroundColor: colors.accent.gold,
    borderRadius: 8,
    minHeight: 44,
  },
  backButtonText: {
    ...typography.bodyBold,
    color: colors.background.primary,
  },
});
