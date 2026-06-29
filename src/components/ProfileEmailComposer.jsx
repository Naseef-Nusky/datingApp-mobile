import { useState, useRef, useEffect } from 'react';
import { FaEnvelope, FaSmile, FaCamera, FaTimes, FaComments } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';

const ProfileEmailComposer = ({ profile, onClose, onSent, onOpenChat }) => {
  const { fetchUser } = useAuth();
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

      // Send each selected gift first
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

      formData.append('frontendUrl', window.location.origin);

      await axios.post('/api/messages/send-email', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (fetchUser) fetchUser();
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

  return (
    <div className="bg-white rounded-none lg:rounded-lg shadow-lg overflow-hidden flex flex-col h-full min-h-0 w-full max-w-full">
      {/* Header with decorative background - watercolor style */}
      <div className="flex-shrink-0 relative h-24 sm:h-32 lg:h-40 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-6 left-8 text-7xl transform rotate-12">🗼</div>
          <div className="absolute top-10 right-12 text-5xl transform -rotate-12">🦋</div>
          <div className="absolute bottom-6 left-1/3 text-4xl transform rotate-6">🌸</div>
          <div className="absolute bottom-8 right-1/4 text-3xl">🌺</div>
        </div>
        {/* PARIS text vertically - hidden on very small screens to avoid overflow */}
        <div className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 -rotate-90 origin-left hidden sm:block pointer-events-none">
          <span className="text-xl sm:text-2xl font-bold text-gray-700 opacity-40">PARIS</span>
        </div>
        <div className="relative h-full flex flex-col items-center justify-center p-3 sm:p-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center mb-2 sm:mb-3 overflow-hidden shrink-0">
            {profile.photos && profile.photos.length > 0 ? (
              <img 
                src={profile.photos[0]?.url || profile.photos[0]} 
                alt={profile.firstName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-3xl">👤</span>';
                }}
              />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <h3 className="text-base sm:text-xl font-bold text-gray-800 text-center px-2 break-words">
            My Email to {profile.firstName}
          </h3>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-100 transition"
          >
            <FaTimes />
          </button>
        </div>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Email Composition Area - scrollable */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-w-0">
          {/* Chat, Email, Photo/Video, Smiles - Same line, 2 corners */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 min-w-0">
            {/* Left corner - Chat and Email */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {onOpenChat && (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="flex items-center gap-2 px-2 py-2 sm:px-4 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <FaComments className="text-lg shrink-0" />
                  <span className="font-medium">Chat</span>
                </button>
              )}
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-2 sm:px-4 text-teal-600 transition-colors"
              >
                <FaEnvelope className="text-lg shrink-0" />
                <span className="font-medium">Email</span>
              </button>
            </div>
            
            {/* Right corner - Photo/Video and Smiles */}
            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
              <button 
                type="button"
                onClick={handlePhotoVideoClick}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Photo/Video"
              >
                <FaCamera className="text-base shrink-0" />
                <span className="whitespace-nowrap">
                  <span className="sm:hidden">Media</span>
                  <span className="hidden sm:inline">Photo/Video</span>
                </span>
              </button>
              <button 
                type="button"
                onClick={handleSmilesClick}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Smiles"
              >
                <FaSmile className="text-base shrink-0" />
                <span>Smiles</span>
              </button>
            </div>
          </div>

          {/* Subject Field */}
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            rows={5}
            className="w-full min-w-0 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-base"
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
        <div className="flex-shrink-0 p-3 sm:p-4 pt-0 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || (!message.trim() && !selectedMedia && selectedGifts.length === 0)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaEnvelope />
            {sending ? 'SENDING...' : 'SEND EMAIL'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEmailComposer;
