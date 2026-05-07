/**
 * Android: front camera preview + periodic snapshots + ML Kit pose (PoseDetectModule).
 * Avoids Vision Camera frame processors / worklets (RN 0.84 codegen conflicts).
 * @format
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useTheme } from '../theme/ThemeContext';

const { PoseDetectModule } = NativeModules;

const WIDTH_SCALE = 2.35;
const CHEST_OFFSET_Y = 0.08;

function smoothBlend(prev, next, alpha) {
  if (next == null) return prev;
  if (prev == null) return next;
  return prev * (1 - alpha) + next * alpha;
}

function smoothPose(prev, raw) {
  const alpha = 0.42;
  if (!raw || raw.found !== true) {
    return prev;
  }
  const base = !prev || prev.found !== true ? raw : prev;
  return {
    found: true,
    lsNx: smoothBlend(base.lsNx, raw.lsNx, alpha),
    lsNy: smoothBlend(base.lsNy, raw.lsNy, alpha),
    rsNx: smoothBlend(base.rsNx, raw.rsNx, alpha),
    rsNy: smoothBlend(base.rsNy, raw.rsNy, alpha),
  };
}

export default function TryOnScreen({ navigation, route }) {
  const theme = useTheme();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const overlayUri = route?.params?.overlayUri;
  const productTitle = route?.params?.productTitle || 'Try on';

  const [camGranted, setCamGranted] = useState(false);
  const [checkingPerm, setCheckingPerm] = useState(true);
  const [pose, setPose] = useState(null);
  const [imgRatio, setImgRatio] = useState(1);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState('front');
  const busyRef = useRef(false);

  const device = useCameraDevice(facing);
  const cameraRef = useRef(null);

  useEffect(() => {
    setCameraReady(false);
    setPose(null);
  }, [facing]);

  useEffect(() => {
    if (!overlayUri) return;
    Image.getSize(
      overlayUri,
      (w, h) => {
        if (w > 0 && h > 0) setImgRatio(w / h);
      },
      () => {}
    );
  }, [overlayUri]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await request(PERMISSIONS.ANDROID.CAMERA);
      if (!cancelled) {
        setCamGranted(r === RESULTS.GRANTED || r === RESULTS.LIMITED);
        setCheckingPerm(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!camGranted || !PoseDetectModule || !cameraReady) return undefined;

    let cancelled = false;

    const tick = async () => {
      if (cancelled || busyRef.current) return;
      const cam = cameraRef.current;
      if (!cam?.takeSnapshot) return;
      busyRef.current = true;
      try {
        const photo = await cam.takeSnapshot({ quality: 75 });
        const path = photo?.path;
        if (!path || cancelled) return;
        const resolved = path.startsWith('file://') ? path : `file://${path}`;
        const raw = await PoseDetectModule.detectPoseFromImagePath(resolved);
        if (!cancelled && raw) {
          setPose((prev) => smoothPose(prev, raw));
        }
      } catch (_) {
        // Snapshot may fail while camera initializes; ignore.
      } finally {
        busyRef.current = false;
      }
    };

    const id = setInterval(tick, 400);
    tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [camGranted, device, cameraReady]);

  const overlayStyle = useMemo(() => {
    if (!pose || pose.found !== true) {
      return { opacity: 0 };
    }
    const { lsNx, lsNy, rsNx, rsNy } = pose;
    // Front selfie preview is usually mirrored; back camera is not — match overlay to preview.
    const mirrorX = facing === 'front';
    const lsXm = mirrorX ? 1 - lsNx : lsNx;
    const rsXm = mirrorX ? 1 - rsNx : rsNx;
    const midX = (lsXm + rsXm) / 2;
    const midY = (lsNy + rsNy) / 2 + CHEST_OFFSET_Y;
    const shoulderWNorm = Math.abs(rsXm - lsXm);
    const garmentW = Math.min(screenW * shoulderWNorm * WIDTH_SCALE, screenW * 1.2);
    const garmentH = garmentW / Math.max(imgRatio, 0.2);
    const left = midX * screenW - garmentW / 2;
    const top = midY * screenH - garmentH * 0.35;
    // Rotation must use the same shoulder vector as on-screen preview (mirrored X on front).
    // Using bitmap-space atan2 while positions are mirrored tilted/inverted the garment vs real shoulders.
    const dx = rsXm - lsXm;
    const dy = rsNy - lsNy;
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      opacity: 1,
      position: 'absolute',
      width: garmentW,
      height: garmentH,
      left,
      top,
      transform: [{ rotate: `${angleDeg}deg` }],
    };
  }, [pose, screenW, screenH, imgRatio, facing]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {productTitle}
        </Text>
        <TouchableOpacity
          onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
          style={[styles.flipBtnHeader, { borderColor: theme.border }]}
          accessibilityLabel={facing === 'front' ? 'Use back camera' : 'Use front camera'}
        >
          <Ionicons name="camera-reverse" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {checkingPerm ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !camGranted ? (
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: theme.text }]}>Camera permission is required for Try on.</Text>
        </View>
      ) : device == null ? (
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: theme.text }]}>
            No {facing === 'front' ? 'front' : 'back'} camera found.
          </Text>
        </View>
      ) : !overlayUri ? (
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: theme.text }]}>No overlay image for this product.</Text>
        </View>
      ) : !PoseDetectModule ? (
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: theme.text }]}>Pose detection native module missing.</Text>
        </View>
      ) : (
        <View style={styles.stage}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={camGranted}
            pixelFormat="yuv"
            onInitialized={() => setCameraReady(true)}
          />
          <Image
            source={{ uri: overlayUri }}
            style={[styles.overlay, overlayStyle]}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.flipFab}
            onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={facing === 'front' ? 'Switch to back camera' : 'Switch to front camera'}
          >
            <Ionicons name="camera-reverse" size={26} color="#fff" />
            <Text style={styles.flipFabLabel}>
              {facing === 'front' ? 'Back camera' : 'Front camera'}
            </Text>
          </TouchableOpacity>
          {(!pose || pose.found !== true) && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Stand facing the camera — shoulders visible</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 8, width: 40 },
  flipBtnHeader: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  stage: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute' },
  flipFab: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    zIndex: 20,
    elevation: 8,
  },
  flipFabLabel: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 120,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { fontSize: 16, textAlign: 'center' },
  banner: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  bannerText: { color: '#fff', textAlign: 'center', fontSize: 14 },
});
