import { useState } from "react";
import { Text, View } from "react-native";
import { CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import { ScanOverlay } from "@/components/scanner/ScanOverlay";
import { ScanDrawer } from "@/components/scanner/ScanDrawer";
import { theme } from "@/constants/theme";

export default function ScannerScreen() {
  const [payload, setPayload] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={async (event) => {
          if (payload) return;
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setPayload(event.data);
        }}
      >
        <ScanOverlay detected={Boolean(payload)} />
      </CameraView>
      <ScanDrawer payload={payload} onClear={() => setPayload(null)} />
      {!payload ? <Text style={{ position: "absolute", bottom: 28, alignSelf: "center", color: theme.colors.textSecondary }}>Align QR code within the frame</Text> : null}
    </View>
  );
}
