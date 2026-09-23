import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../theme";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void | Promise<void>;
  size?: number;
  colorActive?: string;
  colorInactive?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 24,
  colorActive = colors.accent.redSoft,
  colorInactive = colors.accent.white,
  style,
  accessibilityLabel,
}: FavoriteButtonProps) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics pode não estar disponível em emuladores
    }
    onToggle();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.button, style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ||
        (isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos")
      }
      accessibilityState={{ selected: isFavorite }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialCommunityIcons
        name={isFavorite ? "heart" : "heart-outline"}
        size={size}
        color={isFavorite ? colorActive : colorInactive}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
});
