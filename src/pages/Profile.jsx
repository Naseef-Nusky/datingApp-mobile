import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { connectAppSocket, getSocketServerUrl } from '../utils/socketServerUrl';
import { 
  FaHeart, FaCamera, FaVideo, FaEnvelope, FaPhone, FaStar, FaGift,
  FaLeaf, FaMedal, FaMapMarkerAlt, FaPlay,
  FaSearch, FaVolumeUp, FaChevronDown, FaTimes
} from 'react-icons/fa';
import AgoraVideoCall from '../components/AgoraVideoCall';
import AgoraVoiceCall from '../components/AgoraVoiceCall';
import AgoraChat from '../components/AgoraChat';
import PresentShopModal from '../components/PresentShopModal';
import ProfileEmailComposer from '../components/ProfileEmailComposer';
import ProfilePhotoViewer from '../components/ProfilePhotoViewer';
import ContactsSidebar from '../components/ContactsSidebar';
import FreeUserBadge from '../components/FreeUserBadge';
import VerifiedBadge from '../components/VerifiedBadge';
import { createSafeChannelName } from '../utils/agoraUtils';
import { interestIcons, defaultInterestIcon } from '../utils/interestIcons';
import { getDisplayZodiac } from '../utils/zodiac';
import {
  enrichChatRequestsWithProfiles,
  acceptChatRequestAndNavigate,
} from '../utils/chatRequests';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { useServiceAccess } from '../hooks/useServiceAccess';
import { useCreditsSync } from '../hooks/useCreditsSync';
import CompatibilityPanel from '../mobile/components/CompatibilityPanel';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchUser } = useAuth();
  const { syncCreditsAfterCall } = useCreditsSync();
  const { t } = useLanguage();
  const {
    handleCallAccessDenied,
  } = useInsufficientCreditsHandler();
  const {
    ensureCanOpenChat,
    ensureCanSendEmailAccess,
    ensureCanStartCall,
  } = useServiceAccess();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarProfiles, setSimilarProfiles] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [callRequests, setCallRequests] = useState([]); // Missed calls
  const [showLessChatRequests, setShowLessChatRequests] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set()); // Track which users are typing
  const [showFullBio, setShowFullBio] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatDraftMessage, setChatDraftMessage] = useState('');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showPresentShop, setShowPresentShop] = useState(false);
  const [presentCheckoutState, setPresentCheckoutState] = useState(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [callChannelName, setCallChannelName] = useState(null); // Store channel name for RTC
  const [outgoingCall, setOutgoingCall] = useState(null); // Track outgoing call waiting for acceptance
  const outgoingCallRef = useRef(null); // Ref to track outgoing call (for socket handlers)
  const socketRef = useRef(null);
  const [compatibility, setCompatibility] = useState(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const [compatibilityError, setCompatibilityError] = useState('');

  // Open chat or email composer only after credit check (same as calls)
  useEffect(() => {
    if (!user?.id) return;

    const tryOpenEmail = async () => {
      if (!(await ensureCanSendEmailAccess())) return;
      setShowEmailComposer(true);
      setShowChat(false);
    };

    const tryOpenChat = async () => {
      if (!(await ensureCanOpenChat())) return;
      setShowChat(true);
      setShowEmailComposer(false);
    };

    if (location.state?.openEmailComposer) {
      tryOpenEmail();
    } else if (location.state?.openChat) {
      tryOpenChat();
    }
  }, [location.state, user?.id, ensureCanOpenChat, ensureCanSendEmailAccess]);

  // Handle refill checkout return on profile pages and reopen present flow.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refillStatus = params.get('refill');
    const sessionId = params.get('session_id');
    const shouldOpenPresentShop = params.get('openPresentShop') === '1';
    const presentReceiverId = params.get('presentReceiverId');
    const presentStep = params.get('presentStep');
    const isTargetProfile =
      !presentReceiverId || String(presentReceiverId) === String(id);

    const loadPendingPresentCheckout = () => {
      const raw = sessionStorage.getItem('pendingPresentCheckout');
      if (!raw) {
        setPresentCheckoutState(null);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          (!parsed.receiverId || String(parsed.receiverId) === String(id))
        ) {
          setPresentCheckoutState({
            initialStep: parsed.step === 'checkout' ? 'checkout' : 'shop',
            initialCartItems: Array.isArray(parsed.cart) ? parsed.cart : [],
          });
        } else {
          setPresentCheckoutState(null);
        }
      } catch {
        setPresentCheckoutState(null);
      }
    };

    if (shouldOpenPresentShop && isTargetProfile) {
      if (presentStep === 'checkout') {
        loadPendingPresentCheckout();
      } else {
        setPresentCheckoutState(null);
      }
      setShowPresentShop(true);
    }

    if (refillStatus === 'success' && sessionId && isTargetProfile) {
      if (presentStep === 'checkout') {
        loadPendingPresentCheckout();
      }
      if (shouldOpenPresentShop) setShowPresentShop(true);
    }

    if (shouldOpenPresentShop && !refillStatus) {
      navigate(location.pathname, { replace: true, state: location.state || {} });
    }
  }, [location.search, location.pathname, location.state, id, navigate]);

  // Socket.IO setup for real-time call notifications
  useEffect(() => {
    if (user?.id) {
      const socketUrl = getSocketServerUrl() || window.location.origin;
      console.log('🔌 [Profile] Socket.IO:', socketUrl);
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

      // Listen for call accepted (CALLER side - receiver accepted the call)
      socket.on('call-accepted', (data) => {
        console.log('✅ [CALLER] Call accepted by receiver:', data);
        console.log('✅ [CALLER] Current outgoingCallRef:', outgoingCallRef.current);
        
        // Receiver accepted, now start the call
        // Use ref to get current value (not stale closure)
        const currentOutgoingCall = outgoingCallRef.current;
        
        if (currentOutgoingCall) {
          console.log('✅ [CALLER] Starting call now that receiver accepted:', currentOutgoingCall);
          
          // Ensure channel name is set
          if (currentOutgoingCall.channelName) {
            setCallChannelName(currentOutgoingCall.channelName);
            console.log('✅ [CALLER] Set channel name:', currentOutgoingCall.channelName);
          }
          
          // Start the appropriate call type
          if (currentOutgoingCall.callType === 'video') {
          console.log('✅ [CALLER] Starting video chat');
            setShowVideoCall(true);
          } else if (currentOutgoingCall.callType === 'voice') {
            console.log('✅ [CALLER] Starting voice call');
            setShowVoiceCall(true);
          }
          
          // Clear outgoing call state and ref
          setOutgoingCall(null);
          outgoingCallRef.current = null;
        } else {
          console.warn('⚠️ [CALLER] Received call-accepted but no outgoingCall found');
        }
      });

      socket.on('call-request-error', (data) => {
        if (handleCallAccessDenied(data)) {
          setOutgoingCall(null);
          outgoingCallRef.current = null;
          setShowVideoCall(false);
          setShowVoiceCall(false);
          return;
        }
        const msg = data?.message || 'Call could not be started.';
        alert(msg);
        setOutgoingCall(null);
        outgoingCallRef.current = null;
        setShowVideoCall(false);
        setShowVoiceCall(false);
      });

      // Listen for call rejected
      socket.on('call-rejected', (data) => {
        console.log('❌ Call rejected:', data);
        setOutgoingCall(null);
        outgoingCallRef.current = null;
        setShowVideoCall(false);
        setShowVoiceCall(false);
      });

      // Listen for call cancelled (when caller cancels before receiver accepts)
      socket.on('call-cancelled', (data) => {
        console.log('❌ Call cancelled by caller:', data);
      });

      // Listen for call ended
      socket.on('call-ended', (data) => {
        console.log('📴 Call ended:', data);
        setShowVideoCall(false);
        setShowVoiceCall(false);
        setOutgoingCall(null);
        outgoingCallRef.current = null;
        void syncCreditsAfterCall();
      });

      // Listen for new chat requests
      socket.on('new-chat-request', (data) => {
        console.log('📬 New chat request received:', data);
        // Refresh chat requests list
        fetchChatRequests();
      });

      // Listen for contact updates (new messages, new chats, calls)
      socket.on('contact-update', (data) => {
        console.log('👥 Contact update received:', data);
        // Refresh contacts list
        fetchContacts();
      });

      // Listen for call request updates (missed calls)
      socket.on('call-request-update', (data) => {
        console.log('📞 Call request update received:', data);
        // Refresh call requests list
        fetchCallRequests();
      });

      // Listen for new messages
      socket.on('new-message', (data) => {
        console.log('💬 New message received:', data);
        // Refresh contacts to update last message
        fetchContacts();
      });

      // Listen for typing events
      socket.on('user-typing', (data) => {
        console.log('⌨️ User typing:', data);
        if (data.userId && data.userId !== String(user.id)) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
          // Clear typing status after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }, 3000);
        }
      });

      // Listen for stopped typing events
      socket.on('user-stopped-typing', (data) => {
        console.log('⌨️ User stopped typing:', data);
        if (data.userId && data.userId !== String(user.id)) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      });

      socketRef.current = socket;

      return () => {
        console.log('🔌 Disconnecting socket');
        socket.disconnect();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchContacts();
      fetchChatRequests();
      fetchCallRequests();
    }
  }, [id]);
  
  // Listen for global "openPresentShop" events (from header quick presents)
  useEffect(() => {
    const handler = (event) => {
      const targetId = event.detail?.receiverId;
      if (targetId && targetId === id) {
        setShowPresentShop(true);
      }
    };
    window.addEventListener('openPresentShop', handler);
    return () => window.removeEventListener('openPresentShop', handler);
  }, [id]);
  
  // Start call when accepted globally (same profile) or via sessionStorage after navigation
  useEffect(() => {
    const onAcceptIncoming = (e) => {
      const { callType, channelName, callerId } = e.detail || {};
      if (!callerId || String(callerId) !== String(id)) return;
      if (channelName) setCallChannelName(channelName);
      if (callType === 'video') setShowVideoCall(true);
      else if (callType === 'voice') setShowVoiceCall(true);
    };
    window.addEventListener('accept-incoming-call', onAcceptIncoming);
    return () => window.removeEventListener('accept-incoming-call', onAcceptIncoming);
  }, [id]);

  // Handle call start from sessionStorage (when accepting incoming call)
  useEffect(() => {
    if (profile && id) {
      const pendingCall = sessionStorage.getItem('pendingCall');
      if (pendingCall) {
        try {
          const callData = JSON.parse(pendingCall);
          // Only start call if we're on the caller's profile
          if (callData.callerId === id) {
            // CRITICAL: Use the channel name from sessionStorage (must match caller's)
            if (callData.channelName) {
              setCallChannelName(callData.channelName);
              console.log('🔑 [RECEIVER] Using channel name from sessionStorage:', callData.channelName);
            }
            
            if (callData.callType === 'video') {
              setShowVideoCall(true);
            } else if (callData.callType === 'voice') {
              setShowVoiceCall(true);
            }
            sessionStorage.removeItem('pendingCall');
          }
        } catch (e) {
          console.error('Error parsing pending call:', e);
          sessionStorage.removeItem('pendingCall');
        }
      }
    }
  }, [profile, id]);

  // Refresh contacts and chat requests periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts();
      fetchChatRequests();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profile) {
      fetchSimilarProfiles();
    }
  }, [profile]);

  useEffect(() => {
    const ownerId = profile?.userId || id;
    if (!user?.id || !ownerId || String(user.id) === String(ownerId)) {
      setCompatibility(null);
      setCompatibilityError('');
      return;
    }

    let cancelled = false;
    const loadCompatibility = async () => {
      setCompatibilityLoading(true);
      setCompatibilityError('');
      try {
        const response = await axios.get(`/api/compatibility/with/${ownerId}`);
        if (!cancelled) setCompatibility(response.data);
      } catch (err) {
        if (!cancelled) {
          setCompatibility(null);
          setCompatibilityError(err.response?.data?.message || 'Could not load compatibility');
        }
      } finally {
        if (!cancelled) setCompatibilityLoading(false);
      }
    };

    loadCompatibility();
    return () => {
      cancelled = true;
    };
  }, [profile?.userId, id, user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/profiles/${id}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProfiles = async () => {
    try {
      const response = await axios.get('/api/profiles?limit=20');
      const similar = (response.data.profiles || [])
        .filter(p => p.userId !== id)
        .slice(0, 5);
      setSimilarProfiles(similar);
    } catch (error) {
      console.error('Fetch similar profiles error:', error);
      setSimilarProfiles([]);
    }
  };

  const fetchContacts = async () => {
    try {
      // Fetch conversations/chats from API
      const response = await axios.get('/api/messages/conversations');
      
      // Fetch call requests to get call history
      let callRequestsData = [];
      try {
        const callResponse = await axios.get('/api/messages/call-requests');
        callRequestsData = callResponse.data || [];
      } catch (callError) {
        console.error('Error fetching call requests:', callError);
      }
      
      if (response.data && Array.isArray(response.data)) {
        const contactsList = response.data.map((conv) => {
          const otherUser = conv.user || {};
          const profile = otherUser?.profile || {};
          
          // Get name from profile or email
          let contactName = 'Unknown';
          if (profile?.firstName) {
            contactName = profile.firstName;
            if (profile.lastName) {
              contactName += ` ${profile.lastName}`;
            }
          } else if (otherUser?.email) {
            contactName = otherUser.email.split('@')[0];
          }
          
          // Get avatar from profile photos
          let avatar = null;
          if (profile?.photos && Array.isArray(profile.photos) && profile.photos.length > 0) {
            avatar = profile.photos[0]?.url || null;
          }
          
          // Get last message content
          let lastMessage = t('sidebar.noMessagesYet');
          let lastMessageAt = conv.lastMessage?.createdAt || conv.lastMessage?.created_at;
          
          // Transform special last-message types (call history, add-to-contacts)
          const rawLastMsg = conv.lastMessage;
          const rawLastMsgSender = rawLastMsg?.sender ?? rawLastMsg?.sender_id;
          if (rawLastMsg && lastMessage === t('sidebar.noMessagesYet')) {
            lastMessage = rawLastMsg.content || rawLastMsg.message || lastMessage;
          }
          const lowerLastMessage =
            typeof lastMessage === 'string' ? lastMessage.toLowerCase().trim() : '';
          if (
            lowerLastMessage.includes('removed you from my contacts') &&
            rawLastMsgSender === user?.id
          ) {
            // Hide this contact if you removed them
            return null;
          }
          if (
            lowerLastMessage.includes('added you to my contacts') &&
            rawLastMsgSender === user?.id
          ) {
            lastMessage = t('sidebar.addedToContacts');
          }

          // Check for call history (missed or ended calls)
          const userId = conv.userId || otherUser?.id;
          // Find the most recent call where this user is involved (either as caller or receiver)
          const recentCall = callRequestsData
            .filter(call => {
              // Check if this contact is involved in the call
              const isContactCaller = call.callerId === userId;
              const isContactReceiver = call.receiverId === userId;
              const isCurrentUserCaller = call.callerId === user?.id;
              const isCurrentUserReceiver = call.receiverId === user?.id;
              
              // The call must involve both the current user and this contact
              return (isContactCaller || isContactReceiver) && 
                     (isCurrentUserCaller || isCurrentUserReceiver) &&
                     (call.status === 'missed' || call.status === 'completed') &&
                     (call.createdAt || call.created_at); // Handle both camelCase and snake_case
            })
            .sort((a, b) => {
              // Sort by most recent first
              const dateA = new Date(a.endedAt || a.ended_at || a.createdAt || a.created_at);
              const dateB = new Date(b.endedAt || b.ended_at || b.createdAt || b.created_at);
              return dateB - dateA;
            })[0]; // Get the most recent call
          
          // Prioritize call messages over regular messages
          if (recentCall) {
            const callDate = new Date(recentCall.endedAt || recentCall.ended_at || recentCall.createdAt || recentCall.created_at);
            const formattedDate = callDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            if (recentCall.status === 'missed') {
              const callType = recentCall.callType === 'video' ? 'Video Chat' : 'Voice Call';
              const isReceiver = recentCall.receiverId === user?.id;
              lastMessage = isReceiver 
                ? `You missed a ${callType} on ${formattedDate}`
                : `${callType} was missed on ${formattedDate}`;
              lastMessageAt = recentCall.createdAt || recentCall.created_at;
            } else if (recentCall.status === 'completed') {
              const callType = recentCall.callType === 'video' ? 'Video Chat' : 'Voice Call';
              lastMessage = `${callType} has ended on ${formattedDate}`;
              lastMessageAt = recentCall.endedAt || recentCall.ended_at || recentCall.createdAt || recentCall.created_at;
            }
          } else if (conv.lastMessage) {
            if (typeof conv.lastMessage === 'object') {
              lastMessage = conv.lastMessage.content || conv.lastMessage.message || lastMessage;
            } else {
              lastMessage = conv.lastMessage;
            }
          }
          
          const lastMsg = conv.lastMessage;
          const lastMsgSender = lastMsg?.sender ?? lastMsg?.sender_id;
          const giftFromThem = !recentCall && lastMsg?.messageType === 'gift' && lastMsgSender === userId;
          if (lastMsg?.messageType === 'gift') {
            lastMessage = giftFromThem ? t('sidebar.receivedGift') : t('sidebar.youSentGift');
          }
          
          // Determine if contact has call history (for icon overlay)
          // Check if there's any call between current user and this contact
          const hasCallHistory = callRequestsData.some(call => {
            const isContactCaller = call.callerId === userId;
            const isContactReceiver = call.receiverId === userId;
            const isCurrentUserCaller = call.callerId === user?.id;
            const isCurrentUserReceiver = call.receiverId === user?.id;
            
            // The call must involve both the current user and this contact
            return (isContactCaller || isContactReceiver) && 
                   (isCurrentUserCaller || isCurrentUserReceiver) &&
                   (call.status === 'missed' || call.status === 'completed');
          });
          
          // Check if it's a birthday (placeholder - can be enhanced later)
          const isBirthday = false; // Can be enhanced with birthday detection
          
          return {
            id: userId,
            name: contactName,
            type: null,
            message: lastMessage,
            unreadCount: conv.unreadCount || 0,
            avatar: avatar,
            lastMessageAt: lastMessageAt,
            hasCallHistory: hasCallHistory,
            recentCallType: recentCall?.callType || null,
            isBirthday: isBirthday,
            isCallMessage: recentCall ? true : false,
            giftFromThem: !!giftFromThem,
          };
        }).filter(Boolean);
        
        // Sort contacts by lastMessageAt (most recent first)
        contactsList.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
          return dateB - dateA;
        });
        
        setContacts(contactsList);
        console.log('✅ Loaded', contactsList.length, 'contacts');
      } else {
        // No conversations found
        console.log('⚠️ No conversations found, contacts list will be empty');
        setContacts([]);
      }
    } catch (error) {
      console.error('❌ Fetch contacts error:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Do not set any fallback contacts on error (just clear list)
      setContacts([]);
    }
  };

  const fetchCallRequests = async () => {
    try {
      const response = await axios.get('/api/messages/call-requests');
      
      if (response.data && Array.isArray(response.data)) {
        const requests = response.data.map((request) => {
          const caller = request.callerData || {};
          const profile = caller.profile || {};
          
          return {
            id: request.id,
            name: profile.firstName || caller.email?.split('@')[0] || 'Unknown',
            callType: request.callType, // 'video' or 'voice'
            status: request.status, // 'missed', 'completed'
            createdAt: request.createdAt || request.created_at, // Handle both camelCase and snake_case
            avatar: profile.photos?.[0]?.url || null,
            callerId: request.callerId,
          };
        });
        
        setCallRequests(requests);
        console.log('✅ Loaded', requests.length, 'call requests');
      } else {
        setCallRequests([]);
      }
    } catch (error) {
      console.error('❌ Fetch call requests error:', error);
      setCallRequests([]);
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

  const acceptChatRequestAndOpenChat = (request) =>
    acceptChatRequestAndNavigate(request, {
      navigate,
      fetchChatRequests,
      fetchContacts,
    });

  const handleAddToContacts = async (e) => {
    if (e) e.stopPropagation();
    const profileOwnerIdInner = profile?.userId ?? id;
    if (!profileOwnerIdInner || user?.id === profileOwnerIdInner) return;

    const alreadyInContacts = contacts.some((c) => String(c.id) === String(profileOwnerIdInner));
    const contentText = alreadyInContacts
      ? 'Removed you from my contacts.'
      : 'Added you to my contacts.';

    try {
      await axios.post('/api/messages', {
        receiverId: profileOwnerIdInner,
        content: contentText,
        messageType: 'text',
      });

      // Refresh contacts so this profile appears / disappears in My Contacts lists
      fetchContacts();
    } catch (error) {
      console.error('Add/remove contacts (star) error:', error);
    }
  };

  const handleChatNow = async () => {
    if (!(await ensureCanOpenChat())) return;
    setChatDraftMessage('');
    setShowChat(true);
    setShowEmailComposer(false);
  };

  const handleAskQuestion = async (question) => {
    if (!question?.trim()) return;
    if (!(await ensureCanOpenChat())) return;
    setChatDraftMessage(String(question).trim());
    setShowChat(true);
    setShowEmailComposer(false);
  };

  const handleSendEmail = async () => {
    if (!(await ensureCanSendEmailAccess())) return;
    setShowEmailComposer(true);
    setShowChat(false);
  };

  const handleVideoCall = async () => {
    if (!(await ensureCanStartCall('video'))) return;
    try {
      // Create channel name BEFORE emitting call request (must match receiver's channel name)
      const channelName = createSafeChannelName('call', user.id, id);
      console.log('🔑 [CALLER] Channel name created:', channelName);
      
      // Store channel name for RTC connection
      setCallChannelName(channelName);
      
      // Emit Socket.IO event for real-time notification
      if (socketRef.current && socketRef.current.connected && user?.id) {
        const callData = {
          callerId: String(user.id),
          receiverId: String(id),
          callType: 'video',
          channelName: channelName, // Send channel name to receiver
        };
        console.log('📞 Emitting call-request:', callData);
        socketRef.current.emit('call-request', callData);
      } else {
        console.warn('⚠️ Socket not connected, cannot send real-time notification');
        if (!socketRef.current) {
          console.error('❌ Socket ref is null');
        } else if (!socketRef.current.connected) {
          console.error('❌ Socket is not connected');
        }
      }

      // Also create database notification
      try {
        await axios.post('/api/notifications', {
          receiverId: id,
          type: 'call_request',
          title: t('profilePage.videoChatRequest'),
          message: `${user?.email || 'Someone'} wants to video chat with you`,
          relatedId: id,
          relatedType: 'video_call',
        });
      } catch (notifError) {
        console.error('Error creating video chat notification:', notifError);
      }
      
      // Store outgoing call info - wait for receiver to accept
      const outgoingCallData = {
        callType: 'video',
        channelName: channelName,
        receiverId: id,
      };
      setOutgoingCall(outgoingCallData);
      outgoingCallRef.current = outgoingCallData; // Also store in ref for socket handler
      // Don't start call yet - wait for receiver to accept
      console.log('⏳ [CALLER] Waiting for receiver to accept call...');
    } catch (error) {
      console.error('Error initiating video chat:', error);
    }
  };

  const handleAudioCall = async () => {
    if (!(await ensureCanStartCall('voice'))) return;
    try {
      // Create channel name BEFORE emitting call request (must match receiver's channel name)
      const channelName = createSafeChannelName('call', user.id, id);
      console.log('🔑 [CALLER] Channel name created:', channelName);
      
      // Store channel name for RTC connection
      setCallChannelName(channelName);
      
      // Emit Socket.IO event for real-time notification
      if (socketRef.current && socketRef.current.connected && user?.id) {
        const callData = {
          callerId: String(user.id),
          receiverId: String(id),
          callType: 'voice',
          channelName: channelName, // Send channel name to receiver
        };
        console.log('📞 Emitting call-request:', callData);
        socketRef.current.emit('call-request', callData);
      } else {
        console.warn('⚠️ Socket not connected, cannot send real-time notification');
        if (!socketRef.current) {
          console.error('❌ Socket ref is null');
        } else if (!socketRef.current.connected) {
          console.error('❌ Socket is not connected');
        }
      }

      // Also create database notification
      try {
        await axios.post('/api/notifications', {
          receiverId: id,
          type: 'call_request',
          title: t('profilePage.voiceCallRequest'),
          message: `${user?.email || 'Someone'} wants to voice call you`,
          relatedId: id,
          relatedType: 'voice_call',
        });
      } catch (notifError) {
        console.error('Error creating voice call notification:', notifError);
      }
      
      // Store outgoing call info - wait for receiver to accept
      const outgoingCallData = {
        callType: 'voice',
        channelName: channelName,
        receiverId: id,
      };
      setOutgoingCall(outgoingCallData);
      outgoingCallRef.current = outgoingCallData; // Also store in ref for socket handler
      // Don't start call yet - wait for receiver to accept
      console.log('⏳ [CALLER] Waiting for receiver to accept call...');
    } catch (error) {
      console.error('Error initiating voice call:', error);
    }
  };

  const handleEmailSent = () => {
    setShowEmailComposer(false);
    // Refresh contacts or show success message
  };

  const displayedChatRequests = showLessChatRequests ? chatRequests.slice(0, 5) : chatRequests;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">{t('profilePage.loadingProfile')}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-500">{t('profilePage.profileNotFound')}</div>
      </div>
    );
  }

  const mainPhoto = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null;
  const secondaryPhoto = profile.photos && profile.photos.length > 1 ? profile.photos[1] : null;
  const photoCount = profile.photos?.length || 0;
  const videoCount = 0; // Placeholder for video count

  const profileOwnerId = profile.userId || id;
  const isInContacts = contacts.some((c) => String(c.id) === String(profileOwnerId));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ringtone Audio Element */}
      
      <div className={`container mx-auto max-w-[1920px] px-4 sm:px-6 lg:pr-80`}>
        <div className={`flex flex-col lg:flex-row ${(showChat || showEmailComposer) ? 'lg:gap-2' : ''}`}>
          {/* Main Content - Left Column */}
          <div className={`${(showChat || showEmailComposer) ? 'w-full' : 'flex-1'} ${(showChat || showEmailComposer) ? 'hidden lg:block' : ''}`}>
            {/* Cover Photo Banner */}
            <div className="relative h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-orange-400 via-red-500 to-yellow-400 overflow-visible">
              {profile.coverPhoto ? (
                <img
                  src={profile.coverPhoto}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 via-red-500 to-yellow-400"></div>
              )}

              {/* Banner Overlay Content */}
              <div className="absolute inset-0 overflow-visible">
                {/* Top Left - Back Button */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 lg:top-4 lg:left-6 z-10">
                  <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-800 bg-opacity-90 text-white px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded hover:bg-opacity-100 transition"
                  >
                    BACK
                  </button>
                </div>

                {/* Top Right - Star icon for add to contacts / favorites */}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 lg:top-4 lg:right-6 z-10">
                  <button
                    type="button"
                    onClick={handleAddToContacts}
                    disabled={!user || user?.id === profileOwnerId}
                    className={`p-2 sm:p-3 rounded-full hover:bg-opacity-100 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      isInContacts ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 bg-opacity-90 text-white'
                    }`}
                    title={
                      !user
                        ? t('profilePage.logInToAddContacts')
                        : user?.id === profileOwnerId
                        ? t('profilePage.yourProfile')
                        : isInContacts
                        ? t('profilePage.alreadyInContacts')
                        : t('profilePage.addToContacts')
                    }
                  >
                    <FaStar
                      className={`text-sm sm:text-xl ${
                        isInContacts ? 'text-white' : 'text-yellow-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Profile Picture - Left Side, Overlapping Bottom */}
                <div className="absolute bottom-0 left-2 sm:left-4 lg:left-6 transform translate-y-1/2 z-20">
                  <div className="relative">
                    {mainPhoto ? (
                      <img
                        src={mainPhoto.url}
                        alt={profile.firstName}
                        className="w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 object-cover border-2 sm:border-4 border-white shadow-xl rounded cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          if (profile.photos && profile.photos.length > 0) {
                            setSelectedPhotoIndex(0);
                            setShowPhotoViewer(true);
                          }
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/192';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-gray-300 border-2 sm:border-4 border-white shadow-xl flex items-center justify-center rounded">
                        <FaHeart className="text-2xl sm:text-4xl lg:text-6xl text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name, Age, and Status - Right of Profile Picture, Overlaid on Cover */}
                <div className="absolute bottom-2 sm:bottom-4 lg:bottom-8 left-28 sm:left-36 md:left-40 lg:left-64 z-10 max-w-[calc(100%-120px)] sm:max-w-none">
                  <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2 flex-wrap">
                    <h1 className="text-base sm:text-xl lg:text-3xl font-bold text-white truncate">
                      {profile.firstName} {profile.lastName || ''}
                    </h1>
                    {profile.user?.isFreeUser !== false && (
                      <FreeUserBadge className="flex-shrink-0" size="lg" />
                    )}
                    {profile.user?.isVerified && (
                      <VerifiedBadge className="flex-shrink-0" size="lg" />
                    )}
                    <h1 className="text-base sm:text-xl lg:text-3xl font-bold text-white">
                      , {profile.age}
                    </h1>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1">
                    <span
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-white/70 ${
                        profile.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-white text-xs sm:text-sm font-medium drop-shadow">
                      {profile.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {profile.userId && (
                    <p className="text-white text-xs sm:text-sm truncate">ID: {profile.userId.substring(0, 12)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Sections */}
            <div className="mx-auto px-2 sm:px-4 lg:pl-8 py-4 sm:py-6 lg:py-8 mt-12 sm:mt-16 lg:mt-24">
            {user?.id && user?.id !== profileOwnerId && (
              <div className="mb-4 sm:mb-6">
                <CompatibilityPanel
                  data={compatibility}
                  loading={compatibilityLoading}
                  error={compatibilityError}
                  otherName={profile.firstName}
                  onAskQuestion={handleAskQuestion}
                />
              </div>
            )}
            {/* About Section */}
            {profile.bio && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">About {profile.firstName}</h2>
                <p className="text-gray-700 text-sm sm:text-base">
                  {showFullBio ? profile.bio : `${profile.bio.substring(0, 150)}...`}
                  {profile.bio.length > 150 && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="text-teal-600 hover:text-teal-800 ml-2"
                    >
                      {showFullBio ? t('profilePage.showLess') : t('profilePage.continueReading')}
                    </button>
                  )}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 sm:mb-4">
                <button
                  onClick={handleChatNow}
                  className="flex-1 bg-teal-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-teal-700 transition font-semibold text-sm sm:text-base flex items-center justify-center space-x-2"
                >
                  <FaHeart className="text-base sm:text-lg" />
                  <span>CHAT NOW</span>
                </button>
                <button
                  onClick={handleVideoCall}
                  className="flex-1 bg-teal-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-teal-700 transition font-semibold text-sm sm:text-base flex items-center justify-center space-x-2"
                >
                  <FaVideo className="text-base sm:text-lg" />
                  <span>VIDEO CHAT</span>
                </button>
                <button
                  onClick={handleAudioCall}
                  className="flex-1 bg-teal-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-teal-700 transition font-semibold text-sm sm:text-base flex items-center justify-center space-x-2"
                >
                  <FaPhone className="text-base sm:text-lg" />
                  <span>AUDIO CALL</span>
                </button>
                <button
                  onClick={() => setShowPresentShop(true)}
                  className="flex-1 bg-red-500 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-red-600 transition font-semibold text-sm sm:text-base flex items-center justify-center space-x-2"
                >
                  <FaGift className="text-base sm:text-lg" />
                  <span>SEND PRESENT</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 border-t border-gray-200 gap-3 sm:gap-0">
                <p className="text-gray-600 text-xs sm:text-sm">
                  Send exciting Email to your favorite man and make him happy!
                </p>
                <button
                  onClick={handleSendEmail}
                  className="w-full sm:w-auto bg-teal-600 text-white py-2 px-4 sm:px-6 rounded-lg hover:bg-teal-700 transition font-semibold text-sm sm:text-base flex items-center justify-center space-x-2"
                >
                  <FaEnvelope className="text-xs sm:text-sm" />
                  <span>SEND EMAIL</span>
                </button>
              </div>
            </div>

            {/* Videos and Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* My Videos */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-40 sm:h-56 md:h-64 bg-gray-200">
                  {videoCount > 0 ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaPlay className="text-4xl sm:text-5xl md:text-6xl text-white opacity-80" />
                      </div>
                      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex items-center space-x-1 sm:space-x-2 text-white bg-black bg-opacity-50 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm">
                        <FaVideo className="text-xs sm:text-sm" />
                        <span className="text-xs sm:text-sm font-semibold">{videoCount}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FaVideo className="text-2xl sm:text-3xl md:text-4xl text-gray-400 mx-auto mb-1 sm:mb-2" />
                        <p className="text-gray-500 text-xs sm:text-sm">{t('profilePage.noVideosYet')}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center space-x-2">
                    <FaVideo className="text-teal-600 text-sm sm:text-base" />
                    <span>My Videos</span>
                    {videoCount > 0 && <span className="text-gray-500 text-xs sm:text-sm">({videoCount})</span>}
                  </h3>
                </div>
              </div>

              {/* My Photos */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-40 sm:h-56 md:h-64 bg-gray-200">
                  {photoCount > 0 ? (
                    <>
                      <img
                        src={mainPhoto?.url}
                        alt="Photos"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          if (profile.photos && profile.photos.length > 0) {
                            setSelectedPhotoIndex(0);
                            setShowPhotoViewer(true);
                          }
                        }}
                      />
                      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex items-center space-x-1 sm:space-x-2 text-white bg-black bg-opacity-50 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm">
                        <FaCamera className="text-xs sm:text-sm" />
                        <span className="text-xs sm:text-sm font-semibold">{photoCount}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FaCamera className="text-2xl sm:text-3xl md:text-4xl text-gray-400 mx-auto mb-1 sm:mb-2" />
                        <p className="text-gray-500 text-xs sm:text-sm">{t('profilePage.noPhotosYet')}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center space-x-2">
                    <FaCamera className="text-teal-600 text-sm sm:text-base" />
                    <span>My Photos</span>
                    {photoCount > 0 && <span className="text-gray-500 text-xs sm:text-sm">({photoCount})</span>}
                  </h3>
                </div>
              </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* My Interests */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">My Interests</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {profile.interests && profile.interests.length > 0 ? (
                    profile.interests.slice(0, 4).map((interest, index) => {
                      const interestData = interestIcons[interest] || defaultInterestIcon;
                      const Icon = interestData.icon;
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 ${interestData.color} rounded-full flex items-center justify-center text-white text-xl sm:text-2xl mb-1 sm:mb-2`}>
                            <Icon />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-700 text-center">{interest}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-600 col-span-2 text-sm">{t('profilePage.noInterestsYet')}</p>
                  )}
                </div>
              </div>

              {/* About Me */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">About Me</h2>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                  <p><span className="font-semibold">Zodiac sign:</span> {getDisplayZodiac(profile.lifestyle) || 'No answer'}</p>
                  <p><span className="font-semibold">Live in:</span> {profile.location?.city || 'No answer'}, {profile.location?.country || ''}</p>
                  <p><span className="font-semibold">Work as:</span> {profile.lifestyle?.work || 'No answer'}</p>
                  <p><span className="font-semibold">Education:</span> {profile.lifestyle?.education || 'No answer'}</p>
                  <p><span className="font-semibold">Know:</span> {profile.lifestyle?.languages?.join(', ') || 'No answer'}</p>
                  <p><span className="font-semibold">Relationship:</span> {profile.lifestyle?.relationship || 'No answer'}</p>
                  <p><span className="font-semibold">Have kids:</span> {profile.lifestyle?.haveKids !== undefined ? (profile.lifestyle.haveKids ? 'Yes' : 'No') : 'No answer'}</p>
                  <p><span className="font-semibold">Smoke:</span> {profile.lifestyle?.smoke || 'No answer'}</p>
                  <p><span className="font-semibold">Drink:</span> {profile.lifestyle?.drink || 'No answer'}</p>
                  <p><span className="font-semibold">Height:</span> {profile.lifestyle?.height || 'No answer'}</p>
                  <p><span className="font-semibold">Body type:</span> {profile.lifestyle?.bodyType || 'No answer'}</p>
                  <p><span className="font-semibold">Eyes:</span> {profile.lifestyle?.eyes || 'No answer'}</p>
                  <p><span className="font-semibold">Hair:</span> {profile.lifestyle?.hair || 'No answer'}</p>
                </div>
              </div>

              {/* I'm Looking for */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">I'm Looking for</h2>
                <div className="text-gray-700 text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                  <p>
                    {profile.preferences?.lookingFor === 'male' && 'Man'}
                    {profile.preferences?.lookingFor === 'female' && 'Woman'}
                    {profile.preferences?.lookingFor === 'both' && 'Both'},{' '}
                    {profile.preferences?.ageRange?.min || 18} years and older
                  </p>
                  {profile.preferences?.description && (
                    <p className="mt-3 leading-relaxed">{profile.preferences.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* See more people like Sam */}
            {similarProfiles.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">{t('profilePage.seeMorePeopleLike')} {profile.firstName}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                  {similarProfiles.map((similar) => (
                    <div
                      key={similar.id || similar.userId}
                      onClick={() => navigate(`/profile/${similar.userId}`)}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                    >
                      {similar.photos && similar.photos.length > 0 ? (
                        <img
                          src={similar.photos[0].url}
                          alt={similar.firstName}
                          className="w-full h-32 sm:h-40 md:h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-200 flex items-center justify-center">
                          <FaHeart className="text-2xl sm:text-3xl md:text-4xl text-gray-400" />
                        </div>
                      )}
                      <div className="p-2 sm:p-3">
                        <h3 className="font-semibold text-xs sm:text-sm">
                          {similar.firstName}, {similar.age}
                        </h3>
                        {similar.bio && (
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-1 line-clamp-2">
                            {similar.bio}
                          </p>
                        )}
                        <div className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-500">
                          {similar.photos && (
                            <span className="flex items-center space-x-1">
                              <FaCamera className="text-xs" />
                              <span>{similar.photos.length}</span>
                            </span>
                          )}
                          {similar.isOnline && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Dashboard */}
            <div className="text-center mb-4 sm:mb-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-300 text-gray-700 px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm rounded-lg hover:bg-gray-400 transition w-full sm:w-auto"
              >
                BACK TO DASHBOARD
              </button>
            </div>
          </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-4 sm:py-6 mt-6 sm:mt-12">
              <div className="container mx-auto px-2 sm:px-4 text-center text-xs sm:text-sm">
                <p className="mb-1 sm:mb-2">Copyright Vantage Dating {new Date().getFullYear()}. All rights reserved.</p>
              </div>
            </footer>
          </div>

          {/* Chat Window - Middle Panel (when chat is open) */}
          {showChat && user?.id && (
            <div className="w-full min-w-0 max-w-[100vw] lg:w-[56%] overflow-hidden flex flex-col min-h-0 max-lg:fixed max-lg:inset-x-0 max-lg:top-[calc(3.75rem+env(safe-area-inset-top,0px))] max-lg:bottom-0 max-lg:z-40 max-lg:pb-[env(safe-area-inset-bottom,0px)] lg:sticky lg:top-[calc(3.75rem+env(safe-area-inset-top,0px))] lg:h-[calc(100dvh-3.75rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] lg:max-h-[calc(100dvh-3.75rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]">
              <div className="bg-white h-full min-h-0 rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                <AgoraChat
                  userId={user.id}
                  remoteUserId={id}
                  initialMessage={chatDraftMessage}
                  onMessageSent={() => setChatDraftMessage('')}
                  onClose={() => {
                    setShowChat(false);
                    setChatDraftMessage('');
                  }}
                  embedded={true}
                  onOpenEmail={async () => {
                    if (!(await ensureCanSendEmailAccess())) return;
                    setShowChat(false);
                    setShowEmailComposer(true);
                  }}
                />
              </div>
            </div>
          )}

          {/* Email Composer - Middle Panel (when email composer is open) */}
          {showEmailComposer && profile && (
            <div className="w-full min-w-0 max-w-[100vw] lg:w-[56%] overflow-hidden flex flex-col min-h-0 max-lg:fixed max-lg:inset-x-0 max-lg:top-[calc(3.75rem+env(safe-area-inset-top,0px))] max-lg:bottom-0 max-lg:z-40 lg:sticky lg:top-[calc(3.75rem+env(safe-area-inset-top,0px))] lg:h-[calc(100dvh-3.75rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] lg:max-h-[calc(100dvh-3.75rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]">
              <ProfileEmailComposer
                profile={profile}
                onClose={() => setShowEmailComposer(false)}
                onSent={handleEmailSent}
                onOpenChat={async () => {
                  if (!(await ensureCanOpenChat())) return;
                  setShowEmailComposer(false);
                  setShowChat(true);
                }}
              />
            </div>
          )}

        </div>
      </div>

      {/* Right Sidebar - Same layout as Dashboard/Inbox */}
      <div className="hidden lg:flex flex-col w-80 bg-white border-l border-gray-200 h-screen fixed right-0 top-16 overflow-y-auto z-40">
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
          contactsMaxHeight="max-h-96"
          chatRequestsMaxHeight="max-h-96"
          chatRequestLimit={5}
        />
      </div>

      {/* Present Shop Modal */}
      {showPresentShop && profile && (
        <PresentShopModal
          isOpen={showPresentShop}
          onClose={() => {
            setShowPresentShop(false);
            setPresentCheckoutState(null);
            sessionStorage.removeItem('pendingPresentCheckout');
          }}
          receiver={profile}
          initialStep={presentCheckoutState?.initialStep || 'shop'}
          initialCartItems={presentCheckoutState?.initialCartItems || []}
        />
      )}

      {/* Outgoing Call Waiting UI (Caller side - waiting for receiver to accept) */}
      {outgoingCall && !showVideoCall && !showVoiceCall && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-0 sm:mx-4 text-center pt-[max(1.5rem,env(safe-area-inset-top))]">
            {(profile?.photos?.[0]?.url || (typeof profile?.photos?.[0] === 'string' ? profile.photos[0] : null)) ? (
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 border-4 border-teal-400 shadow-lg animate-pulse">
                <img 
                  src={profile.photos[0]?.url || profile.photos[0]} 
                  alt={profile.firstName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                <span className="text-5xl font-bold text-white">
                  {profile?.firstName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {profile?.firstName || 'Calling...'}
            </h3>
            <p className="text-gray-600 mb-4">
              {outgoingCall.callType === 'video' ? 'Video' : 'Voice'} Call
            </p>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-gray-500 mb-6">{t('profilePage.waitingForAccept')} {profile?.firstName || 'user'} {t('profilePage.toAccept')}</p>
            <button
              onClick={() => {
                console.log('❌ [CALLER] Canceling call');
                if (socketRef.current && socketRef.current.connected && user?.id && outgoingCall) {
                  // Emit call-cancel event to notify receiver
                  socketRef.current.emit('call-cancel', {
                    callerId: String(user.id),
                    receiverId: String(outgoingCall.receiverId),
                  });
                  console.log('✅ [CALLER] Call cancel event emitted');
                }
                // Clear local state
                setOutgoingCall(null);
                outgoingCallRef.current = null;
                setCallChannelName(null);
                console.log('✅ [CALLER] Call canceled, UI cleared');
              }}
              className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl transition-all duration-200 font-semibold"
            >
              Cancel Call
            </button>
          </div>
        </div>
      )}

      {/* Agora Components - Only show after receiver accepts */}
      {showVideoCall && user?.id && callChannelName && (
        <AgoraVideoCall
          channelName={callChannelName}
          userId={user.id}
          remoteUserId={profile?.firstName || profile?.userId || id || 'Unknown'}
          remoteUserProfile={profile || null} // Pass full profile object (may be null if still loading)
          onEndCall={(duration) => {
            setShowVideoCall(false);
            setCallChannelName(null); // Clear channel name
            // Emit call end event with duration
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('call-end', {
                userId: user.id,
                otherUserId: id,
                duration: duration || 0, // Pass call duration in seconds
              });
            }
            void syncCreditsAfterCall();
          }}
          callType="video"
        />
      )}

      {showVoiceCall && user?.id && callChannelName && (
        <AgoraVoiceCall
          channelName={callChannelName}
          userId={user.id}
          remoteUserId={profile?.firstName || profile?.userId || id || 'Unknown'}
          remoteUserProfile={profile || null} // Pass full profile object (may be null if still loading)
          onEndCall={(duration) => {
            setShowVoiceCall(false);
            setCallChannelName(null); // Clear channel name
            // Emit call end event with duration
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('call-end', {
                userId: user.id,
                otherUserId: id,
                duration: duration || 0, // Pass call duration in seconds
              });
            }
            void syncCreditsAfterCall();
          }}
        />
      )}

      {/* Photo Viewer Modal */}
      {showPhotoViewer && profile?.photos && profile.photos.length > 0 && (
        <ProfilePhotoViewer
          isOpen={showPhotoViewer}
          onClose={() => setShowPhotoViewer(false)}
          photos={profile.photos}
          initialIndex={selectedPhotoIndex}
          profileName={profile.firstName}
        />
      )}
    </div>
  );
};

export default Profile;
