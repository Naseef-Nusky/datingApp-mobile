import { useState, useEffect } from 'react';
import { FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsModal({ isOpen, onClose, onOpen }) {
  const { user, logout, fetchUser } = useAuth();
  const { language: i18nLanguage, languages, t } = useLanguage();
  const navigate = useNavigate();
  const [soundMyContacts, setSoundMyContacts] = useState(true);
  const [soundChatRequests, setSoundChatRequests] = useState(true);
  const [repeatUntilRead, setRepeatUntilRead] = useState(false);
  const [language, setLanguage] = useState(i18nLanguage || 'en');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showConciergeSettings, setShowConciergeSettings] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showManageAccountModal, setShowManageAccountModal] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+44');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [conciergeChatSetting, setConciergeChatSetting] = useState('all');
  const [manageAccountOption, setManageAccountOption] = useState('logout');
  const [emailNotifChat, setEmailNotifChat] = useState(true);
  const [emailNotifFromContactsChat, setEmailNotifFromContactsChat] = useState(true);
  const [emailNotifEmail, setEmailNotifEmail] = useState(true);
  const [emailNotifFromContactsEmail, setEmailNotifFromContactsEmail] = useState(true);
  const [emailNotifBonus, setEmailNotifBonus] = useState(true);
  const [emailNotifDigest, setEmailNotifDigest] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await axios.get('/api/settings');
        if (data) {
          if (data.email) setEmail(data.email);
          if (data.language) setLanguage(data.language);

          if (data.sound) {
            setSoundMyContacts(data.sound.myContacts !== false);
            setSoundChatRequests(data.sound.chatRequests !== false);
            setRepeatUntilRead(!!data.sound.repeatUntilRead);
          }

          if (data.phone && typeof data.phone === 'object') {
            setPhoneCountryCode(data.phone.countryCode || '+44');
            setPhoneNumber(data.phone.number || '');
          }

          if (data.concierge) {
            setConciergeChatSetting(data.concierge.mode || 'all');
          }

          if (data.emailNotifications) {
            setEmailNotifChat(data.emailNotifications.newMessageInChat !== false);
            setEmailNotifFromContactsChat(
              data.emailNotifications.newMessageFromContactInChat !== false
            );
            setEmailNotifEmail(data.emailNotifications.newEmailFromUser !== false);
            setEmailNotifFromContactsEmail(
              data.emailNotifications.newEmailFromContact !== false
            );
            setEmailNotifBonus(data.emailNotifications.bonusCredits !== false);
            setEmailNotifDigest(data.emailNotifications.activityDigest !== false);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        if (user?.email) {
          setEmail(user.email);
        }
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen && i18nLanguage) setLanguage(i18nLanguage);
  }, [isOpen, i18nLanguage]);

  useEffect(() => {
    if (isOpen && typeof onOpen === 'function') onOpen();
  }, [isOpen, onOpen]);

  if (!isOpen) return null;

  const saveAllSettings = async (extra = {}) => {
    try {
      const payload = {
        email,
        language,
        sound: {
          myContacts: soundMyContacts,
          chatRequests: soundChatRequests,
          repeatUntilRead,
        },
        phone: {
          countryCode: phoneCountryCode,
          number: phoneNumber,
        },
        concierge: {
          mode: conciergeChatSetting,
        },
        emailNotifications: {
          newMessageInChat: emailNotifChat,
          newMessageFromContactInChat: emailNotifFromContactsChat,
          newEmailFromUser: emailNotifEmail,
          newEmailFromContact: emailNotifFromContactsEmail,
          bonusCredits: emailNotifBonus,
          activityDigest: emailNotifDigest,
        },
        ...extra,
      };

      await axios.put('/api/settings', payload);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await saveAllSettings();
    // Apply saved language site-wide so the whole site uses the new language
    try {
      localStorage.setItem('app_language', language);
      localStorage.setItem('selectedLanguage', language);
    } catch (e) {}
    onClose?.();
    window.location.reload();
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    try {
      setPasswordSaving(true);
      await saveAllSettings({ newPassword });
      setNewPassword('');
      setPasswordSuccess('Password updated successfully.');
    } catch (error) {
      console.error('Change password error:', error);
      const message = error.response?.data?.message || 'Could not change password. Please try again.';
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 sm:px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gradient-to-b from-white via-white to-sky-50 rounded-2xl shadow-2xl overflow-hidden max-h-[calc(90*var(--vh))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-5 pb-3 border-b border-slate-200 bg-white/70 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">
              Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 transition"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSave}
          className="px-6 sm:px-8 py-4 space-y-6 overflow-y-auto max-h-[calc(72*var(--vh))]"
        >
          {/* Sound */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              Sound
            </h3>
            <div className="space-y-1 text-sm text-slate-700">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                  checked={soundMyContacts}
                  onChange={(e) => setSoundMyContacts(e.target.checked)}
                />
                <span>My Contacts</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                  checked={soundChatRequests}
                  onChange={(e) => setSoundChatRequests(e.target.checked)}
                />
                <span>Chat Requests</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                  checked={repeatUntilRead}
                  onChange={(e) => setRepeatUntilRead(e.target.checked)}
                />
                <span>Repeat until Read</span>
              </label>
            </div>
          </section>

          {/* Language */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              {t('settings.language')}
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              {t('settings.languageOptionNote')}
            </p>
            <div className="relative inline-block w-full max-w-xs">
              <select
                className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-nex-pink focus:border-nex-pink"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Email */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              {t('settings.yourEmail')}
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              {t('settings.yourEmailNote')}
            </p>
            <input
              type="email"
              className="w-full max-w-md rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-nex-pink focus:border-nex-pink"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </section>

          {/* Calls and text messages */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Calls and text messages
            </h3>
            <p className="text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setShowPhoneModal(true)}
                className="text-nex-pink font-semibold underline-offset-2 hover:underline"
              >
                Add Phone Number
              </button>{' '}
              to complete and improve security.
            </p>
          </section>

          {/* Email notification settings */}
          <section className="space-y-1 text-sm text-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Email notification settings
            </h3>
            <p>
              You can choose the type of notifications you receive{' '}
              <button
                type="button"
                onClick={() => setShowEmailSettings(true)}
                className="text-nex-pink font-semibold underline-offset-2 hover:underline"
              >
                here
              </button>
              .
            </p>
          </section>

          {/* Concierge chat settings */}
          <section className="space-y-1 text-sm text-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Concierge chat settings
            </h3>
            <p>
              You can change your concierge preferences{' '}
              <button
                type="button"
                onClick={() => setShowConciergeSettings(true)}
                className="text-nex-pink font-semibold underline-offset-2 hover:underline"
              >
                here
              </button>
              .
            </p>
          </section>

          {/* Change password */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Change your password
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Remember to change your password to something you won&apos;t forget and other
              people won&apos;t be able to guess.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-md">
              <input
                type="password"
                className="flex-1 rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-nex-pink focus:border-nex-pink"
                placeholder={t('settingsModal.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordSaving || !newPassword}
                className={`px-4 py-2 rounded-md text-xs font-semibold ${
                  passwordSaving || !newPassword
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-nex-pink text-white hover:bg-pink-600 cursor-pointer'
                }`}
              >
                {passwordSaving ? 'CHANGING...' : 'CHANGE'}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-red-500 mt-1">{passwordError}</p>
            )}
            {!passwordError && passwordSuccess && (
              <p className="text-xs text-emerald-600 mt-1">{passwordSuccess}</p>
            )}
          </section>

          {/* Manage account */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Manage account
            </h3>
            <p className="text-xs text-slate-600">
              Need a break? You can hide your account or cancel membership{' '}
              <button
                type="button"
                onClick={() => setShowManageAccountModal(true)}
                className="text-nex-pink font-semibold underline-offset-2 hover:underline"
              >
                here
              </button>
              .
            </p>
          </section>
        </form>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-white/80 backdrop-blur flex justify-center">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            SAVE
          </button>
        </div>

        {/* Email notification settings popup */}
        {showEmailSettings && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-2 sm:px-4"
            onClick={() => setShowEmailSettings(false)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 sm:px-8 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">
                  Email notification settings
                </h2>
                <button
                  type="button"
                  onClick={() => setShowEmailSettings(false)}
                  className="text-slate-500 hover:text-slate-700 transition"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="px-6 sm:px-8 py-5 space-y-3 text-sm text-slate-700">
                <p className="text-sm text-slate-600 mb-2">
                  Choose notifications you would like to receive:
                </p>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                    checked={emailNotifChat}
                    onChange={(e) => setEmailNotifChat(e.target.checked)}
                  />
                  <span>New message in chat</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                    checked={emailNotifFromContactsChat}
                    onChange={(e) => setEmailNotifFromContactsChat(e.target.checked)}
                  />
                  <span>New message from user in your contact list</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                    checked={emailNotifEmail}
                    onChange={(e) => setEmailNotifEmail(e.target.checked)}
                  />
                  <span>New email from user</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                    checked={emailNotifFromContactsEmail}
                    onChange={(e) => setEmailNotifFromContactsEmail(e.target.checked)}
                  />
                  <span>New email from user in your contact list</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                    checked={emailNotifBonus}
                    onChange={(e) => setEmailNotifBonus(e.target.checked)}
                  />
                  <span>Bonus Credits notification</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-nex-pink focus:ring-nex-pink"
                    checked={emailNotifDigest}
                    onChange={(e) => setEmailNotifDigest(e.target.checked)}
                  />
                  <span>Activity Digest</span>
                </label>
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-white flex justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    await saveAllSettings();
                    setShowEmailSettings(false);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enter phone number popup */}
        {showPhoneModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-2 sm:px-4"
            onClick={() => setShowPhoneModal(false)}
          >
            <div
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 sm:px-8 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(false)}
                    className="text-slate-500 hover:text-slate-700 transition"
                  >
                    <FaArrowLeft />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">
                    Enter Your Phone Number
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="text-slate-500 hover:text-slate-700 transition"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="px-6 sm:px-8 py-6 space-y-5 text-sm text-slate-700">
                <p className="text-center text-slate-600">
                  We&apos;ll send you a confirmation code
                </p>
                <div className="flex justify-center">
                  <div className="flex w-full max-w-md items-center rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 shadow-inner">
                    {/* Very simple country selector stub */}
                    <select
                      className="mr-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-nex-pink focus:border-nex-pink"
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                    >
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+33">🇫🇷 +33</option>
                    </select>
                    <input
                      type="tel"
                      className="flex-1 bg-transparent outline-none text-sm text-slate-800"
                      placeholder="0794 7744101"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 pb-6 flex justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    await saveAllSettings();
                    setShowPhoneModal(false);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-10 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  SEND CODE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage account popup */}
        {showManageAccountModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-2 sm:px-4"
            onClick={() => setShowManageAccountModal(false)}
          >
            <div
              className="relative w-full max-w-3xl bg-gradient-to-b from-white via-white to-sky-50 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                  Manage account
                </h2>
                <button
                  type="button"
                  onClick={() => setShowManageAccountModal(false)}
                  className="text-slate-500 hover:text-slate-700 transition"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="px-6 sm:px-8 py-6 space-y-5 text-sm text-slate-800">
                <p className="text-sm sm:text-base text-slate-700 max-w-3xl">
                  By deleting your profile or cancelling subscription you will lose bonus Credits we
                  give you to help you find happiness. You&apos;ll also lose the chance to meet
                  thousands of new people who join us on a daily basis. You can:
                </p>

                <div className="space-y-3">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="manage-account"
                      className="mt-1 text-nex-pink focus:ring-nex-pink"
                      checked={manageAccountOption === 'logout'}
                      onChange={() => setManageAccountOption('logout')}
                    />
                    <span>Log out</span>
                  </label>

                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="manage-account"
                      className="mt-1 text-nex-pink focus:ring-nex-pink"
                      checked={manageAccountOption === 'hide-profile'}
                      onChange={() => setManageAccountOption('hide-profile')}
                    />
                    <span>
                      <span className="block">{t('settingsModal.hideProfile')}</span>
                      <span className="block text-xs text-slate-500">
                        Other members will no longer see you in the Search list.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="manage-account"
                      className="mt-1 text-nex-pink focus:ring-nex-pink"
                      checked={manageAccountOption === 'turn-off-email'}
                      onChange={() => setManageAccountOption('turn-off-email')}
                    />
                    <span>Turn off email notifications</span>
                  </label>

                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="manage-account"
                      className="mt-1 text-nex-pink focus:ring-nex-pink"
                      checked={manageAccountOption === 'delete-profile'}
                      onChange={() => setManageAccountOption('delete-profile')}
                    />
                    <span>Delete profile</span>
                  </label>

                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="manage-account"
                      className="mt-1 text-nex-pink focus:ring-nex-pink"
                      checked={manageAccountOption === 'cancel-subscription'}
                      onChange={() => setManageAccountOption('cancel-subscription')}
                    />
                    <span>Cancel Subscription</span>
                  </label>
                </div>
              </div>

              <div className="px-6 sm:px-8 pb-6 flex justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (manageAccountOption === 'cancel-subscription') {
                      const apiUrl = import.meta.env.VITE_API_URL || '';
                      try {
                        await axios.post(`${apiUrl}/api/credits/cancel-subscription`);
                        if (typeof fetchUser === 'function') fetchUser();
                      } catch (err) {
                        console.error('Cancel subscription error:', err);
                        const msg = err.response?.data?.message || 'Failed to cancel subscription. Please try again.';
                        alert(msg);
                        return;
                      }
                    }
                    await saveAllSettings({
                      manageAccountOption,
                    });

                    if (manageAccountOption === 'logout' || manageAccountOption === 'delete-profile') {
                      logout();
                      setShowManageAccountModal(false);
                      onClose?.();
                      navigate('/');
                      return;
                    }

                    setShowManageAccountModal(false);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-10 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  CONTINUE USING
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Concierge chat settings popup */}
        {showConciergeSettings && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-2 sm:px-4"
            onClick={() => setShowConciergeSettings(false)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 sm:px-8 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">
                  Concierge Chat Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setShowConciergeSettings(false)}
                  className="text-slate-500 hover:text-slate-700 transition"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="px-6 sm:px-8 py-5 space-y-3 text-sm text-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="concierge-setting"
                    className="text-nex-pink focus:ring-nex-pink"
                    checked={conciergeChatSetting === 'all'}
                    onChange={() => setConciergeChatSetting('all')}
                  />
                  <span>Send me all messages</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="concierge-setting"
                    className="text-nex-pink focus:ring-nex-pink"
                    checked={conciergeChatSetting === 'week'}
                    onChange={() => setConciergeChatSetting('week')}
                  />
                  <span>Don&apos;t send me messages for a week</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="concierge-setting"
                    className="text-nex-pink focus:ring-nex-pink"
                    checked={conciergeChatSetting === 'two-weeks'}
                    onChange={() => setConciergeChatSetting('two-weeks')}
                  />
                  <span>Don&apos;t send me messages for two weeks</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="concierge-setting"
                    className="text-nex-pink focus:ring-nex-pink"
                    checked={conciergeChatSetting === 'month'}
                    onChange={() => setConciergeChatSetting('month')}
                  />
                  <span>Don&apos;t send me messages for a month</span>
                </label>
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-white flex justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    await saveAllSettings();
                    setShowConciergeSettings(false);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
