import { ActivityIndicator, View } from "react-native";
import { colors } from "../theme";

type LoadingProps = {
  color?: string;
  size?: "small" | "large";
};

export function Loading({
  color = colors.accent.darkRed,
  size = "small",
}: LoadingProps) {
  return (
    <View>
      <ActivityIndicator color={color} size={size} />
    </View>
  );
}