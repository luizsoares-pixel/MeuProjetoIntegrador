// components/ScreenHeader.tsx

import { StyleSheet, Text, View } from "react-native";

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
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.divider} />

      <Text style={styles.subtitle}>
        {subtitle}
      </Text>

      <Text style={styles.tagline}>
        {tagline}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 50,
  },

  title: {
    color: "#d4af37",
    fontSize: 42,
    fontWeight: "bold",
  },

  divider: {
    width: 80,
    height: 2,
    backgroundColor: "#d4af37",
    marginVertical: 8,
  },

  subtitle: {
    color: "#FFF",
    fontSize: 16,
    letterSpacing: 5,
  },

  tagline: {
    color: "#d8c184",
    marginTop: 10,
    fontSize: 14,
  },
});