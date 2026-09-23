import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  MenuItemResponse,
  RestaurantResponse,
} from "@menu-digital/contracts";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { RestaurantCard } from "../../components/RestaurantCard";
import { FavoriteButton } from "../../components/FavoriteButton";
import { Button } from "../../components/Button";
import { colors, spacing, typography } from "../../theme";

type FavoriteTabType = "restaurants" | "dishes";

type FavoriteDishItem = MenuItemResponse & { restaurantName?: string };

interface FavoriteDishCardProps {
  dish: FavoriteDishItem;
  onPress: () => void;
  onToggleFavorite: () => void;
}

function FavoriteDishCard({
  dish,
  onPress,
  onToggleFavorite,
}: FavoriteDishCardProps) {
  const [imgLoading, setImgLoading] = useState(Boolean(dish.photoUrl));

  return (
    <Pressable
      style={({ pressed }) => [
        styles.dishCard,
        pressed && styles.dishCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Prato ${dish.name}`}
    >
      {/* Imagem do prato */}
      <View style={styles.dishImageFrame}>
        {dish.photoUrl ? (
          <>
            {imgLoading ? (
              <View style={styles.dishImagePlaceholder}>
                <ActivityIndicator size="small" color={colors.accent.gold} />
              </View>
            ) : null}
            <Image
              source={{ uri: dish.photoUrl }}
              style={styles.dishImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              onLoadStart={() => setImgLoading(true)}
              onLoadEnd={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
              accessibilityLabel={`Foto de ${dish.name}`}
            />
          </>
        ) : (
          <View style={styles.dishImagePlaceholder}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={24}
              color={colors.accent.goldMuted}
            />
          </View>
        )}
      </View>

      {/* Conteúdo descritivo */}
      <View style={styles.dishContent}>
        <Text style={styles.dishName} numberOfLines={1}>
          {dish.name}
        </Text>

        {dish.restaurantName ? (
          <View style={styles.restaurantTag}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={13}
              color={colors.accent.gold}
            />
            <Text style={styles.restaurantTagName} numberOfLines={1}>
              {dish.restaurantName}
            </Text>
          </View>
        ) : null}

        {dish.description ? (
          <Text style={styles.dishDescription} numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}

        <View style={styles.dishFooter}>
          <Text style={styles.dishPrice}>
            R$ {dish.price.toFixed(2).replace(".", ",")}
          </Text>
          <Text style={styles.viewMenuText}>Ver cardápio →</Text>
        </View>
      </View>

      {/* Botão de Favorito no Card */}
      <View style={styles.dishFavoriteContainer}>
        <FavoriteButton
          isFavorite={true}
          onToggle={onToggleFavorite}
          size={20}
        />
      </View>
    </Pressable>
  );
}

export default function FavoritosTab() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const {
    favoritesData,
    isLoading,
    refreshFavorites,
    toggleDish,
  } = useFavorites();

  const [activeTab, setActiveTab] = useState<FavoriteTabType>("restaurants");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshFavorites();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFavorites]);

  const handleRestaurantPress = useCallback((restaurant: RestaurantResponse) => {
    router.push(`/restaurante/${restaurant.id}` as never);
  }, []);

  const handleDishPress = useCallback((dish: FavoriteDishItem) => {
    router.push(`/restaurante/${dish.restaurantId}/cardapio` as never);
  }, []);

  const renderRestaurantItem = useCallback(
    ({ item }: { item: RestaurantResponse }) => (
      <RestaurantCard
        restaurant={item}
        onPress={handleRestaurantPress}
      />
    ),
    [handleRestaurantPress]
  );

  const renderDishItem = useCallback(
    ({ item }: { item: FavoriteDishItem }) => (
      <FavoriteDishCard
        dish={item}
        onPress={() => handleDishPress(item)}
        onToggleFavorite={() => toggleDish(item)}
      />
    ),
    [handleDishPress, toggleDish]
  );

  // 1. Estado Não Autenticado
  if (!session) {
    return (
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={[styles.container, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.centeredContainer}>
          <View style={styles.unauthIconContainer}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={52}
              color={colors.accent.gold}
            />
          </View>
          <Text style={styles.unauthTitle}>Salve seus Favoritos</Text>
          <Text style={styles.unauthSubtitle}>
            Faça login na sua conta para salvar restaurantes e pratos preferidos
            e encontrá-los facilmente a qualquer momento.
          </Text>
          <View style={styles.unauthButtonWrapper}>
            <Button
              title="FAZER LOGIN"
              onPress={() => router.push("/login" as never)}
            />
          </View>
        </View>
      </LinearGradient>
    );
  }

  const restaurants = favoritesData?.restaurants ?? [];
  const dishes = favoritesData?.dishes ?? [];
  const hasRestaurants = restaurants.length > 0;
  const hasDishes = dishes.length > 0;

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <Text style={styles.headerSubtitle}>
          Seus restaurantes e pratos selecionados
        </Text>
      </View>

      {/* Segmented Control / Alternador de Abas */}
      <View style={styles.segmentedContainer}>
        <Pressable
          style={[
            styles.segmentButton,
            activeTab === "restaurants" && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab("restaurants")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "restaurants" }}
        >
          <MaterialCommunityIcons
            name="storefront"
            size={18}
            color={
              activeTab === "restaurants"
                ? colors.background.primary
                : colors.accent.goldMuted
            }
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === "restaurants" && styles.segmentTextActive,
            ]}
          >
            Restaurantes
          </Text>
          <View
            style={[
              styles.counterBadge,
              activeTab === "restaurants" && styles.counterBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.counterText,
                activeTab === "restaurants" && styles.counterTextActive,
              ]}
            >
              {restaurants.length}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[
            styles.segmentButton,
            activeTab === "dishes" && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab("dishes")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "dishes" }}
        >
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={18}
            color={
              activeTab === "dishes"
                ? colors.background.primary
                : colors.accent.goldMuted
            }
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === "dishes" && styles.segmentTextActive,
            ]}
          >
            Pratos
          </Text>
          <View
            style={[
              styles.counterBadge,
              activeTab === "dishes" && styles.counterBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.counterText,
                activeTab === "dishes" && styles.counterTextActive,
              ]}
            >
              {dishes.length}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Conteúdo Principal */}
      {isLoading && !favoritesData ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.accent.gold} />
          <Text style={styles.loadingText}>Carregando favoritos...</Text>
        </View>
      ) : activeTab === "restaurants" ? (
        !hasRestaurants ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={44}
                color={colors.accent.goldMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>Nenhum restaurante favoritado</Text>
            <Text style={styles.emptySubtitle}>
              Toque no ícone de coração nos restaurantes para acessá-los com
              praticidade sempre que desejar.
            </Text>
            <View style={styles.emptyButtonWrapper}>
              <Button
                title="EXPLORAR RESTAURANTES"
                onPress={() => router.push("/(tabs)/buscar" as never)}
              />
            </View>
          </View>
        ) : (
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            renderItem={renderRestaurantItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + spacing.xxxl },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent.gold}
                colors={[colors.accent.gold]}
              />
            }
          />
        )
      ) : !hasDishes ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons
              name="food-outline"
              size={44}
              color={colors.accent.goldMuted}
            />
          </View>
          <Text style={styles.emptyTitle}>Nenhum prato favoritado</Text>
          <Text style={styles.emptySubtitle}>
            Navegue pelos cardápios dos restaurantes e salve seus pratos e
            bebidas prediletos aqui.
          </Text>
          <View style={styles.emptyButtonWrapper}>
            <Button
              title="VER RESTAURANTES"
              onPress={() => router.push("/(tabs)/buscar" as never)}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          renderItem={renderDishItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.gold}
              colors={[colors.accent.gold]}
            />
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
  },
  headerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.accent.whiteSoft,
    marginTop: 2,
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: colors.background.dark,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: colors.accent.gold,
  },
  segmentText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.accent.goldMuted,
  },
  segmentTextActive: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
  },
  counterBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  counterBadgeActive: {
    backgroundColor: colors.background.primary,
  },
  counterText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    color: colors.accent.goldMuted,
  },
  counterTextActive: {
    color: colors.accent.gold,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  // Card do Prato Favorito
  dishCard: {
    flexDirection: "row",
    backgroundColor: colors.background.dark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.accent.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dishCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  dishImageFrame: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: colors.background.secondary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  dishImage: {
    width: "100%",
    height: "100%",
  },
  dishImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  dishContent: {
    flex: 1,
  },
  dishName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
  },
  restaurantTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  restaurantTagName: {
    fontSize: typography.size.xs,
    color: colors.accent.gold,
    fontWeight: typography.weight.medium,
  },
  dishDescription: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteSoft,
    lineHeight: 16,
    marginTop: 4,
  },
  dishFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  dishPrice: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.accent.gold,
  },
  viewMenuText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.accent.goldMuted,
  },
  dishFavoriteContainer: {
    paddingLeft: spacing.xs,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.goldTint,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.accent.whiteSoft,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  emptyButtonWrapper: {
    width: "100%",
  },
  // Unauth State
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
  },
  unauthIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent.goldTint,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  unauthTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  unauthSubtitle: {
    fontSize: typography.size.sm,
    color: colors.accent.whiteSoft,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  unauthButtonWrapper: {
    width: "100%",
  },
});
