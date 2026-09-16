import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors, spacing, typography } from "../theme";

interface SearchEmptyStateProps {
  searchTerm?: string;
  cuisineFilter?: string | null;
  cityFilter?: string | null;
  onClearFilters: () => void;
}

export function SearchEmptyState({
  searchTerm,
  cuisineFilter,
  cityFilter,
  onClearFilters,
}: SearchEmptyStateProps) {
  const filterDescriptions: string[] = [];
  if (searchTerm) filterDescriptions.push(`"${searchTerm}"`);
  if (cuisineFilter) filterDescriptions.push(`Culinária: ${cuisineFilter}`);
  if (cityFilter) filterDescriptions.push(`Cidade: ${cityFilter}`);

  const filterText =
    filterDescriptions.length > 0 ? ` para ${filterDescriptions.join(", ")}` : "";

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name="magnify-remove-outline"
          size={46}
          color={colors.accent.goldMuted}
        />
      </View>

      <Text style={styles.title}>Nenhum resultado encontrado</Text>
      <Text style={styles.description}>
        Não encontramos restaurantes correspondentes{filterText}. Tente buscar com outros termos ou limpar os filtros aplicados.
      </Text>

      <View style={styles.buttonWrapper}>
        <Button
          title="Limpar filtros"
          onPress={onClearFilters}
          variant="outline"
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
    maxWidth: 220,
  },
});
