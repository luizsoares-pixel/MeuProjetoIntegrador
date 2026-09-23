import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import type { ReviewResponse } from "@menu-digital/contracts";
import { colors, spacing, typography } from "../theme";
import { StarRating } from "./StarRating";
import { uploadReviewPhoto } from "../services/review.service";
import { useAuth } from "../hooks/useAuth";

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  targetName: string;
  initialReview?: ReviewResponse | null;
  onSubmit: (data: {
    rating: number;
    comment?: string;
    photoUrls: string[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function ReviewModal({
  visible,
  onClose,
  targetName,
  initialReview,
  onSubmit,
  onDelete,
}: ReviewModalProps) {
  const { session } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);

  const isEditing = Boolean(initialReview);

  useEffect(() => {
    if (visible) {
      if (initialReview) {
        setRating(initialReview.rating);
        setComment(initialReview.comment ?? "");
        setSelectedPhotos((initialReview.photos ?? []).map((p) => p.url));
      } else {
        setRating(5);
        setComment("");
        setSelectedPhotos([]);
      }
      setIsSubmitting(false);
      setIsDeleting(false);
      setUploadStatusText(null);
    }
  }, [visible, initialReview]);

  const handleClose = () => {
    onClose();
  };

  const handlePickPhotos = async () => {
    if (selectedPhotos.length >= 3) {
      Alert.alert("Limite de fotos", "Você pode anexar no máximo 3 fotos.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3 - selectedPhotos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newUris = result.assets.map((asset: { uri: string }) => asset.uri);
        const combined = [...selectedPhotos, ...newUris].slice(0, 3);
        setSelectedPhotos(combined);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível acessar a galeria de imagens.");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert("Nota necessária", "Selecione uma nota entre 1 e 5 estrelas.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Faz upload de cada foto selecionada exibindo feedback de progresso
      const uploadedUrls: string[] = [];
      const totalPhotos = selectedPhotos.length;

      for (let i = 0; i < totalPhotos; i++) {
        const uri = selectedPhotos[i];
        if (uri.startsWith("http://") || uri.startsWith("https://")) {
          uploadedUrls.push(uri);
        } else {
          setUploadStatusText(`Enviando foto ${i + 1} de ${totalPhotos}...`);
          const url = await uploadReviewPhoto(uri, session?.access_token);
          uploadedUrls.push(url);
        }
      }

      setUploadStatusText("Salvando avaliação...");

      await onSubmit({
        rating,
        comment: comment.trim() || undefined,
        photoUrls: uploadedUrls,
      });

      handleClose();
    } catch (error: any) {
      Alert.alert(
        "Erro ao enviar",
        error?.message || "Ocorreu um erro ao enviar sua avaliação. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
      setUploadStatusText(null);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      "Excluir avaliação",
      "Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await onDelete();
              handleClose();
            } catch (err: any) {
              Alert.alert(
                "Erro ao excluir",
                err?.message || "Não foi possível excluir a avaliação."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* ── Barra Superior do Modal ─────────────────────────────────── */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>
                {isEditing ? "Editar sua avaliação" : "Deixe sua avaliação"}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {targetName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fechar formulário de avaliação"
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.accent.white}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Seletor de Estrelas ─────────────────────────────────── */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>Sua nota:</Text>
              <StarRating
                rating={rating}
                interactive
                size={36}
                onRatingChange={setRating}
              />
              <Text style={styles.ratingHint}>
                {rating === 5
                  ? "Excelente! ⭐⭐⭐⭐⭐"
                  : rating === 4
                  ? "Muito bom! ⭐⭐⭐⭐"
                  : rating === 3
                  ? "Bom ⭐⭐⭐"
                  : rating === 2
                  ? "Razoável ⭐⭐"
                  : "Ruim ⭐"}
              </Text>
            </View>

            {/* ── Campo de Comentário ─────────────────────────────────── */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Comentário (opcional):</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                maxLength={1000}
                placeholder="Conte sua experiência: sabor, temperatura, atendimento..."
                placeholderTextColor={colors.accent.whiteLight}
                value={comment}
                onChangeText={setComment}
              />
              <Text style={styles.charCounter}>{comment.length} / 1000</Text>
            </View>

            {/* ── Seletor de Fotos ────────────────────────────────────── */}
            <View style={styles.photosSection}>
              <View style={styles.photosHeader}>
                <Text style={styles.sectionLabel}>Fotos (máximo 3):</Text>
                <Text style={styles.photosCount}>{selectedPhotos.length}/3</Text>
              </View>

              <View style={styles.photosRow}>
                {selectedPhotos.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.photoPreviewContainer}>
                    <Image source={{ uri }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhoto(index)}
                      accessibilityRole="button"
                      accessibilityLabel="Remover foto"
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={20}
                        color={colors.accent.redSoft}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {selectedPhotos.length < 3 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={handlePickPhotos}
                    accessibilityRole="button"
                    accessibilityLabel="Adicionar foto da galeria"
                  >
                    <MaterialCommunityIcons
                      name="camera-plus"
                      size={28}
                      color={colors.accent.gold}
                    />
                    <Text style={styles.addPhotoText}>Adicionar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Feedback de Progresso do Upload ─────────────────────── */}
            {uploadStatusText ? (
              <View style={styles.progressBox}>
                <ActivityIndicator size="small" color={colors.accent.gold} />
                <Text style={styles.progressText}>{uploadStatusText}</Text>
              </View>
            ) : null}

            {/* ── Botão de Enviar / Atualizar ─────────────────────────── */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || isDeleting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || isDeleting}
              accessibilityRole="button"
              accessibilityLabel={
                isEditing ? "Atualizar avaliação" : "Enviar avaliação"
              }
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? "Atualizar Avaliação" : "Enviar Avaliação"}
                </Text>
              )}
            </TouchableOpacity>

            {/* ── Botão de Excluir Avaliação (Modo Edição) ────────────── */}
            {isEditing && onDelete ? (
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  (isSubmitting || isDeleting) && styles.submitButtonDisabled,
                ]}
                onPress={handleDelete}
                disabled={isSubmitting || isDeleting}
                accessibilityRole="button"
                accessibilityLabel="Excluir minha avaliação"
              >
                {isDeleting ? (
                  <ActivityIndicator color={colors.accent.redSoft} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color={colors.accent.redSoft}
                      accessible={false}
                    />
                    <Text style={styles.deleteButtonText}>
                      Excluir Avaliação
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.accent.goldTint,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitles: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteLight,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollBody: {
    padding: spacing.md,
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    marginBottom: spacing.xs,
  },
  ratingHint: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
    marginTop: spacing.xs,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  textArea: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    color: colors.accent.white,
    padding: spacing.md,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 100,
  },
  charCounter: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteLight,
    textAlign: "right",
    marginTop: 4,
  },
  photosSection: {
    marginBottom: spacing.lg,
  },
  photosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  photosCount: {
    fontSize: typography.size.xs,
    color: colors.accent.gold,
  },
  photosRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  photoPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.05)",
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
    color: colors.accent.gold,
    marginTop: 2,
  },
  progressBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 8,
  },
  progressText: {
    fontSize: typography.size.xs,
    color: colors.accent.gold,
  },
  submitButton: {
    backgroundColor: colors.accent.gold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.background.primary,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(224, 86, 75, 0.5)",
    backgroundColor: "rgba(224, 86, 75, 0.08)",
    minHeight: 44,
  },
  deleteButtonText: {
    color: colors.accent.redSoft,
    fontSize: 14,
    fontWeight: typography.weight.bold,
  },
});
