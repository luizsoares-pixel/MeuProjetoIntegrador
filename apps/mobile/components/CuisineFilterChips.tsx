import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing, typography } from "../theme";

export const DEFAULT_CUISINES = [
  "Brasileira",
  "Italiana",
  "Japonesa",
  "Hamburgueria",
  "Pizzaria",
  "Cafeteria",
  "Sobremesas",
  "Contemporânea",
] as const;

interface CuisineFilterChipsProps {
  selectedCuisine: string | null;
  onSelectCuisine: (cuisine: string | null) => void;
  cuisines?: string[];
}

export function CuisineFilterChips({
  selectedCuisine,
  onSelectCuisine,
  cuisines = [...DEFAULT_CUISINES],
}: CuisineFilterChipsProps) {
  const isAllSelected = !selectedCuisine;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Chip "Todos" */}
        <Pressable
          style={[
            styles.chip,
            isAllSelected && styles.chipActive,
          ]}
          onPress={() => onSelectCuisine(null)}
          accessibilityRole="button"
          accessibilityState={{ selected: isAllSelected }}
          accessibilityLabel="Filtrar por todos os tipos de culinária"
        >
          <Text
            style={[
              styles.chipText,
              isAllSelected && styles.chipTextActive,
            ]}
          >
            Todos
          </Text>
        </Pressable>

        {/* Chips de Culinárias */}
        {cuisines.map((cuisine) => {
          const isSelected = selectedCuisine === cuisine;
          return (
            <Pressable
              key={cuisine}
              style={[
                styles.chip,
                isSelected && styles.chipActive,
              ]}
              onPress={() => onSelectCuisine(isSelected ? null : cuisine)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Filtrar por culinária ${cuisine}`}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                ]}
              >
                {cuisine}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.none,
    gap: spacing.xs,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  chipActive: {
    backgroundColor: colors.accent.goldTintStrong,
    borderColor: colors.accent.gold,
  },
  chipText: {
    color: colors.accent.whiteLight,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  chipTextActive: {
    color: colors.accent.white,
    fontWeight: typography.weight.bold,
  },
});
