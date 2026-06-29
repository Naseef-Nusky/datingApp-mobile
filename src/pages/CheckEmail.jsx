import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getCheckInboxButtonLabel, openEmailInbox } from '../utils/emailInbox';

/**
 * Shown after user enters email and clicks Continue: "Check your email", login link sent to [email].
 */
export default function CheckEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const email = location.state?.email || '';
  const devLoginLink = location.state?.devLoginLink;

  const handleOpenEmail = () => {
    openEmailInbox(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-24 bg-white rounded-full blur-2xl" />
        <div className="absolute top-40 right-20 w-56 h-32 bg-white rounded-full blur-2xl" />
      </div>

      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 p-8 md:p-10 text-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
          {t('pages.checkEmail.title')}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {devLoginLink
            ? t('pages.checkEmail.devMode')
            : <>{t('pages.checkEmail.sentTo')} <strong className="text-gray-700">{email || t('pages.checkEmail.yourEmailAddress')}</strong>.</>}
        </p>

        {devLoginLink ? (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
            <p className="text-amber-800 text-xs font-medium mb-2">{t('pages.checkEmail.devLinkLabel')}</p>
            <a href={devLoginLink} className="block text-blue-600 text-sm break-all hover:underline">
              {devLoginLink}
            </a>
            <button
              type="button"
              onClick={() => { window.location.href = devLoginLink; }}
              className="mt-3 w-full py-2.5 px-4 rounded-lg font-semibold text-white text-sm hover:opacity-90"
              style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
            >
              {t('pages.checkEmail.openLoginLink')}
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleOpenEmail}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white uppercase text-sm tracking-wide mb-3 transition hover:opacity-90"
              style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
            >
              {getCheckInboxButtonLabel(email)}
            </button>
            <p className="text-xs text-gray-600 text-left bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 leading-relaxed">
              {t('pages.checkEmail.spamHint')}
            </p>
          </>
        )}

        <Link
          to="/signup-email"
          className="block w-full py-3.5 px-6 rounded-xl font-semibold text-gray-700 uppercase text-sm tracking-wide border border-gray-300 hover:bg-gray-50 transition"
        >
          {t('pages.checkEmail.backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
