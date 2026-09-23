import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "../theme";

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
  iconColor = colors.accent.gold,
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
    backgroundColor: colors.background.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxxl,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(47, 0, 0, 0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    elevation: 10,
    boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)",
  },
  icon: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.accent.white,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.size.lg,
    color: colors.accent.whiteSoft,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: spacing.xl,
    fontWeight: typography.weight.medium,
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
    backgroundColor: colors.accent.gold,
    minHeight: 52,
  },
  confirmButtonText: {
    color: colors.background.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.lg,
    letterSpacing: typography.letterSpacing.wide,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent.goldTintStrong,
    marginBottom: spacing.sm,
  },
  cancelButtonText: {
    color: colors.accent.gold,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.base,
  },
});

