import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaPaperPlane, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CONTACT_INFO_WARNING, hasBlockedContactInfo } from '../utils/contactInfoBlock';

const StoryViewer = ({ isOpen, onClose, userId, stories = [] }) => {
  const { user } = useAuth();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [userStories, setUserStories] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const progressIntervalRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Fetch user's stories
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserStories();
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  // Auto-advance story after 5 seconds
  useEffect(() => {
    if (isOpen && userStories.length > 0 && currentStoryIndex < userStories.length) {
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 2; // 2% per 100ms = 5 seconds total
        });
      }, 100);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [isOpen, currentStoryIndex, userStories.length]);

  const fetchUserStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/stories');
      if (response.data && Array.isArray(response.data)) {
        // Filter stories for this user - handle both string and UUID comparison
        const userIdStr = String(userId);
        const filtered = response.data
          .filter(story => {
            const storyUserId = String(story.userId || story.user?.id || '');
            return storyUserId === userIdStr;
          })
          .sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
        setUserStories(filtered);
        setCurrentStoryIndex(0);
      }
    } catch (error) {
      console.error('Error fetching user stories:', error);
      setUserStories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/api/profiles/${userId}`);
      if (response.data) {
        setUserProfile(response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handlePrevious = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else {
      // Close if no previous story
      onClose();
    }
  };

  const handleNext = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      // Close if no next story
      onClose();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !userId) return;

    if (hasBlockedContactInfo(message.trim())) {
      alert(CONTACT_INFO_WARNING);
      return;
    }

    try {
      const response = await axios.post('/api/messages', {
        receiverId: userId.toString(),
        content: message.trim(),
        messageType: 'text',
      });
      
      console.log('✅ Message sent successfully:', response.data);
      setMessage('');
      // Message sent, keep story viewer open
    } catch (error) {
      console.error('❌ Error sending message:', error.response?.data || error.message);
      // Show error to user
      alert(error.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory || !currentStory.id) return;
    
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await axios.delete(`/api/stories/${currentStory.id}`);
      console.log('✅ Story deleted successfully');
      
      // Remove from local state
      const updatedStories = userStories.filter((_, index) => index !== currentStoryIndex);
      setUserStories(updatedStories);
      
      // Navigate to next story or close if no more stories
      if (updatedStories.length === 0) {
        onClose();
      } else if (currentStoryIndex >= updatedStories.length) {
        setCurrentStoryIndex(updatedStories.length - 1);
      }
    } catch (error) {
      console.error('❌ Error deleting story:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to delete story. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') {
          handlePrevious();
        } else if (e.key === 'ArrowRight') {
          handleNext();
        } else if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentStoryIndex, userStories.length]);

  if (!isOpen || !userId) return null;

  const currentStory = userStories[currentStoryIndex];
  const storyCount = userStories.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4">
      {/* Chat Window Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md h-[calc(85*var(--vh))] max-h-[800px] flex flex-col overflow-hidden">
        {/* Title Bar */}
        <div className="bg-nex-blue px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Profile Image */}
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white border-opacity-30 flex-shrink-0">
              {userProfile?.photos?.[0]?.url ? (
                <img
                  src={userProfile.photos[0].url}
                  alt={userProfile.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white bg-opacity-20 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {userProfile?.firstName?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-white font-semibold text-lg">
              {userProfile?.firstName || 'User'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white text-opacity-80 hover:text-white transition"
            aria-label="Close"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Progress Indicators - Dashed Lines */}
        {storyCount > 0 && (
          <div className="bg-nex-blue px-4 py-2">
            <div className="flex space-x-1">
              {userStories.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-1 bg-white bg-opacity-30 rounded overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{
                      width:
                        index < currentStoryIndex
                          ? '100%'
                          : index === currentStoryIndex
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story Content Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="text-white text-xl">Loading story...</div>
          ) : currentStory ? (
            <>
              {currentStory.mediaType === 'photo' ? (
                <img
                  src={currentStory.mediaUrl}
                  alt="Story"
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => {
                    // Open image in full screen on click
                    window.open(currentStory.mediaUrl, '_blank');
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x600?text=Story+Not+Available';
                  }}
                />
              ) : (
                <video
                  src={currentStory.mediaUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  loop
                  muted
                  onError={(e) => {
                    console.error('Video load error:', currentStory.mediaUrl);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {/* Previous Button - Only show if there's a previous story */}
              {currentStoryIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-3 transition hover:bg-opacity-70 z-10"
                  aria-label="Previous story"
                >
                  <FaChevronLeft size={20} />
                </button>
              )}

              {/* Next Button - Only show if there's a next story */}
              {currentStoryIndex < userStories.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-3 transition hover:bg-opacity-70 z-10"
                  aria-label="Next story"
                >
                  <FaChevronRight size={20} />
                </button>
              )}

              {/* Delete Story Button - Only show if viewing own story */}
              {userId && String(userId) === String(user?.id) && (
                <button
                  onClick={handleDeleteStory}
                  className="absolute bottom-4 right-4 text-white hover:text-red-300 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 transition z-10"
                  aria-label="Delete story"
                >
                  <FaTrash size={18} />
                </button>
              )}
            </>
          ) : (
            <div className="text-white text-xl">No stories available</div>
          )}
        </div>

        {/* Message Input - Bottom - Only show if not viewing own story */}
        {userId && String(userId) !== String(user?.id) && (
          <div className="bg-nex-blue px-4 py-3">
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-full px-4 py-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-white placeholder-white placeholder-opacity-70 focus:outline-none text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="text-white hover:text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Send message"
              >
                <FaPaperPlane size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
