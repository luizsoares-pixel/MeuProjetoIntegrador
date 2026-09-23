import React, { useState } from "react";
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
import { colors, spacing, typography } from "../theme";
import { StarRating } from "./StarRating";
import { uploadReviewPhoto } from "../services/review.service";
import { useAuth } from "../hooks/useAuth";

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  targetName: string;
  onSubmit: (data: {
    rating: number;
    comment?: string;
    photoUrls: string[];
  }) => Promise<void>;
}

export function ReviewModal({
  visible,
  onClose,
  targetName,
  onSubmit,
}: ReviewModalProps) {
  const { session } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setRating(5);
    setComment("");
    setSelectedPhotos([]);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
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
        const newUris = result.assets.map((asset) => asset.uri);
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

      // Faz upload de cada foto selecionada
      const uploadedUrls: string[] = [];
      for (const uri of selectedPhotos) {
        const url = await uploadReviewPhoto(uri, session?.access_token);
        uploadedUrls.push(url);
      }

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
    }
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
              <Text style={styles.headerTitle}>Deixe sua avaliação</Text>
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
                  <View key={uri} style={styles.photoPreviewContainer}>
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

            {/* ── Botão de Enviar ─────────────────────────────────────── */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Enviar avaliação"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
              )}
            </TouchableOpacity>
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
    ...typography.h3,
    color: colors.accent.gold,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.accent.whiteLight,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollBody: {
    padding: spacing.md,
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.bodyBold,
    color: colors.accent.white,
    marginBottom: spacing.xs,
  },
  ratingHint: {
    ...typography.captionBold,
    color: colors.accent.gold,
    marginTop: spacing.xs,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  textArea: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.accent.white,
    minHeight: 90,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    ...typography.body,
  },
  charCounter: {
    ...typography.caption,
    color: colors.accent.whiteLight,
    textAlign: "right",
    marginTop: 4,
    fontSize: 11,
  },
  photosSection: {
    marginBottom: spacing.xl,
  },
  photosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  photosCount: {
    ...typography.captionBold,
    color: colors.accent.gold,
  },
  photosRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  photoPreviewContainer: {
    width: 76,
    height: 76,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 10,
  },
  addPhotoButton: {
    width: 76,
    height: 76,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.05)",
  },
  addPhotoText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontSize: 10,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.background.primary,
    fontWeight: "700",
  },
});
