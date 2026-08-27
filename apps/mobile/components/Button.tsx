import {
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { colors, spacing, typography } from "../theme";
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
    backgroundColor: colors.accent.goldSoft,
    borderRadius: 18,
    paddingVertical: spacing.lg,

    boxShadow: `0px 3px 10px ${colors.accent.goldTintStrong}`,

    elevation: 8,

    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    color: colors.accent.darkRed,
    fontWeight: typography.weight.bold,
    textAlign: "center",
    fontSize: typography.size.lg,
    letterSpacing: 1,
  },
});