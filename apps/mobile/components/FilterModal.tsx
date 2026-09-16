import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, spacing, typography } from "../theme";

export interface FilterState {
  priceRange: string[];
  minRating: number | null;
  maxDistance: number | null;
  openNow: boolean;
}

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (applied: FilterState, coords?: { lat: number; lng: number } | null) => void;
  onReset: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

const PRICE_OPTIONS = [
  { value: "$", label: "$ Econômico" },
  { value: "$$", label: "$$ Moderado" },
  { value: "$$$", label: "$$$ Sofisticado" },
];

const RATING_OPTIONS = [
  { value: null, label: "Todas" },
  { value: 3, label: "★ 3.0+" },
  { value: 3.5, label: "★ 3.5+" },
  { value: 4, label: "★ 4.0+" },
  { value: 4.5, label: "★ 4.5+" },
];

const DISTANCE_OPTIONS = [
  { value: null, label: "Qualquer" },
  { value: 1000, label: "1 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
];

export function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
  userCoords = null,
}: FilterModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <FilterSheetContent
        filters={filters}
        onClose={onClose}
        onApply={onApply}
        onReset={onReset}
        userCoords={userCoords}
      />
    </Modal>
  );
}

interface FilterSheetContentProps {
  filters: FilterState;
  onClose: () => void;
  onApply: (applied: FilterState, coords?: { lat: number; lng: number } | null) => void;
  onReset: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

function FilterSheetContent({
  filters,
  onClose,
  onApply,
  onReset,
  userCoords = null,
}: FilterSheetContentProps) {
  const [draftPriceRange, setDraftPriceRange] = useState<string[]>(
    filters.priceRange ?? []
  );
  const [draftMinRating, setDraftMinRating] = useState<number | null>(
    filters.minRating ?? null
  );
  const [draftMaxDistance, setDraftMaxDistance] = useState<number | null>(
    filters.maxDistance ?? null
  );
  const [draftOpenNow, setDraftOpenNow] = useState<boolean>(
    Boolean(filters.openNow)
  );

  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(
    null
  );
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
    userCoords
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!isMounted) return;
        if (perm.status === "granted") {
          setHasLocationPermission(true);
          if (!currentCoords) {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            if (isMounted) {
              setCurrentCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            }
          }
        } else {
          setHasLocationPermission(false);
        }
      } catch {
        if (isMounted) setHasLocationPermission(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentCoords]);

  function handleTogglePrice(val: string) {
    setDraftPriceRange((prev) =>
      prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]
    );
  }

  function handleSelectRating(val: number | null) {
    setDraftMinRating(val);
  }

  function handleSelectDistance(val: number | null) {
    if (hasLocationPermission === false) return;
    setDraftMaxDistance(val);
  }

  function handleResetAll() {
    setDraftPriceRange([]);
    setDraftMinRating(null);
    setDraftMaxDistance(null);
    setDraftOpenNow(false);
    onReset();
  }

  function handleApplyFilters() {
    onApply(
      {
        priceRange: draftPriceRange,
        minRating: draftMinRating,
        maxDistance: draftMaxDistance,
        openNow: draftOpenNow,
      },
      currentCoords
    );
    onClose();
  }

  const isDistanceDisabled = hasLocationPermission === false;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons
                name="tune-variant"
                size={22}
                color={colors.accent.gold}
                style={styles.headerIcon}
              />
              <Text style={styles.headerTitle}>Filtros</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Fechar modal de filtros"
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.accent.whiteSoft}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Seção 1: Faixa de Preço */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Faixa de Preço</Text>
              <View style={styles.chipsRow}>
                {PRICE_OPTIONS.map((item) => {
                  const isSelected = draftPriceRange.includes(item.value);
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                      onPress={() => handleTogglePrice(item.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected
                            ? styles.chipTextSelected
                            : styles.chipTextUnselected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Seção 2: Avaliação Mínima */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Avaliação Mínima</Text>
              <View style={styles.chipsRow}>
                {RATING_OPTIONS.map((item) => {
                  const isSelected = draftMinRating === item.value;
                  return (
                    <TouchableOpacity
                      key={String(item.value)}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                      onPress={() => handleSelectRating(item.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected
                            ? styles.chipTextSelected
                            : styles.chipTextUnselected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Seção 3: Distância Máxima */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Distância Máxima</Text>
                {isDistanceDisabled && (
                  <Text style={styles.disabledTag}>GPS Indisponível</Text>
                )}
              </View>

              {isDistanceDisabled && (
                <View style={styles.locationWarning}>
                  <MaterialCommunityIcons
                    name="map-marker-off"
                    size={16}
                    color={colors.accent.gold}
                    style={styles.warningIcon}
                  />
                  <Text style={styles.locationWarningText}>
                    Permissão de localização desativada. Ative o GPS para filtrar
                    restaurantes por distância.
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.chipsRow,
                  isDistanceDisabled && styles.disabledSection,
                ]}
              >
                {DISTANCE_OPTIONS.map((item) => {
                  const isSelected = draftMaxDistance === item.value;
                  return (
                    <TouchableOpacity
                      key={String(item.value)}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                        isDistanceDisabled && styles.chipDisabled,
                      ]}
                      onPress={() => handleSelectDistance(item.value)}
                      disabled={isDistanceDisabled}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected
                            ? styles.chipTextSelected
                            : styles.chipTextUnselected,
                          isDistanceDisabled && styles.chipTextDisabled,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Seção 4: Aberto Agora */}
            <View style={[styles.section, styles.switchSection]}>
              <View style={styles.switchLabelContainer}>
                <View style={styles.switchIconRow}>
                  <MaterialCommunityIcons
                    name="clock-time-four-outline"
                    size={20}
                    color={colors.accent.gold}
                    style={styles.switchIcon}
                  />
                  <Text style={styles.sectionTitle}>Aberto Agora</Text>
                </View>
                <Text style={styles.switchDescription}>
                  Exibir apenas locais abertos no horário atual
                </Text>
              </View>

              <Switch
                value={draftOpenNow}
                onValueChange={setDraftOpenNow}
                trackColor={{
                  false: colors.background.dark,
                  true: colors.accent.gold,
                }}
                thumbColor={
                  draftOpenNow ? colors.accent.white : colors.accent.whiteLight
                }
              />
            </View>
          </ScrollView>

          {/* Footer com Ações */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleResetAll}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Limpar filtros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    maxHeight: "85%",
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.goldTint,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    color: colors.accent.white,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.accent.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  disabledTag: {
    color: colors.accent.redLight,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  locationWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent.goldTint,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningIcon: {
    marginRight: spacing.xs,
  },
  locationWarningText: {
    flex: 1,
    color: colors.accent.goldMuted,
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
  disabledSection: {
    opacity: 0.45,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  chipUnselected: {
    backgroundColor: colors.background.dark,
    borderColor: colors.accent.goldTintStrong,
  },
  chipDisabled: {
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  chipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  chipTextSelected: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
  },
  chipTextUnselected: {
    color: colors.accent.whiteSoft,
  },
  chipTextDisabled: {
    color: colors.accent.whiteLight,
  },
  switchSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.dark,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent.goldTint,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchIconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchIcon: {
    marginRight: spacing.xs,
  },
  switchDescription: {
    color: colors.accent.whiteLight,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.dark,
  },
  clearButtonText: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  applyButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonText: {
    color: colors.background.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
});
