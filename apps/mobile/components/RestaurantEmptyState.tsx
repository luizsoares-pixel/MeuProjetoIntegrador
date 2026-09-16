import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors, spacing, typography } from "../theme";

interface RestaurantEmptyStateProps {
  onRefresh?: () => void;
}

export function RestaurantEmptyState({ onRefresh }: RestaurantEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name="store-search-outline"
          size={48}
          color={colors.accent.gold}
        />
      </View>

      <Text style={styles.title}>Nenhum restaurante encontrado</Text>
      <Text style={styles.description}>
        Ainda não há estabelecimentos cadastrados na plataforma. Novos sabores aparecerão aqui em breve!
      </Text>

      {onRefresh ? (
        <View style={styles.buttonWrapper}>
          <Button
            title="Atualizar lista"
            onPress={onRefresh}
            variant="outline"
          />
        </View>
      ) : null}
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
    backgroundColor: colors.accent.goldTint,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
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
