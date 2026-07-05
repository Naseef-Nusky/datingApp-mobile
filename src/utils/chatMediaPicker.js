import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './platform';
import { isHeicFile, prepareProfileImageForUpload } from './profileImage';

export const CHAT_MEDIA_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/aac,audio/webm,audio/wav,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.mp4,.mov,.m4v,.webm,.mp3,.m4a,.aac,.wav';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

const extFromName = (name = '') => {
  const parts = String(name).toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
};

export function inferChatMessageType(file) {
  if (!file) return 'text';
  const type = String(file.type || '').toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'voice';

  const ext = extFromName(file.name);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'm4v', 'webm', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'm4a', 'aac', 'wav', 'ogg', 'webm'].includes(ext)) return 'voice';
  return 'text';
}

export function validateChatMediaFile(file) {
  if (!file) return 'No file selected';
  if (file.size > MAX_FILE_BYTES) return 'File must be smaller than 50MB';
  const type = inferChatMessageType(file);
  if (type === 'text') {
    return 'Please choose a photo, video, or audio file';
  }
  if (type === 'voice' && file.size < 100) {
    return 'Recording too short — please hold the mic a little longer';
  }
  return null;
}

export async function prepareChatMediaForUpload(file) {
  const messageType = inferChatMessageType(file);
  if (messageType === 'image' && (file.type.startsWith('image/') || isHeicFile(file))) {
    return prepareProfileImageForUpload(file);
  }
  if (messageType === 'voice') {
    return normalizeVoiceFileForUpload(file);
  }
  return file;
}

/** Ensure voice blobs from iOS MediaRecorder upload with a valid audio MIME type. */
export function normalizeVoiceFileForUpload(file) {
  if (!file) return file;

  const name = String(file.name || 'voice.m4a');
  const ext = extFromName(name) || 'm4a';
  let mime = String(file.type || '').toLowerCase();

  if (!mime.startsWith('audio/')) {
    if (mime.startsWith('video/') || ext === 'mp4' || ext === 'm4v') {
      mime = 'audio/mp4';
    } else if (ext === 'webm') {
      mime = 'audio/webm';
    } else if (ext === 'mp3') {
      mime = 'audio/mpeg';
    } else if (ext === 'wav') {
      mime = 'audio/wav';
    } else {
      mime = 'audio/mp4';
    }
  }

  const safeExt = voiceFileExtension(mime);
  const baseName = name.replace(/\.[^.]+$/, '') || 'voice';
  const nextName = name.includes('.') ? name : `${baseName}.${safeExt}`;

  if (file.type === mime && file.name === nextName) {
    return file;
  }

  return new File([file], nextName, {
    type: mime,
    lastModified: file.lastModified || Date.now(),
  });
}

async function uriToFile(webPath, fileName, mimeType) {
  const response = await fetch(webPath);
  const blob = await response.blob();
  return new File([blob], fileName, {
    type: mimeType || blob.type || 'application/octet-stream',
    lastModified: Date.now(),
  });
}

/** Opens the device gallery / file picker (photos, videos, audio). Must run from a user tap. */
export function openGalleryPicker(fileInputRef) {
  const input = fileInputRef?.current;
  if (!input) return;
  input.value = '';
  input.click();
}

/**
 * Take a photo with the native camera on iOS/Android.
 * Returns a File, or null when the user cancels.
 * Throws on permission / hardware errors.
 */
export async function capturePhotoWithNativeCamera() {
  if (!isNative()) return null;

  const perm = await Camera.requestPermissions({ permissions: ['camera'] });
  if (perm.camera === 'denied') {
    throw new Error('Camera access denied. Enable it in Settings to take photos.');
  }

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    saveToGallery: false,
  });

  if (!photo?.webPath) return null;
  return uriToFile(photo.webPath, `photo-${Date.now()}.jpg`, 'image/jpeg');
}

/** Best MediaRecorder mime type for this device (iOS prefers audio/mp4). */
export function getAudioRecorderOptions() {
  if (typeof MediaRecorder === 'undefined') return null;

  const candidates = [
    'audio/mp4',
    'audio/aac',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mpeg',
  ];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return { mimeType };
    }
  }
  return {};
}

export function voiceFileExtension(mimeType = '') {
  const mime = mimeType.toLowerCase();
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  return 'm4a';
}

export function isVoiceRecordingSupported() {
  return typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined';
}
