import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Loading } from "./Loading";

type Props = {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function Button({
  title,
  loading,
  disabled,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.submitButton,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <Loading />
      ) : (
        <Text style={styles.submitButtonText}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    backgroundColor: "#c4943e",
    borderRadius: 18,
    paddingVertical: 18,

    shadowColor: "#d4af37",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.6,
    shadowRadius: 10,

    elevation: 8,

    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    color: "#4a0505",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 1,
  },
});