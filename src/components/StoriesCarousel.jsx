import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AddStoryModal from './AddStoryModal';
import StoryViewer from './StoryViewer';

const StoriesCarousel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryUserId, setSelectedStoryUserId] = useState(null);

  useEffect(() => {
    fetchStories();
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get('/api/profiles/me');
      if (response.data) {
        setUserProfile(response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchStories = async () => {
    try {
      setLoading(true);
      // Fetch actual stories from API
      const response = await axios.get('/api/stories');
      if (response.data && Array.isArray(response.data)) {
        // Group stories by user
        const storiesByUser = {};
        response.data.forEach(story => {
          const userId = story.userId || story.user?.id;
          if (!storiesByUser[userId]) {
            storiesByUser[userId] = {
              id: userId,
              name: story.user?.profile?.firstName || story.user?.email?.split('@')[0] || 'User',
              avatar: story.user?.profile?.photos?.[0]?.url || null,
              hasNewStory: true,
              isViewed: Array.isArray(story.views) && story.views.some(v => (typeof v === 'object' ? v.userId : v) === user?.id) || false,
              storyCount: 0,
            };
          }
          storiesByUser[userId].storyCount++;
        });
        
        // Convert to array and limit to 10
        const storiesData = Object.values(storiesByUser).slice(0, 10);
        setStories(storiesData);
      } else {
        setStories([]);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      // Fallback to profiles if stories API fails
      try {
        const profileResponse = await axios.get('/api/profiles?limit=20');
        if (profileResponse.data && profileResponse.data.profiles) {
          const storiesData = profileResponse.data.profiles
            .filter(p => p.userId !== user?.id)
            .slice(0, 10)
            .map(profile => ({
              id: profile.userId || profile.id,
              name: profile.firstName || 'User',
              avatar: profile.photos?.[0]?.url || null,
              hasNewStory: true,
              isViewed: false,
            }));
          setStories(storiesData);
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback stories:', fallbackError);
        setStories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = () => {
    setShowAddStoryModal(true);
  };

  const handleStoryAdded = (newStory) => {
    // Refresh stories list
    fetchStories();
  };

  const handleStoryClick = (storyUserId) => {
    setSelectedStoryUserId(storyUserId);
    setShowStoryViewer(true);
  };

  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 sticky top-14 sm:top-16 z-[5]">
        <div className="container mx-auto px-2 sm:px-4 lg:px-8 pt-1.5 pb-1 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide pb-2">
            <div className="text-gray-500 text-sm">Loading stories...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-14 sm:top-16 z-[5]">
      <div className="container mx-auto px-2 sm:px-4 lg:px-8 pt-1.5 pb-0 sm:py-2">
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide pb-1">
          {/* Add Story Button */}
          <div 
            onClick={handleAddStory}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer group relative isolate"
          >
            <div className="relative isolate">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center border-2 border-gray-300 group-hover:border-pink-400 transition overflow-hidden p-0.5 relative">
                {userProfile?.photos?.[0]?.url ? (
                  <img
                    src={userProfile.photos[0].url}
                    alt="Your story"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              {/* Plus Icon Overlay */}
              <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center group-hover:bg-blue-600 transition shadow-md pointer-events-none">
                <FaPlus className="text-white text-[10px] sm:text-xs" />
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-700 mt-1 text-center max-w-[50px] sm:max-w-[60px] truncate font-medium block">
              Your Story
            </span>
          </div>

          {/* Stories */}
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => handleStoryClick(story.id)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:opacity-80 transition group relative isolate"
            >
              <div className="relative isolate">
                {/* Gradient Border - Pink to Purple/Blue */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 ${
                    story.hasNewStory && !story.isViewed
                      ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-white p-0.5">
                    {story.avatar ? (
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center"><span class="text-white font-semibold text-xs sm:text-sm">' + (story.name?.[0]?.toUpperCase() || 'U') + '</span></div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {story.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] text-gray-700 mt-1 text-center max-w-[50px] sm:max-w-[60px] truncate block">
                {story.name}
              </span>
            </div>
          ))}

          {stories.length === 0 && (
            <div className="text-gray-500 text-sm">No stories available</div>
          )}
        </div>
      </div>

      {/* Add Story Modal */}
      <AddStoryModal
        isOpen={showAddStoryModal}
        onClose={() => setShowAddStoryModal(false)}
        onStoryAdded={handleStoryAdded}
      />

      {/* Story Viewer */}
      <StoryViewer
        isOpen={showStoryViewer}
        onClose={() => {
          setShowStoryViewer(false);
          setSelectedStoryUserId(null);
        }}
        userId={selectedStoryUserId}
      />
    </div>
  );
};

export default StoriesCarousel;
