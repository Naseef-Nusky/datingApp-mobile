import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * Modal shown after 15 minutes of inactivity. Shows user's profile picture,
 * message "You're inactive for 15 minutes", and a "CONTINUE USING" button.
 */
const InactivityModal = ({ onContinue }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        setProfile(res.data.profile || null);
      } catch {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const photoUrl = profile?.photos?.[0]?.url;
  const displayName = profile?.firstName || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
        {/* Profile picture */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-2 border-gray-200 overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl font-semibold">{initial}</span>
            )}
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-800 text-lg font-medium mb-1">
          It's been 15 minutes since your last activity
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Click the button below to continue
        </p>

        {/* Continue button */}
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-4 rounded-lg font-semibold text-white text-base uppercase tracking-wide hover:opacity-90 transition bg-red-500 hover:bg-red-600"
        >
          Continue using
        </button>
      </div>
    </div>
  );
};

export default InactivityModal;
