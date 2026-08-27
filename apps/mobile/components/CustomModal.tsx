import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CustomModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
};

export function CustomModal({
  visible,
  title,
  message,
  confirmText = "OK",
  cancelText,
  iconName = "information-outline",
  iconColor = "#d4af37",
  onConfirm,
  onCancel,
  onClose,
}: CustomModalProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <MaterialCommunityIcons
            name={iconName}
            size={44}
            color={iconColor}
            style={styles.icon}
          />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {cancelText ? (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(40, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#f3f3f3",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1d1d1d",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    color: "#1d1d1d",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 20,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: "#7d1f1f",
    minHeight: 52,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.4,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(125,31,31,0.4)",
    marginBottom: 12,
  },
  cancelButtonText: {
    color: "#7d1f1f",
    fontWeight: "600",
    fontSize: 16,
  },
});

