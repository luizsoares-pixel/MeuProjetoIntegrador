import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type TabBarIconProps = {
  name: IconName;
  focused: boolean;
  color: string;
};

export function TabBarIcon({ name, focused, color }: TabBarIconProps) {
  return (
    <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
      <MaterialCommunityIcons
        name={name}
        size={focused ? 24 : 22}
        color={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 44,
  },
  activeIconContainer: {
    borderBottomColor: "#d4af37",
    borderBottomWidth: 2,
  },
});
