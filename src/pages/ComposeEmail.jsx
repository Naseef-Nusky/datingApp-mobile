import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useServiceAccess } from '../hooks/useServiceAccess';
import { useCreditsSync } from '../hooks/useCreditsSync';
import { FaPaperPlane, FaSpinner, FaTimes, FaSearch } from 'react-icons/fa';
import AutoResizeTextarea from '../components/AutoResizeTextarea';
import {
  EMAIL_COMPOSER_PAGE,
  EMAIL_COMPOSER_PAGE_INNER,
  EMAIL_COMPOSER_HEADER,
  EMAIL_COMPOSER_SCROLL,
  EMAIL_COMPOSER_FOOTER,
  EMAIL_COMPOSER_INPUT,
  EMAIL_COMPOSER_TEXTAREA,
} from '../utils/emailComposerLayout';

const ComposeEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { syncCreditsAfterAction } = useCreditsSync();
  const { handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const { ensureCanSendEmailAccess } = useServiceAccess();
  const [accessChecked, setAccessChecked] = useState(false);
  const [canSendEmail, setCanSendEmail] = useState(true);
  const [receiverId, setReceiverId] = useState(searchParams.get('to') || '');
  const [receiverProfile, setReceiverProfile] = useState(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allowed = await ensureCanSendEmailAccess();
      if (!cancelled) {
        setCanSendEmail(allowed);
        setAccessChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [ensureCanSendEmailAccess]);

  useEffect(() => {
    if (receiverId) {
      fetchReceiverProfile();
    }
  }, [receiverId]);

  const fetchReceiverProfile = async () => {
    try {
      const response = await axios.get(`/api/profiles/${receiverId}`);
      setReceiverProfile(response.data);
    } catch (error) {
      console.error('Error fetching receiver profile:', error);
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/api/profiles?search=${query}&limit=10`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching profiles:', error);
    }
  };

  const handleSelectReceiver = (profile) => {
    setReceiverId(profile.userId);
    setReceiverProfile(profile);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSendEmail) {
      await ensureCanSendEmailAccess();
      return;
    }

    if (!receiverId) {
      alert('Please select a recipient');
      return;
    }

    if (!content.trim()) {
      alert('Please enter email content');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/messages/send-email', {
        receiverId,
        subject: subject || undefined,
        content,
        frontendUrl: window.location.origin,
      });
      await syncCreditsAfterAction(response.data);
      alert('Email sent successfully!');
      navigate('/inbox');
    } catch (error) {
      console.error('Error sending email:', error);
      const data = error.response?.data;
      const msg = data?.message || 'Failed to send email';
      if (!handleInsufficientCreditsError(error)) {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={EMAIL_COMPOSER_PAGE}>
      <div className={`${EMAIL_COMPOSER_PAGE_INNER} bg-white sm:rounded-lg sm:shadow-lg sm:my-4 overflow-hidden flex flex-col`}>
        <div className={`${EMAIL_COMPOSER_HEADER} !items-stretch !text-left bg-gradient-to-r from-purple-600 to-indigo-600 border-none`}>
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Compose Email</h1>
              <p className="text-purple-100 mt-0.5 text-sm">Send a message via email</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/inbox')}
              className="text-white hover:text-purple-200 transition-colors p-2 shrink-0"
              aria-label="Close"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className={`${EMAIL_COMPOSER_SCROLL} space-y-4 sm:space-y-5`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="relative">
                {receiverProfile ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
                    {receiverProfile.profileImage ? (
                      <img
                        src={receiverProfile.profileImage}
                        alt={receiverProfile.firstName}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center shrink-0">
                        <span className="text-purple-600 font-semibold">
                          {receiverProfile.firstName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {receiverProfile.firstName} {receiverProfile.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{receiverProfile.age} years old</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiverId('');
                        setReceiverProfile(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
                      aria-label="Clear recipient"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center">
                      <FaSearch className="absolute left-3 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleSearch(e.target.value);
                          setShowSearch(true);
                        }}
                        onFocus={() => setShowSearch(true)}
                        placeholder="Search for a user..."
                        className={`${EMAIL_COMPOSER_INPUT} pl-10 focus:ring-purple-500`}
                      />
                    </div>
                    {showSearch && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto overscroll-contain">
                        {searchResults.map((profile) => (
                          <button
                            key={profile.userId}
                            type="button"
                            onClick={() => handleSelectReceiver(profile)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
                          >
                            {profile.profileImage ? (
                              <img
                                src={profile.profileImage}
                                alt={profile.firstName}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center shrink-0">
                                <span className="text-purple-600 font-semibold">
                                  {profile.firstName?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {profile.firstName} {profile.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{profile.age} years old</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject (Optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className={`${EMAIL_COMPOSER_INPUT} focus:ring-purple-500`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <AutoResizeTextarea
                minRows={4}
                maxRows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message here..."
                required
                className={`${EMAIL_COMPOSER_TEXTAREA} focus:ring-purple-500`}
              />
            </div>
          </div>

          <div className={`${EMAIL_COMPOSER_FOOTER} flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3`}>
            <button
              type="button"
              onClick={() => navigate('/inbox')}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !accessChecked || !canSendEmail || !receiverId || !content.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-semibold"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeEmail;
