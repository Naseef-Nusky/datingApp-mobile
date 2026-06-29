import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RegistrationWizard from '../components/RegistrationWizard';

/**
 * Shown after magic-link login when the user was created by send-login-link (registration not complete).
 * User completes the "about you" registration steps, then we mark registration complete and redirect to dashboard.
 */
export default function CompleteProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('/api/profiles/me')
      .then((res) => {
        setProfile(res.data || null);
      })
      .catch((err) => {
        // Legacy API or network — still allow wizard if profile missing (404).
        if (err.response?.status === 404) {
          setProfile(null);
          return;
        }
        setError(err.response?.data?.message || 'Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-xl font-semibold text-white"
            style={{
              background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
            }}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <RegistrationWizard
      completeProfileOnly
      initialProfile={profile}
      onComplete={handleComplete}
    />
  );
}
