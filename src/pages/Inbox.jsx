import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { connectAppSocket, getSocketServerUrl } from '../utils/socketServerUrl';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaEnvelope, FaEnvelopeOpen, FaTrash, FaReply, FaCamera, FaVideo, FaSpinner, FaSearch, FaVolumeUp, FaEllipsisV, FaPhone, FaGift, FaUsers } from 'react-icons/fa';
import EmailDetailModal from '../components/EmailDetailModal';
import InboxEmailComposer from '../components/InboxEmailComposer';
import ContactsSidebar from '../components/ContactsSidebar';
import {
  mapChatRequestFromApi,
  enrichChatRequestsWithProfiles,
  acceptChatRequestAndNavigate,
} from '../utils/chatRequests';
import { useServiceAccess } from '../hooks/useServiceAccess';

const Inbox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, translatePageNow } = useLanguage();
  const { ensureCanSendEmailAccess } = useServiceAccess();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [composerEmail, setComposerEmail] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [showLessChatRequests, setShowLessChatRequests] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set()); // Track which users are typing
  const socketRef = useRef(null);

  // Translate page when Inbox loads (for non-English: Settings, dropdown, Inbox, all)
  useEffect(() => {
    const lang = localStorage.getItem('app_language') || localStorage.getItem('selectedLanguage') || 'en';
    if (lang === 'en' || lang === 'en-uk') return;
    const id = setTimeout(() => translatePageNow?.(), 600);
    return () => clearTimeout(id);
  }, [translatePageNow]);

  // Socket.IO setup for real-time email updates
  useEffect(() => {
    if (user?.id) {
      const socketUrl = getSocketServerUrl() || window.location.origin;
      console.log('🔌 [INBOX] Socket.IO:', socketUrl);
      const socket = connectAppSocket({
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        upgrade: true,
        rememberUpgrade: true,
      });

      socket.on('connect', () => {
        console.log('✅ [INBOX] Socket connected:', socket.id);
        socket.emit('join-room', String(user.id));
        console.log('📢 [INBOX] Joined room for user:', user.id);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ [INBOX] Socket connection error:', error);
        // Don't show error to user - socket will auto-reconnect
      });

      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, need to manually reconnect
          console.log('⚠️ [INBOX] Socket disconnected by server, reconnecting...');
          socket.connect();
        } else {
          // Client disconnected or transport error - will auto-reconnect
          console.log('⚠️ [INBOX] Socket disconnected:', reason);
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 [INBOX] Socket reconnected after', attemptNumber, 'attempts');
        socket.emit('join-room', String(user.id));
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 [INBOX] Reconnection attempt', attemptNumber);
      });

      socket.on('reconnect_error', (error) => {
        console.error('❌ [INBOX] Reconnection error:', error);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌ [INBOX] Reconnection failed after all attempts');
        // Could show a notification to user here
      });

      // Listen for new emails
      socket.on('new-email', async (data) => {
        console.log('📧 [INBOX] New email received:', data);
        // Fetch the full email details
        try {
          const response = await axios.get(`/api/messages/emails/${data.messageId}`);
          const newEmail = response.data;
          
          // Add to emails list if it matches current filter
          setEmails(prevEmails => {
            // Check if email already exists (avoid duplicates)
            const exists = prevEmails.find(e => e.id === newEmail.id);
            if (exists) return prevEmails;
            
            // Add to beginning of list
            return [newEmail, ...prevEmails];
          });
          
          // Update contacts if needed
          fetchContacts();
        } catch (error) {
          console.error('Error fetching new email details:', error);
          // Still refresh the list
          fetchEmails();
        }
      });

      // Listen for email read status updates
      socket.on('email-read', (data) => {
        console.log('✅ [INBOX] Email marked as read:', data);
        setEmails(prevEmails => 
          prevEmails.map(email => 
            email.id === data.emailId 
              ? { ...email, isRead: true, readAt: data.readAt }
              : email
          )
        );
      });

      // Listen for contact updates and new chat messages (real-time My Contacts sidebar)
      socket.on('contact-update', (data) => {
        console.log('👥 [INBOX] Contact update received:', data);
        fetchContacts();
      });
      socket.on('new-message', () => {
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

      socketRef.current = socket;

      return () => {
        console.log('🔌 [INBOX] Disconnecting socket');
        socket.disconnect();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEmails();
    fetchContacts();
    fetchChatRequests();
  }, [filter]);

  // Open that email in inbox (detail modal) when landing from SendGrid link (e.g. ?messageId=123)
  const openMessageId = searchParams.get('messageId');
  useEffect(() => {
    if (!openMessageId || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await axios.get(`/api/messages/emails/${openMessageId}`);
        const email = response?.data;
        if (cancelled || !email) return;
        setSelectedEmail(email);
        setShowEmailModal(true);
        setSearchParams({}, { replace: true });
      } catch (_) {
        if (!cancelled) setSearchParams({}, { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [openMessageId, user?.id, setSearchParams]);

  // Handle hash navigation - show sidebar on mobile when hash is present
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [mobileSection, setMobileSection] = useState(null);

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.substring(1); // Remove the #
      // On mobile, show sidebar with the requested section
      if (window.innerWidth < 1024) {
        setMobileSection(elementId);
        setShowMobileSidebar(true);
      } else {
        // On desktop, scroll to the section
        setTimeout(() => {
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    } else {
      setShowMobileSidebar(false);
      setMobileSection(null);
    }
  }, [location.hash]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/emails?filter=${filter}`);
      setEmails(response.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axios.get('/api/messages/conversations');
      if (response.data && Array.isArray(response.data)) {
        const contactsList = response.data.map((conv) => {
          const otherUser = conv.user || {};
          const profile = otherUser?.profile || {};
          
          let contactName = 'Unknown';
          if (profile?.firstName) {
            contactName = profile.firstName;
            if (profile.lastName) {
              contactName += ` ${profile.lastName}`;
            }
          } else if (otherUser?.email) {
            contactName = otherUser.email.split('@')[0];
          }
          
          let avatar = null;
          if (profile?.photos && Array.isArray(profile.photos) && profile.photos.length > 0) {
            avatar = profile.photos[0]?.url || null;
          }
          
          let lastMessage = t('sidebar.noMessagesYet');
          if (conv.lastMessage) {
            if (typeof conv.lastMessage === 'object') {
              lastMessage = conv.lastMessage.content || conv.lastMessage.message || lastMessage;
            } else {
              lastMessage = conv.lastMessage;
            }
          }
          
          const lastMsg = conv.lastMessage;
          const lastMsgSender = lastMsg?.sender ?? lastMsg?.sender_id;
          const giftFromThem = lastMsg?.messageType === 'gift' && lastMsgSender === (conv.userId || otherUser?.id);
          const lowerLastMessage =
            typeof lastMessage === 'string' ? lastMessage.toLowerCase().trim() : '';
          if (lastMsg?.messageType === 'gift') {
            lastMessage = giftFromThem ? t('sidebar.receivedGift') : t('sidebar.youSentGift');
          }
          if (
            lowerLastMessage.includes('removed you from my contacts') &&
            lastMsgSender === user?.id
          ) {
            // Hide this contact – you removed them
            return null;
          }
          if (
            lowerLastMessage.includes('added you to my contacts') &&
            lastMsgSender === user?.id
          ) {
            lastMessage = t('sidebar.addedToContacts');
          }
          
          return {
            id: conv.userId || otherUser?.id,
            name: contactName,
            type: null,
            message: lastMessage,
            unreadCount: conv.unreadCount || 0,
            avatar: avatar,
            lastMessageAt: conv.lastMessage?.createdAt || conv.lastMessage?.created_at,
            giftFromThem: !!giftFromThem,
          };
        }).filter(Boolean);
        
        const filtered = contactsList.filter(
          (c) => c.lastMessageAt || (c.message && c.message !== t('sidebar.noMessagesYet'))
        );
        
        filtered.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
          return dateB - dateA;
        });
        
        setContacts(filtered);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
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
      }
    } catch (error) {
      console.error('Error fetching chat requests:', error);
      setChatRequests([]);
    }
  };

  const acceptChatRequestAndOpenChat = (request) =>
    acceptChatRequestAndNavigate(request, {
      navigate,
      fetchChatRequests,
      fetchContacts,
    });

  const handleEmailClick = async (email) => {
    try {
      const response = await axios.get(`/api/messages/emails/${email.id}`);
      const updatedEmail = response.data;
      setSelectedEmail(updatedEmail);
      setShowEmailModal(true);
      
      // Update email in list with read status
      setEmails(prevEmails => 
        prevEmails.map(e => 
          e.id === email.id 
            ? { ...e, isRead: updatedEmail.isRead, readAt: updatedEmail.readAt }
            : e
        )
      );
    } catch (error) {
      console.error('Error fetching email:', error);
    }
  };

  const handleReplyClick = async (email) => {
    if (!(await ensureCanSendEmailAccess())) return;
    setComposerEmail(email);
    setShowComposer(true);
    setShowEmailModal(false);
  };

  const handleDelete = async (emailId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this email?')) return;

    try {
      setDeletingId(emailId);
      await axios.delete(`/api/messages/emails/${emailId}`);
      setEmails(emails.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Failed to delete email');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReply = (email) => {
    const receiverId = email.sender === user.id ? email.receiver : email.sender;
    navigate(`/compose-email?to=${receiverId}&replyTo=${email.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Just now';
    }

    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'Just now';
    }

    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      // Today: Show time only, e.g., "04:41"
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (days === 1) {
      // Yesterday: Show "Yesterday, HH:MM"
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    } else if (days < 7) {
      // This week: Show weekday and time, e.g., "Monday, 04:41"
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${weekday}, ${time}`;
    } else {
      // Older: Show month, day, and time, e.g., "Dec 29, 13:18"
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${monthDay}, ${time}`;
    }
  };

  const getSenderName = (email) => {
    if (email.sender === user.id) {
      return email.receiverData?.profile?.firstName || email.receiverData?.email?.split('@')[0] || 'Unknown';
    }
    return email.senderData?.profile?.firstName || email.senderData?.email?.split('@')[0] || 'Unknown';
  };

  const getSenderImage = (email) => {
    if (email.sender === user.id) {
      const photos = email.receiverData?.profile?.photos;
      if (photos && Array.isArray(photos) && photos.length > 0) {
        return photos[0]?.url || photos[0] || null;
      }
      return null;
    }
    const photos = email.senderData?.profile?.photos;
    if (photos && Array.isArray(photos) && photos.length > 0) {
      return photos[0]?.url || photos[0] || null;
    }
    return null;
  };

  const getPreview = (content) => {
    if (!content) return 'No content';
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    // Show more characters for better preview (matching screenshot)
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };

  const hasMedia = (email) => {
    return !!email.mediaUrl;
  };

  const displayedChatRequests = showLessChatRequests ? chatRequests.slice(0, 5) : chatRequests;
  const totalUnreadContacts = contacts.filter(c => c.unreadCount > 0).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-2 sm:px-4 max-w-6xl">
        <div className="flex h-[calc(100*var(--vh)-64px-env(safe-area-inset-top,0px))] min-h-0">
           {/* Main Inbox Area */}
           <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile contacts + filter row */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white lg:hidden px-2">
            <button
              type="button"
              onClick={() => {
                setMobileSection('contacts-sidebar');
                setShowMobileSidebar(true);
              }}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              <FaUsers className="text-base" />
              <span>{t('common.contacts')}</span>
              {totalUnreadContacts > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {totalUnreadContacts > 99 ? '99+' : totalUnreadContacts}
                </span>
              )}
            </button>
          </div>
          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 min-w-0 px-3 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('inbox.all')}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 min-w-0 px-3 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'unread'
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('inbox.unread')}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`flex-1 min-w-0 px-3 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'read'
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('inbox.readUnanswered')}
            </button>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin text-3xl text-nex-orange" />
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaEnvelope className="text-4xl mx-auto mb-4 opacity-50" />
                <p>{t('inbox.noEmailsFound')}</p>
              </div>
            ) : (
              <div>
                {emails.map((email) => {
                  const isUnread = !email.isRead && email.receiver === user.id;
                  const isSelected = selectedEmail?.id === email.id;
                  const senderName = getSenderName(email);
                  const senderImage = getSenderImage(email);
                  const preview = getPreview(email.content);
                  
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={`flex items-center p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      {/* Profile Picture */}
                      <div className="flex-shrink-0 mr-4">
                        {senderImage ? (
                          <img
                            src={senderImage}
                            alt={senderName}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {senderName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                       {/* Message Content */}
                       <div className="flex-1 min-w-0 ml-4">
                         <div className="flex items-center justify-between mb-1">
                           <span className={`font-semibold text-sm ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                             {senderName}
                           </span>
                           <div className="flex items-center gap-2 ml-4">
                             {hasMedia(email) && (
                               <>
                                 <FaVideo className="text-gray-400 text-xs" />
                                 <FaCamera className="text-gray-400 text-xs" />
                               </>
                             )}
                             {!hasMedia(email) && email.mediaUrl && (
                               <FaCamera className="text-gray-400 text-xs" />
                             )}
                           </div>
                         </div>
                         <div className="flex items-center justify-between gap-4">
                           <p className="text-sm text-gray-600 mb-2 leading-relaxed" style={{ 
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical',
                             overflow: 'hidden'
                           }}>
                             {preview}
                           </p>
                           <div className="flex items-center gap-2 flex-shrink-0">
                             <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                               {formatDate(email.createdAt || email.created_at)}
                             </span>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 // Show menu or delete
                               }}
                               className="text-gray-400 hover:text-gray-600 p-1 ml-4"
                             >
                               <FaEllipsisV className="text-xs" />
                             </button>
                           </div>
                         </div>
                       </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay - same ContactsSidebar as desktop */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileSidebar(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold text-gray-800">{t('common.contacts')}</h2>
              <button
                type="button"
                onClick={() => setShowMobileSidebar(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <ContactsSidebar
                contacts={contacts}
                chatRequests={chatRequests}
                typingUsers={typingUsers}
                onContactClick={(contact) => {
                  if (contact.id && contact.id !== 'system-concierge') {
                    navigate(`/profile/${contact.id}`, { state: { openChat: true } });
                    setShowMobileSidebar(false);
                  }
                }}
                onAcceptChatRequest={(request) => {
                  setShowMobileSidebar(false);
                  acceptChatRequestAndOpenChat(request);
                }}
                showLessChatRequests={showLessChatRequests}
                onToggleShowMoreChatRequests={() => setShowLessChatRequests(!showLessChatRequests)}
                contactsMaxHeight="max-h-64"
                chatRequestsMaxHeight="max-h-80"
                chatRequestLimit={5}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {/* Right Sidebar - Contacts and Chat Requests - Hidden on mobile */}
      <div id="contacts-sidebar" className="hidden lg:flex flex-col w-80 bg-white border-l border-gray-200 h-screen fixed right-0 top-16 overflow-y-auto z-40">
        <ContactsSidebar
          contacts={contacts}
          chatRequests={chatRequests}
          typingUsers={typingUsers}
          onContactClick={(contact) => {
            if (contact.id && contact.id !== 'system-concierge') {
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

      {/* Email Detail Modal */}
      <EmailDetailModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedEmail(null);
        }}
        email={selectedEmail}
        onReply={(email) => handleReplyClick(email)}
        user={user}
      />

      {/* Email Composer Modal */}
      {showComposer && composerEmail && (
        <InboxEmailComposer
          email={composerEmail}
          onClose={() => {
            setShowComposer(false);
            setComposerEmail(null);
          }}
          onSent={() => {
            fetchEmails();
            fetchContacts();
          }}
          user={user}
        />
      )}
    </div>
  );
};

export default Inbox;
