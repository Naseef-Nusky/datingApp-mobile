import { FaTimes, FaUnlock, FaLock } from 'react-icons/fa';

const PhotoViewModal = ({ isOpen, onClose, photo, photoIndex, onTogglePrivacy, onSetAsThumbnail, onDelete, isThumbnail = false }) => {
  if (!isOpen || !photo) return null;

  // Handle both string and object formats
  const photoUrl = typeof photo === 'string' ? photo : photo?.url;
  const isPublic = typeof photo === 'string' ? true : (photo?.isPublic !== false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3 transition"
        >
          <FaTimes size={24} />
        </button>

        {/* Photo Display */}
        <img
          src={photoUrl}
          alt="Photo"
          className="max-w-full max-h-[calc(90*var(--vh))] object-contain"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800';
          }}
        />

        {/* Control Buttons - Top Bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 z-10">
          {/* Public Button */}
          <button
            onClick={() => onTogglePrivacy(photoIndex)}
            className={`px-4 py-2 rounded font-semibold text-sm transition ${
              isPublic
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Public
          </button>

          {/* Private Button */}
          <button
            onClick={() => onTogglePrivacy(photoIndex)}
            className={`px-4 py-2 rounded font-semibold text-sm transition ${
              !isPublic
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Private
          </button>

          {/* Set as Thumbnail Button */}
          {!isThumbnail && (
            <button
              onClick={() => {
                onSetAsThumbnail(photoIndex);
                onClose();
              }}
              className="px-4 py-2 bg-green-500 text-white rounded font-semibold text-sm hover:bg-green-600 transition"
            >
              Set as Thumbnail
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoViewModal;

