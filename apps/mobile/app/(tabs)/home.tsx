import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
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
import { useFadeSlide } from "../../hooks/useFadeSlide";
import { colors, spacing, typography } from "../../theme";

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

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
    isRefreshing,
    isError,
    isEmpty,
    isSearching,
    refresh,
    retry,
  } = useRestaurantList({
    limit: 20,
    search: searchText,
    cuisine: selectedCuisine,
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

  const eyebrowAnim = useFadeSlide({ delay: 0, translateY: 8 });
  const titleAnim = useFadeSlide({ delay: 80, translateY: 12 });
  const descAnim = useFadeSlide({ delay: 160, translateY: 8 });

  const handleCardPress = useCallback((restaurant: RestaurantResponse) => {
    router.push(`/restaurante/${restaurant.id}`);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setSelectedCuisine(null);
    setActiveFilters({
      priceRange: [],
      minRating: null,
      maxDistance: null,
      openNow: false,
    });
  }, []);

  // Vitrine secundária: ordenação por avaliação para descoberta em destaque
  const topRatedRestaurants = useMemo(() => {
    return [...restaurants]
      .filter((r) => r.rating !== null && r.rating !== undefined && r.rating >= 4.0)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [restaurants]);

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
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
      >
        {/* Header de Boas-vindas */}
        <View style={styles.headerContainer}>
          <Animated.Text style={[styles.eyebrow, eyebrowAnim.animatedStyle]}>
            MENU DIGITAL
          </Animated.Text>

          <Animated.Text style={[styles.title, titleAnim.animatedStyle]}>
            Encontre seu próximo sabor
          </Animated.Text>

          <Animated.Text style={[styles.description, descAnim.animatedStyle]}>
            Explore opções e cardápios digitais perto de você.
          </Animated.Text>

          {/* Barra de Busca Rápida e Botão de Filtros */}
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

          {/* Chips de Culinária */}
          <CuisineFilterChips
            selectedCuisine={selectedCuisine}
            onSelectCuisine={setSelectedCuisine}
          />

          {/* Chips de Ordenação */}
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
        </View>

        {/* Estados de Loading, Erro ou Vazio */}
        {isLoading ? (
          <View style={styles.showcaseSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Carregando destaques...</Text>
            </View>
            <FlatList
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              data={[1, 2, 3]}
              keyExtractor={(item) => String(item)}
              renderItem={() => (
                <RestaurantCardSkeleton style={styles.horizontalCard} />
              )}
              contentContainerStyle={styles.horizontalListContent}
            />
          </View>
        ) : isError ? (
          <View style={styles.stateWrapper}>
            <RestaurantErrorState onRetry={retry} />
          </View>
        ) : isEmpty ? (
          <View style={styles.stateWrapper}>
            {isSearching || searchText || selectedCuisine ? (
              <SearchEmptyState
                searchTerm={searchText}
                cuisineFilter={selectedCuisine}
                onClearFilters={handleClearFilters}
              />
            ) : (
              <RestaurantEmptyState onRefresh={refresh} />
            )}
          </View>
        ) : (
          <>
            {/* Vitrine de Descoberta 1: Destaques & Descobertas */}
            <View style={styles.showcaseSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {searchText || selectedCuisine ? "Resultados da Busca" : "Destaques & Descobertas"}
                </Text>
                <Text style={styles.sectionBadge}>
                  {restaurants.length} {restaurants.length === 1 ? "opção" : "opções"}
                </Text>
              </View>

              <FlatList
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                data={restaurants}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <RestaurantCard
                    restaurant={item}
                    onPress={handleCardPress}
                    style={styles.horizontalCard}
                  />
                )}
                contentContainerStyle={styles.horizontalListContent}
              />
            </View>

            {/* Vitrine de Descoberta 2: Mais Bem Avaliados */}
            {topRatedRestaurants.length > 0 && !searchText && (
              <View style={styles.showcaseSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mais Bem Avaliados</Text>
                  <Text style={styles.sectionBadge}>★ 4.0+</Text>
                </View>

                <FlatList
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  data={topRatedRestaurants}
                  keyExtractor={(item) => `top-${item.id}`}
                  renderItem={({ item }) => (
                    <RestaurantCard
                      restaurant={item}
                      onPress={handleCardPress}
                      style={styles.horizontalCard}
                    />
                  )}
                  contentContainerStyle={styles.horizontalListContent}
                />
              </View>
            )}

            {/* Chamada para Exploração Profunda / Busca Avançada */}
            <TouchableOpacity
              style={styles.deepSearchBanner}
              onPress={() => router.push("/buscar" as never)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ir para busca avançada com filtros combinados"
            >
              <View style={styles.deepSearchContent}>
                <MaterialCommunityIcons
                  name="compass-outline"
                  size={30}
                  color={colors.accent.gold}
                  style={styles.deepSearchIcon}
                />
                <View style={styles.deepSearchTextContainer}>
                  <Text style={styles.deepSearchTitle}>Busca Avançada & Filtros</Text>
                  <Text style={styles.deepSearchSubtitle}>
                    Consulte por raio em km, cidade e estabelecimentos abertos.
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.accent.gold}
                />
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal de Filtros Avançados */}
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
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
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
    fontSize: 28,
    fontWeight: typography.weight.bold,
    lineHeight: 34,
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
    marginBottom: spacing.xs,
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
  showcaseSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.accent.white,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  sectionBadge: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  horizontalListContent: {
    paddingHorizontal: spacing.lg,
  },
  horizontalCard: {
    width: 280,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  stateWrapper: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  deepSearchBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    borderRadius: 16,
  },
  deepSearchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  deepSearchIcon: {
    marginRight: 2,
  },
  deepSearchTextContainer: {
    flex: 1,
  },
  deepSearchTitle: {
    color: colors.accent.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  deepSearchSubtitle: {
    color: colors.accent.whiteSoft,
    fontSize: typography.size.xs,
    lineHeight: 16,
    marginTop: 2,
  },
});
