import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEnvelope, FaCamera } from 'react-icons/fa';
import axios from 'axios';
import {
  EMAIL_COMPOSER_MODAL_OVERLAY,
  EMAIL_DETAIL_MODAL_PANEL,
  EMAIL_DETAIL_HEADER,
  EMAIL_DETAIL_SCROLL,
  EMAIL_DETAIL_CONTENT,
  EMAIL_DETAIL_REPLY_FOOTER,
  EMAIL_COMPOSER_SEND_BTN,
  EMAIL_COMPOSER_AVATAR,
  EMAIL_COMPOSER_AVATAR_FALLBACK,
} from '../utils/emailComposerLayout';

const EmailNotificationModal = ({ email, onClose, onReply }) => {
  const navigate = useNavigate();
  const [emailData, setEmailData] = useState(email);

  useEffect(() => {
    if (email?.id && !emailData?.content) {
      fetchEmailDetails();
    }
  }, [email]);

  const fetchEmailDetails = async () => {
    try {
      const response = await axios.get(`/api/messages/emails/${email.id}`);
      setEmailData(response.data);
    } catch (error) {
      console.error('Error fetching email details:', error);
    }
  };

  if (!emailData) return null;

  const senderName = emailData.senderData?.profile?.firstName ||
                     emailData.senderData?.email?.split('@')[0] ||
                     'Someone';
  const senderImage = emailData.senderData?.profile?.profileImage;
  const senderAge = emailData.senderData?.profile?.age;

  const handleReply = () => {
    if (onReply) {
      onReply(emailData);
    } else {
      const receiverId = emailData.sender === emailData.receiver ?
                        emailData.sender :
                        emailData.sender;
      navigate(`/compose-email?to=${receiverId}&replyTo=${emailData.id}`);
    }
    onClose();
  };

  const handleViewInInbox = () => {
    navigate('/inbox');
    onClose();
  };

  return (
    <div className={EMAIL_COMPOSER_MODAL_OVERLAY} onClick={onClose} role="dialog" aria-modal="true">
      <div className={EMAIL_DETAIL_MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[max(0.75rem,env(safe-area-inset-top,0px))] right-3 z-20 text-white hover:text-gray-200 bg-black/30 rounded-full p-2"
          aria-label="Close"
        >
          <FaTimes className="text-lg" />
        </button>

        <div className={`${EMAIL_DETAIL_HEADER} bg-gradient-to-br from-orange-400 via-red-500 to-pink-500`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-3 py-2">
            {senderImage ? (
              <img src={senderImage} alt={senderName} className={`${EMAIL_COMPOSER_AVATAR} mb-2 border-white`} />
            ) : (
              <div className={`${EMAIL_COMPOSER_AVATAR_FALLBACK} mb-2 bg-white/90`}>
                <span className="text-purple-600 font-bold text-lg">
                  {senderName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h2 className="text-white text-sm sm:text-lg font-semibold drop-shadow-lg px-8 text-center">
              Email from {senderName}
            </h2>
          </div>
        </div>

        <div className={EMAIL_DETAIL_SCROLL}>
          <div className={EMAIL_DETAIL_CONTENT}>
            <p className="text-base text-gray-800 mb-4">
              {emailData.content?.split('\n')[0] || 'Hi, I wanted to reach out to you...'}
            </p>

            {emailData.mediaUrl && (
              <div className="mb-4">
                <div className="w-full h-48 sm:h-64 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                  {emailData.mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img src={emailData.mediaUrl} alt="Email attachment" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <FaCamera className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Media attachment</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-gray-700 whitespace-pre-wrap text-base mb-4">
              {emailData.content || ''}
            </div>

            <div className="text-sm text-gray-500 text-center pb-2">
              <p>This email was sent from Vantage Dating</p>
              <p className="mt-1">
                {senderName}{senderAge ? `, ${senderAge}` : ''} • {new Date(emailData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className={`${EMAIL_DETAIL_REPLY_FOOTER} flex flex-col sm:flex-row gap-3`}>
            <button type="button" onClick={handleReply} className={EMAIL_COMPOSER_SEND_BTN}>
              <FaEnvelope className="shrink-0" />
              REPLY
            </button>
            <button
              type="button"
              onClick={handleViewInInbox}
              className="w-full sm:flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              View in Inbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailNotificationModal;
