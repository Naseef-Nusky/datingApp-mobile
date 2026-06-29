import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaChevronDown } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const OPTIONS = [
  { value: 'all', labelKey: 'dashboard.filterAllUsers', dotClass: 'bg-gradient-to-br from-teal-400 to-emerald-500' },
  { value: 'online', labelKey: 'dashboard.filterOnlineUsers', dotClass: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.65)]' },
  { value: 'offline', labelKey: 'dashboard.filterOfflineUsers', dotClass: 'bg-gray-400' },
];

export default function StreamerMemberFilter({ value, onChange }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = OPTIONS.find((o) => o.value === value) || OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (next) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={rootRef}>
      <button
        type="button"
        id="streamer-member-filter"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('dashboard.memberListFilterLabel')}
        className={`group flex w-full min-w-[180px] items-center gap-2.5 rounded-2xl border bg-white/90 px-4 py-2.5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 sm:w-auto ${
          open
            ? 'border-teal-400/60 ring-2 ring-teal-500/20 shadow-md'
            : 'border-gray-200/80 hover:border-teal-300/50 hover:shadow-md'
        }`}
      >
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${selected.dotClass}`}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {t(selected.labelKey)}
        </span>
        <FaChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-teal-600' : 'group-hover:text-gray-600'
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby="streamer-member-filter"
          className="absolute right-0 z-30 mt-2 w-full min-w-[240px] overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-1.5 shadow-xl shadow-gray-200/50 ring-1 ring-black/[0.04] sm:w-[260px]"
        >
          {OPTIONS.map((opt) => {
            const isActive = value === opt.value;
            return (
              <li key={opt.value} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => pick(opt.value)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-50 to-emerald-50/80 text-teal-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${opt.dotClass}`}
                    aria-hidden
                  />
                  <span className="flex-1 font-medium">{t(opt.labelKey)}</span>
                  {isActive && (
                    <FaCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
