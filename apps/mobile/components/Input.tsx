import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type Props = TextInputProps & {
  error?: string;
};

export function Input({
  error,
  style,
  ...rest
}: Props) {
  return (
    <View>
      <TextInput
        placeholderTextColor="#d8c184"
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        {...rest}
      />

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#d4af37",
    fontSize: 15,
    color: "#1a1a1a",
  },

  inputError: {
    borderColor: "#ff6b6b",
    marginBottom: 6,
  },

  errorText: {
    color: "#ff8080",
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
  },
});