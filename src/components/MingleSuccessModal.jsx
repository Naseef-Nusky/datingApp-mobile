import { FaTimes } from 'react-icons/fa';

const MingleSuccessModal = ({ isOpen, onClose, matchedProfiles, onMingleAgain }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2"
          >
            <FaTimes />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-800 text-center">Success!</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6">
            Here are those people who received your message. As soon as they answer you'll notice it in <strong>Chat Requests</strong>.
          </p>

          {/* Profile Pictures */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {matchedProfiles && matchedProfiles.length > 0 ? (
              matchedProfiles.slice(0, 6).map((profile, index) => (
                <div
                  key={profile.id || profile.userId || index}
                  className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg"
                >
                  {profile.photos && profile.photos.length > 0 ? (
                    <img
                      src={profile.photos[0]?.url || profile.photos[0]}
                      alt={profile.firstName || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center"><span class="text-2xl">👤</span></div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">
                No profiles matched your criteria
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={onMingleAgain}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            LET'S MINGLE AGAIN
          </button>
        </div>
      </div>
    </div>
  );
};

export default MingleSuccessModal;
