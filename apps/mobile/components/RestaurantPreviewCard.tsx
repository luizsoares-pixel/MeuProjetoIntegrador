import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../theme";
import { useFavorites } from "../hooks/useFavorites";
import { FavoriteButton } from "./FavoriteButton";
import type { NearbyRestaurant } from "../services/api";

interface RestaurantPreviewCardProps {
  restaurant: NearbyRestaurant | null;
  visible: boolean;
  onClose: () => void;
  onTraceRoute?: (restaurant: NearbyRestaurant) => void;
}

/** Formata metros para exibição legível: < 1 km → "850 m", ≥ 1 km → "1,2 km" */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * Modal de preview exibido ao tocar em um pin de restaurante.
 * Critérios de aceite #34: nome, foto de capa e avaliação média (placeholder).
 *
 * Usa expo-image (já é dependência do projeto) para cache e
 * placeholder nativo sem dependência extra.
 */
export function RestaurantPreviewCard({
  restaurant,
  visible,
  onClose,
  onTraceRoute,
}: RestaurantPreviewCardProps) {
  const insets = useSafeAreaInsets();
  const { isRestaurantFavorite, toggleRestaurant } = useFavorites();
  if (!restaurant) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* stopPropagation: impede que toque no card feche o modal */}
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Foto de capa */}
          <View style={styles.imageContainer}>
            {restaurant.imageUrl ? (
              <Image
                source={{ uri: restaurant.imageUrl }}
                style={styles.image}
                contentFit="cover"
                transition={300}
                accessibilityLabel={`Foto de capa de ${restaurant.name}`}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons
                  name="silverware-fork-knife"
                  size={40}
                  color={colors.accent.goldMuted}
                />
              </View>
            )}

            {/* Botão Favoritar */}
            <View style={styles.favoriteButtonContainer}>
              <FavoriteButton
                isFavorite={isRestaurantFavorite(restaurant.id)}
                onToggle={() => toggleRestaurant(restaurant)}
                size={18}
              />
            </View>

            {/* Badge de distância sobreposta à imagem */}
            <View style={styles.distanceBadge}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={13}
                color={colors.background.primary}
              />
              <Text style={styles.distanceText}>
                {formatDistance(restaurant.distanceInMeters)}
              </Text>
            </View>

            {/* Botão fechar */}
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={onClose}
              accessibilityLabel="Fechar preview"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={colors.accent.white}
              />
            </Pressable>
          </View>

          {/* Informações */}
          <View
            style={[
              styles.info,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Text style={styles.name} numberOfLines={2}>
              {restaurant.name}
            </Text>

            <View style={styles.addressRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={colors.accent.goldMuted}
              />
              <Text style={styles.address} numberOfLines={2}>
                {restaurant.address}
              </Text>
            </View>

            {/* Avaliação — placeholder até feature de avaliações ser implementada */}
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialCommunityIcons
                  key={star}
                  name="star"
                  size={18}
                  color={colors.accent.gold}
                />
              ))}
              <Text style={styles.ratingLabel}>Em breve</Text>
            </View>

            {/* Ações: Ver Rota e Ver Detalhes */}
            <View style={styles.actionRow}>
              {onTraceRoute ? (
                <Pressable
                  style={styles.traceRouteButton}
                  onPress={() => {
                    onClose();
                    onTraceRoute(restaurant);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Ver rota no mapa"
                >
                  <MaterialCommunityIcons
                    name="navigation-variant"
                    size={16}
                    color={colors.background.primary}
                  />
                  <Text style={styles.traceRouteButtonText}>Ver Rota</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={styles.detailsButton}
                onPress={() => {
                  onClose();
                  router.push(`/restaurante/${restaurant.id}`);
                }}
                accessibilityRole="button"
                accessibilityLabel="Ver detalhes do restaurante"
              >
                <Text style={styles.detailsButtonText}>Detalhes</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={colors.accent.gold}
                />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "rgba(47, 0, 0, 0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    overflow: "hidden",
    elevation: 12,
    boxShadow: "0px -4px 16px rgba(0,0,0,0.25)",
  },
  imageContainer: {
    position: "relative",
    height: 190,
    backgroundColor: colors.background.dark,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.dark,
  },
  distanceBadge: {
    position: "absolute",
    bottom: 10,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  distanceText: {
    color: colors.background.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  favoriteButtonContainer: {
    position: "absolute",
    top: 10,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  info: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  name: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    lineHeight: 28,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  address: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.accent.whiteSoft,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: spacing.xs,
  },
  ratingLabel: {
    marginLeft: 6,
    fontSize: typography.size.sm,
    color: colors.accent.goldMuted,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  traceRouteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  traceRouteButtonText: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  detailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  detailsButtonText: {
    color: colors.accent.gold,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
});
