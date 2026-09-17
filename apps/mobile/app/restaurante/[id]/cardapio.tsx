import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MenuItemResponse } from "@menu-digital/contracts";
import { fetchRestaurantMenu } from "../../../services/api";
import { colors, spacing, typography } from "../../../theme";

type MenuSection = { title: string; data: MenuItemResponse[] };

export default function RestaurantMenuScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurantId = Array.isArray(id) ? id[0] : id;
  const listRef = useRef<SectionList<MenuItemResponse, MenuSection>>(null);
  const [items, setItems] = useState<MenuItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    if (!restaurantId) return;
    let mounted = true;
    fetchRestaurantMenu(restaurantId)
      .then((result) => {
        if (mounted) setItems(result);
      })
      .catch((loadError: Error) => {
        if (mounted) setError(loadError.message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [restaurantId]);

  const sections = useMemo<MenuSection[]>(() => {
    const grouped = new Map<string, MenuItemResponse[]>();
    items.forEach((item) => {
      const categoryItems = grouped.get(item.category) ?? [];
      categoryItems.push(item);
      grouped.set(item.category, categoryItems);
    });
    return Array.from(grouped, ([title, data]) => ({ title, data }));
  }, [items]);

  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 30 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ section?: { title: string } }> }) => {
      const activeItem = viewableItems.find((viewable) => viewable.section);
      if (activeItem?.section) {
        const index = sectionsRef.current.findIndex(
          (entry) => entry.title === activeItem.section?.title
        );
        if (index >= 0) setActiveCategory(index);
      }
    }
  ).current;

  const scrollToCategory = (index: number) => {
    setActiveCategory(index);
    try {
      listRef.current?.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        viewPosition: 0,
        animated: true,
      });
    } catch {
      // Fallback gracioso caso a seção ainda não esteja montada no layout
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.mutedText}>Carregando cardápio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons name="wifi-off" size={42} color={colors.accent.redSoft} />
        <Text style={styles.emptyTitle}>Não foi possível carregar o cardápio</Text>
        <Text style={styles.mutedText}>{error}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Voltar">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.accent.white} />
        </Pressable>
        <Text style={styles.title}>Cardápio</Text>
        <View style={styles.headerSpacer} />
      </View>

      {sections.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={54} color={colors.accent.goldMuted} />
          <Text style={styles.emptyTitle}>Cardápio em preparação</Text>
          <Text style={styles.mutedText}>Este restaurante ainda não cadastrou itens.</Text>
        </View>
      ) : (
        <>
          <View style={styles.categoryBarContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBar}>
              {sections.map((section, index) => (
                <Pressable
                  key={section.title}
                  onPress={() => scrollToCategory(index)}
                  style={[styles.categoryTab, activeCategory === index && styles.categoryTabActive]}
                >
                  <Text style={[styles.categoryText, activeCategory === index && styles.categoryTextActive]}>
                    {section.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <SectionList
            ref={listRef}
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            contentContainerStyle={styles.listContent}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => <MenuItemCard item={item} />}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToLocation({
                sectionIndex: info.index,
                itemIndex: 0,
                animated: false,
              });
            }}
          />
        </>
      )}
    </View>
  );
}

function MenuItemCard({ item }: { item: MenuItemResponse }) {
  return (
    <View style={[styles.itemCard, !item.available && styles.itemUnavailable]}>
      <View style={styles.itemCopy}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
        <Text style={styles.itemPrice}>R$ {item.price.toFixed(2).replace(".", ",")}</Text>
        {!item.available ? <Text style={styles.soldOut}>ESGOTADO</Text> : null}
      </View>
      <MenuItemImage photoUrl={item.photoUrl} itemName={item.name} />
    </View>
  );
}

function MenuItemImage({ photoUrl, itemName }: { photoUrl: string | null; itemName: string }) {
  const [isLoading, setIsLoading] = useState(Boolean(photoUrl));

  return (
    <View style={styles.imageFrame}>
      {photoUrl ? (
        <>
          {isLoading ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="small" color={colors.accent.gold} />
            </View>
          ) : null}
          <Image
            source={{ uri: photoUrl }}
            style={styles.itemImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="low"
            transition={250}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            accessibilityLabel={`Foto de ${itemName}`}
          />
        </>
      ) : (
        <MaterialCommunityIcons name="food-outline" size={30} color={colors.accent.goldMuted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxxl, backgroundColor: colors.background.primary },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.accent.goldTint },
  iconButton: { padding: spacing.xs },
  headerSpacer: { width: 32 },
  title: { flex: 1, textAlign: "center", color: colors.accent.white, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  listContent: { paddingBottom: spacing.xxxl },
  categoryBarContainer: {
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.goldTint,
  },
  categoryBar: { flexDirection: "row", padding: spacing.sm, gap: spacing.xs, backgroundColor: colors.background.secondary },
  categoryTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.accent.goldTint },
  categoryTabActive: { backgroundColor: colors.accent.gold },
  categoryText: { color: colors.accent.goldMuted, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  categoryTextActive: { color: colors.background.primary },
  sectionHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.background.dark },
  sectionTitle: { color: colors.accent.gold, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  itemCard: { flexDirection: "row", gap: spacing.md, padding: spacing.md, marginHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.accent.goldTint },
  itemUnavailable: { opacity: 0.58 },
  itemCopy: { flex: 1, justifyContent: "center" },
  itemName: { color: colors.accent.white, fontSize: typography.size.base, fontWeight: typography.weight.bold },
  itemDescription: { color: colors.accent.whiteSoft, fontSize: typography.size.sm, lineHeight: 20, marginTop: spacing.xs },
  itemPrice: { color: colors.accent.gold, fontSize: typography.size.md, fontWeight: typography.weight.bold, marginTop: spacing.sm },
  soldOut: { color: colors.accent.redSoft, fontSize: typography.size.xs, fontWeight: typography.weight.bold, marginTop: spacing.xs },
  imageFrame: { width: 104, height: 104, borderRadius: 10, backgroundColor: colors.background.secondary, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  imagePlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background.secondary, alignItems: "center", justifyContent: "center", zIndex: 1 },
  itemImage: { width: "100%", height: "100%", zIndex: 0 },
  emptyTitle: { color: colors.accent.white, fontSize: typography.size.lg, fontWeight: typography.weight.bold, marginTop: spacing.lg, textAlign: "center" },
  mutedText: { color: colors.accent.whiteSoft, fontSize: typography.size.sm, textAlign: "center", marginTop: spacing.sm },
  backButton: { marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.accent.gold, borderRadius: 8 },
  backButtonText: { color: colors.background.primary, fontWeight: typography.weight.bold },
});