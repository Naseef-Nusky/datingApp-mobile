import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { FaPaperPlane, FaSpinner, FaTimes, FaUser, FaSearch } from 'react-icons/fa';

const ComposeEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, fetchUser } = useAuth();
  const { handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const [receiverId, setReceiverId] = useState(searchParams.get('to') || '');
  const [receiverProfile, setReceiverProfile] = useState(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

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
      await axios.post('/api/messages/send-email', {
        receiverId,
        subject: subject || undefined,
        content,
        frontendUrl: window.location.origin,
      });
      if (fetchUser) fetchUser();
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Compose Email</h1>
                <p className="text-purple-100 mt-1">Send a message via email</p>
              </div>
              <button
                onClick={() => navigate('/inbox')}
                className="text-white hover:text-purple-200 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* To Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <div className="relative">
                {receiverProfile ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {receiverProfile.profileImage ? (
                      <img
                        src={receiverProfile.profileImage}
                        alt={receiverProfile.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {receiverProfile.firstName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
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
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center">
                      <FaSearch className="absolute left-3 text-gray-400" />
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    {showSearch && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((profile) => (
                          <div
                            key={profile.userId}
                            onClick={() => handleSelectReceiver(profile)}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            {profile.profileImage ? (
                              <img
                                src={profile.profileImage}
                                alt={profile.firstName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                                <span className="text-purple-600 font-semibold">
                                  {profile.firstName?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {profile.firstName} {profile.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{profile.age} years old</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subject Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject (Optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Content Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message here..."
                rows={12}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/inbox')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !receiverId || !content.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>
  );
};

export default ComposeEmail;
