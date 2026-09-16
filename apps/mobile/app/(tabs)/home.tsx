import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import type { RestaurantResponse } from "@menu-digital/contracts";
import { RestaurantCard } from "../../components/RestaurantCard";
import { RestaurantCardSkeleton } from "../../components/RestaurantCardSkeleton";
import { RestaurantEmptyState } from "../../components/RestaurantEmptyState";
import { RestaurantErrorState } from "../../components/RestaurantErrorState";
import { useRestaurantList } from "../../hooks/useRestaurantList";
import { useFadeSlide } from "../../hooks/useFadeSlide";
import { colors, spacing, typography } from "../../theme";

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const {
    restaurants,
    isLoading,
    isLoadingMore,
    isRefreshing,
    isError,
    isEmpty,
    errorMessage,
    hasMore,
    refresh,
    loadMore,
    retry,
  } = useRestaurantList({ limit: 10 });

  const eyebrowAnim = useFadeSlide({ delay: 0, translateY: 8 });
  const titleAnim = useFadeSlide({ delay: 80, translateY: 12 });
  const descAnim = useFadeSlide({ delay: 160, translateY: 8 });

  const handleCardPress = useCallback((_restaurant: RestaurantResponse) => {
    // Integração futura com a tela de detalhes do cardápio (Sprint #4)
  }, []);

  const renderHeader = useCallback(() => {
    return (
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

        {!isLoading && !isError && !isEmpty && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Restaurantes em destaque</Text>
            <Text style={styles.sectionBadge}>
              {restaurants.length} {restaurants.length === 1 ? "opção" : "opções"}
            </Text>
          </View>
        )}
      </View>
    );
  }, [eyebrowAnim, titleAnim, descAnim, isLoading, isError, isEmpty, restaurants.length]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          <RestaurantCardSkeleton />
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
      return <RestaurantEmptyState onRefresh={refresh} />;
    }

    return null;
  }, [isLoading, isError, isEmpty, errorMessage, retry, refresh]);

  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color={colors.accent.gold} />
          <Text style={styles.footerLoadingText}>
            Carregando mais restaurantes...
          </Text>
        </View>
      );
    }

    if (!hasMore && restaurants.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <View style={styles.footerEndLine} />
          <Text style={styles.footerEndText}>Fim da lista</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.accent.gold}
            colors={[colors.accent.gold]}
          />
        }
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
    marginBottom: spacing.lg,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
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
