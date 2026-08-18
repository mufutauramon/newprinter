import { useState } from "react";
import {
  Image,
  ImageProps,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

type Props = ImageProps & {
  fallback?: any;
};

export default function SafeImage({
  source,
  fallback,
  style,
  ...rest
}: Props) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      )}

      <Image
        {...rest}
        source={failed ? fallback : source}
        style={[StyleSheet.absoluteFill, style]}
        resizeMode="cover"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});