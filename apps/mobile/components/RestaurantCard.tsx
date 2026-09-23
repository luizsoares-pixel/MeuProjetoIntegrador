import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RestaurantResponse } from "@menu-digital/contracts";
import { colors, spacing, typography } from "../theme";
import { useFavorites } from "../hooks/useFavorites";
import { FavoriteButton } from "./FavoriteButton";

interface RestaurantCardProps {
  restaurant: RestaurantResponse;
  onPress?: (restaurant: RestaurantResponse) => void;
}

export function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  const { isRestaurantFavorite, toggleRestaurant } = useFavorites();
  const displayAddress =
    restaurant.neighborhood && restaurant.city
      ? `${restaurant.neighborhood}, ${restaurant.city}`
      : restaurant.address || "Endereço não informado";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress?.(restaurant)}
      accessibilityRole="button"
      accessibilityLabel={`Restaurante ${restaurant.name}`}
    >
      {/* Imagem de Capa ou Placeholder */}
      <View style={styles.imageContainer}>
        {restaurant.imageUrl ? (
          <Image
            source={{ uri: restaurant.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Foto de ${restaurant.name}`}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={36}
              color={colors.accent.goldMuted}
            />
          </View>
        )}

        {/* Badge de Avaliação Média */}
        <View style={styles.ratingBadge}>
          {restaurant.rating !== null && restaurant.rating !== undefined ? (
            <>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color={colors.accent.gold}
              />
              <Text style={styles.ratingText}>
                {restaurant.rating.toFixed(1)}
              </Text>
            </>
          ) : (
            <Text style={styles.newBadgeText}>Novo</Text>
          )}
        </View>

        {/* Badge de Faixa de Preço */}
        {restaurant.priceRange ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{restaurant.priceRange}</Text>
          </View>
        ) : null}

        {/* Botão de Favorito no Card */}
        <View style={styles.favoriteButtonContainer}>
          <FavoriteButton
            isFavorite={isRestaurantFavorite(restaurant.id)}
            onToggle={() => toggleRestaurant(restaurant)}
            size={20}
          />
        </View>
      </View>

      {/* Conteúdo Informativo */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
        </View>

        {/* Culinária e Detalhes */}
        <View style={styles.metaRow}>
          {restaurant.cuisineType ? (
            <View style={styles.cuisineTag}>
              <MaterialCommunityIcons
                name="food-variant"
                size={13}
                color={colors.accent.gold}
              />
              <Text style={styles.cuisineText} numberOfLines={1}>
                {restaurant.cuisineType}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Endereço Resumido */}
        <View style={styles.addressRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={colors.accent.whiteLight}
          />
          <Text style={styles.addressText} numberOfLines={1}>
            {displayAddress}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.dark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    marginBottom: spacing.md,
    overflow: "hidden",
    elevation: 3,
    shadowColor: colors.accent.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    height: 150,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(20, 0, 0, 0.78)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.goldTint,
  },
  ratingText: {
    color: colors.accent.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  newBadgeText: {
    color: colors.accent.gold,
    fontSize: 11,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
  },
  priceBadge: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: "rgba(20, 0, 0, 0.78)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent.goldTint,
  },
  priceText: {
    color: colors.accent.gold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  content: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cuisineTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent.goldTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cuisineText: {
    color: colors.accent.goldMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: typography.size.xs,
    color: colors.accent.whiteLight,
    flex: 1,
  },
  favoriteButtonContainer: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
