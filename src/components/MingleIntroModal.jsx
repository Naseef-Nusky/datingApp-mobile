import { FaTimes } from 'react-icons/fa';

const MingleIntroModal = ({ isOpen, onClose, onGetStarted }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2 z-10"
          >
            <FaTimes />
          </button>
          
          {/* Profile Pictures Cluster - Using lets_mingle.png */}
          <div className="relative w-full flex items-center justify-center mb-6" style={{ height: '300px' }}>
            <img
              src="/lets_mingle.png"
              alt="Let's Mingle"
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Failed to load lets_mingle.png');
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            Get Matches Instantly!
          </h2>
          
          <p className="text-gray-700 text-center mb-3">
            Start receiving instant messages from like-minded members.
          </p>
          
          <p className="text-gray-600 text-sm text-center mb-6">
            Your introductory message will be sent to hundreds of online members and they will start responding to you.
          </p>

          {/* Action Button */}
          <button
            onClick={onGetStarted}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            GET STARTED
          </button>
        </div>
      </div>
    </div>
  );
};

export default MingleIntroModal;
