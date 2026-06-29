import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchFilterModal from '../components/SearchFilterModal';
import { FaHeart, FaCamera, FaEnvelope, FaVideo } from 'react-icons/fa';
import { appendBrowseGenderQuery } from '../utils/browseGenderFilter';

const Search = () => {
  const navigate = useNavigate();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(null);

  // Show modal on first visit if no filters applied
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('searchVisited');
    if (!hasVisited && !filters && profiles.length === 0) {
      setShowFilterModal(true);
      sessionStorage.setItem('searchVisited', 'true');
    }
  }, []);

  useEffect(() => {
    if (filters) {
      fetchProfiles();
    }
  }, [filters]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      appendBrowseGenderQuery(params, filters.lookingFor);
      
      // Age range filters
      if (filters.ageMin) params.append('minAge', filters.ageMin.toString());
      if (filters.ageMax) params.append('maxAge', filters.ageMax.toString());
      
      // Location filter
      if (filters.location && filters.location.trim()) {
        const normalizedLocation = filters.location.trim().replace(/\s+/g, ' ');
        const locationParts = normalizedLocation.split(',');
        if (locationParts.length > 1) {
          if (locationParts[0] && locationParts[0].trim()) {
            params.append('city', locationParts[0].trim());
          }
          if (locationParts[1] && locationParts[1].trim()) {
            params.append('country', locationParts[1].trim());
          }
        } else {
          // Single term (e.g. "USA"): backend will match city OR country.
          params.append('location', normalizedLocation);
        }
      }
      
      // Video chat filter
      if (filters.availableForVideoChat) {
        params.append('videoChat', 'true');
      }

      // Zodiac signs
      if (filters.zodiacSigns && filters.zodiacSigns.length > 0) {
        params.append('zodiacSigns', filters.zodiacSigns.join(','));
      }

      // Interests (array)
      if (filters.interests && filters.interests.length > 0) {
        params.append('interests', filters.interests.join(','));
      }

      // Education
      if (filters.education) {
        params.append('education', filters.education);
      }

      // Languages (array)
      if (filters.languages && filters.languages.length > 0) {
        params.append('languages', filters.languages.join(','));
      }

      // Relationship
      if (filters.relationship) {
        params.append('relationship', filters.relationship);
      }

      // Kids
      if (filters.kids) {
        params.append('kids', filters.kids);
      }

      // Smoke
      if (filters.smoke) {
        params.append('smoke', filters.smoke);
      }

      // Drink
      if (filters.drink) {
        params.append('drink', filters.drink);
      }

      // Height range (90 cm - 240 cm)
      if (filters.heightMin) {
        params.append('minHeight', filters.heightMin);
      }
      if (filters.heightMax) {
        params.append('maxHeight', filters.heightMax);
      }

      // Body type
      if (filters.bodyType) {
        params.append('bodyType', filters.bodyType);
      }

      // Eyes
      if (filters.eyes) {
        params.append('eyes', filters.eyes);
      }

      // Hair
      if (filters.hair) {
        params.append('hair', filters.hair);
      }

      // Compatible zodiac only flag
      if (filters.compatibleZodiacOnly) {
        params.append('compatibleZodiacOnly', 'true');
      }

      console.log('[Search] Applied filters object:', filters);
      console.log('[Search] Query params string:', params.toString());
      console.log('[Search] Query params entries:', Object.fromEntries(params.entries()));
      const response = await axios.get(`/api/profiles?${params.toString()}`);
      console.log('Profiles response:', response.data);
      setProfiles(response.data.profiles || []);
    } catch (error) {
      console.error('Fetch profiles error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (appliedFilters) => {
    console.log('[Search] Filters selected in modal:', appliedFilters);
    setFilters(appliedFilters);
    setShowFilterModal(false);
  };

  const handleLike = async (userId) => {
    try {
      await axios.post(`/api/matches/like/${userId}`);
      fetchProfiles();
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handlePass = async (userId) => {
    try {
      await axios.post(`/api/matches/pass/${userId}`);
      fetchProfiles();
    } catch (error) {
      console.error('Pass error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter Modal */}
      <SearchFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
      />

      {/* Search Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-nex-blue">Search for Your Matches</h1>
          <button
            onClick={() => setShowFilterModal(true)}
            className="bg-gradient-nex text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
          >
            Filter Search
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl">Loading matches...</div>
          </div>
        ) : profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile._id || profile.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
              >
                {profile.photos && profile.photos.length > 0 ? (
                  <img
                    src={profile.photos[0].url}
                    alt={profile.firstName}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <FaHeart className="text-6xl text-gray-400" />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-xl font-semibold">
                    {profile.firstName}, {profile.age}
                  </h3>
                  {profile.location && (
                    <p className="text-gray-600 text-sm">
                      {profile.location.city}, {profile.location.country}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    {profile.photos && (
                      <span className="flex items-center space-x-1">
                        <FaCamera />
                        <span>{profile.photos.length}</span>
                      </span>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handlePass(profile.userId)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => handleLike(profile.userId)}
                      className="flex-1 bg-gradient-nex text-white py-2 rounded hover:opacity-90 transition"
                    >
                      Like
                    </button>
                  </div>

                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => navigate(`/profile/${profile.userId}`)}
                      className="flex-1 bg-nex-blue text-white py-2 rounded hover:bg-nex-dark transition text-center text-sm"
                    >
                      View Profile
                    </button>
                    <button className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition">
                      <FaEnvelope />
                    </button>
                    <button className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
                      <FaVideo />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No matches found. Try adjusting your filters.</p>
            <button
              onClick={() => setShowFilterModal(true)}
              className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Adjust Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

