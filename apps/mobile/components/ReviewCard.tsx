import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ReviewResponse } from "@menu-digital/contracts";
import { colors, spacing, typography } from "../theme";
import { StarRating } from "./StarRating";

interface ReviewCardProps {
  review: ReviewResponse;
  currentUserId?: string;
  isOwner?: boolean;
  onReply?: (reviewId: string) => void;
  onEdit?: (review: ReviewResponse) => void;
  onReport?: (reviewId: string) => void;
}

function formatDate(dateValue: string | Date | undefined): string {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function ReviewCard({
  review,
  currentUserId,
  isOwner = false,
  onReply,
  onEdit,
  onReport,
}: ReviewCardProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Formata nome do autor
  const authorName = review.userEmail
    ? review.userEmail.split("@")[0]
    : "Cliente";

  const isMyReview = Boolean(currentUserId && review.userId === currentUserId);

  const handleReportPress = () => {
    if (!onReport) return;

    Alert.alert(
      "Denunciar avaliação",
      "Selecione o motivo da denúncia para análise:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Conteúdo ofensivo ou inadequado",
          onPress: () => onReport(review.id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* ── Cabeçalho do Card ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {authorName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{authorName}</Text>
            {isMyReview ? (
              <View style={styles.myBadge}>
                <Text style={styles.myBadgeText}>Sua avaliação</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.dateText}>{formatDate(review.createdAt)}</Text>
        </View>

        <View style={styles.headerActions}>
          <StarRating rating={review.rating} size={15} />

          {/* Botão de Denúncia (avaliações de terceiros) com hitSlop 44x44pt */}
          {!isMyReview && onReport ? (
            <TouchableOpacity
              onPress={handleReportPress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.actionIconButton}
              accessibilityRole="button"
              accessibilityLabel="Denunciar esta avaliação"
            >
              <MaterialCommunityIcons
                name="flag-outline"
                size={16}
                color={colors.accent.whiteLight}
                accessible={false}
              />
            </TouchableOpacity>
          ) : null}

          {/* Botão de Editar (avaliação própria) */}
          {isMyReview && onEdit ? (
            <TouchableOpacity
              onPress={() => onEdit(review)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.actionIconButton}
              accessibilityRole="button"
              accessibilityLabel="Editar minha avaliação"
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={16}
                color={colors.accent.gold}
                accessible={false}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Comentário ──────────────────────────────────────────────── */}
      {review.comment ? (
        <Text style={styles.commentText}>{review.comment}</Text>
      ) : null}

      {/* ── Galeria de Fotos em Thumbnails ──────────────────────────── */}
      {review.photos && review.photos.length > 0 ? (
        <View style={styles.photosRow}>
          {review.photos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              activeOpacity={0.8}
              onPress={() => setSelectedPhoto(photo.url)}
              style={styles.thumbnailContainer}
              accessibilityRole="button"
              accessibilityLabel="Ver foto da avaliação em tela cheia"
            >
              <Image
                source={{ uri: photo.url }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* ── Resposta Oficial do Restaurante ─────────────────────────── */}
      {review.reply ? (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <MaterialCommunityIcons
              name="store"
              size={16}
              color={colors.accent.gold}
              accessible={false}
            />
            <Text style={styles.replyTitle}>Resposta do restaurante</Text>
            {review.repliedAt ? (
              <Text style={styles.replyDate}>
                {formatDate(review.repliedAt)}
              </Text>
            ) : null}
          </View>
          <Text style={styles.replyBody}>{review.reply}</Text>
        </View>
      ) : isOwner ? (
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => onReply?.(review.id)}
          accessibilityRole="button"
          accessibilityLabel="Responder a esta avaliação"
        >
          <MaterialCommunityIcons
            name="reply"
            size={16}
            color={colors.accent.gold}
            accessible={false}
          />
          <Text style={styles.replyButtonText}>Responder avaliação</Text>
        </TouchableOpacity>
      ) : null}

      {/* ── Modal de Visualização da Foto em Tela Cheia ─────────────── */}
      <Modal
        visible={Boolean(selectedPhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedPhoto(null)}
        >
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setSelectedPhoto(null)}
            accessibilityRole="button"
            accessibilityLabel="Fechar visualização de foto"
          >
            <MaterialCommunityIcons
              name="close"
              size={28}
              color={colors.accent.white}
              accessible={false}
            />
          </TouchableOpacity>

          {selectedPhoto ? (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.fullImage}
              contentFit="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent.goldTint,
  },
  avatarText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
  },
  myBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.goldTint,
  },
  myBadgeText: {
    color: colors.accent.gold,
    fontSize: 10,
    fontWeight: typography.weight.semibold,
  },
  dateText: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteLight,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconButton: {
    padding: 6,
    borderRadius: 4,
  },
  commentText: {
    fontSize: typography.size.sm,
    color: colors.accent.white,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  photosRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  thumbnailContainer: {
    width: 68,
    height: 68,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  replyBox: {
    marginTop: spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 8,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  replyTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
    marginLeft: 6,
    flex: 1,
  },
  replyDate: {
    fontSize: 11,
    color: colors.accent.whiteLight,
  },
  replyBody: {
    fontSize: typography.size.xs,
    color: colors.accent.white,
    lineHeight: 18,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  replyButtonText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalButton: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: "90%",
    height: "75%",
  },
});
