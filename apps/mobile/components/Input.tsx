import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { ReactNode } from "react";
import { colors, spacing, typography } from "../theme";

type Props = TextInputProps & {
  error?: string;
  rightElement?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({
  error,
  style,
  rightElement,
  containerStyle,
  ...rest
}: Props) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          placeholderTextColor="#d8c184"
          style={[styles.input, style]}
          {...rest}
        />

        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    color: colors.accent.text,
  },
  rightElement: {
    paddingRight: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  inputError: {
    borderColor: colors.accent.redSoft,
  },
  errorText: {
    color: colors.accent.redLight,
    fontSize: typography.size.xs,
    marginTop: 6,
    marginLeft: 4,
  },
});