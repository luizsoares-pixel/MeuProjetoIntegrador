import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, spacing } from "../theme";

interface RestaurantCardSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

export function RestaurantCardSkeleton({ style }: RestaurantCardSkeletonProps = {}) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.card, style]}>
      {/* Imagem Placeholder */}
      <Animated.View style={[styles.imageSkeleton, animatedStyle]} />

      {/* Conteúdo Placeholder */}
      <View style={styles.content}>
        {/* Título Placeholder */}
        <Animated.View style={[styles.titleSkeleton, animatedStyle]} />

        {/* Tag Culinária Placeholder */}
        <Animated.View style={[styles.tagSkeleton, animatedStyle]} />

        {/* Endereço Placeholder */}
        <Animated.View style={[styles.addressSkeleton, animatedStyle]} />
      </View>
    </View>
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
  },
  imageSkeleton: {
    height: 150,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  content: {
    padding: spacing.md,
  },
  titleSkeleton: {
    height: 20,
    width: "60%",
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginBottom: spacing.sm,
  },
  tagSkeleton: {
    height: 16,
    width: "35%",
    borderRadius: 6,
    backgroundColor: colors.accent.goldTint,
    marginBottom: spacing.sm,
  },
  addressSkeleton: {
    height: 14,
    width: "80%",
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
});
