import { FaCamera, FaVideo, FaEnvelope } from 'react-icons/fa';

const HEARTS_BG =
  'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,200,220,0.5) 0%, transparent 50%), linear-gradient(145deg, #f4a5b8 0%, #e86b7f 45%, #d94d63 100%)';

function formatEmailPreview(text, maxLen = 120) {
  const raw = String(text || '').trim().replace(/\s+/g, ' ');
  if (!raw) return 'NEW EMAIL FOR YOU';
  const upper = raw.toUpperCase();
  return upper.length > maxLen ? `${upper.slice(0, maxLen)}…` : upper;
}

/**
 * In-chat email bubble (reference: heart card + READ EMAIL + side icons).
 */
const ChatEmailMessageCard = ({
  previewText,
  isOwn = false,
  onReadEmail,
  onOpenComposer,
  onPhotoVideo,
  showSideActions = true,
}) => {
  const preview = formatEmailPreview(previewText);

  const card = (
    <div
      className="relative overflow-hidden rounded-xl shadow-md min-w-[200px] max-w-[300px]"
      style={{ background: HEARTS_BG }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="relative z-10 p-4 space-y-3">
        <p className="text-white text-xs sm:text-sm font-semibold leading-snug drop-shadow-sm">
          {preview}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReadEmail?.();
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wide py-2.5 px-3 rounded-md shadow transition-colors"
        >
          {isOwn ? 'VIEW EMAIL' : 'READ EMAIL'}
        </button>
      </div>
    </div>
  );

  if (isOwn || !showSideActions) {
    return card;
  }

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      {card}
      <div className="flex flex-col items-center gap-3 pt-2 text-gray-400 shrink-0">
        <button
          type="button"
          title="Photo/Video"
          onClick={(e) => {
            e.stopPropagation();
            onPhotoVideo?.();
          }}
          className="p-1 hover:text-gray-600 transition-colors"
        >
          <FaCamera className="text-lg" />
        </button>
        <button
          type="button"
          title="Video"
          onClick={(e) => {
            e.stopPropagation();
            onPhotoVideo?.();
          }}
          className="p-1 hover:text-gray-600 transition-colors"
        >
          <FaVideo className="text-lg" />
        </button>
        <button
          type="button"
          title="Email"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenComposer) onOpenComposer();
            else onReadEmail?.();
          }}
          className="p-1 hover:text-red-500 transition-colors"
        >
          <FaEnvelope className="text-lg" />
        </button>
      </div>
    </div>
  );
};

export default ChatEmailMessageCard;
