// components/ScreenHeader.tsx

import { Text, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  tagline: string;
};

export function ScreenHeader({
  title,
  subtitle,
  tagline,
}: Props) {
  return (
    <View>
      <Text>{title}</Text>
      <Text>{subtitle}</Text>
      <Text>{tagline}</Text>
    </View>
  );
}