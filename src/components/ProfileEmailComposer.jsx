import { useState, useRef, useEffect } from 'react';
import { FaEnvelope, FaSmile, FaCamera, FaTimes, FaComments } from 'react-icons/fa';
import axios from 'axios';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { useCreditsSync } from '../hooks/useCreditsSync';
import { useServiceAccess } from '../hooks/useServiceAccess';
import AutoResizeTextarea from './AutoResizeTextarea';
import {
  EMAIL_COMPOSER_EMBEDDED_ROOT,
  EMAIL_COMPOSER_HEADER,
  EMAIL_COMPOSER_HEADER_DECORATIVE,
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

const ProfileEmailComposer = ({ profile, onClose, onSent, onOpenChat }) => {
  const { syncCreditsAfterAction } = useCreditsSync();
  const { ensureCanSendEmailAccess, ensureCanAffordCredits } = useServiceAccess();
  const { handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [catalogGifts, setCatalogGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [selectedGifts, setSelectedGifts] = useState([]);
  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (!message.trim() && !selectedMedia && selectedGifts.length === 0) {
      alert('Please enter a message, add a photo/video, or add a gift');
      return;
    }

    if (!profile) {
      alert('Error: Profile information is missing');
      return;
    }

    const receiverId = profile.userId;
    if (!receiverId) {
      alert('Error: Could not find receiver ID. Please refresh the page and try again.');
      return;
    }

    try {
      setSending(true);

      if (!(await ensureCanSendEmailAccess())) {
        setSending(false);
        return;
      }

      // Send each selected gift first
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

      formData.append('frontendUrl', window.location.origin);

      const emailRes = await axios.post('/api/messages/send-email', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await syncCreditsAfterAction(emailRes.data);
      alert('Email sent successfully!');
      setSubject('');
      setMessage('');
      setSelectedMedia(null);
      setMediaPreview(null);
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

  // Fetch virtual gift catalog when composer is open – only virtual gifts (no presents)
  useEffect(() => {
    if (!profile) return;
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
  }, [profile]);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMedia(file);
      // Create preview for both images and videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
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

  const profilePhoto = profile.photos?.length > 0
    ? (profile.photos[0]?.url || profile.photos[0])
    : null;

  return (
    <div className={EMAIL_COMPOSER_EMBEDDED_ROOT}>
      {/* Mobile: flat header (matches inbox composer) */}
      <div className={`lg:hidden ${EMAIL_COMPOSER_HEADER}`}>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        {profilePhoto ? (
          <img src={profilePhoto} alt={profile.firstName} className={`${EMAIL_COMPOSER_AVATAR} mb-2`} />
        ) : (
          <div className={`${EMAIL_COMPOSER_AVATAR_FALLBACK} mb-2`}>
            <span className="text-white font-semibold text-lg">
              {profile.firstName?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
        <h3 className={EMAIL_COMPOSER_TITLE}>My Email to {profile.firstName}</h3>
      </div>

      {/* Desktop: decorative header */}
      <div className={`hidden lg:block ${EMAIL_COMPOSER_HEADER_DECORATIVE}`}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-6 left-8 text-7xl transform rotate-12">🗼</div>
          <div className="absolute top-10 right-12 text-5xl transform -rotate-12">🦋</div>
          <div className="absolute bottom-6 left-1/3 text-4xl transform rotate-6">🌸</div>
          <div className="absolute bottom-8 right-1/4 text-3xl">🌺</div>
        </div>
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90 origin-left pointer-events-none">
          <span className="text-2xl font-bold text-gray-700 opacity-40">PARIS</span>
        </div>
        <div className="relative h-full flex flex-col items-center justify-center p-4">
          <div className={`${EMAIL_COMPOSER_AVATAR} mb-3 overflow-hidden bg-gray-200`}>
            {profilePhoto ? (
              <img src={profilePhoto} alt={profile.firstName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-800 text-center px-2 break-words line-clamp-2">
            My Email to {profile.firstName}
          </h3>
        </div>
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-100 transition"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className={EMAIL_COMPOSER_BODY_WRAP}>
        <div className={EMAIL_COMPOSER_SCROLL}>
          <div className={EMAIL_COMPOSER_TOOLBAR}>
            <div className="flex flex-wrap items-center gap-2">
              {onOpenChat && (
                <button type="button" onClick={onOpenChat} className={EMAIL_COMPOSER_TOOLBAR_BTN}>
                  <FaComments className="text-base shrink-0" />
                  <span className="font-medium">Chat</span>
                </button>
              )}
              <button type="button" className={`${EMAIL_COMPOSER_TOOLBAR_BTN} text-teal-600`}>
                <FaEnvelope className="text-base shrink-0" />
                <span className="font-medium">Email</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handlePhotoVideoClick} className={EMAIL_COMPOSER_TOOLBAR_BTN} title="Photo/Video">
                <FaCamera className="text-base shrink-0" />
                <span className="whitespace-nowrap">
                  <span className="sm:hidden">Media</span>
                  <span className="hidden sm:inline">Photo/Video</span>
                </span>
              </button>
              <button type="button" onClick={handleSmilesClick} className={EMAIL_COMPOSER_TOOLBAR_BTN} title="Smiles">
                <FaSmile className="text-base shrink-0" />
                <span>Smiles</span>
              </button>
            </div>
          </div>

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject..."
            className={`${EMAIL_COMPOSER_INPUT} mb-3 sm:mb-4`}
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

          <AutoResizeTextarea
            minRows={2}
            maxRows={12}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className={`${EMAIL_COMPOSER_TEXTAREA} mb-4`}
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="mb-4 relative inline-block max-w-[200px]">
              {selectedMedia?.type.startsWith('image/') ? (
                <img src={mediaPreview} alt="Preview" className="max-w-full max-h-28 rounded-lg object-cover" />
              ) : selectedMedia?.type.startsWith('video/') ? (
                <video src={mediaPreview} controls className="max-w-full max-h-28 rounded-lg" />
              ) : null}
              <button
                onClick={() => {
                  setSelectedMedia(null);
                  setMediaPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <FaTimes />
              </button>
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
            disabled={sending || (!message.trim() && !selectedMedia && selectedGifts.length === 0)}
            className={EMAIL_COMPOSER_SEND_BTN}
          >
            <FaEnvelope className="shrink-0" />
            {sending ? 'SENDING...' : 'SEND EMAIL'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEmailComposer;
