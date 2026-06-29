/** Full-page maintenance notice when CRM enables maintenance mode. */
export default function MaintenanceScreen({ siteName = 'Vantage Dating', message = '' }) {
  const defaultMsg =
    'We are performing scheduled maintenance to improve your experience. Please check back soon.';

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-12 text-center">
      <div className="max-w-md rounded-2xl bg-white/95 p-8 shadow-xl border border-white/20">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-2xl">
          ⚙
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">{siteName}</h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {message?.trim() ? message.trim() : defaultMsg}
        </p>
        <p className="text-xs text-slate-400">Thank you for your patience.</p>
      </div>
    </div>
  );
}
