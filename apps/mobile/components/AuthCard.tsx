import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <View style={styles.formCard}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.24)",
    elevation: 8,
    maxWidth: 440,
    padding: 22,
    width: "100%",
  },
});