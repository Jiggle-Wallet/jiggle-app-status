import { StyleSheet, Text, View } from "react-native";
import status from "../status.json";

/**
 * Human-readable landing page. Machines should hit GET /status (API route)
 * or /status.json (static public mirror).
 */
export default function Index() {
  const maintenance = status.maintenance?.active ? "ACTIVE" : "off";
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jiggle App Status</Text>
      <Text style={styles.body}>
        Out-of-band force-upgrade + maintenance config.
      </Text>
      <Text style={styles.mono}>GET /status</Text>
      <Text style={styles.mono}>GET /status.json</Text>
      <Text style={styles.meta}>
        maintenance: {maintenance} · updatedAt: {status.updatedAt}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#144A38",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    color: "#82E578",
    fontSize: 28,
    fontWeight: "600",
  },
  body: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    maxWidth: 420,
  },
  mono: {
    color: "#C2D8B5",
    fontSize: 14,
    fontFamily: "monospace",
  },
  meta: {
    color: "#C2D8B5",
    fontSize: 12,
    marginTop: 16,
  },
});
