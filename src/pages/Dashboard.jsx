import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { connectAppSocket, getSocketServerUrl } from '../utils/socketServerUrl';
import {
  mapChatRequestFromApi,
  enrichChatRequestsWithProfiles,
  acceptChatRequestAndNavigate,
} from '../utils/chatRequests';
import { FaHeart, FaCamera, FaEnvelope, FaVideo, FaGift, FaSearch, FaVolumeUp, FaChevronDown, FaFire, FaCheckCircle, FaPlay, FaPhone, FaTimes, FaComment } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import MingleIntroModal from '../components/MingleIntroModal';
import LetsMingleModal from '../components/LetsMingleModal';
import MingleSuccessModal from '../components/MingleSuccessModal';
import StoriesCarousel from '../components/StoriesCarousel';
import ContactsSidebar from '../components/ContactsSidebar';
import FreeUserBadge from '../components/FreeUserBadge';
import VerifiedBadge from '../components/VerifiedBadge';
import { appendBrowseGenderQuery } from '../utils/browseGenderFilter';
import StreamerMemberFilter from '../components/StreamerMemberFilter';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchUser } = useAuth();
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [showLessChatRequests, setShowLessChatRequests] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set()); // Track which users are typing
  /** Streamer/talent: main grid filter — all | online | offline */
  const [streamerUserFilter, setStreamerUserFilter] = useState('all');
  const [streamerNameSearch, setStreamerNameSearch] = useState('');
  const socketRef = useRef(null);
  const paymentSuccessHandledRef = useRef(null); // Prevent duplicate success alert (e.g. Strict Mode double-mount)
  
  // Filter states
  const [filters, setFilters] = useState({
    gender: '',
    lookingFor: '',
    ageMin: '',
    ageMax: '',
    location: '',
    availableForVideoChat: false,
    compatibleZodiacOnly: false,
    zodiacSigns: [],
    interests: [],
    education: '',
    languages: [],
    relationship: '',
    kids: '',
    smoke: '',
    drink: '',
    heightMin: '',
    heightMax: '',
    bodyType: '',
    eyes: '',
    hair: '',
  });

  // Mingle states
  const [showMingleIntro, setShowMingleIntro] = useState(false);
  const [showMingleModal, setShowMingleModal] = useState(false);
  const [showMingleSuccess, setShowMingleSuccess] = useState(false);
  const [mingleMatchedProfiles, setMingleMatchedProfiles] = useState([]);

  // After Stripe checkout success: confirm payment with backend (uses secret key only), then refresh user. Run once per session_id.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const upgradeSuccess = params.get('upgrade') === 'success';
    const refillSuccess = params.get('refill') === 'success';

    if (upgradeSuccess && sessionId) {
      const key = `upgrade-${sessionId}`;
      if (paymentSuccessHandledRef.current === key) return;
      paymentSuccessHandledRef.current = key;
      window.history.replaceState({}, '', location.pathname);
      axios.post(`${apiUrl}/api/credits/confirm-payment`, { session_id: sessionId })
        .then(() => {
          fetchUser();
          alert(t('dashboard.paymentSuccess'));
        })
        .catch((err) => {
          paymentSuccessHandledRef.current = null;
          const msg = err.response?.data?.message || 'Could not confirm payment. Credits may still be applied.';
          alert(msg);
        });
      return;
    }
    if (refillSuccess && sessionId) {
      const key = `refill-${sessionId}`;
      if (paymentSuccessHandledRef.current === key) return;
      paymentSuccessHandledRef.current = key;
      window.history.replaceState({}, '', location.pathname);
      axios.post(`${apiUrl}/api/credits/confirm-refill-payment`, { session_id: sessionId })
        .then((res) => {
          fetchUser();
          const added = res.data?.creditsAdded ?? '';
          alert(added ? t('dashboard.paymentCreditsAddedWithNumber').replace('{{count}}', added) : t('dashboard.paymentCreditsAdded'));
        })
        .catch((err) => {
          paymentSuccessHandledRef.current = null;
          const msg = err.response?.data?.message || 'Could not confirm refill payment. Credits may still be applied.';
          alert(msg);
        });
    }
  }, [location.search, location.pathname, fetchUser]);

  // Socket.IO setup for real-time call notifications
  useEffect(() => {
    if (user?.id) {
      const socketUrl = getSocketServerUrl() || window.location.origin;
      console.log('🔌 [Dashboard] Socket.IO:', socketUrl);
      const socket = connectAppSocket();

      socket.on('connect', () => {
        console.log('✅ [RECEIVER] Socket connected:', socket.id);
        console.log('✅ [RECEIVER] User ID:', user.id);
        console.log('✅ [RECEIVER] Socket URL:', socketUrl);
        // Join user's room
        socket.emit('join-room', String(user.id));
        console.log('📢 [RECEIVER] Emitted join-room for user-' + user.id);
        
        // Verify socket is ready to receive calls
        console.log('✅ [RECEIVER] Socket ready to receive incoming calls');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        // Don't show alert for timeout errors - they're common and will retry
        if (error.message && !error.message.includes('timeout')) {
          console.warn('Socket.IO connection issue - will retry automatically');
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('⚠️ Socket disconnected:', reason);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        socket.emit('join-room', String(user.id));
      });

      // Listen for new chat requests
      socket.on('new-chat-request', (data) => {
        console.log('📬 New chat request received:', data);
        // Refresh chat requests list
        fetchChatRequests();
      });

      // Listen for contact updates (new messages, new chats)
      socket.on('contact-update', (data) => {
        console.log('👥 Contact update received:', data);
        // Refresh contacts list
        fetchContacts();
      });

      // Listen for new messages
      socket.on('new-message', (data) => {
        console.log('💬 New message received:', data);
        // Refresh contacts to update last message
        fetchContacts();
      });

      // Listen for typing events
      socket.on('user-typing', (data) => {
        if (data.userId && data.userId !== String(user.id)) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }, 3000);
        }
      });

      socket.on('user-stopped-typing', (data) => {
        if (data.userId && data.userId !== String(user.id)) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      });

      // Listen for chat request accepted
      socket.on('chat-request-accepted', (data) => {
        console.log('✅ Chat request accepted:', data);
        // Refresh chat requests and contacts
        fetchChatRequests();
        fetchContacts();
      });

      socketRef.current = socket;

      return () => {
        console.log('🔌 Disconnecting socket');
        socket.disconnect();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    fetchContacts();
    fetchChatRequests();

    const contactsInterval = setInterval(() => {
      fetchContacts();
    }, 10000);

    const chatRequestsInterval = setInterval(() => {
      fetchChatRequests();
    }, 10000);

    return () => {
      clearInterval(contactsInterval);
      clearInterval(chatRequestsInterval);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchProfiles();
  }, [user, filters]);

  useEffect(() => {
    const isSt = user?.userType === 'streamer' || user?.userType === 'talent';
    if (!isSt) setStreamerUserFilter('all');
  }, [user?.userType]);

  // Check if we should open search modal, mingle intro, or redirect to complete profile
  useEffect(() => {
    let shouldClearState = false;

    if (location.state?.applySearchFilters) {
      handleApplyFilters(location.state.applySearchFilters);
      shouldClearState = true;
    }

    if (location.state?.openSearchModal) {
      setShowSearchModal(true);
      shouldClearState = true;
    }
    if (location.state?.openMingleIntro) {
      setShowMingleIntro(true);
      shouldClearState = true;
    }
    // Login link with incomplete registration: open dashboard first, then redirect to complete profile
    if (location.state?.openCompleteProfile) {
      navigate('/complete-profile', { replace: true, state: {} });
      return;
    }

    if (shouldClearState) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Listen for custom event to apply search filters from Header
  useEffect(() => {
    const handleApplySearchFilters = (event) => {
      const filters = event.detail;
      handleApplyFilters(filters);
    };
    
    window.addEventListener('applySearchFilters', handleApplySearchFilters);
    
    return () => {
      window.removeEventListener('applySearchFilters', handleApplySearchFilters);
    };
  }, []);

  // Listen for custom event to open mingle intro modal
  useEffect(() => {
    const handleOpenMingleIntro = () => {
      setShowMingleIntro(true);
    };
    
    window.addEventListener('openMingleIntro', handleOpenMingleIntro);
    
    return () => {
      window.removeEventListener('openMingleIntro', handleOpenMingleIntro);
    };
  }, []);

  // Handle filter modal apply
  const handleApplyFilters = (appliedFilters) => {
    console.log('[Dashboard] Filters selected in modal:', appliedFilters);
    setFilters((prev) => ({
      ...prev,
      ...appliedFilters,
      zodiacSigns: Array.isArray(appliedFilters.zodiacSigns) ? appliedFilters.zodiacSigns : [],
      interests: Array.isArray(appliedFilters.interests) ? appliedFilters.interests : [],
      languages: Array.isArray(appliedFilters.languages) ? appliedFilters.languages : [],
    }));
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      console.log('Fetching profiles...');
      
      // Ensure token is set
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

      // Interests
      if (filters.interests && filters.interests.length > 0) {
        params.append('interests', filters.interests.join(','));
      }

      // Education
      if (filters.education) {
        params.append('education', filters.education);
      }

      // Languages
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

      // Height range
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
      
      // Ask backend for a very high limit so dashboard effectively sees "all" profiles.
      params.append('limit', '1000');
      const queryString = params.toString();
      const url = `/api/profiles?${queryString}`;
      
      console.log('[Dashboard] Applied filters object:', filters);
      console.log('[Dashboard] Query params string:', queryString);
      console.log('[Dashboard] Query params entries:', Object.fromEntries(params.entries()));
      console.log('Fetching profiles with URL:', url);
      const response = await axios.get(url);
      console.log('Profiles response:', response.data);
      console.log('Profiles count:', response.data?.profiles?.length || 0);
      
      if (response.data && response.data.profiles) {
        console.log('Setting profiles:', response.data.profiles.length);
        const raw = response.data.profiles;
        const isTalentOrStreamer =
          user?.userType === 'streamer' || user?.userType === 'talent';
        const ordered = isTalentOrStreamer
          ? [...raw].sort(
              (a, b) => Number(!!b.isOnline) - Number(!!a.isOnline)
            )
          : raw;
        setProfiles(ordered);
      } else {
        console.warn('No profiles in response:', response.data);
        setProfiles([]);
      }
    } catch (error) {
      console.error('Fetch profiles error:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      setProfiles([]);
    } finally {
      setLoading(false);
    }
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

  const fetchContacts = async () => {
    try {
      // Fetch conversations/chats from API
      const response = await axios.get('/api/messages/conversations');
      
      if (response.data && Array.isArray(response.data)) {
        const contactsList = response.data.map((conv) => {
          const otherUser = conv.user;
          const profile = otherUser?.profile; // Access profile data
          
          const lastMsg = conv.lastMessage;
          const senderId = lastMsg?.sender ?? lastMsg?.sender_id;
          const giftFromThem = lastMsg?.messageType === 'gift' && senderId === conv.userId;
          let message = conv.lastMessage?.content || t('sidebar.noMessagesYet');
          if (lastMsg?.messageType === 'gift') {
            message = giftFromThem ? t('sidebar.receivedGift') : t('sidebar.youSentGift');
          }
          const lowerMessage = typeof message === 'string' ? message.toLowerCase().trim() : '';
          if (
            lowerMessage.includes('removed you from my contacts') &&
            senderId === user?.id
          ) {
            // Hide contacts where you explicitly removed them
            return null;
          }
          if (
            lowerMessage.includes('added you to my contacts') &&
            senderId === user?.id
          ) {
            message = t('sidebar.addedToContacts');
          }
          return {
            id: conv.userId,
            name: profile?.firstName || otherUser?.email?.split('@')[0] || 'Unknown',
            type: null,
            message,
            unreadCount: conv.unreadCount || 0,
            avatar: profile?.photos?.[0]?.url || null,
            lastMessageAt: conv.lastMessage?.createdAt,
            giftFromThem: !!giftFromThem,
          };
        }).filter(Boolean);
        // Remove contacts with no activity (\"No messages yet\" and no timestamp)
        const filtered = contactsList.filter(
          (c) => c.lastMessageAt || (c.message && c.message !== t('sidebar.noMessagesYet'))
        );
        // Sort by latest activity (newest first)
        filtered.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
          return dateB - dateA;
        });
        setContacts(filtered);
      } else {
        // No conversations found – no contacts
        setContacts([]);
      }
    } catch (error) {
      console.error('Fetch contacts error:', error);
      // On error, clear contacts (no fake Concierge)
      setContacts([]);
    }
  };

  const fetchChatRequests = async () => {
    try {
      const response = await axios.get('/api/messages/chat-requests');
      if (response.data && Array.isArray(response.data)) {
        const mapped = response.data.map((r) =>
          mapChatRequestFromApi(r, t('sidebar.newMessage'))
        );
        const requests = await enrichChatRequestsWithProfiles(mapped);
        setChatRequests(requests);
      } else {
        setChatRequests([]);
      }
    } catch (error) {
      console.error('Fetch chat requests error:', error);
      setChatRequests([]);
    }
  };

  const displayedChatRequests = showLessChatRequests ? chatRequests.slice(0, 5) : chatRequests;


  const acceptChatRequestAndOpenChat = (request) =>
    acceptChatRequestAndNavigate(request, {
      navigate,
      fetchChatRequests,
      fetchContacts,
    });

  const isStreamerVideoEnabled = (profile) => {
    const prefFlag = profile?.preferences?.availableForVideoChat;
    return prefFlag === true || prefFlag === 'true';
  };

  const getActionButton = (profile) => {
    // Determine action button based on profile status
    if (profile.isOnline && profile.user?.userType === 'streamer' && isStreamerVideoEnabled(profile)) {
      return (
        <button
          onClick={() => navigate(`/profile/${profile.userId}`)}
          className="w-full bg-gradient-nex text-white py-2 px-4 rounded hover:opacity-90 transition font-semibold text-sm"
        >
          WATCH NOW
        </button>
      );
    } else if (profile.isOnline) {
      return (
        <button
          onClick={() => navigate(`/profile/${profile.userId}`)}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition font-semibold text-sm"
        >
          START VIDEO CHAT
        </button>
      );
    } else {
      const actions = [
        { label: 'CHAT NOW', color: 'bg-blue-500 hover:bg-blue-600' },
        { label: 'SEND EMAIL', color: 'bg-purple-500 hover:bg-purple-600' },
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      return (
        <button
          onClick={() => navigate(`/profile/${profile.userId}`)}
          className={`w-full ${randomAction.color} text-white py-2 px-4 rounded transition font-semibold text-sm`}
        >
          {randomAction.label}
        </button>
      );
    }
  };

  const isStreamerTalent =
    user?.userType === 'streamer' || user?.userType === 'talent';

  const profileMatchesNameSearch = (profile, query) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const first = (profile.firstName || '').toLowerCase();
    const last = (profile.lastName || '').toLowerCase();
    const full = `${first} ${last}`.trim();
    return first.includes(q) || last.includes(q) || full.includes(q);
  };

  const statusFilteredProfiles =
    !isStreamerTalent || streamerUserFilter === 'all'
      ? profiles
      : streamerUserFilter === 'online'
        ? profiles.filter((p) => p.isOnline)
        : profiles.filter((p) => !p.isOnline);

  const gridProfiles = isStreamerTalent
    ? statusFilteredProfiles.filter((p) => profileMatchesNameSearch(p, streamerNameSearch))
    : statusFilteredProfiles;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">{t('dashboardPage.loadingProfiles')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stories Carousel */}
      <StoriesCarousel />


      {/* Mingle Intro Modal - Step 1 */}
      <MingleIntroModal
        isOpen={showMingleIntro}
        onClose={() => setShowMingleIntro(false)}
        onGetStarted={() => {
          setShowMingleIntro(false);
          setShowMingleModal(true);
        }}
      />

      {/* Let's Mingle Modal - Step 2 */}
      <LetsMingleModal
        isOpen={showMingleModal}
        onClose={() => setShowMingleModal(false)}
        onSuccess={(matchedProfiles) => {
          setMingleMatchedProfiles(matchedProfiles);
          setShowMingleModal(false);
          setShowMingleSuccess(true);
        }}
      />

      {/* Mingle Success Modal - Step 3 */}
      <MingleSuccessModal
        isOpen={showMingleSuccess}
        onClose={() => setShowMingleSuccess(false)}
        matchedProfiles={mingleMatchedProfiles}
        onMingleAgain={() => {
          setShowMingleSuccess(false);
          setShowMingleIntro(true);
        }}
      />

      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 min-w-0 lg:mr-80">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-2 pb-4 sm:pt-4 lg:py-6">
            {isStreamerTalent && (
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <FaSearch
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={streamerNameSearch}
                    onChange={(e) => setStreamerNameSearch(e.target.value)}
                    placeholder={t('dashboard.searchMembersByName')}
                    aria-label={t('dashboard.searchMembersByName')}
                    className="h-10 w-full rounded-2xl border border-gray-200/80 bg-white/90 pl-10 pr-4 text-sm text-gray-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-gray-400 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <StreamerMemberFilter
                  value={streamerUserFilter}
                  onChange={setStreamerUserFilter}
                />
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {gridProfiles.map((profile) => {
              // Count photos and videos from the photos array
              const allMedia = profile.photos || [];
              const photoCount = allMedia.filter(photo => {
                // Check if it's a photo (not a video)
                // Videos typically have .mp4, .mov, .webm extensions or video/ mimetype
                if (typeof photo === 'string') return true; // Assume string URLs are photos
                const url = photo?.url || photo;
                if (!url) return false;
                const lowerUrl = url.toLowerCase();
                return !lowerUrl.includes('.mp4') && !lowerUrl.includes('.mov') && !lowerUrl.includes('.webm') && !lowerUrl.includes('video/');
              }).length;
              
              const videoCount = allMedia.filter(photo => {
                // Check if it's a video
                if (typeof photo === 'string') {
                  const lowerUrl = photo.toLowerCase();
                  return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm');
                }
                const url = photo?.url || photo;
                if (!url) return false;
                const lowerUrl = url.toLowerCase();
                return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm') || lowerUrl.includes('video/') || photo?.type === 'video' || photo?.mediaType === 'video';
              }).length;
              
              const isOnline = profile.isOnline || false;
              const mainPhoto =
                profile.photos && profile.photos.length > 0
                  ? (typeof profile.photos[0] === 'string'
                      ? profile.photos[0]
                      : profile.photos[0]?.url || '')
                  : null;

              return (
                <div
                  key={profile.id || profile.userId}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer isolate flex flex-col h-full"
                  onClick={() => navigate(`/profile/${profile.userId}`)}
                >
                  {/* Image section */}
                  <div className="relative w-full h-36 sm:h-44 lg:h-52 overflow-hidden bg-gray-200">
                    {mainPhoto ? (
                      <img
                        src={mainPhoto}
                        alt={profile.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaHeart className="text-3xl sm:text-4xl lg:text-5xl text-gray-400" />
                      </div>
                    )}

                    {/* Top-left badges: Free User + Verified (side-by-side) */}
                    {(profile.user?.isFreeUser !== false || profile.user?.isVerified) && (
                      <div
                        className="absolute top-1 left-1 sm:top-2 sm:left-2 z-[20] flex items-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {profile.user?.isFreeUser !== false && <FreeUserBadge size="sm" />}
                        {profile.user?.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                    )}

                    {/* Bottom-left photo/video count */}
                    <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 flex items-center space-x-1 sm:space-x-2 z-[20]">
                      {photoCount > 0 && (
                        <span
                          className="flex items-center space-x-0.5 sm:space-x-1 text-white text-[10px] sm:text-xs bg-black bg-opacity-60 rounded px-1 sm:px-2 py-0.5 sm:py-1 cursor-pointer hover:bg-opacity-80 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${profile.userId}`, { state: { showPhotos: true } });
                          }}
                          title={`${photoCount} photo${photoCount !== 1 ? 's' : ''}`}
                        >
                          <FaCamera className="text-[10px] sm:text-xs" />
                          <span className="font-semibold">{photoCount}</span>
                        </span>
                      )}
                      {videoCount > 0 && (
                        <span
                          className="flex items-center space-x-0.5 sm:space-x-1 text-white text-[10px] sm:text-xs bg-black bg-opacity-60 rounded px-1 sm:px-2 py-0.5 sm:py-1 cursor-pointer hover:bg-opacity-80 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${profile.userId}`, { state: { showVideos: true } });
                          }}
                          title={`${videoCount} video${videoCount !== 1 ? 's' : ''}`}
                        >
                          <FaVideo className="text-[10px] sm:text-xs" />
                          <span className="font-semibold">{videoCount}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Text/content section */}
                  <div className="flex-1 flex flex-col p-2 sm:p-3 lg:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                        {profile.firstName} {profile.lastName ? profile.lastName : ''}, {profile.age}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {videoCount > 0 && (
                          <FaVideo className="text-teal-500 text-xs sm:text-sm flex-shrink-0" />
                        )}
                        <div
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        ></div>
                      </div>
                    </div>

                    {(() => {
                      const description = profile.bio || profile.aboutMe;
                      return description ? (
                        <p className="text-xs sm:text-sm text-gray-700 mt-0.5 line-clamp-3">
                          {description}
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

              {gridProfiles.length === 0 && !loading && (
                <div className="text-center py-12 col-span-full">
                  <p className="text-gray-600 text-lg mb-2">
                    {isStreamerTalent &&
                    statusFilteredProfiles.length > 0 &&
                    streamerNameSearch.trim()
                      ? t('dashboard.noMembersMatchNameSearch')
                      : isStreamerTalent &&
                          profiles.length > 0 &&
                          streamerUserFilter === 'online'
                        ? t('dashboard.noOnlineMembersWithFilter')
                        : isStreamerTalent &&
                            profiles.length > 0 &&
                            streamerUserFilter === 'offline'
                          ? t('dashboard.noOfflineMembersWithFilter')
                          : t('dashboard.noProfilesFound')}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {isStreamerTalent &&
                    statusFilteredProfiles.length > 0 &&
                    streamerNameSearch.trim() ? (
                      <button
                        type="button"
                        onClick={() => setStreamerNameSearch('')}
                        className="font-medium text-teal-600 underline hover:text-teal-800"
                      >
                        {t('dashboard.clearNameSearch')}
                      </button>
                    ) : isStreamerTalent &&
                      profiles.length > 0 &&
                      (streamerUserFilter === 'online' ||
                        streamerUserFilter === 'offline') ? (
                      <button
                        type="button"
                        onClick={() => setStreamerUserFilter('all')}
                        className="font-medium text-teal-600 underline hover:text-teal-800"
                      >
                        {t('dashboard.filterAllUsers')}
                      </button>
                    ) : (
                      t('dashboard.tryRefresh')
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Fixed - Hidden on mobile */}
        <div className="hidden lg:block w-80 bg-white border-l border-gray-200 fixed right-0 top-16 h-[calc(100*var(--vh)-4rem)] flex flex-col z-20 shadow-lg overflow-hidden">
          <ContactsSidebar
            contacts={contacts}
            chatRequests={chatRequests}
            typingUsers={typingUsers}
            onContactClick={(contact) => {
              if (contact.id && contact.id !== 'system-concierge' && typeof contact.id === 'string' && !contact.id.includes('system-')) {
                navigate(`/profile/${contact.id}`, { state: { openChat: true } });
              }
            }}
            onAcceptChatRequest={acceptChatRequestAndOpenChat}
            showLessChatRequests={showLessChatRequests}
            onToggleShowMoreChatRequests={() => setShowLessChatRequests(!showLessChatRequests)}
            contactsMaxHeight="max-h-64"
            chatRequestsMaxHeight="flex-1 min-h-0"
            chatRequestLimit={5}
          />
        </div>
    </div>
  );
};

export default Dashboard;
