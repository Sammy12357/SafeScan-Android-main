import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { analyzeUrl, api, type AnalyzeResult } from "@/services/api";
import { useScanStore } from "@/stores/scanStore";
import { useAirdropStore } from "@/stores/airdropStore";
import { useAuthStore } from "@/stores/authStore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { buildLocalOnlyAnalyzeResult } from "@/utils/localRisk";

const REPEAT_SCAN_WINDOW_MS = 3000;

type RecentScan = {
  payload: string;
  scannedAt: number;
};

function fileNameFromUri(uri: string, fallback: string) {
  try {
    const last = uri.split("?")[0].split("#")[0].split("/").pop();
    return last && last.length > 0 ? decodeURIComponent(last) : fallback;
  } catch {
    return fallback;
  }
}

function mimeForUri(uri: string, fallback = "image/jpeg") {
  const lower = uri.split("?")[0].toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return fallback;
}

function extensionForMime(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/heic") return ".heic";
  if (mimeType === "image/svg+xml") return ".svg";
  if (mimeType === "application/pdf") return ".pdf";
  return ".jpg";
}

function ensureFileExtension(name: string, mimeType: string) {
  return /\.[a-z0-9]{2,5}$/i.test(name) ? name : `${name}${extensionForMime(mimeType)}`;
}

export function useScanner(): {
  hasPermission: boolean | null;
  isAnalyzing: boolean;
  isUploading: boolean;
  error: string | null;
  torchOn: boolean;
  toggleTorch: () => void;
  zoom: number;
  setZoom: (value: number) => void;
  onBarcodeScanned: (data: string) => void;
  captureAndScan: (framedPayload?: string | null) => Promise<void>;
  pickFromLibrary: () => Promise<void>;
  cameraRef: RefObject<CameraView | null>;
} {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const recentScanRef = useRef<RecentScan | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoomState] = useState(0);
  const addScan = useScanStore((state) => state.addScan);
  const enqueuePending = useScanStore((state) => state.enqueuePending);
  const fetchAirdropStatus = useAirdropStore((state) => state.fetchStatus);
  const hasBackendSession = useAuthStore((state) => state.hasBackendSession);
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  const toggleTorch = useCallback(() => {
    setTorchOn((prev) => {
      void Haptics.selectionAsync();
      return !prev;
    });
  }, []);

  const setZoom = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, 0), 1);
    setZoomState(clamped);
  }, []);

  const handleResult = useCallback((result: AnalyzeResult, options?: { pending?: boolean }) => {
    const scanId = result.scanId || `${Date.now()}`;
    const scan = { ...result, scanId, id: scanId, pending: options?.pending ?? false };
    queryClient.setQueryData(["scan-result", scanId], scan);
    addScan(scan);
    // Backend bumps scan_count / fraud_score / airdrop tier on every counted
    // scan. Refresh in the background so the Airdrop tab reflects the new
    // numbers without the user having to navigate to it manually. Only for
    // online + backend-authed sessions — the local-only fallback didn't
    // touch the server.
    if (hasBackendSession && !options?.pending) {
      void fetchAirdropStatus().catch(() => undefined);
    }
    router.push({ pathname: "/scan-result/[id]", params: { id: scanId } });
  }, [addScan, fetchAirdropStatus, hasBackendSession, queryClient, router]);

  const runLocalFallback = useCallback((payload: string) => {
    const result = buildLocalOnlyAnalyzeResult(payload);
    const scanId = result.scanId || `local:${Date.now()}`;
    enqueuePending({ id: scanId, payload, queuedAt: Date.now() });
    handleResult({ ...result, scanId }, { pending: true });
  }, [enqueuePending, handleResult]);

  const analyzeMutation = useMutation({
    mutationFn: (payload: string) => analyzeUrl(payload),
    meta: { silent: true },
    onSuccess: (result) => handleResult(result),
    onError: (mutationError, payload) => {
      if (!isOnline) {
        runLocalFallback(payload);
        return;
      }
      setError(mutationError instanceof Error ? mutationError.message : "SafeScan could not analyze this QR code.");
    }
  });

  const fileMutation = useMutation({
    mutationFn: (file: { uri: string; name: string; mimeType: string }) => api.scan.file(file),
    meta: { silent: true },
    onSuccess: (result) => handleResult({ ...result, source: "backend" }),
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "SafeScan could not decode that file.");
    }
  });

  useEffect(() => {
    if (!permission) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const onBarcodeScanned = useCallback(
    (data: string) => {
      const payload = data.trim();
      const now = Date.now();
      const recent = recentScanRef.current;

      if (!payload || analyzeMutation.isPending) return;
      if (recent?.payload === payload && now - recent.scannedAt < REPEAT_SCAN_WINDOW_MS) return;

      recentScanRef.current = { payload, scannedAt: now };
      setError(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!isOnline) {
        runLocalFallback(payload);
        return;
      }

      analyzeMutation.mutate(payload);
    },
    [analyzeMutation, isOnline, runLocalFallback]
  );

  const pickFromLibrary = useCallback(async () => {
    setError(null);
    if (!isOnline) {
      setError("Uploading a QR image needs an internet connection — try scanning with the camera instead.");
      return;
    }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setError("Photo library access is required to upload a QR image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 1
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const mimeType = asset.mimeType ?? mimeForUri(asset.uri);
    const name = ensureFileExtension(asset.fileName ?? fileNameFromUri(asset.uri, "qr-upload"), mimeType);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fileMutation.mutate({ uri: asset.uri, name, mimeType });
  }, [fileMutation, isOnline]);

  const captureAndScan = useCallback(async (framedPayload?: string | null) => {
    setError(null);
    const payload = framedPayload?.trim();

    if (payload) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!isOnline) {
        runLocalFallback(payload);
        return;
      }
      analyzeMutation.mutate(payload);
      return;
    }

    if (!isOnline) {
      setError("You're offline — point at a QR code and SafeScan will read it without uploading the image.");
      return;
    }

    const camera = cameraRef.current;
    if (!camera) {
      setError("Camera is not ready yet.");
      return;
    }

    try {
      const photo = await camera.takePictureAsync({
        quality: 0.9,
        skipProcessing: false
      });
      if (!photo?.uri) {
        setError("Could not capture a QR image.");
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      fileMutation.mutate({
        uri: photo.uri,
        name: ensureFileExtension(fileNameFromUri(photo.uri, `qr-capture-${Date.now()}`), "image/jpeg"),
        mimeType: "image/jpeg"
      });
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "Could not capture a QR image.");
    }
  }, [analyzeMutation, fileMutation, isOnline, runLocalFallback]);

  return {
    hasPermission: permission ? permission.granted : null,
    isAnalyzing: analyzeMutation.isPending || fileMutation.isPending,
    isUploading: fileMutation.isPending,
    error,
    torchOn,
    toggleTorch,
    zoom,
    setZoom,
    onBarcodeScanned,
    captureAndScan,
    pickFromLibrary,
    cameraRef
  };
}
