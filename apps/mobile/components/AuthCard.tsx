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
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    borderRadius: 25,
    padding: 20,
  },
});