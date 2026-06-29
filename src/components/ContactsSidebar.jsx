import { FaEnvelope, FaGift, FaSearch, FaVolumeUp, FaVideo } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

/**
 * Single sidebar component for the whole website: My Contacts + Chat Requests.
 * Use this component everywhere you need the contacts/chat-requests sidebar
 * (Dashboard, Profile, MyProfile, Inbox, Header modal, mobile overlay).
 * Do not duplicate contact or chat-request list UI—always use ContactsSidebar.
 *
 * @param {Object[]} contacts - List of { id, name, avatar, message, unreadCount, lastMessageAt, type, giftFromThem, hasCallHistory, isBirthday, isCallMessage }
 * @param {Object[]} chatRequests - List of { id, name, avatar, message, status, senderId?, isVideoChat?, isAudioChat?, hasEmail?, createdAt? }
 * @param {Set<string>} [typingUsers] - Set of contact ids currently typing
 * @param {(contact: Object) => void} onContactClick
 * @param {(request: Object) => void} onAcceptChatRequest
 * @param {(request: Object) => void} [onRejectChatRequest] - If provided, show Accept/Reject buttons; else show REPLY
 * @param {boolean} showLessChatRequests
 * @param {() => void} onToggleShowMoreChatRequests
 * @param {string} [searchValue]
 * @param {(value: string) => void} [onSearchChange]
 * @param {string} [className]
 * @param {string} [contactsMaxHeight='max-h-64']
 * @param {string} [chatRequestsMaxHeight='max-h-96']
 * @param {boolean} [showSearch=true]
 * @param {boolean} [compact=false] - Smaller avatars/text for modals
 * @param {number} [chatRequestLimit=5] - Show more/less threshold and initial slice
 */
const ContactsSidebar = ({
  contacts = [],
  chatRequests = [],
  typingUsers = new Set(),
  onContactClick,
  onAcceptChatRequest,
  onRejectChatRequest,
  showLessChatRequests,
  onToggleShowMoreChatRequests,
  searchValue = '',
  onSearchChange,
  className = '',
  contactsMaxHeight = 'max-h-64',
  chatRequestsMaxHeight = 'max-h-96',
  showSearch = true,
  compact = false,
  chatRequestLimit = 5,
}) => {
  const { t } = useLanguage();
  const pendingRequests = chatRequests.filter((r) => !r.status || r.status === 'pending');
  const displayedRequests =
    showLessChatRequests && pendingRequests.length > chatRequestLimit
      ? pendingRequests.slice(0, chatRequestLimit)
      : pendingRequests;
  const showMoreLess =
    pendingRequests.length > chatRequestLimit && onToggleShowMoreChatRequests;

  const avatarSize = compact ? 'w-10 h-10' : 'w-12 h-12';
  const avatarSizeContact = compact ? 'w-10 h-10' : 'w-12 h-12';
  const titleClass = compact ? 'text-base' : 'text-base';

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* My Contacts */}
      {/* My Contacts header stays visible at top while scrolling */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold text-gray-800 ${titleClass}`}>{t('sidebar.myContacts')}</h3>
          {contacts.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              {contacts.filter((c) => c.unreadCount > 0).reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
            </span>
          )}
        </div>

        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaEnvelope className="text-gray-400 text-2xl" />
            </div>
            <p className="text-sm text-gray-500">{t('sidebar.noContactsYet')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('sidebar.startChattingHint')}</p>
          </div>
        ) : (
          <div className={`space-y-2 mb-4 ${contactsMaxHeight} overflow-y-auto`}>
            {contacts.map((contact) => {
              const isCallMessage =
                contact.isCallMessage || contact.message?.includes?.('missed') || contact.message?.includes?.('ended');
              const isBirthday = contact.isBirthday;
              return (
                <div
                  key={contact.id || `contact-${contact.name}`}
                  className={`flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition group ${
                    isBirthday ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onContactClick(contact)}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`${contact.id === 'system-concierge' && !compact ? 'w-14 h-14 rounded-lg' : `${avatarSizeContact} rounded-full`} bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-teal-300 transition`}
                    >
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name || 'Contact'}
                          className={`w-full h-full ${contact.id === 'system-concierge' && !compact ? 'rounded-lg' : 'rounded-full'} object-cover`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {(contact.name && contact.name[0]?.toUpperCase()) || '?'}
                        </span>
                      )}
                    </div>
                    {contact.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                      </span>
                    )}
                    {contact.hasCallHistory && contact.id !== 'system-concierge' && !compact && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white z-10">
                        <FaVideo className="text-gray-600 text-xs" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="font-semibold text-gray-800 text-sm truncate">
                          {contact.name || 'Unknown'}
                        </span>
                        {contact.type && (
                          <span className="text-red-500 text-xs font-medium whitespace-nowrap bg-red-50 px-2 py-0.5 rounded">
                            {contact.type}
                          </span>
                        )}
                      </div>
                      {contact.unreadCount > 0 && compact && (
                        <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 ml-2">
                          {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${isCallMessage ? 'text-gray-500 italic' : 'text-gray-600'}`}>
                      {typingUsers.has(String(contact.id)) ? (
                        <span className="text-gray-500 italic">{t('sidebar.typing')}</span>
                      ) : contact.giftFromThem ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                          <FaGift className="text-gray-400 flex-shrink-0" />
                          {t('sidebar.receivedGift')}
                        </span>
                      ) : (
                        contact.message || t('sidebar.noMessagesYet')
                      )}
                    </p>
                    {contact.lastMessageAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(contact.lastMessageAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showSearch && (
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              type="text"
              placeholder={t('sidebar.searchContact')}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nex-orange focus:border-transparent text-sm bg-white"
            />
            <FaVolumeUp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition" />
          </div>
        )}
      </div>

      {/* Chat Requests */}
      <div className="p-4 flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <h3 className={`font-semibold text-gray-800 ${titleClass}`}>{t('sidebar.chatRequests')}</h3>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                {pendingRequests.length}
              </span>
            )}
          </div>
          {showMoreLess && (
            <button
              type="button"
              onClick={onToggleShowMoreChatRequests}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
            >
              {showLessChatRequests ? t('sidebar.showMore') : t('sidebar.showLess')}
            </button>
          )}
        </div>

        <div className={`space-y-3 overflow-y-auto flex-1 min-h-0 ${chatRequestsMaxHeight}`}>
          {displayedRequests.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{t('sidebar.noChatRequests')}</p>
          ) : (
            displayedRequests.map((request) => {
              const openProfileWithChat = () => onAcceptChatRequest(request);
              const showVideoIcon = request.isVideoChat;
              const showAudioIcon = request.isAudioChat;
              const showEmailIcon = request.hasEmail;

              return (
                <div
                  key={request.id}
                  className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition border border-gray-100"
                  onClick={onRejectChatRequest ? undefined : openProfileWithChat}
                >
                  <div className="flex-shrink-0 mr-3">
                    <div className={`${avatarSize} rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden`}>
                      {request.avatar ? (
                        <img
                          src={request.avatar}
                          alt={request.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-white text-sm font-semibold">
                          {request.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {request.name || 'Unknown'}
                      </h4>
                      {onRejectChatRequest ? (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAcceptChatRequest(request);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded transition"
                          >
                            {t('sidebar.accept')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRejectChatRequest(request);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded transition"
                          >
                            {t('sidebar.reject')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProfileWithChat();
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full transition"
                        >
                          {t('common.reply')}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {showVideoIcon && <FaVideo className="text-green-500 text-xs flex-shrink-0" />}
                      {showAudioIcon && <FaVolumeUp className="text-blue-500 text-xs flex-shrink-0" />}
                      {showEmailIcon && <FaEnvelope className="text-red-500 text-xs flex-shrink-0" />}
                      <p
                        className="text-xs text-gray-600 truncate flex-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcceptChatRequest(request);
                        }}
                      >
                        {request.message || t('sidebar.newChatRequest')}
                      </p>
                    </div>
                    {request.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsSidebar;
