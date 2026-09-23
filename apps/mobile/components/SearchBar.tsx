import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { colors, spacing, typography } from "../theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = "Buscar restaurantes...",
  autoFocus = false,
}: SearchBarProps) {
  function handleClear() {
    onChangeText("");
    onClear?.();
  }

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={colors.accent.gold}
        style={styles.searchIcon}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.accent.whiteLight}
        style={styles.input}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Campo de busca de restaurantes"
      />

      {value.length > 0 ? (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          accessibilityLabel="Limpar busca"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={18}
            color={colors.accent.whiteLight}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.dark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.accent.white,
    fontSize: typography.size.sm,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: spacing.xs,
    padding: 2,
  },
});
