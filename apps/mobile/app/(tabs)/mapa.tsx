import { StyleSheet, View } from "react-native";
import InteractiveMap from "../../components/InteractiveMap";

export default function MapaTab() {
  return (
    <View style={styles.container}>
      <InteractiveMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});