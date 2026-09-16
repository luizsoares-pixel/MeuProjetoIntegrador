import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors, spacing, typography } from "../theme";

interface RestaurantErrorStateProps {
  message?: string | null;
  onRetry: () => void;
}

export function RestaurantErrorState({
  message,
  onRetry,
}: RestaurantErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name="wifi-off"
          size={44}
          color={colors.accent.redSoft}
        />
      </View>

      <Text style={styles.title}>Falha ao carregar restaurantes</Text>
      <Text style={styles.description}>
        {message ||
          "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."}
      </Text>

      <View style={styles.buttonWrapper}>
        <Button
          title="Tentar novamente"
          onPress={onRetry}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.accent.whiteSoft,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  buttonWrapper: {
    width: "100%",
    maxWidth: 240,
  },
});
