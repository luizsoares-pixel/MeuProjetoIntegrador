import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import type {
  CreateMenuItemInput,
  MenuItemResponse,
} from "@menu-digital/contracts";
import { useAuth } from "../hooks/useAuth";
import { createMenuItem, updateMenuItem } from "../services/api";
import { colors, spacing, typography } from "../theme";

const CATEGORY_PRESETS = [
  "Entradas",
  "Pratos Principais",
  "Lanches",
  "Pizzas",
  "Bebidas",
  "Sobremesas",
];

interface MenuItemFormModalProps {
  visible: boolean;
  onClose: () => void;
  restaurantId: string;
  initialItem?: MenuItemResponse | null;
  onSuccess: (item: MenuItemResponse) => void;
}

export function MenuItemFormModal({
  visible,
  onClose,
  restaurantId,
  initialItem,
  onSuccess,
}: MenuItemFormModalProps) {
  const { session } = useAuth();

  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preenche valores se estiver em modo edição
  useEffect(() => {
    if (visible) {
      if (initialItem) {
        setCategory(initialItem.category || "");
        setName(initialItem.name || "");
        setDescription(initialItem.description || "");
        setPrice(initialItem.price ? String(initialItem.price) : "");
        setPhotoUrl(initialItem.photoUrl || null);
        setAvailable(initialItem.available ?? true);
      } else {
        setCategory("");
        setName("");
        setDescription("");
        setPrice("");
        setPhotoUrl(null);
        setAvailable(true);
      }
      setErrorMessage(null);
    }
  }, [visible, initialItem]);

  async function handlePickImage() {
    try {
      setIsPickingImage(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Autorize o acesso à galeria nas configurações para selecionar fotos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn("Erro ao selecionar imagem:", err);
      Alert.alert("Erro", "Não foi possível abrir a galeria de fotos.");
    } finally {
      setIsPickingImage(false);
    }
  }

  async function handleTakePhoto() {
    try {
      setIsPickingImage(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Autorize o acesso à câmera nas configurações para tirar fotos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn("Erro ao tirar foto:", err);
      Alert.alert("Erro", "Não foi possível acessar a câmera do dispositivo.");
    } finally {
      setIsPickingImage(false);
    }
  }

  async function handleSave() {
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const numPrice = Number(price.replace(",", "."));

    if (!trimmedCategory) {
      setErrorMessage("Informe ou selecione a categoria do item.");
      return;
    }
    if (!trimmedName) {
      setErrorMessage("O nome do item é obrigatório.");
      return;
    }
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage("Informe um preço válido (ex: 29.90).");
      return;
    }

    const token = session?.access_token || (session as any)?.token;
    if (!token) {
      setErrorMessage("Sua sessão expirou. Faça login novamente para continuar.");
      return;
    }

    const payload: CreateMenuItemInput = {
      category: trimmedCategory,
      name: trimmedName,
      description: description.trim() ? description.trim() : null,
      price: numPrice,
      photoUrl: photoUrl && photoUrl.trim() ? photoUrl.trim() : null,
      available,
    };

    setIsSaving(true);
    try {
      let savedItem: MenuItemResponse;
      if (initialItem?.id) {
        savedItem = await updateMenuItem(initialItem.id, payload, token);
      } else {
        savedItem = await createMenuItem(restaurantId, payload, token);
      }
      onSuccess(savedItem);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Não foi possível salvar o item no cardápio.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={22}
                color={colors.accent.gold}
              />
              <Text style={styles.title}>
                {initialItem ? "Editar Item do Cardápio" : "Novo Item do Cardápio"}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={22} color={colors.accent.white} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {errorMessage ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={colors.accent.redSoft} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Categoria */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Categoria *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Pratos Principais, Bebidas..."
                placeholderTextColor={colors.accent.whiteLight}
                value={category}
                onChangeText={setCategory}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsContainer}
              >
                {CATEGORY_PRESETS.map((preset) => (
                  <Pressable
                    key={preset}
                    style={[
                      styles.tagBadge,
                      category.toLowerCase() === preset.toLowerCase() && styles.tagBadgeActive,
                    ]}
                    onPress={() => setCategory(preset)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        category.toLowerCase() === preset.toLowerCase() && styles.tagTextActive,
                      ]}
                    >
                      {preset}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Nome do Item */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome do Item *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Picanha na Chapa 400g"
                placeholderTextColor={colors.accent.whiteLight}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Preço */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Preço (R$) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 59.90"
                placeholderTextColor={colors.accent.whiteLight}
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            {/* Descrição */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Ingredientes, acompanhamentos e detalhes do prato..."
                placeholderTextColor={colors.accent.whiteLight}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Foto do Prato */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Foto do Prato</Text>
              {photoUrl ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoUrl }} style={styles.photoPreview} contentFit="cover" />
                  <Pressable
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotoUrl(null)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.accent.white} />
                    <Text style={styles.removePhotoText}>Remover</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoActionsRow}>
                  <Pressable
                    style={styles.photoActionBtn}
                    onPress={handleTakePhoto}
                    disabled={isPickingImage}
                  >
                    <MaterialCommunityIcons name="camera" size={20} color={colors.accent.gold} />
                    <Text style={styles.photoActionText}>Tirar Foto</Text>
                  </Pressable>

                  <Pressable
                    style={styles.photoActionBtn}
                    onPress={handlePickImage}
                    disabled={isPickingImage}
                  >
                    <MaterialCommunityIcons name="image-multiple" size={20} color={colors.accent.gold} />
                    <Text style={styles.photoActionText}>Galeria</Text>
                  </Pressable>
                </View>
              )}

              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Ou cole a URL da imagem aqui"
                placeholderTextColor={colors.accent.whiteLight}
                value={photoUrl || ""}
                onChangeText={setPhotoUrl}
                autoCapitalize="none"
              />
            </View>

            {/* Disponibilidade */}
            <View style={styles.availabilityRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.availabilityTitle}>Disponibilidade</Text>
                <Text style={styles.availabilitySubtitle}>
                  {available ? "Item disponível para pedidos" : "Item esgotado no momento"}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.toggleBtn,
                  available ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
                onPress={() => setAvailable(!available)}
              >
                <MaterialCommunityIcons
                  name={available ? "check-circle" : "close-circle"}
                  size={20}
                  color={available ? colors.accent.gold : colors.accent.whiteLight}
                />
                <Text
                  style={[
                    styles.toggleText,
                    available ? styles.toggleTextActive : styles.toggleTextInactive,
                  ]}
                >
                  {available ? "Disponível" : "Esgotado"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Footer / Botão Salvar */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.background.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="content-save-check"
                    size={20}
                    color={colors.background.primary}
                  />
                  <Text style={styles.saveBtnText}>
                    {initialItem ? "Salvar Alterações" : "Adicionar ao Cardápio"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  modalCard: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    boxShadow: "0px -4px 16px rgba(0, 0, 0, 0.5)",
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.goldTintStrong,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.accent.white,
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 83, 80, 0.18)",
    borderWidth: 1,
    borderColor: colors.accent.redSoft,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    color: colors.accent.white,
    fontSize: 13,
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: colors.accent.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.accent.white,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 6,
    paddingTop: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(230, 192, 123, 0.25)",
  },
  tagBadgeActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  tagText: {
    color: colors.accent.goldMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  tagTextActive: {
    color: colors.background.primary,
    fontWeight: "700",
  },
  photoActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(230, 192, 123, 0.12)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  photoActionText: {
    color: colors.accent.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  photoPreviewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    backgroundColor: "#000",
  },
  photoPreview: {
    width: "100%",
    height: 140,
  },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: "rgba(47, 0, 0, 0.9)",
  },
  removePhotoText: {
    color: colors.accent.redSoft,
    fontSize: 12,
    fontWeight: "600",
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  availabilityTitle: {
    color: colors.accent.white,
    fontSize: 14,
    fontWeight: "600",
  },
  availabilitySubtitle: {
    color: colors.accent.goldMuted,
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: "rgba(230, 192, 123, 0.15)",
    borderColor: colors.accent.gold,
  },
  toggleBtnInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: colors.accent.gold,
  },
  toggleTextInactive: {
    color: colors.accent.whiteLight,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.accent.goldTintStrong,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent.gold,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});
