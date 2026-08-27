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
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#d4af37",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 15,
    color: "#1a1a1a",
  },
  rightElement: {
    paddingRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  inputError: {
    borderColor: "#ff6b6b",
  },
  errorText: {
    color: "#ff8080",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
});