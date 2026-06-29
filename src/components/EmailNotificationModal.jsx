import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEnvelope, FaCamera, FaReply } from 'react-icons/fa';
import axios from 'axios';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[calc(90*var(--vh))] overflow-y-auto">
        {/* Header with background image */}
        <div className="relative h-48 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative h-full flex flex-col items-center justify-center p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors bg-black bg-opacity-30 rounded-full p-2"
            >
              <FaTimes className="text-xl" />
            </button>
            
            {/* Profile Picture */}
            <div className="mb-4">
              {senderImage ? (
                <img
                  src={senderImage}
                  alt={senderName}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                  <span className="text-4xl font-bold text-purple-600">
                    {senderName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Email from text */}
            <h2 className="text-white text-xl font-semibold drop-shadow-lg">
              Email from {senderName}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Greeting */}
          <p className="text-lg text-gray-800 mb-4">
            {emailData.content?.split('\n')[0] || 'Hi, I wanted to reach out to you...'}
          </p>

          {/* Media placeholder if exists */}
          {emailData.mediaUrl && (
            <div className="mb-4 relative">
              <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                {emailData.mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={emailData.mediaUrl}
                    alt="Email attachment"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <FaCamera className="text-4xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Media attachment</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message content */}
          <div className="prose max-w-none mb-6">
            <div
              className="text-gray-700 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: emailData.content?.replace(/\n/g, '<br>') || '' 
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleReply}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FaEnvelope />
              REPLY
            </button>
            <button
              onClick={handleViewInInbox}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              View in Inbox
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500 text-center">
            <p>This email was sent from Vantage Dating</p>
            <p className="mt-1">
              {senderName}{senderAge ? `, ${senderAge}` : ''} • {new Date(emailData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailNotificationModal;
