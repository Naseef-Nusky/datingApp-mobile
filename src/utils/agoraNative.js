import { Capacitor } from '@capacitor/core';

export function isIosNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function isNativeMobile() {
  return isIosNative() || isAndroidNative();
}

/** Mobile browser (narrow viewport or phone UA), not only Capacitor. */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  if (isNativeMobile()) return true;
  if (window.matchMedia?.('(max-width: 768px)')?.matches) return true;
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(navigator.userAgent || '');
}

/**
 * H.264 is required for iOS WKWebView and must match between caller/callee.
 * Modern desktop browsers support H.264 in WebRTC — use it for all video calls.
 */
export function getRtcCodec() {
  return 'h264';
}

export function getLocalVideoPlayConfig() {
  return { fit: 'cover', mirror: true };
}

export function getRemoteVideoPlayConfig() {
  return { fit: 'cover', mirror: false };
}

/**
 * Warm up camera/mic permissions before Agora creates tracks (helps iOS prompt + grant flow).
 */
export async function requestCallMediaPermissions(includeVideo = true) {
  if (!navigator.mediaDevices?.getUserMedia) return;

  const constraints = includeVideo
    ? { video: { facingMode: 'user' }, audio: true }
    : { audio: true };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Play Agora video into a DOM container with retries (iOS WebView can mount video late).
 */
export async function playAgoraVideoTrack(track, container, config = {}, maxAttempts = 10) {
  if (!track || !container) return false;

  const playConfig = { fit: 'cover', ...config };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await track.play(container, playConfig);
      applyIosInlineVideoAttributes(container);
      return true;
    } catch (err) {
      if (attempt === maxAttempts - 1) {
        console.warn('[Agora] play() failed after retries:', err);
        return false;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 80 * (attempt + 1));
      });
    }
  }
  return false;
}

export function applyIosInlineVideoAttributes(container) {
  if (!container?.querySelectorAll) return;
  container.querySelectorAll('video').forEach((video) => {
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;
  });
}

const FRONT_CAMERA_LABEL = /front|user|selfie|facetime|truedepth|wide.*front/i;
const BACK_CAMERA_LABEL = /back|rear|environment|telephoto|ultra\s*wide(?!\s*front)/i;

/** Pick front/selfie camera from Agora device list (index + deviceId). */
export function findFrontCameraIndex(cameras = []) {
  if (!cameras.length) return 0;

  const byFacing = cameras.findIndex((c) => c.facingMode === 'user' || c.facing === 'front');
  if (byFacing >= 0) return byFacing;

  const byLabel = cameras.findIndex((c) => FRONT_CAMERA_LABEL.test(c.label || ''));
  if (byLabel >= 0) return byLabel;

  const notBack = cameras.findIndex((c) => !BACK_CAMERA_LABEL.test(c.label || ''));
  if (notBack >= 0) return notBack;

  return 0;
}

export function getFrontCameraDeviceId(cameras = []) {
  const idx = findFrontCameraIndex(cameras);
  return cameras[idx]?.deviceId ?? null;
}

export function getCameraTrackInitConfig(cameras = null) {
  if (!isMobileDevice()) return {};

  const config = {
    facingMode: 'user',
  };

  const frontId = cameras ? getFrontCameraDeviceId(cameras) : null;
  if (frontId) {
    config.cameraId = frontId;
  }

  if (isNativeMobile()) {
    config.encoderConfig = {
      width: 640,
      height: 480,
      frameRate: 24,
      bitrateMax: 800,
    };
  }

  return config;
}

/** After track exists, ensure the active device is the front camera on mobile. */
export async function applyFrontCameraToTrack(videoTrack, cameras = null) {
  if (!videoTrack || !isMobileDevice()) return findFrontCameraIndex(cameras || []);

  let list = cameras;
  if (!list?.length) {
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      list = await AgoraRTC.getCameras();
    } catch {
      return 0;
    }
  }

  const frontIdx = findFrontCameraIndex(list);
  const frontId = list[frontIdx]?.deviceId;
  if (!frontId) return frontIdx;

  try {
    await videoTrack.setDevice(frontId);
  } catch (err) {
    console.warn('[Camera] setDevice(front) failed:', err);
  }
  return frontIdx;
}
