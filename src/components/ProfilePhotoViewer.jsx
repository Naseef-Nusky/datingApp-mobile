import { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ProfilePhotoViewer = ({ isOpen, onClose, photos, initialIndex = 0, profileName }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Update current index when initialIndex changes
  useEffect(() => {
    if (isOpen && initialIndex !== null) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex, photos?.length]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const photoUrl = typeof currentPhoto === 'string' ? currentPhoto : currentPhoto?.url;
  const totalPhotos = photos.length;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
      {/* Close Button - Top Right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-3 transition hover:bg-opacity-70"
        aria-label="Close"
      >
        <FaTimes size={24} />
      </button>

      {/* Photo Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Previous Button */}
        {totalPhotos > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-4 transition hover:bg-opacity-70"
            aria-label="Previous photo"
          >
            <FaChevronLeft size={24} />
          </button>
        )}

        {/* Photo Display */}
        <div className="flex items-center justify-center w-full h-full">
          <img
            src={photoUrl}
            alt={`${profileName || 'Profile'} photo ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x600?text=Photo+Not+Available';
            }}
          />
        </div>

        {/* Next Button */}
        {totalPhotos > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-4 transition hover:bg-opacity-70"
            aria-label="Next photo"
          >
            <FaChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Photo Counter - Bottom Center */}
      {totalPhotos > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 rounded-full px-4 py-2 text-sm font-semibold z-20">
          {currentIndex + 1} / {totalPhotos}
        </div>
      )}

      {/* Photo Thumbnails - Bottom (optional, can be added later) */}
      {totalPhotos > 1 && totalPhotos <= 10 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 z-20">
          {photos.map((photo, index) => {
            const thumbUrl = typeof photo === 'string' ? photo : photo?.url;
            return (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-12 h-12 rounded overflow-hidden border-2 transition ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoViewer;
