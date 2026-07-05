import { FaMicrophone, FaPaperPlane, FaStop, FaTimes, FaTrash } from 'react-icons/fa';
import AutoResizeTextarea from './AutoResizeTextarea';

function formatRecordingTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function VoiceWaveform({ active = true }) {
  const bars = [3, 5, 8, 5, 9, 6, 4, 7, 5, 8, 4, 6, 5, 7, 4];

  return (
    <div className="flex h-6 flex-1 items-center gap-[3px] overflow-hidden px-1" aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={index}
          className={`w-[3px] shrink-0 rounded-full bg-red-400/90 ${active ? 'animate-pulse' : 'opacity-40'}`}
          style={{
            height: `${height + 4}px`,
            animationDelay: `${index * 0.07}s`,
            animationDuration: `${0.45 + (index % 4) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * WhatsApp-style composer: send top-right; tap mic to record; Cancel / Send while recording.
 */
export default function ChatMessageComposer({
  message,
  onMessageChange,
  onKeyDown,
  onSend,
  placeholder = 'Message',
  textareaClassName = '',
  isRecording = false,
  isStarting = false,
  isVoiceActive = false,
  recordingTime = 0,
  voiceSlideCancel = false,
  voiceSupported = true,
  mediaUploading = false,
  onVoiceTapStart,
  onVoiceHoldMove,
  onVoiceSendTap,
  onVoiceCancelTap,
}) {
  const hasText = Boolean(message.trim());
  const showRecordingUi = isVoiceActive;
  const canSendText = hasText && !showRecordingUi && !mediaUploading;

  const handleMicTap = (e) => {
    if (hasText || mediaUploading || !voiceSupported || showRecordingUi) return;
    e.preventDefault();
    onVoiceTapStart?.();
  };

  return (
    <div className="border-t border-gray-200 bg-[#f0f2f5] px-2 py-2 sm:px-3 sm:py-3">
      <div className="flex items-start gap-2">
        <div
          onPointerMove={(e) => showRecordingUi && onVoiceHoldMove?.(e.clientX)}
          className={`min-h-[48px] flex-1 rounded-[24px] border bg-white shadow-sm transition-all sm:min-h-[52px] ${
            showRecordingUi
              ? voiceSlideCancel
                ? 'border-red-300 bg-red-50'
                : 'border-red-200 bg-red-50/80'
              : 'border-gray-200'
          } ${showRecordingUi ? 'flex items-center px-2 py-2 sm:px-3' : 'flex items-end pl-3 pr-2 py-1.5 sm:pl-4 sm:pr-3 sm:py-2'}`}
          style={{ touchAction: showRecordingUi ? 'none' : 'auto' }}
        >
          {showRecordingUi ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVoiceCancelTap?.();
                }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                  voiceSlideCancel ? 'bg-red-600 text-white' : 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-200'
                }`}
                aria-label="Cancel recording"
              >
                {voiceSlideCancel ? <FaTrash className="text-sm" /> : <FaTimes className="text-sm" />}
              </button>

              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-1 sm:px-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-red-700">
                    {formatRecordingTime(recordingTime)}
                  </span>
                  <VoiceWaveform active={isRecording} />
                </div>
                <p
                  className={`truncate text-[11px] font-medium sm:text-xs ${
                    voiceSlideCancel ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  {isStarting
                    ? 'Starting microphone…'
                    : voiceSlideCancel
                      ? 'Release or tap ✕ to cancel'
                      : 'Tap ■ to send · ✕ to cancel'}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVoiceSendTap?.();
                }}
                disabled={isStarting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition active:scale-95 disabled:opacity-50 sm:h-11 sm:w-11"
                aria-label="Send voice message"
              >
                <FaStop className="text-xs" />
              </button>
            </>
          ) : (
            <>
              <AutoResizeTextarea
                minRows={1}
                maxRows={5}
                value={message}
                onChange={onMessageChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                disabled={mediaUploading}
                className={`min-h-[36px] flex-1 min-w-0 border-0 bg-transparent py-1.5 text-base focus:ring-0 focus:outline-none sm:min-h-[38px] sm:py-2 sm:text-sm ${textareaClassName}`.trim()}
              />

              {!hasText && voiceSupported && (
                <button
                  type="button"
                  onClick={handleMicTap}
                  disabled={mediaUploading}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#54656F] transition hover:bg-gray-100 active:bg-gray-200 sm:mb-1 sm:h-11 sm:w-11"
                  aria-label="Tap to record voice message"
                >
                  <FaMicrophone className="text-base" />
                </button>
              )}
            </>
          )}
        </div>

        {!showRecordingUi && (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSendText}
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full bg-[#25D366] text-white shadow-sm transition hover:bg-[#20bd5a] disabled:cursor-default disabled:bg-[#A7E8C0] disabled:text-white/90 sm:h-11 sm:w-11"
            aria-label="Send message"
          >
            <FaPaperPlane className="text-sm sm:text-base" />
          </button>
        )}
      </div>

      {!voiceSupported && !hasText && !showRecordingUi && (
        <p className="mt-1.5 text-center text-[11px] text-gray-500">
          Voice messages are not supported in this browser.
        </p>
      )}
    </div>
  );
}
