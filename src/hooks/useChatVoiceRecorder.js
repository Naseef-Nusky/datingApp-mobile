import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAudioRecorderOptions,
  isVoiceRecordingSupported,
  normalizeVoiceFileForUpload,
  voiceFileExtension,
} from '../utils/chatMediaPicker';
import { isIos } from '../utils/platform';

const SLIDE_CANCEL_PX = 80;
const MIN_RECORDING_MS = 600;
const STOP_FLUSH_MS = 350;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Voice recorder for chat — tap mic to record, tap Send/Cancel (or hold + release to send).
 * Optimized for iOS WKWebView / Capacitor.
 */
export function useChatVoiceRecorder({ uploadFile, blocked = false }) {
  const [phase, setPhase] = useState('idle'); // idle | starting | recording | sending
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceSlideCancel, setVoiceSlideCancel] = useState(false);

  const mediaRecorderRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const voiceMimeRef = useRef('audio/mp4');
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const uploadFileRef = useRef(uploadFile);
  const phaseRef = useRef('idle');
  const pendingActionRef = useRef(null); // null | 'send' | 'cancel'
  const holdStartXRef = useRef(0);
  const slideCancelRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const unbindPointerRef = useRef(null);
  const processingRef = useRef(false);

  uploadFileRef.current = uploadFile;

  const setPhaseSafe = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      voiceStreamRef.current = null;
    }
  }, []);

  const resetUi = useCallback(() => {
    clearTimer();
    stopStream();
    mediaRecorderRef.current = null;
    voiceChunksRef.current = [];
    pendingActionRef.current = null;
    pointerActiveRef.current = false;
    slideCancelRef.current = false;
    unbindPointerRef.current?.();
    unbindPointerRef.current = null;
    setVoiceSlideCancel(false);
    setRecordingTime(0);
    setPhaseSafe('idle');
  }, [clearTimer, setPhaseSafe, stopStream]);

  const uploadVoiceBlob = useCallback(async (shouldCancel) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setPhaseSafe('sending');

    await wait(STOP_FLUSH_MS);

    const chunks = voiceChunksRef.current.slice();
    const mimeType = voiceMimeRef.current || 'audio/mp4';
    const elapsed = Date.now() - startedAtRef.current;

    stopStream();
    mediaRecorderRef.current = null;
    voiceChunksRef.current = [];

    if (shouldCancel) {
      processingRef.current = false;
      resetUi();
      return;
    }

    if (chunks.length === 0) {
      processingRef.current = false;
      resetUi();
      alert('No audio captured. Please try again and speak for at least 1 second.');
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 200 || elapsed < MIN_RECORDING_MS) {
      processingRef.current = false;
      resetUi();
      alert('Recording too short. Speak for at least 1 second, then tap Send.');
      return;
    }

    const ext = voiceFileExtension(mimeType);
    const rawFile = new File([blob], `voice-${Date.now()}.${ext}`, {
      type: mimeType || 'audio/mp4',
    });

    try {
      const file = await normalizeVoiceFileForUpload(rawFile);
      await uploadFileRef.current?.(file, 'voice');
    } catch (error) {
      console.error('Voice upload error:', error);
      alert(error?.response?.data?.message || error?.message || 'Failed to send voice message');
    } finally {
      processingRef.current = false;
      resetUi();
    }
  }, [resetUi, setPhaseSafe, stopStream]);

  const finishRecording = useCallback(
    async (action) => {
      const shouldCancel = action === 'cancel' || slideCancelRef.current;
      pendingActionRef.current = shouldCancel ? 'cancel' : 'send';

      const recorder = mediaRecorderRef.current;

      if (!recorder) {
        if (phaseRef.current === 'starting') {
          return;
        }
        resetUi();
        return;
      }

      if (recorder.state !== 'recording') {
        return;
      }

      setPhaseSafe('sending');

      try {
        if (typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
      } catch {
        // ignore
      }

      await wait(80);

      try {
        recorder.stop();
      } catch (err) {
        console.error('MediaRecorder stop error:', err);
        await uploadVoiceBlob(shouldCancel);
      }
    },
    [resetUi, setPhaseSafe, uploadVoiceBlob],
  );

  const startRecording = useCallback(async () => {
    if (blocked) return;
    if (phaseRef.current !== 'idle') return;

    if (!isVoiceRecordingSupported()) {
      alert('Voice recording is not supported on this device.');
      return;
    }

    setPhaseSafe('starting');
    pendingActionRef.current = null;
    voiceChunksRef.current = [];
    slideCancelRef.current = false;
    setVoiceSlideCancel(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });

      if (pendingActionRef.current === 'cancel') {
        stream.getTracks().forEach((t) => t.stop());
        resetUi();
        return;
      }

      voiceStreamRef.current = stream;

      const options = getAudioRecorderOptions();
      if (options === null) {
        stream.getTracks().forEach((t) => t.stop());
        alert('Voice recording is not supported on this device.');
        resetUi();
        return;
      }

      const mimeType = options.mimeType || 'audio/mp4';
      voiceMimeRef.current = mimeType;

      const recorder = new MediaRecorder(
        stream,
        options.mimeType ? options : undefined,
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const action = pendingActionRef.current;
        const shouldCancel = action === 'cancel' || slideCancelRef.current;
        uploadVoiceBlob(shouldCancel);
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording failed. Please try again.');
        resetUi();
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();

      // iOS: single blob on stop works more reliably than timeslice
      if (isIos()) {
        recorder.start();
      } else {
        recorder.start(250);
      }

      setPhaseSafe('recording');
      setRecordingTime(0);
      clearTimer();
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);

      if (pendingActionRef.current === 'send') {
        await wait(Math.max(MIN_RECORDING_MS, 400));
        finishRecording('send');
      } else if (pendingActionRef.current === 'cancel') {
        finishRecording('cancel');
      }
    } catch (error) {
      console.error('Voice start error:', error);
      alert('Microphone access needed. Allow it in Settings and try again.');
      resetUi();
    }
  }, [blocked, clearTimer, finishRecording, resetUi, setPhaseSafe, uploadVoiceBlob]);

  const unbindPointer = useCallback(() => {
    unbindPointerRef.current?.();
    unbindPointerRef.current = null;
  }, []);

  const bindHoldPointer = useCallback(
    (clientX) => {
      unbindPointer();
      holdStartXRef.current = clientX;
      pointerActiveRef.current = true;

      const onMove = (e) => {
        if (!pointerActiveRef.current) return;
        const slideLeft = holdStartXRef.current - e.clientX;
        const cancel = slideLeft > SLIDE_CANCEL_PX;
        slideCancelRef.current = cancel;
        setVoiceSlideCancel(cancel);
      };

      const onEnd = () => {
        if (!pointerActiveRef.current) return;
        pointerActiveRef.current = false;
        unbindPointer();
        finishRecording(slideCancelRef.current ? 'cancel' : 'send');
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);

      unbindPointerRef.current = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };
    },
    [finishRecording, unbindPointer],
  );

  /** Tap mic — start locked recording (most reliable on iOS). */
  const startLockedRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  /** Hold mic — start + track finger for slide-to-cancel / release-to-send. */
  const beginHold = useCallback(
    (clientX) => {
      if (blocked || phaseRef.current !== 'idle') return;
      bindHoldPointer(clientX);
      startRecording();
    },
    [bindHoldPointer, blocked, startRecording],
  );

  const sendRecording = useCallback(() => {
    unbindPointer();
    pointerActiveRef.current = false;
    slideCancelRef.current = false;
    finishRecording('send');
  }, [finishRecording, unbindPointer]);

  const cancelRecording = useCallback(() => {
    unbindPointer();
    pointerActiveRef.current = false;
    slideCancelRef.current = true;
    finishRecording('cancel');
  }, [finishRecording, unbindPointer]);

  const onHoldMove = useCallback((clientX) => {
    if (phaseRef.current !== 'recording' && phaseRef.current !== 'starting') return;
    const slideLeft = holdStartXRef.current - clientX;
    const cancel = slideLeft > SLIDE_CANCEL_PX;
    slideCancelRef.current = cancel;
    setVoiceSlideCancel(cancel);
  }, []);

  useEffect(() => {
    return () => {
      pendingActionRef.current = 'cancel';
      unbindPointer();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === 'recording') {
        try {
          recorder.stop();
        } catch {
          resetUi();
        }
      } else {
        resetUi();
      }
    };
  }, [resetUi, unbindPointer]);

  const isRecording = phase === 'recording';
  const isStarting = phase === 'starting';
  const isVoiceActive = phase === 'recording' || phase === 'starting' || phase === 'sending';

  return {
    isRecording,
    isStarting,
    isVoiceActive,
    voiceHolding: isVoiceActive,
    recordingTime,
    voiceSlideCancel,
    voiceSupported: isVoiceRecordingSupported(),
    startLockedRecording,
    beginHold,
    sendRecording,
    cancelRecording,
    onHoldMove,
  };
}
