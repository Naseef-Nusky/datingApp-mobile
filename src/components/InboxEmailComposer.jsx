import { useState, useRef, useEffect } from 'react';
import { FaEnvelope, FaSmile, FaCamera, FaVideo, FaPaperPlane, FaTimes, FaEllipsisV } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';

const VIDEO_THUMBNAIL_URL = 'https://nexdatingmedia.lon1.digitaloceanspaces.com/Icons/video_thumbnail.png';

const InboxEmailComposer = ({ email, onClose, onSent, user }) => {
  const { fetchUser } = useAuth();
  const { handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [emailAttachments, setEmailAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [catalogGifts, setCatalogGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [selectedGifts, setSelectedGifts] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch virtual gift catalog when composer is open (no physical presents)
  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    const load = async () => {
      setLoadingGifts(true);
      try {
        const { data } = await axios.get('/api/gifts/catalog?type=virtual');
        if (!cancelled) setCatalogGifts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setCatalogGifts([]);
      } finally {
        if (!cancelled) setLoadingGifts(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [email]);

  if (!email) return null;

  const getSenderName = () => {
    if (email.sender === user.id) {
      return email.receiverData?.profile?.firstName || email.receiverData?.email?.split('@')[0] || 'Unknown';
    }
    return email.senderData?.profile?.firstName || email.senderData?.email?.split('@')[0] || 'Unknown';
  };

  const getSenderImage = () => {
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

  const getReceiverId = () => {
    // If we're replying, the receiver is the original sender
    // If email.sender is current user, we sent it, so receiver is the other person
    // If email.receiver is current user, we received it, so we reply to the sender
    if (email.sender === user.id) {
      // We sent this email, so receiver is the other person
      return email.receiver;
    } else {
      // We received this email, so we reply to the sender
      return email.sender;
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedMedia && selectedGifts.length === 0 && emailAttachments.length === 0) {
      alert('Please enter a message, add a photo/video, or add a gift');
      return;
    }

    try {
      setSending(true);
      const receiverId = getReceiverId();

      for (const gift of selectedGifts) {
        try {
          await axios.post('/api/gifts/send', { receiverId, giftId: gift.id });
          if (fetchUser) fetchUser();
        } catch (giftErr) {
          const data = giftErr.response?.data;
          const msg = data?.message || 'Failed to send gift';
          if (!handleInsufficientCreditsError(giftErr)) {
            alert(msg);
          }
          setSending(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append('receiverId', receiverId);
      formData.append('content', message.trim());

      if (subject && subject.trim()) {
        formData.append('subject', subject.trim());
      }

      if (selectedMedia) {
        formData.append('media', selectedMedia);
      }

      if (selectedGifts.length > 0 && selectedGifts[0]?.imageUrl) {
        formData.append('mediaUrl', selectedGifts[0].imageUrl);
      }

      if (emailAttachments.length > 0) {
        formData.append('attachments', JSON.stringify(emailAttachments));
      }

      formData.append('frontendUrl', window.location.origin);

      await axios.post('/api/messages/send-email', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (fetchUser) fetchUser();
      alert('Email sent successfully!');
      setSubject('');
      setMessage('');
      setSelectedMedia(null);
      setMediaPreview(null);
      setEmailAttachments([]);
      setSelectedGifts([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onSent) onSent();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      const data = error.response?.data;
      const msg = data?.message || 'Failed to send email';
      if (!handleInsufficientCreditsError(error)) {
        alert(msg);
      }
    } finally {
      setSending(false);
    }
  };

  const addGiftToEmail = (g) => {
    const item = { id: g.id, imageUrl: g.imageUrl, name: g.name };
    setSelectedGifts((prev) => {
      const exists = prev.some((sg) => sg.id === g.id);
      if (exists) return prev.filter((sg) => sg.id !== g.id);
      return [...prev, item];
    });
  };

  const removeGiftFromEmail = (giftId) => {
    setSelectedGifts((prev) => prev.filter((sg) => sg.id !== giftId));
  };

  const handlePhotoVideoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // First file is used for local preview and as main media
    const first = files[0];
    setSelectedMedia(first);
    if (first.type.startsWith('image/') || first.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result);
      reader.readAsDataURL(first);
    }

    // All files (including first) are uploaded as email attachments
    setUploadingAttachment(true);
    try {
      const receiverId = getReceiverId();
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('receiverId', receiverId);
        const { data } = await axios.post('/api/messages/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const mt = data.messageType || '';
        const type = mt === 'voice' ? 'voice' : (mt === 'video' ? 'video' : 'photo');
        setEmailAttachments((prev) => [...prev, { type, url: data.url }]);
      }
    } catch (err) {
      console.error('Upload attachment error:', err);
      alert(err.response?.data?.message || 'Failed to upload attachment(s)');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSmilesClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const insertEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Common emojis
  const commonEmojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  const senderName = getSenderName();
  const senderImage = getSenderImage();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[env(safe-area-inset-top,0px)]"
      onClick={onClose}
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-3xl w-full h-[100dvh] sm:h-auto sm:max-h-[min(90dvh,calc(90*var(--vh,1vh)))] flex flex-col overflow-hidden relative min-h-0 pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #fafafa 100%)',
        }}
      >
        {/* Header with recipient profile - centered like reference */}
        <div className="relative flex-shrink-0 p-4 sm:p-6 pt-5 sm:pt-8 pb-4 sm:pb-8 border-b border-gray-200 flex flex-col items-center justify-center text-center">
          {/* Options and Close - top right */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-white/50 transition"
              >
                <FaEllipsisV />
              </button>
              {showOptions && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px] z-10">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                    Block User
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                    Report a Violation
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                    Disable Sound
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-white/50 transition"
            >
              <FaTimes />
            </button>
          </div>
          {/* Centered profile picture */}
          {senderImage ? (
            <img
              src={senderImage}
              alt={senderName}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mb-3"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center border-4 border-white shadow-lg mb-3">
              <span className="text-white font-semibold text-2xl">
                {senderName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Centered "My Email to ..." */}
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 px-2 break-words">
            My Email to {senderName}
          </h2>
        </div>

        {/* Email Composition Area - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6">
            {/* Photo/Video & Smiles */}
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 text-xs text-gray-600 mb-4">
              <button 
                onClick={handlePhotoVideoClick}
                className="flex items-center gap-1 hover:text-gray-900 transition-colors"
              >
                <FaCamera className="text-sm" />
                <span>Photo/Video</span>
              </button>
              <button 
                onClick={handleSmilesClick}
                className="flex items-center gap-1 hover:text-gray-900 transition-colors"
              >
                <FaSmile className="text-sm" />
                <span>Smiles</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            {/* Subject Field */}
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />

            {/* Selected gifts – multiple compact previews with X to remove each */}
            {selectedGifts.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedGifts.map((gift) => (
                  <div key={gift.id} className="relative inline-block">
                    <div className="max-w-[100px] rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                      {gift.imageUrl ? (
                        <img
                          src={gift.imageUrl}
                          alt=""
                          className="w-full h-auto object-contain max-h-20"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center text-3xl">🎁</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGiftFromEmail(gift.id)}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition shadow"
                      aria-label="Remove gift"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message Field */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={6}
              className="w-full min-w-0 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-base"
            />

            {/* Thumbnails for all selected attachments (each can be removed) */}
            {emailAttachments.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {emailAttachments.map((att, idx) => (
                  <div key={idx} className="relative inline-block">
                    <div className="w-20 h-20 rounded-xl bg-gray-100 border overflow-hidden flex items-center justify-center shadow-sm">
                      {att.type === 'photo' && att.url ? (
                        <img
                          src={att.url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : att.type === 'video' ? (
                        <img
                          src={VIDEO_THUMBNAIL_URL}
                          alt="Video"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-xs text-gray-600">▶</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEmailAttachments((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Virtual gifts – horizontal row like stickers */}
            <div className="mb-4">
              {loadingGifts ? (
                <div className="text-sm text-gray-500 py-2">Loading gifts...</div>
              ) : catalogGifts.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">No gifts available.</div>
              ) : (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {catalogGifts.map((g) => {
                    const cost = g.creditCost ?? 0;
                    const isFree = cost === 0;
                    const isSelected = selectedGifts.some((sg) => sg.id === g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => addGiftToEmail(g)}
                        className={`group flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 relative min-w-[72px] cursor-pointer hover:scale-110 hover:shadow-lg ${
                          isSelected ? 'bg-pink-50 shadow-md' : 'bg-white hover:shadow-md'
                        }`}
                        title={g.name}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-1 relative">
                          {g.imageUrl ? (
                            <img src={g.imageUrl} alt="" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <span className="text-2xl">🎁</span>
                          )}
                          {isFree && (
                            <span className="absolute bottom-0 left-0 bg-red-500 text-white text-[9px] font-bold px-1 rounded-tr">FREE</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 min-h-[1rem]">
                          {isFree ? 'FREE' : `${cost} Credits`}
                        </span>
                      </button>
                      );
                    })}
                </div>
              )}
            </div>
        </div>

        {/* Send Button - fixed at bottom */}
        <div className="flex-shrink-0 p-3 sm:p-4 pt-2 border-t border-gray-200/80 bg-white/90 backdrop-blur-sm">
            <button
              onClick={handleSend}
              disabled={sending || (!message.trim() && !selectedMedia && selectedGifts.length === 0 && emailAttachments.length === 0)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              <FaEnvelope className="text-lg sm:text-xl shrink-0" />
              <span>{sending ? 'SENDING...' : 'SEND EMAIL'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default InboxEmailComposer;
