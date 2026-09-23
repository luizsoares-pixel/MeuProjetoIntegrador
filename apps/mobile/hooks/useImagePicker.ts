import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageFromUri } from "../services/api";

export interface PickAndUploadOptions {
  source: "camera" | "gallery";
  token?: string | null;
  folder?: string;
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export function useImagePicker() {
  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Solicita permissão e abre a câmera ou galeria para selecionar uma foto.
   */
  const pickLocalImage = useCallback(
    async (
      source: "camera" | "gallery",
      options?: {
        allowsEditing?: boolean;
        aspect?: [number, number];
        quality?: number;
      }
    ): Promise<ImagePicker.ImagePickerAsset | null> => {
      setError(null);
      setIsPicking(true);

      try {
        if (source === "camera") {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permissão necessária",
              "Autorize o acesso à câmera nas configurações do dispositivo para tirar fotos."
            );
            return null;
          }

          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: options?.allowsEditing ?? true,
            aspect: options?.aspect ?? [4, 3],
            quality: options?.quality ?? 0.8,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0];
          }
          return null;
        } else {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permissão necessária",
              "Autorize o acesso à galeria nas configurações do dispositivo para selecionar fotos."
            );
            return null;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: options?.allowsEditing ?? true,
            aspect: options?.aspect ?? [4, 3],
            quality: options?.quality ?? 0.8,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0];
          }
          return null;
        }
      } catch (err: any) {
        const msg = err?.message || "Não foi possível acessar a imagem.";
        setError(msg);
        Alert.alert("Erro", "Falha ao selecionar imagem no dispositivo.");
        return null;
      } finally {
        setIsPicking(false);
      }
    },
    []
  );

  /**
   * Envia uma URI local para o Supabase Storage via Presigned URL do backend.
   */
  const upload = useCallback(
    async (
      localUri: string,
      token: string,
      folder: string = "uploads"
    ): Promise<string> => {
      setError(null);
      setIsUploading(true);

      try {
        const publicUrl = await uploadImageFromUri(localUri, token, { folder });
        return publicUrl;
      } catch (err: any) {
        const msg = err?.message || "Erro no upload da imagem.";
        setError(msg);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  /**
   * Pipeline combinado: Seleciona do dispositivo e sobe diretamente para o Storage via Presigned URL.
   */
  const pickAndUpload = useCallback(
    async (options: PickAndUploadOptions): Promise<string | null> => {
      const asset = await pickLocalImage(options.source, {
        allowsEditing: options.allowsEditing,
        aspect: options.aspect,
        quality: options.quality,
      });

      if (!asset?.uri) {
        return null;
      }

      if (!options.token) {
        Alert.alert(
          "Autenticação necessária",
          "Faça login para poder realizar o upload de fotos."
        );
        return null;
      }

      try {
        const publicUrl = await upload(
          asset.uri,
          options.token,
          options.folder ?? "uploads"
        );
        return publicUrl;
      } catch (err: any) {
        Alert.alert(
          "Erro no upload",
          err?.message || "Não foi possível salvar a imagem no servidor."
        );
        return null;
      }
    },
    [pickLocalImage, upload]
  );

  return {
    isPicking,
    isUploading,
    isLoading: isPicking || isUploading,
    error,
    pickLocalImage,
    upload,
    pickAndUpload,
  };
}
