import { useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';

const WAVEFORM = [4, 7, 5, 9, 6, 8, 4, 7, 5, 10, 6, 8, 5, 7, 4, 9, 6, 5, 8, 4, 7, 6, 9, 5];

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * WhatsApp-style voice note bubble with play button, scrub bar, and duration.
 */
export default function ChatVoiceMessageBubble({ src, isOwn = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setDuration(0);
    setCurrent(0);
    setReady(false);
    setError(false);
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setReady(true);
      }
    };
    const onTime = () => setCurrent(audio.currentTime || 0);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setError(true);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    try {
      if (playing) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (err) {
      console.error('Voice playback error:', err);
      setError(true);
    }
  };

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const displayDuration = duration > 0 ? duration : 0;
  const accent = isOwn ? 'text-[#075E54]' : 'text-[#128C7E]';
  const btnBg = isOwn ? 'bg-[#DCF8C6]' : 'bg-[#ECE5DD]';
  const barActive = isOwn ? 'bg-[#25D366]' : 'bg-[#8696A0]';
  const barIdle = isOwn ? 'bg-[#A5D6A7]' : 'bg-[#C5CBD0]';

  if (error) {
    return (
      <p className="text-xs text-red-500">Could not load voice message</p>
    );
  }

  return (
    <div className="flex min-w-[200px] max-w-[260px] items-center gap-2 sm:min-w-[220px]">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <button
        type="button"
        onClick={togglePlay}
        disabled={!src || error}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${btnBg} ${accent} shadow-sm transition hover:opacity-90 disabled:opacity-50`}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
      >
        {playing ? <FaPause className="text-xs" /> : <FaPlay className="ml-0.5 text-xs" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex h-7 items-end gap-[2px]">
          {WAVEFORM.map((height, index) => {
            const barProgress = (index / WAVEFORM.length) * 100;
            const played = barProgress <= progress;
            return (
              <span
                key={index}
                className={`w-[2px] shrink-0 rounded-full transition-colors ${played ? barActive : barIdle}`}
                style={{ height: `${height + 6}px` }}
              />
            );
          })}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className={`text-[11px] tabular-nums ${isOwn ? 'text-gray-600' : 'text-gray-500'}`}>
            {playing || current > 0
              ? formatDuration(current)
              : formatDuration(displayDuration)}
          </span>
          {!ready && (
            <span className="text-[10px] text-gray-400">Voice</span>
          )}
        </div>
      </div>
    </div>
  );
}
