import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RestaurantResponse } from "@menu-digital/contracts";
import { CuisineFilterChips } from "../../components/CuisineFilterChips";
import { FilterModal, FilterState } from "../../components/FilterModal";
import { RestaurantCard } from "../../components/RestaurantCard";
import { RestaurantCardSkeleton } from "../../components/RestaurantCardSkeleton";
import { RestaurantEmptyState } from "../../components/RestaurantEmptyState";
import { RestaurantErrorState } from "../../components/RestaurantErrorState";
import { SearchBar } from "../../components/SearchBar";
import { SearchEmptyState } from "../../components/SearchEmptyState";
import { SortSelectorChips } from "../../components/SortSelectorChips";
import { useRestaurantList } from "../../hooks/useRestaurantList";
import { useSortPreference } from "../../hooks/useSortPreference";
import { colors, spacing, typography } from "../../theme";

export default function BuscarTab() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [cityText, setCityText] = useState("");

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceRange: [],
    minRating: null,
    maxDistance: null,
    openNow: false,
  });
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === "granted") {
          const loc =
            (await Location.getLastKnownPositionAsync({})) ||
            (await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }));
          if (loc && isMounted) {
            setUserCoords({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            });
          }
        }
      } catch {
        // Silently continue
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasLocation = Boolean(userCoords);
  const { sortBy, setSortBy } = useSortPreference(hasLocation);

  const {
    restaurants,
    isLoading,
    isLoadingMore,
    isRefreshing,
    isError,
    isEmpty,
    isSearching,
    errorMessage,
    hasMore,
    refresh,
    loadMore,
    retry,
  } = useRestaurantList({
    limit: 10,
    search: searchText,
    cuisine: selectedCuisine,
    city: cityText,
    priceRange: activeFilters.priceRange,
    minRating: activeFilters.minRating,
    maxDistance: activeFilters.maxDistance,
    openNow: activeFilters.openNow,
    sortBy,
    lat: userCoords?.lat ?? null,
    lng: userCoords?.lng ?? null,
  });

  const modalFilterCount =
    (activeFilters.priceRange.length > 0 ? 1 : 0) +
    (activeFilters.minRating !== null ? 1 : 0) +
    (activeFilters.maxDistance !== null ? 1 : 0) +
    (activeFilters.openNow ? 1 : 0);

  const handleCardPress = useCallback((_restaurant: RestaurantResponse) => {
    // Integração futura com detalhes do cardápio (Sprint #4)
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setSelectedCuisine(null);
    setCityText("");
    setActiveFilters({
      priceRange: [],
      minRating: null,
      maxDistance: null,
      openNow: false,
    });
  }, []);

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.eyebrow}>BUSCA AVANÇADA</Text>
        <Text style={styles.title}>O que você quer saborear hoje?</Text>
        <Text style={styles.description}>
          Filtre restaurantes por nome, culinária ou cidade.
        </Text>

        {/* Input de Busca por Nome e Botão de Filtros */}
        <View style={styles.searchRow}>
          <View style={styles.searchBarFlex}>
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              onClear={() => setSearchText("")}
              placeholder="Buscar por nome do restaurante..."
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterTriggerButton,
              modalFilterCount > 0 && styles.filterTriggerButtonActive,
            ]}
            onPress={() => setFilterModalVisible(true)}
            accessibilityLabel="Abrir filtros avançados"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={22}
              color={
                modalFilterCount > 0
                  ? colors.background.primary
                  : colors.accent.gold
              }
            />
            {modalFilterCount > 0 && (
              <View style={styles.badgeIndicator}>
                <Text style={styles.badgeIndicatorText}>
                  {modalFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Input de Filtro por Cidade */}
        <View style={styles.cityInputContainer}>
          <MaterialCommunityIcons
            name="city-variant-outline"
            size={20}
            color={colors.accent.gold}
            style={styles.cityIcon}
          />
          <TextInput
            value={cityText}
            onChangeText={setCityText}
            placeholder="Filtrar por cidade (ex: Brasília)..."
            placeholderTextColor={colors.accent.whiteLight}
            style={styles.cityInput}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {cityText.length > 0 ? (
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={colors.accent.whiteLight}
              onPress={() => setCityText("")}
            />
          ) : null}
        </View>

        {/* Chips de Culinária */}
        <CuisineFilterChips
          selectedCuisine={selectedCuisine}
          onSelectCuisine={setSelectedCuisine}
        />

        {/* Chips de Ordenação (HU8) */}
        <SortSelectorChips
          selectedSort={sortBy}
          onSelectSort={setSortBy}
          hasLocation={hasLocation}
          onRequestLocation={async () => {
            try {
              const res = await Location.requestForegroundPermissionsAsync();
              if (res.status === "granted") {
                const pos = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Balanced,
                });
                setUserCoords({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                });
                setSortBy("distance");
              }
            } catch {
              // Ignore
            }
          }}
        />

        {!isLoading && !isError && !isEmpty && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Restaurantes encontrados</Text>
            <Text style={styles.resultsBadge}>
              {restaurants.length} {restaurants.length === 1 ? "resultado" : "resultados"}
            </Text>
          </View>
        )}
      </View>
    );
  }, [
    searchText,
    cityText,
    selectedCuisine,
    modalFilterCount,
    isLoading,
    isError,
    isEmpty,
    restaurants.length,
    sortBy,
    setSortBy,
    hasLocation,
  ]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          <RestaurantCardSkeleton />
          <RestaurantCardSkeleton />
        </View>
      );
    }

    if (isError) {
      return (
        <RestaurantErrorState
          message={errorMessage}
          onRetry={retry}
        />
      );
    }

    if (isEmpty) {
      if (isSearching || searchText || selectedCuisine || cityText) {
        return (
          <SearchEmptyState
            searchTerm={searchText}
            cuisineFilter={selectedCuisine}
            cityFilter={cityText}
            onClearFilters={handleClearFilters}
          />
        );
      }
      return <RestaurantEmptyState onRefresh={refresh} />;
    }

    return null;
  }, [
    isLoading,
    isError,
    isEmpty,
    isSearching,
    searchText,
    selectedCuisine,
    cityText,
    errorMessage,
    retry,
    handleClearFilters,
    refresh,
  ]);

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color={colors.accent.gold} />
          <Text style={styles.footerLoadingText}>Carregando mais opções...</Text>
        </View>
      );
    }

    if (!hasMore && restaurants.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <View style={styles.footerEndLine} />
          <Text style={styles.footerEndText}>Fim dos resultados</Text>
          <View style={styles.footerEndLine} />
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  }, [isLoadingMore, hasMore, restaurants.length]);

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <FlatList
        data={isLoading ? [] : restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={handleCardPress}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.accent.gold}
            colors={[colors.accent.gold]}
          />
        }
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={{
          ...activeFilters,
          sortBy,
        }}
        onApply={(newFilters, coords) => {
          setActiveFilters(newFilters);
          if (newFilters.sortBy) {
            setSortBy(newFilters.sortBy);
          }
          if (coords) setUserCoords(coords);
        }}
        onReset={() => {
          setActiveFilters({
            priceRange: [],
            minRating: null,
            maxDistance: null,
            openNow: false,
          });
          setSortBy(hasLocation ? "distance" : "rating");
        }}
        userCoords={userCoords}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.accent.gold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.accent.white,
    fontSize: 26,
    fontWeight: typography.weight.bold,
    lineHeight: 32,
    maxWidth: 320,
  },
  description: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchBarFlex: {
    flex: 1,
  },
  filterTriggerButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background.dark,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterTriggerButtonActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  badgeIndicator: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.accent.gold,
    borderColor: colors.background.primary,
    borderWidth: 1.5,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeIndicatorText: {
    color: colors.background.primary,
    fontSize: 10,
    fontWeight: typography.weight.bold,
  },
  cityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.dark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.xs,
  },
  cityIcon: {
    marginRight: spacing.sm,
  },
  cityInput: {
    flex: 1,
    color: colors.accent.white,
    fontSize: typography.size.sm,
    paddingVertical: 0,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  resultsTitle: {
    color: colors.accent.white,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  resultsBadge: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  skeletonContainer: {
    marginTop: spacing.xs,
  },
  footerLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: 8,
  },
  footerLoadingText: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.xs,
  },
  footerEnd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: 12,
  },
  footerEndLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  footerEndText: {
    color: colors.accent.whiteLight,
    fontSize: typography.size.xs,
  },
  footerSpacer: {
    height: spacing.md,
  },
});
