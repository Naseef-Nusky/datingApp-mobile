import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCheckInboxButtonLabel, openEmailInbox } from '../utils/emailInbox';
import { trackGoogleAdsConversion } from '../utils/analytics';

const RegistrationSuccessModal = ({ user, email, onClose, onResendEmail }) => {
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const conversionTracked = useRef(false);

  useEffect(() => {
    if (conversionTracked.current) return;
    conversionTracked.current = true;
    trackGoogleAdsConversion();
  }, []);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await onResendEmail();
      // Show success message
      alert('Verification email sent again!');
    } catch (error) {
      alert('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckEmail = () => {
    openEmailInbox(email);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        {/* Header with confetti icons */}
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl">🎉</span>
          <h2 className="text-3xl font-bold text-gray-800 mx-4 text-center">
            {user?.firstName || 'User'}, thanks for registering!
          </h2>
          <span className="text-4xl">🎊</span>
        </div>

        {/* Instruction text */}
        <p className="text-gray-700 text-center mb-2">
          Confirm your profile and start dating - please click the link sent to
        </p>

        {/* Email address */}
        <div className="text-center mb-4">
          <p className="text-xl font-bold text-gray-900">{email}</p>
          <button
            onClick={() => {
              // You can implement change email functionality
              alert('Change email functionality coming soon');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm mt-2"
          >
            Change Email
          </button>
        </div>

        {/* Profile pictures placeholder */}
        <div className="flex justify-center space-x-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center border-2 border-white shadow-md"
            >
              <span className="text-2xl">👤</span>
            </div>
          ))}
        </div>

        {/* Check email button - opens the correct inbox (Gmail, Yahoo, Outlook, etc.) */}
        <button
          onClick={handleCheckEmail}
          className="w-full bg-red-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-red-600 transition mb-4"
        >
          {getCheckInboxButtonLabel(email)}
        </button>

        {/* Troubleshooting text */}
        <p className="text-sm text-gray-600 text-center">
          Didn&apos;t get the email? Check Junk or Spam (especially Outlook and iCloud), mark as Not junk, then{' '}
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isResending ? 'Sending...' : 'Send Again'}
          </button>
        </p>

        {/* Skip for now option */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              onClose();
              navigate('/dashboard');
            }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessModal;






