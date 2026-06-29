import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { FaBars, FaTimes, FaInstagram, FaFacebookF, FaTwitter } from 'react-icons/fa';
import Logo from './Logo';
import PasswordInput from './PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { buildSendLoginLinkPayload } from '../utils/sendLoginLinkPayload';
import { getCheckInboxButtonLabel, openEmailInbox } from '../utils/emailInbox';
import { authorizeAppleSignIn } from '../utils/nativeAppleSignIn';

const isIosNativeShell = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

const loginBtnClass =
  'px-4 py-2 rounded-lg text-white text-sm font-semibold transition hover:opacity-90 shrink-0';
const loginBtnStyle = { background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' };

export default function LandingHero({ backgroundImage = "/hero%20img.png" }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginMode, setLoginMode] = useState('magic'); // 'magic' | 'password' | 'signup' | 'forgot'
  const [signupName, setSignupName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [magicSentEmail, setMagicSentEmail] = useState('');
  const [resetSentEmail, setResetSentEmail] = useState('');
  const loginPopupRef = useRef(null);
  /** Full-screen mobile / iOS login sheet — must be included in outside-click checks (desktop ref is absent on iOS). */
  const mobileLoginPopupRef = useRef(null);
  const navigate = useNavigate();
  const { login, loginWithToken } = useAuth();
  const { language, changeLanguage, languages, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileLangMenu, setShowMobileLangMenu] = useState(false);
  const [heroSocialError, setHeroSocialError] = useState('');

  useEffect(() => {
    if (!showLoginPopup) return;
    const isInsideLoginUi = (target) => {
      if (!(target instanceof Node)) return false;
      return (
        Boolean(loginPopupRef.current?.contains(target)) ||
        Boolean(mobileLoginPopupRef.current?.contains(target))
      );
    };
    const onDocPointerDown = (event) => {
      if (isInsideLoginUi(event.target)) return;
      setShowLoginPopup(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [showLoginPopup]);

  useEffect(() => {
    if (isIosNativeShell() && loginMode === 'forgot') {
      setLoginError('');
      setLoginMode('password');
    }
  }, [loginMode]);

  const openLoginPopup = () => {
    setLoginError('');
    setMagicSentEmail('');
    setLoginMode('magic');
    setShowLoginPopup(true);
  };

  const openSignupPopup = () => {
    setLoginError('');
    setLoginMode('signup');
    setShowLoginPopup(true);
  };

  const handleSendLoginLink = async (e) => {
    e.preventDefault();
    setLoginError('');
    setMagicSentEmail('');
    const trimmed = loginEmail.trim().toLowerCase();
    if (!trimmed) {
      setLoginError(t('auth.pleaseEnterEmail'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setLoginError(t('auth.pleaseEnterValidEmail'));
      return;
    }
    setLoginLoading(true);
    try {
      const res = await axios.post('/api/auth/send-login-link', buildSendLoginLinkPayload(trimmed));
      setMagicSentEmail(trimmed);
      setLoginMode('magicSent');
      // if dev link is returned, surface it in error text to help devs
      if (res.data?._devLoginLink) {
        setLoginError(`Dev login link: ${res.data._devLoginLink}`);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Failed to send login link. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setLoginError('');
    const nameTrimmed = signupName.trim();
    const emailTrimmed = loginEmail.trim().toLowerCase();
    if (!nameTrimmed) {
      setLoginError(t('auth.pleaseEnterName'));
      return;
    }
    if (!emailTrimmed) {
      setLoginError(t('auth.pleaseEnterEmail'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setLoginError(t('auth.pleaseEnterValidEmail'));
      return;
    }
    if (!acceptedTerms) {
      setLoginError(t('auth.pleaseAcceptTerms'));
      return;
    }
    setLoginLoading(true);
    try {
      const res = await axios.post('/api/auth/send-login-link', buildSendLoginLinkPayload(emailTrimmed));
      // store name for later steps if needed
      sessionStorage.setItem('signup_name', nameTrimmed);
      setMagicSentEmail(emailTrimmed);
      setLoginMode('magicSent');
      // if dev link is returned, surface it to help in development
      if (res.data?._devLoginLink) {
        setLoginError(`Dev login link: ${res.data._devLoginLink}`);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const emailTrimmed = loginEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setLoginError(t('auth.pleaseEnterEmail'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setLoginError(t('auth.pleaseEnterValidEmail'));
      return;
    }
    if (!loginPassword) {
      setLoginError(t('auth.pleaseEnterPassword'));
      return;
    }
    setLoginLoading(true);
    try {
      const result = await login(emailTrimmed, loginPassword);
      if (result.success) {
        setShowLoginPopup(false);
        navigate('/dashboard');
      } else {
        setLoginError(result.message || t('auth.loginFailed'));
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoginError('');
    const emailTrimmed = loginEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setLoginError(t('auth.pleaseEnterEmail'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setLoginError(t('auth.pleaseEnterValidEmail'));
      return;
    }
    setLoginLoading(true);
    try {
      await axios.post('/api/auth/password-reset', { email: emailTrimmed });
      setResetSentEmail(emailTrimmed);
      setLoginError('');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Failed to send reset instructions. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAppleHeroSignIn = async () => {
    if (!isIosNativeShell()) return;
    setHeroSocialError('');
    setLoginLoading(true);
    try {
      const { identityToken, givenName, familyName } = await authorizeAppleSignIn();
      const res = await axios.post('/api/auth/apple', { identityToken, givenName, familyName });
      const { token, needsProfileCompletion, registrationComplete } = res.data;
      if (token && loginWithToken) {
        loginWithToken(token);
        setShowLoginPopup(false);
        setShowMobileMenu(false);
        if (needsProfileCompletion === true || registrationComplete === false) {
          navigate('/complete-profile');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (e) {
      setHeroSocialError(
        e.response?.data?.message || e.message || 'Apple sign-in failed.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const flagUrlFor = (lang) => {
    switch (lang) {
      case 'es': return 'https://flagcdn.com/w40/es.png';
      case 'zh': return 'https://flagcdn.com/w40/cn.png';
      case 'it': return 'https://flagcdn.com/w40/it.png';
      case 'fr': return 'https://flagcdn.com/w40/fr.png';
      case 'de': return 'https://flagcdn.com/w40/de.png';
      case 'ja': return 'https://flagcdn.com/w40/jp.png';
      case 'en':
      default: return 'https://flagcdn.com/w40/us.png';
    }
  };

  const iosApp = isIosNativeShell();

  return (
    <section
      className="relative min-h-app-screen flex flex-col"
    >
      {/* Desktop: full-screen image with overlay header + floating white card */}
      <div
        className="hidden md:block relative min-h-app-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
        }}
      >
        {/* Desktop header: logo top left, nav top right — over image */}
        <header className="absolute top-0 left-0 right-0 z-20">
          <div
            className={
              iosApp
                ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-end pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4'
                : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-5'
            }
          >
            {iosApp ? (
              <button type="button" onClick={openLoginPopup} className={loginBtnClass} style={loginBtnStyle}>
                {t('home.login')}
              </button>
            ) : (
              <>
            <Link to="/" className="inline-flex items-center">
              <Logo className="h-8 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-2 lg:gap-3">
              <Link
                to="/#relationship-experts"
                className="px-4 py-2.5 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition"
              >
                Online Dating Advice
              </Link>
              <Link
                to="/online-dating-singles"
                className="px-4 py-2.5 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition"
              >
                Singles Online
              </Link>

              {/* Log in button + popup */}
              <div className="relative">
                <button
                  type="button"
                  onClick={openLoginPopup}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                >
                  Log In
                </button>

                {showLoginPopup && (
                  <div
                    ref={loginPopupRef}
                    className="absolute right-0 mt-3 w-[340px] bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
                  >
                  {loginMode === 'magic' ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">
                        Enter your email to receive a login link.
                      </p>
                      <form onSubmit={handleSendLoginLink} className="space-y-3">
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Your Email"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                          disabled={loginLoading}
                        />
                        {loginError && <p className="text-red-600 text-xs">{loginError}</p>}
                        <button
                          type="submit"
                          disabled={loginLoading}
                          className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition"
                          style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                        >
                          {loginLoading ? 'Sending…' : 'CONTINUE'}
                        </button>
                        <button
                          type="button"
                          className="block w-full text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                          onClick={() => { setLoginError(''); setLoginMode('password'); }}
                        >
                          SIGN IN WITH PASSWORD
                        </button>
                        <p className="text-center text-[11px] text-gray-500">
                          <button type="button" className="text-blue-600 hover:underline" onClick={openSignupPopup}>
                            Create Your Account
                          </button>
                        </p>
                      </form>
                    </>
                  ) : loginMode === 'magicSent' ? (
                    <div className="space-y-3 text-center">
                      <p className="text-xs text-gray-600">
                        Log in quickly using any link from the email we&apos;ve sent to{' '}
                        <span className="font-semibold break-all">{magicSentEmail}</span>.
                      </p>
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                        style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                        onClick={() => openEmailInbox(magicSentEmail)}
                      >
                        {getCheckInboxButtonLabel(magicSentEmail)}
                      </button>
                      <p className="text-[11px] text-amber-900 text-left bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed">
                        {t('auth.loginLinkSpamHint')}
                      </p>
                      <button
                        type="button"
                        className="block w-full text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                        onClick={() => { setLoginError(''); setMagicSentEmail(''); setLoginMode('password'); }}
                      >
                        SIGN IN
                      </button>
                      <p className="text-[11px] text-gray-500 mt-1 text-left">
                        <span className="mr-1">💡</span>
                        For all future logins, click any link inside any of our emails.
                      </p>
                    </div>
                  ) : loginMode === 'signup' ? (
                    <form onSubmit={handleCreateAccount} className="space-y-3">
                      <p className="text-xs text-gray-500">
                        Enter your email to receive a login link.
                      </p>
                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder={t('landing.nameOrNicknamePlaceholder')}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                        disabled={loginLoading}
                      />
                      <div className="relative">
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Your Email"
                          className="w-full px-3 py-2.5 pr-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                          disabled={loginLoading}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">i</span>
                      </div>

                      {loginError && <p className="text-red-600 text-xs">{loginError}</p>}

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                        style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                      >
                        {loginLoading ? t('landing.creating') : t('landing.createAccount')}
                      </button>

                      <button
                        type="button"
                        className="block w-full text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                        onClick={() => { setLoginError(''); setLoginMode('magic'); }}
                      >
                        SIGN IN
                      </button>

                      <label className="flex items-start gap-2 text-[11px] text-gray-600 pt-1">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          By clicking “Create Account” you agree with the{' '}
                          <Link to="/terms" className="underline hover:text-gray-800" onClick={() => setShowLoginPopup(false)}>Terms &amp; Conditions</Link>,{' '}
                          <Link to="/privacy" className="underline hover:text-gray-800" onClick={() => setShowLoginPopup(false)}>Privacy Policy</Link>,{' '}
                          <Link to="/refund" className="underline hover:text-gray-800" onClick={() => setShowLoginPopup(false)}>{t('landing.refundPolicyLink')}</Link> and{' '}
                          <Link to="/terms#content" className="underline hover:text-gray-800" onClick={() => setShowLoginPopup(false)}>Content Policy</Link>.
                          You can terminate your account or opt out of any or part of the services (including linked-one) any time.
                        </span>
                      </label>
                    </form>
                  ) : loginMode === 'password' ? (
                    <form onSubmit={handlePasswordLogin} className="space-y-3">
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Your Email"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                        disabled={loginLoading}
                      />
                      <PasswordInput
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        inputClassName="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                        disabled={loginLoading}
                        autoComplete="current-password"
                      />
                      {!isIosNativeShell() && (
                        <div className="text-center">
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => { setLoginError(''); setLoginMode('forgot'); }}
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                      {loginError && <p className="text-red-600 text-xs">{loginError}</p>}
                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                        style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                      >
                        {loginLoading ? 'Logging in…' : 'CONTINUE'}
                      </button>
                      <button
                        type="button"
                        className="block w-full text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                        onClick={() => { setLoginError(''); setLoginPassword(''); setLoginMode('magic'); }}
                      >
                        SIGN IN WITHOUT PASSWORD
                      </button>
                      <p className="text-center text-[11px] text-gray-500">
                        <button type="button" className="text-blue-600 hover:underline" onClick={openSignupPopup}>
                          Create Your Account
                        </button>
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <p className="text-xs text-gray-500">
                        Enter your email to receive instructions on how to create a new password.
                      </p>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Your Email"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                        disabled={loginLoading}
                      />
                      {loginError && <p className="text-red-600 text-xs">{loginError}</p>}
                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition bg-red-600 hover:bg-red-700"
                      >
                        {loginLoading ? 'Sending…' : 'CONTINUE'}
                      </button>
                      <button
                        type="button"
                        className="block w-full text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                        onClick={() => { setLoginError(''); setLoginMode('password'); }}
                      >
                        SIGN IN
                      </button>
                    </form>
                  )}
                </div>
                )}
              </div>

              {/* Language dropdown with FlagCDN images */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangMenu((v) => !v)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-black/40 hover:bg-black/60 text-white text-sm font-medium border border-white/30"
                >
                  <span className="flex items-center justify-center">
                    <img
                      src={flagUrlFor(language || 'en')}
                      alt={languages.find((l) => l.value === language)?.label || 'English'}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  </span>
                  <span className="hidden sm:inline">
                    {languages.find((l) => l.value === language)?.label || 'English'}
                  </span>
                  <span className="text-xs">▾</span>
                </button>

                {showLangMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowLangMenu(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 z-40 w-44 rounded-xl bg-black/85 text-white shadow-xl py-2 border border-white/10">
                      {languages.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={async () => {
                            await changeLanguage(opt.value);
                            setShowLangMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10 ${
                            opt.value === language ? 'bg-white/15 font-semibold' : ''
                          }`}
                        >
                          <img
                            src={flagUrlFor(opt.value)}
                            alt={opt.label}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        </header>

        {/* Desktop: floating white card on left — overlay with shadow */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-[420px] lg:max-w-[460px] bg-white rounded-2xl shadow-xl p-8 lg:p-10">
          <div className="flex justify-center mb-6">
            <Logo className="h-8 w-auto text-gray-900" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 text-center">
            {t('landing.globalDating')}
          </h1>
          <p className="text-gray-500 text-base lg:text-lg leading-relaxed mb-8 text-center">
            {t('landing.globalDatingSub')}
          </p>
          <div className="space-y-3">
            <Link
              to="/signup-email"
              className="block w-full text-center py-4 rounded-xl text-white text-lg font-semibold transition hover:opacity-95"
              style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
            >
              {t('landing.takeAChance')}
            </Link>
            <a
              href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
              className="flex items-center justify-center gap-3 w-full bg-white border border-gray-200 text-gray-800 text-base font-medium py-3.5 px-6 rounded-xl hover:bg-gray-50 transition no-underline"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('landing.signInWithGoogle')}
            </a>
            {iosApp && (
              <button
                type="button"
                onClick={handleAppleHeroSignIn}
                disabled={loginLoading}
                className="flex items-center justify-center gap-3 w-full bg-black text-white text-base font-medium py-3.5 px-6 rounded-xl hover:opacity-90 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.06 1.87-2.54 5.98.48 7.13-.57 1.48-1.31 2.96-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                {t('landing.signInWithApple')}
              </button>
            )}
            {heroSocialError && (
              <p className="text-red-600 text-xs text-center">{heroSocialError}</p>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mt-8">
            By clicking &quot;Take a chance!&quot; you agree with the{' '}
            <Link to="/terms" className="underline hover:text-gray-600">Terms &amp; Conditions</Link>,{' '}
            <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>,{' '}
            <Link to="/refund" className="underline hover:text-gray-600">{t('landing.refundPolicyLink')}</Link> and{' '}
            <Link to="/terms#content" className="underline hover:text-gray-600">Content Policy</Link>.
            You can terminate your account or opt out of any or part of the services.
          </p>
            </div>
          </div>
        </div>

        {/* Image disclaimer — bottom right */}
        <p className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] text-[10px] text-white/80 max-w-[200px] text-right">
          For display purposes only. The individual in the image is not a user of this service.
        </p>
      </div>

      {/* Mobile: full-screen overlay layout */}
      <div
        className="md:hidden relative min-h-app-screen flex flex-col bg-cover bg-center bg-no-repeat flex-1"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.4), rgba(0,0,0,.25)), url('/hero%20img.png')",
        }}
      >
      {/* Mobile Header: iOS app = Log in right only; else logo + hamburger */}
      <header
        className={
          iosApp
            ? 'absolute top-0 left-0 right-0 z-20 flex items-center justify-end px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4'
            : 'absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4'
        }
      >
        {iosApp ? (
          <button type="button" onClick={openLoginPopup} className={loginBtnClass} style={loginBtnStyle}>
            {t('home.login')}
          </button>
        ) : (
          <>
            <Link to="/" className="inline-flex items-center">
              <Logo className="h-7 w-auto object-contain text-white" />
            </Link>
            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition"
              aria-label="Open menu"
            >
              <FaBars className="w-6 h-6" />
            </button>
          </>
        )}
      </header>

      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMobileMenu(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[#0b1120] shadow-xl flex flex-col px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex justify-between items-center mb-10">
              <Logo className="h-8 text-white" />
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-white hover:bg-white/10 rounded"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-w-xs">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl text-white font-semibold text-center"
                style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                onClick={() => {
                  setShowMobileMenu(false);
                  openLoginPopup();
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl text-white font-semibold text-center bg-[#1f2937]"
                onClick={(e) => {
                  // Some mobile WebViews can drop Link navigation when a state update closes the menu.
                  // Navigate on the next tick after closing the menu.
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMobileMenu(false);
                  setTimeout(() => navigate('/online-dating-advice'), 0);
                }}
              >
                Online Dating Advice
              </button>
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl text-white font-semibold text-center bg-[#1f2937]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMobileMenu(false);
                  setTimeout(() => navigate('/online-dating-singles'), 0);
                }}
              >
                Singles Online
              </button>
              <Link
                to="/about"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full py-3 px-4 rounded-xl text-white font-semibold text-center bg-[#1f2937]"
              >
                About
              </Link>
            </div>
            <div className="mt-auto pt-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition"
                >
                  <FaInstagram className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition"
                >
                  <FaFacebookF className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition"
                >
                  <FaTwitter className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMobileLangMenu((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-medium"
                >
                  <img
                    src={flagUrlFor(language || 'en')}
                    alt="Language"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="uppercase">{language || 'en'}</span>
                  <span className="text-[10px]">▾</span>
                </button>
                {showMobileLangMenu && (
                  <div className="absolute bottom-10 right-0 w-40 rounded-xl bg-black/90 text-white shadow-xl py-2 border border-white/10 z-10">
                    {languages.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={async () => {
                          await changeLanguage(opt.value);
                          setShowMobileLangMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-white/10 ${
                          opt.value === language ? 'bg-white/15 font-semibold' : ''
                        }`}
                      >
                        <img
                          src={flagUrlFor(opt.value)}
                          alt={opt.label}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile login popup (full-screen); on iOS native shell include md+ so iPad layout still has login UI */}
      {showLoginPopup && (
        <div className={`fixed inset-0 z-[60] touch-manipulation ${iosApp ? '' : 'md:hidden'}`}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowLoginPopup(false)} aria-hidden="true" />
          <div
            ref={mobileLoginPopupRef}
            className="absolute left-4 right-4 top-[calc(6rem+env(safe-area-inset-top,0px))] z-10 max-h-[min(70vh,calc(100dvh-8rem))] overflow-y-auto overscroll-contain ios-login-sheet-scroll touch-manipulation bg-white rounded-2xl shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">{t('landing.logIn')}</p>
              <button type="button" onClick={() => setShowLoginPopup(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            {loginMode === 'magic' ? (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Enter your email to receive a login link.
                </p>
                <form onSubmit={handleSendLoginLink} className="space-y-3">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Your Email"
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                    disabled={loginLoading}
                  />
                  {loginError && <p className="text-red-600 text-xs">{loginError}</p>}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition"
                    style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                  >
                    {loginLoading ? 'Sending…' : 'CONTINUE'}
                  </button>
                  <button
                    type="button"
                    className="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                    onClick={() => { setLoginError(''); setLoginMode('password'); }}
                  >
                    SIGN IN WITH PASSWORD
                  </button>
                  <p className="text-center text-xs text-blue-600">
                    <button type="button" onClick={openSignupPopup} className="hover:underline">
                      Create Your Account
                    </button>
                  </p>
                </form>
              </>
            ) : loginMode === 'magicSent' ? (
              <div className="space-y-3 text-center">
                <p className="text-xs text-gray-600">
                  Log in quickly using any link from the email we&apos;ve sent to{' '}
                  <span className="font-semibold break-all">{magicSentEmail}</span>.
                </p>
                <button
                  type="button"
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition bg-red-600 hover:bg-red-700"
                  onClick={() => openEmailInbox(magicSentEmail)}
                >
                  {getCheckInboxButtonLabel(magicSentEmail)}
                </button>
                <p className="text-xs text-amber-900 text-left bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
                  {t('auth.loginLinkSpamHint')}
                </p>
                <button
                  type="button"
                  className="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                  onClick={() => { setLoginError(''); setMagicSentEmail(''); setLoginMode('password'); }}
                >
                  SIGN IN
                </button>
                <p className="text-[11px] text-gray-500 mt-1 text-left">
                  <span className="mr-1">💡</span>
                  For all future logins, click any link inside any of our emails.
                </p>
              </div>
            ) : loginMode === 'signup' ? (
              <form onSubmit={handleCreateAccount} className="space-y-3">
                <p className="text-xs text-gray-500 mb-1">
                  Enter your email to receive a login link.
                </p>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder={t('landing.nameOrNicknamePlaceholder')}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                  disabled={loginLoading}
                />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Your Email"
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                  disabled={loginLoading}
                />
                {loginError && <p className="text-red-600 text-xs">{loginError}</p>}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                >
                  {loginLoading ? t('landing.creating') : t('landing.createAccount')}
                </button>
                <button
                  type="button"
                  className="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                  onClick={() => { setLoginError(''); setLoginMode('magic'); }}
                >
                  SIGN IN
                </button>
                <label className="flex items-start gap-2 text-[11px] text-gray-600 pt-1">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    By clicking “Create Account” you agree with the{' '}
                    <Link to="/terms" className="underline" onClick={() => setShowLoginPopup(false)}>Terms</Link>,{' '}
                    <Link to="/privacy" className="underline" onClick={() => setShowLoginPopup(false)}>Privacy Policy</Link> and{' '}
                    <Link to="/refund" className="underline" onClick={() => setShowLoginPopup(false)}>{t('landing.refundPolicyLink')}</Link>.
                  </span>
                </label>
              </form>
            ) : loginMode === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Your Email"
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                  disabled={loginLoading}
                />
                <PasswordInput
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  inputClassName="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                  disabled={loginLoading}
                  autoComplete="current-password"
                />
                {!isIosNativeShell() && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => { setLoginError(''); setLoginMode('forgot'); }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
                {loginError && <p className="text-red-600 text-xs">{loginError}</p>}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
                >
                  {loginLoading ? 'Logging in…' : 'CONTINUE'}
                </button>
                <button
                  type="button"
                  className="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                  onClick={() => { setLoginError(''); setLoginPassword(''); setLoginMode('magic'); }}
                >
                  SIGN IN WITHOUT PASSWORD
                </button>
                <p className="text-center text-xs text-blue-600">
                  <button type="button" onClick={openSignupPopup} className="hover:underline">
                    Create Your Account
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-gray-500 mb-1">
                  Enter your email to receive instructions on how to create a new password.
                </p>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Your Email"
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vantage-purple focus:border-transparent outline-none text-base"
                  disabled={loginLoading}
                />
                {loginError && <p className="text-red-600 text-xs">{loginError}</p>}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition bg-red-600 hover:bg-red-700"
                >
                  {loginLoading ? 'Sending…' : 'CONTINUE'}
                </button>
                <button
                  type="button"
                  className="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                  onClick={() => { setLoginError(''); setLoginMode('password'); }}
                >
                  SIGN IN
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main content: centered logo, headline, subheadline, CTAs — over the image (mobile-first) */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] sm:pt-24 sm:pb-[calc(6rem+env(safe-area-inset-bottom,0px))] text-center">
        <div className="flex justify-center w-full mb-4 sm:mb-5">
          <Logo className="h-10 sm:h-12 w-auto object-contain drop-shadow-md" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 drop-shadow-md">
          {t('landing.globalDating')}
        </h1>
        <p className="text-white/95 text-base sm:text-lg md:text-xl max-w-md mb-8 sm:mb-10 drop-shadow-sm">
          {t('landing.globalDatingSub')}
        </p>

        <div className="w-full max-w-[320px] sm:max-w-[340px] space-y-3">
          <Link
            to="/signup-email"
            className="block w-full text-center py-4 rounded-xl text-white text-lg font-semibold transition hover:opacity-95 active:opacity-90 shadow-lg"
            style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
          >
            Give it a try!
          </Link>
          <a
            href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full bg-white border border-gray-200 text-gray-800 text-base font-medium py-3.5 px-6 rounded-xl hover:bg-gray-50 transition no-underline shadow"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </a>
          {iosApp && (
            <button
              type="button"
              onClick={handleAppleHeroSignIn}
              disabled={loginLoading}
              className="flex items-center justify-center gap-3 w-full bg-black text-white text-base font-medium py-3.5 px-6 rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.06 1.87-2.54 5.98.48 7.13-.57 1.48-1.31 2.96-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              {t('landing.signInWithApple')}
            </button>
          )}
          {heroSocialError && (
            <p className="text-red-200 text-xs text-center drop-shadow">{heroSocialError}</p>
          )}
        </div>
      </div>

      {/* Legal fine print at bottom — over the image */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pt-5 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-xs sm:text-sm text-white/85 text-center leading-relaxed max-w-xl mx-auto">
          By clicking &quot;Take a chance!&quot; you agree with the{' '}
          <Link to="/terms" className="underline hover:text-white">Terms &amp; Conditions</Link>,{' '}
          <Link to="/privacy" className="underline hover:text-white">Privacy Policy</Link>,{' '}
          <Link to="/refund" className="underline hover:text-white">{t('landing.refundPolicyLink')}</Link> and{' '}
          <Link to="/terms#content" className="underline hover:text-white">Content Policy</Link>.
          You can terminate your account or opt out of any or part of the services.
        </p>
      </div>
      </div>
    </section>
  );
}
