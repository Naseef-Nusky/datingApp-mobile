import { useState, useRef, useEffect } from 'react';
import { FaEnvelope, FaSmile, FaCamera, FaTimes, FaEllipsisV } from 'react-icons/fa';
import axios from 'axios';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { useCreditsSync } from '../hooks/useCreditsSync';
import { useServiceAccess } from '../hooks/useServiceAccess';
import AutoResizeTextarea from './AutoResizeTextarea';
import {
  EMAIL_COMPOSER_MODAL_OVERLAY,
  EMAIL_COMPOSER_MODAL_PANEL,
  EMAIL_COMPOSER_HEADER,
  EMAIL_COMPOSER_BODY_WRAP,
  EMAIL_COMPOSER_SCROLL,
  EMAIL_COMPOSER_FOOTER,
  EMAIL_COMPOSER_SEND_BTN,
  EMAIL_COMPOSER_INPUT,
  EMAIL_COMPOSER_TEXTAREA,
  EMAIL_COMPOSER_TOOLBAR,
  EMAIL_COMPOSER_TOOLBAR_BTN,
  EMAIL_COMPOSER_GIFTS_ROW,
  EMAIL_COMPOSER_AVATAR,
  EMAIL_COMPOSER_AVATAR_FALLBACK,
  EMAIL_COMPOSER_TITLE,
} from '../utils/emailComposerLayout';

const VIDEO_THUMBNAIL_URL = 'https://nexdatingmedia.lon1.digitaloceanspaces.com/Icons/video_thumbnail.png';

const InboxEmailComposer = ({ email, onClose, onSent, user }) => {
  const { syncCreditsAfterAction } = useCreditsSync();
  const { ensureCanSendEmailAccess, ensureCanAffordCredits } = useServiceAccess();
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

      if (!(await ensureCanSendEmailAccess())) {
        setSending(false);
        return;
      }

      for (const gift of selectedGifts) {
        try {
          if (!(await ensureCanAffordCredits(gift?.creditCost))) {
            setSending(false);
            return;
          }
          const giftRes = await axios.post('/api/gifts/send', { receiverId, giftId: gift.id });
          await syncCreditsAfterAction(giftRes.data);
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

      const emailRes = await axios.post('/api/messages/send-email', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await syncCreditsAfterAction(emailRes.data);
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
      className={EMAIL_COMPOSER_MODAL_OVERLAY}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inbox-email-composer-title"
    >
      <div
        className={EMAIL_COMPOSER_MODAL_PANEL}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #fafafa 100%)',
        }}
      >
        <div className={EMAIL_COMPOSER_HEADER}>
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-white/50 transition"
                aria-label="More options"
              >
                <FaEllipsisV />
              </button>
              {showOptions && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px] z-10">
                  <button type="button" className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                    Block User
                  </button>
                  <button type="button" className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                    Report a Violation
                  </button>
                  <button type="button" className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                    Disable Sound
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-white/50 transition"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
          {senderImage ? (
            <img
              src={senderImage}
              alt={senderName}
              className={`${EMAIL_COMPOSER_AVATAR} mb-2 sm:mb-3`}
            />
          ) : (
            <div className={`${EMAIL_COMPOSER_AVATAR_FALLBACK} mb-2 sm:mb-3`}>
              <span className="text-white font-semibold text-lg sm:text-2xl">
                {senderName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h2 id="inbox-email-composer-title" className={EMAIL_COMPOSER_TITLE}>
            My Email to {senderName}
          </h2>
        </div>

        <div className={EMAIL_COMPOSER_BODY_WRAP}>
          <div className={EMAIL_COMPOSER_SCROLL}>
            <div className={`${EMAIL_COMPOSER_TOOLBAR} justify-end`}>
              <button
                type="button"
                onClick={handlePhotoVideoClick}
                className={`${EMAIL_COMPOSER_TOOLBAR_BTN} hover:bg-white/80`}
              >
                <FaCamera className="text-sm shrink-0" />
                <span className="whitespace-nowrap">
                  <span className="sm:hidden">Media</span>
                  <span className="hidden sm:inline">Photo/Video</span>
                </span>
              </button>
              <button
                type="button"
                onClick={handleSmilesClick}
                className={`${EMAIL_COMPOSER_TOOLBAR_BTN} hover:bg-white/80`}
              >
                <FaSmile className="text-sm shrink-0" />
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
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className={`${EMAIL_COMPOSER_INPUT} mb-3 sm:mb-4 focus:ring-blue-500`}
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
            <AutoResizeTextarea
              minRows={3}
              maxRows={12}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className={`${EMAIL_COMPOSER_TEXTAREA} mb-4 focus:ring-blue-500`}
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
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
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

            {/* Virtual gifts – horizontal scroll */}
            <div className="mb-2 sm:mb-4">
              {loadingGifts ? (
                <div className="text-sm text-gray-500 py-2">Loading gifts...</div>
              ) : catalogGifts.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">No gifts available.</div>
              ) : (
                <div className={EMAIL_COMPOSER_GIFTS_ROW}>
                  {catalogGifts.map((g) => {
                    const cost = g.creditCost ?? 0;
                    const isFree = cost === 0;
                    const isSelected = selectedGifts.some((sg) => sg.id === g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => addGiftToEmail(g)}
                        className={`group flex-shrink-0 snap-start flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 relative min-w-[64px] sm:min-w-[72px] cursor-pointer hover:scale-105 hover:shadow-lg ${
                          isSelected ? 'bg-pink-50 shadow-md' : 'bg-white hover:shadow-md'
                        }`}
                        title={g.name}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-1 relative">
                          {g.imageUrl ? (
                            <img src={g.imageUrl} alt="" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <span className="text-2xl">🎁</span>
                          )}
                          {isFree && (
                            <span className="absolute bottom-0 left-0 bg-red-500 text-white text-[9px] font-bold px-1 rounded-tr">FREE</span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-500 min-h-[1rem]">
                          {isFree ? 'FREE' : `${cost} Credits`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={EMAIL_COMPOSER_FOOTER}>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || uploadingAttachment || (!message.trim() && !selectedMedia && selectedGifts.length === 0 && emailAttachments.length === 0)}
              className={EMAIL_COMPOSER_SEND_BTN}
            >
              <FaEnvelope className="text-base sm:text-xl shrink-0" />
              <span>{sending ? 'SENDING...' : uploadingAttachment ? 'UPLOADING...' : 'SEND EMAIL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxEmailComposer;
