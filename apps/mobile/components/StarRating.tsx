import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 18,
  color = colors.accent.gold,
  emptyColor = colors.accent.whiteLight,
  interactive = false,
  onRatingChange,
  showValue = false,
}: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, index) => index + 1);

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((starValue) => {
          const isFilled = starValue <= Math.round(rating);
          const iconName = isFilled ? "star" : "star-outline";
          const iconColor = isFilled ? color : emptyColor;

          if (interactive) {
            return (
              <TouchableOpacity
                key={starValue}
                onPress={() => onRatingChange?.(starValue)}
                style={styles.starTouchTarget}
                accessibilityRole="button"
                accessibilityLabel={`${starValue} de ${maxRating} estrelas`}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={size}
                  color={iconColor}
                />
              </TouchableOpacity>
            );
          }

          return (
            <MaterialCommunityIcons
              key={starValue}
              name={iconName}
              size={size}
              color={iconColor}
              style={styles.staticStar}
            />
          );
        })}
      </View>

      {showValue && (
        <Text style={[styles.ratingValueText, { fontSize: size * 0.85 }]}>
          {rating > 0 ? rating.toFixed(1) : "—"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starTouchTarget: {
    padding: spacing.xs / 2,
  },
  staticStar: {
    marginRight: 2,
  },
  ratingValueText: {
    ...typography.bodyBold,
    color: colors.accent.gold,
    marginLeft: spacing.sm,
  },
});
