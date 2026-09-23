import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme";

interface RatingDistributionProps {
  distribution?: Record<number, number>;
  totalReviews: number;
}

export function RatingDistribution({
  distribution = {},
  totalReviews,
}: RatingDistributionProps) {
  const rows = [5, 4, 3, 2, 1];

  return (
    <View style={styles.container}>
      {rows.map((star) => {
        const count = distribution[star] ?? 0;
        const percentage =
          totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

        return (
          <View key={star} style={styles.row}>
            {/* Label da Estrela */}
            <View style={styles.starLabel}>
              <Text style={styles.starNumber}>{star}</Text>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color={colors.accent.gold}
              />
            </View>

            {/* Barra de Progresso */}
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${percentage}%`,
                  },
                ]}
              />
            </View>

            {/* Contagem / Porcentagem */}
            <Text style={styles.countText}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  starLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 28,
  },
  starNumber: {
    ...typography.captionBold,
    color: colors.accent.white,
    marginRight: 2,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent.gold,
    borderRadius: 4,
  },
  countText: {
    ...typography.caption,
    color: colors.accent.whiteLight,
    width: 24,
    textAlign: "right",
  },
});
