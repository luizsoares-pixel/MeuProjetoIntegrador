import { ActivityIndicator, View } from "react-native";

type LoadingProps = {
  color?: string;
  size?: "small" | "large";
};

export function Loading({
  color = "#4a0505",
  size = "small",
}: LoadingProps) {
  return (
    <View>
      <ActivityIndicator
        color={color}
        size={size}
      />
    </View>
  );
}