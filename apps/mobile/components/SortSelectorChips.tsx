import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SORT_OPTIONS,
  SortByOption,
} from "../hooks/useSortPreference";
import { colors, spacing, typography } from "../theme";

interface SortSelectorChipsProps {
  selectedSort: SortByOption;
  onSelectSort: (option: SortByOption) => void;
  hasLocation?: boolean;
  onRequestLocation?: () => void;
}

/**
 * Seletor horizontal em chips para ordenação rápida de restaurantes (HU8).
 * Suporta estados: ativo, inativo e bloqueado por GPS ausente.
 */
export function SortSelectorChips({
  selectedSort,
  onSelectSort,
  hasLocation = false,
  onRequestLocation,
}: SortSelectorChipsProps) {
  function handlePress(option: (typeof SORT_OPTIONS)[number]) {
    if (option.requiresLocation && !hasLocation) {
      if (onRequestLocation) {
        onRequestLocation();
      } else {
        Alert.alert(
          "Localização Indisponível",
          "Para ordenar restaurantes pela menor distância, permita o acesso à sua localização/GPS."
        );
      }
      return;
    }

    onSelectSort(option.value);
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SORT_OPTIONS.map((option) => {
          const isSelected = selectedSort === option.value;
          const isDisabled = option.requiresLocation && !hasLocation;

          return (
            <Pressable
              key={option.value}
              style={[
                styles.chip,
                isSelected && styles.chipActive,
                isDisabled && styles.chipDisabled,
              ]}
              onPress={() => handlePress(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              accessibilityLabel={`Ordenar por ${option.label}`}
            >
              <MaterialCommunityIcons
                name={
                  isDisabled && option.value === "distance"
                    ? "map-marker-off"
                    : option.icon
                }
                size={15}
                color={
                  isDisabled
                    ? colors.accent.whiteLight
                    : isSelected
                    ? colors.background.primary
                    : colors.accent.gold
                }
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                  isDisabled && styles.chipTextDisabled,
                ]}
              >
                {option.label}
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
    marginVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  chipActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  chipDisabled: {
    opacity: 0.6,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.accent.whiteSoft,
  },
  chipTextActive: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
  },
  chipTextDisabled: {
    color: colors.accent.whiteLight,
  },
});
