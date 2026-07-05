/** Shared mobile-first layout classes for all email composers. */

export const EMAIL_COMPOSER_MODAL_OVERLAY =
  'fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4';

export const EMAIL_COMPOSER_MODAL_PANEL =
  'w-full max-w-3xl flex flex-col min-h-0 overflow-hidden bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl ' +
  'mt-[env(safe-area-inset-top,0px)] mb-[env(safe-area-inset-bottom,0px)] ' +
  'h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] ' +
  'sm:mt-0 sm:mb-0 sm:h-auto sm:max-h-[min(90dvh,calc(90*var(--vh,1vh)))]';

export const EMAIL_COMPOSER_EMBEDDED_ROOT =
  'bg-white rounded-none lg:rounded-lg shadow-lg overflow-hidden flex flex-col h-full min-h-0 w-full max-w-full';

export const EMAIL_COMPOSER_HEADER =
  'relative flex-shrink-0 px-3 py-3 sm:px-6 sm:py-5 border-b border-gray-200 flex flex-col items-center justify-center text-center min-w-0 bg-white/90';

export const EMAIL_COMPOSER_HEADER_DECORATIVE =
  'hidden lg:block flex-shrink-0 relative h-40 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 overflow-hidden';

export const EMAIL_COMPOSER_BODY_WRAP = 'flex-1 min-h-0 flex flex-col overflow-hidden';

export const EMAIL_COMPOSER_SCROLL =
  'flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-6 sm:py-4';

export const EMAIL_COMPOSER_FOOTER =
  'flex-shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pt-3 border-t border-gray-200 bg-white/95 backdrop-blur-sm';

export const EMAIL_COMPOSER_SEND_BTN =
  'w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 sm:py-3.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg';

export const EMAIL_COMPOSER_INPUT =
  'w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';

export const EMAIL_COMPOSER_TEXTAREA =
  'w-full min-w-0 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-base';

export const EMAIL_COMPOSER_TOOLBAR =
  'flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4';

export const EMAIL_COMPOSER_TOOLBAR_BTN =
  'inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors';

export const EMAIL_COMPOSER_GIFTS_ROW =
  'flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-3 px-3 sm:mx-0 sm:px-0';

export const EMAIL_COMPOSER_AVATAR =
  'w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg shrink-0';

export const EMAIL_COMPOSER_AVATAR_FALLBACK =
  'w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center border-2 sm:border-4 border-white shadow-lg shrink-0';

export const EMAIL_COMPOSER_TITLE =
  'text-base sm:text-xl font-bold text-gray-900 px-8 sm:px-2 break-words max-w-full line-clamp-2';

export const EMAIL_COMPOSER_PAGE =
  'min-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] bg-gray-50 flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]';

export const EMAIL_COMPOSER_PAGE_INNER = 'flex-1 flex flex-col min-h-0 w-full max-w-3xl mx-auto px-0 sm:px-4 lg:px-8';

/** Email read/detail modal — content-sized on mobile, capped at viewport height. */
export const EMAIL_DETAIL_MODAL_PANEL =
  'relative w-full max-w-2xl flex flex-col min-h-0 overflow-hidden bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl ' +
  'mt-[env(safe-area-inset-top,0px)] mb-[env(safe-area-inset-bottom,0px)] ' +
  'max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] ' +
  'sm:mt-0 sm:mb-0 sm:max-h-[min(90dvh,calc(90*var(--vh,1vh)))]';

export const EMAIL_DETAIL_HEADER =
  'relative flex-shrink-0 h-28 sm:h-44 md:h-52 overflow-hidden rounded-t-2xl sm:rounded-t-2xl';

export const EMAIL_DETAIL_SCROLL =
  'overflow-y-auto overscroll-contain min-h-0 flex-1 flex flex-col';

export const EMAIL_DETAIL_CONTENT = 'px-3 py-3 sm:px-6 sm:py-5 flex-1 min-w-0';

export const EMAIL_DETAIL_REPLY_FOOTER =
  'flex-shrink-0 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6 border-t border-gray-100 bg-white';
