import { FaHeart, FaCommentDots } from 'react-icons/fa';

function scoreColor(score) {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-pink-600';
  return 'text-amber-600';
}

function scoreRingColor(score) {
  if (score >= 85) return 'from-emerald-500 to-teal-500';
  if (score >= 70) return 'from-pink-500 to-rose-500';
  return 'from-amber-500 to-orange-500';
}

/** Compact badge for dashboard profile cards — ❤️ + % on photo corner */
export function CompatibilityBadge({ score, className = '', variant = 'default' }) {
  if (score == null) return null;

  if (variant === 'card') {
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-lg bg-black/60 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-sm font-bold shadow-lg backdrop-blur-sm ${className}`}
      >
        <span aria-hidden>❤️</span>
        {score}%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] sm:text-xs font-semibold shadow ${scoreColor(score)} ${className}`}
    >
      <FaHeart className="text-[10px] text-red-500" />
      {score}%
    </span>
  );
}

/** Full compatibility panel on profile view */
export default function CompatibilityPanel({ data, loading, error, otherName, onAskQuestion }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-4 sm:p-5 animate-pulse">
        <div className="h-5 w-40 bg-pink-100 rounded mb-3" />
        <div className="h-16 bg-pink-50 rounded mb-3" />
        <div className="h-10 bg-pink-50 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        {error}
      </div>
    );
  }

  if (!data?.score) return null;

  const name = otherName || 'this member';

  return (
    <section className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600 mb-1">
            Compatibility
          </p>
          <h2 className="text-lg font-bold text-gray-900">Why you may connect with {name}</h2>
        </div>
        <div
          className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${scoreRingColor(data.score)} text-white shadow-lg`}
        >
          <FaHeart className="text-sm mb-0.5" />
          <span className="text-xl sm:text-2xl font-bold leading-none">{data.score}%</span>
        </div>
      </div>

      {data.summary && (
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{data.summary}</p>
      )}

      {data.strengths?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Why you&apos;re compatible</h3>
          <ul className="space-y-1.5">
            {data.strengths.map((item) => (
              <li key={item} className="text-sm text-gray-700 flex gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.challenges?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Possible difference</h3>
          <ul className="space-y-1.5">
            {data.challenges.map((item) => (
              <li key={item} className="text-sm text-gray-600 flex gap-2">
                <span className="text-amber-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.icebreakers?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FaCommentDots className="text-pink-500" />
            Try asking in chat
          </h3>
          <ul className="space-y-2">
            {data.icebreakers.map((item, index) => (
              <li key={`icebreaker-${index}`}>
                <button
                  type="button"
                  onClick={() => onAskQuestion?.(item)}
                  disabled={!onAskQuestion}
                  className="w-full text-left text-sm text-gray-800 bg-white/80 border border-pink-100 rounded-lg px-3 py-2.5 min-h-[44px] hover:bg-pink-50 active:bg-pink-100 transition touch-manipulation disabled:cursor-default"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-500 mt-2">
            Tap to open chat with a ready-to-send dating message. New ideas each visit.
          </p>
        </div>
      )}

      {data.source === 'heuristic' && !data.cached && (
        <p className="text-[11px] text-gray-500 mt-3">
          Quick compatibility estimate — open this profile for personalized conversation starters.
        </p>
      )}
    </section>
  );
}
