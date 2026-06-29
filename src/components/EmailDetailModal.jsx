import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEnvelope, FaUser, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';

const VIDEO_THUMBNAIL_URL = 'https://nexdatingmedia.lon1.digitaloceanspaces.com/Icons/video_thumbnail.png';

const EmailDetailModal = ({ isOpen, onClose, email, onReply, user }) => {
  const navigate = useNavigate();
  const { handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const [emailState, setEmailState] = useState(email);
  const [unlockingIndex, setUnlockingIndex] = useState(null);
  const [viewAttachmentIndex, setViewAttachmentIndex] = useState(null);
  useEffect(() => { setEmailState(email); }, [email]);
  const currentEmail = emailState || email;
  if (!isOpen || !email) return null;

  const getSenderName = () => {
    if (currentEmail.sender === user.id) {
      return currentEmail.receiverData?.profile?.firstName || currentEmail.receiverData?.email?.split('@')[0] || 'Unknown';
    }
    return currentEmail.senderData?.profile?.firstName || currentEmail.senderData?.email?.split('@')[0] || 'Unknown';
  };

  const getSenderImage = () => {
    if (currentEmail.sender === user.id) {
      const photos = currentEmail.receiverData?.profile?.photos;
      if (photos && Array.isArray(photos) && photos.length > 0) {
        return photos[0]?.url || photos[0] || null;
      }
      return null;
    }
    const photos = currentEmail.senderData?.profile?.photos;
    if (photos && Array.isArray(photos) && photos.length > 0) {
      return photos[0]?.url || photos[0] || null;
    }
    return null;
  };

  const getSubject = () => {
    if (currentEmail.subject) return currentEmail.subject;
    const content = currentEmail.content || '';
    const text = content.replace(/<[^>]*>/g, '');
    const firstLine = text.split('\n')[0];
    return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
  };

  const getMessageBody = () => {
    const content = currentEmail.content || '';
    const text = content.replace(/<[^>]*>/g, '');
    // Remove subject line if it's the first line
    const lines = text.split('\n');
    if (lines.length > 1) {
      return lines.slice(1).join('\n').trim();
    }
    return text;
  };

  const senderName = getSenderName();
  const senderImage = getSenderImage();
  const subject = getSubject();
  const messageBody = getMessageBody();
  const attachments = Array.isArray(currentEmail.attachments) ? currentEmail.attachments : [];
  const hasPhotos = attachments.some((a) => a.type === 'photo');
  const hasVideos = attachments.some((a) => a.type === 'video');
  const hasVoice = attachments.some((a) => a.type === 'voice');
  const attachmentLabel = [
    hasPhotos && 'photos',
    hasVideos && 'videos',
    hasVoice && 'voice messages',
  ].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1');
  const attachmentsSectionTitle = attachmentLabel ? `Attached ${attachmentLabel}:` : 'Attachments:';
  const creditCosts = currentEmail.creditCosts || { photoViewCredits: 15, voiceMessageCredits: 10 };
  const senderId = currentEmail.sender === user.id ? currentEmail.receiver : currentEmail.sender;
  const isReceiver = currentEmail.receiver === user.id;

  const handleUnlockAttachment = async (index) => {
    setUnlockingIndex(index);
    try {
      const { data } = await axios.post(`/api/messages/emails/${currentEmail.id}/unlock-attachment`, { index });
      setEmailState((prev) => {
        const next = { ...prev };
        const att = [...(next.attachments || [])];
        if (att[index]) att[index] = { ...att[index], url: data.url, locked: false };
        next.attachments = att;
        return next;
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to unlock';
      if (!handleInsufficientCreditsError(err)) {
        alert(msg);
      }
    } finally {
      setUnlockingIndex(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[env(safe-area-inset-top,0px)]"
      onClick={onClose}
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[min(90dvh,calc(90*var(--vh,1vh)))] flex flex-col overflow-hidden relative min-h-0 pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(to bottom, #fff 0%, #fff 25%, #fff 100%)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-md transition"
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>

        {/* Header Section with Decorative Background */}
        <div className="relative flex-shrink-0 h-36 sm:h-48 md:h-56 overflow-hidden rounded-t-2xl sm:rounded-t-2xl">
          {/* Decorative Background - Sunset Scene */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, #ff8c42 0%, #ffa366 30%, #ffb380 60%, #ffc299 100%)',
            }}
          >
            {/* Sun - Large orange disk */}
            <div 
              className="absolute top-4 right-6 w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ff8c42 0%, #ff6b35 100%)',
                boxShadow: '0 0 60px rgba(255, 140, 66, 0.6)',
              }}
            />
            
            {/* Trees Silhouette - Multiple trees */}
            <div className="absolute bottom-0 left-0 right-0 h-40">
              {/* Left side trees */}
              <div 
                className="absolute bottom-0 left-2 w-20 h-32 rounded-t-full opacity-80"
                style={{ background: '#1a3009' }}
              />
              <div 
                className="absolute bottom-0 left-16 w-16 h-28 rounded-t-full opacity-90"
                style={{ background: '#2d5016' }}
              />
              <div 
                className="absolute bottom-0 left-28 w-18 h-30 rounded-t-full opacity-85"
                style={{ background: '#1a3009' }}
              />
              
              {/* Right side trees */}
              <div 
                className="absolute bottom-0 right-20 w-16 h-26 rounded-t-full opacity-80"
                style={{ background: '#2d5016' }}
              />
              <div 
                className="absolute bottom-0 right-4 w-14 h-24 rounded-t-full opacity-90"
                style={{ background: '#1a3009' }}
              />
            </div>

            {/* Lamppost - Right side */}
            <div className="absolute bottom-0 right-16">
              <div 
                className="w-1.5 h-24"
                style={{ background: '#3a3a3a' }}
              />
              <div 
                className="absolute top-0 right-0 w-6 h-6 rounded-full -translate-x-1/2"
                style={{ 
                  background: '#ffd700',
                  boxShadow: '0 0 15px rgba(255, 215, 0, 0.9)',
                }}
              />
            </div>

            {/* Couple on Bench - Center left */}
            <div className="absolute bottom-12 left-1/4">
              {/* Bench */}
              <div 
                className="w-20 h-3 rounded"
                style={{ background: '#4a4a4a' }}
              />
              {/* Person 1 */}
              <div 
                className="absolute -top-4 left-2 w-4 h-4 rounded-full"
                style={{ background: '#2d2d2d' }}
              />
              {/* Person 2 */}
              <div 
                className="absolute -top-4 right-2 w-4 h-4 rounded-full"
                style={{ background: '#2d2d2d' }}
              />
            </div>
          </div>

          {/* Profile Picture and Name Overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full pt-6">
            <div className="mb-4">
              {senderImage ? (
                <img
                  src={senderImage}
                  alt={senderName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center border-4 border-white shadow-xl">
                  <span className="text-white font-semibold text-3xl">
                    {senderName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <p className="text-white font-semibold text-base sm:text-xl drop-shadow-2xl px-4 text-center break-words">
              Email from {senderName}
            </p>
          </div>
        </div>

        {/* Content Section - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 bg-white">
          {/* Subject Line */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 break-words pr-10">
            {subject}
          </h3>

          {/* Message Body */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {messageBody || 'No message content'}
            </p>
            {isReceiver && senderId && (
              <button
                type="button"
                onClick={() => { navigate(`/profile/${senderId}`); onClose(); }}
                className="mt-2 text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
              >
                <FaUser className="text-xs" /> Open profile
              </button>
            )}
          </div>

          {/* Attached photos / videos / voice (locked: thumb + lock; unlocked: clear or player) */}
            {attachments.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">{attachmentsSectionTitle}</p>
              <div className="flex flex-wrap gap-3">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative">
                    {att.locked ? (
                      <button
                        type="button"
                        disabled={unlockingIndex === idx}
                        onClick={() => setViewAttachmentIndex(idx)}
                        className="w-24 h-24 rounded-lg overflow-hidden border border-gray-300 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      >
                        {/* Background: photo = blurred url; video = thumbnail image; else gradient */}
                        {att.type === 'photo' && att.url ? (
                          <img
                            src={att.url}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ filter: 'blur(4px)' }}
                          />
                        ) : att.type === 'video' ? (
                          <>
                            <img
                              src={VIDEO_THUMBNAIL_URL}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{ filter: 'blur(4px)' }}
                            />
                            <div className="absolute inset-0 bg-black/40" />
                          </>
                        ) : (
                          <div
                            className="absolute inset-0"
                            style={{
                              background: 'linear-gradient(135deg, #bbf7d0 0%, #86efac 50%, #4ade80 100%)',
                            }}
                          />
                        )}
                        {/* Lock icon only - centered */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img src="/lock_icon.png" alt="Locked" className="w-20 h-20 object-contain" />
                        </div>
                        {unlockingIndex === idx && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">...</span>
                          </div>
                        )}
                      </button>
                    ) : (
                      <div className={att.type === 'voice' ? 'w-full min-w-[200px]' : 'w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200'}>
                        {att.type === 'photo' && att.url ? (
                          <button
                            type="button"
                            onClick={() => setViewAttachmentIndex(idx)}
                            className="w-full h-full block focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg"
                          >
                            <img src={att.url} alt="Attachment" className="w-full h-full object-cover rounded-lg" />
                          </button>
                        ) : att.type === 'video' && att.url ? (
                          <button
                            type="button"
                            onClick={() => setViewAttachmentIndex(idx)}
                            className="w-full h-full block focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg"
                          >
                            <img src={VIDEO_THUMBNAIL_URL} alt="Video" className="w-full h-full object-cover rounded-lg" />
                          </button>
                        ) : att.type === 'voice' && att.url ? (
                          <audio controls src={att.url} className="w-full h-10" />
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Reply Button - fixed at bottom */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-100 bg-white">
          <button
            onClick={() => {
              if (onReply) {
                onReply(currentEmail);
              }
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-lg text-sm sm:text-base"
          >
            <FaEnvelope className="text-lg sm:text-xl shrink-0" />
            <span>REPLY</span>
          </button>
        </div>
      </div>

      {/* Full-screen attachment view: locked template (blur + lock + VIEW PHOTO) or clear image; slider when multiple */}
      {viewAttachmentIndex !== null && attachments[viewAttachmentIndex]?.type === 'photo' && (
        (() => {
          const currentAtt = attachments[viewAttachmentIndex];
          const photoIndices = attachments.map((a, i) => (a.type === 'photo' ? i : null)).filter((i) => i !== null);
          const currentPos = photoIndices.indexOf(viewAttachmentIndex);
          const hasPrev = photoIndices.length > 1 && currentPos > 0;
          const hasNext = photoIndices.length > 1 && currentPos >= 0 && currentPos < photoIndices.length - 1;
          const isLocked = currentAtt?.locked;

          return (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center"
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
              }}
              onClick={() => setViewAttachmentIndex(null)}
            >
              <div
                className="relative flex flex-col items-center justify-center w-full h-full p-4"
                onClick={(e) => e.stopPropagation()}
              >
                {isLocked ? (
                  /* Locked template: heavily blurred image + lock icon + VIEW PHOTO button */
                  <>
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      {currentAtt?.url ? (
                        <img
                          src={currentAtt.url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ filter: 'blur(24px)', transform: 'scale(1.1)' }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-400 to-slate-600" />
                      )}
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center gap-6">
                      <img src="/lock_icon.png" alt="Locked" className="w-24 h-24 object-contain drop-shadow-lg" />
                      <button
                        type="button"
                        disabled={unlockingIndex === viewAttachmentIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlockAttachment(currentAtt.index ?? viewAttachmentIndex);
                        }}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white font-semibold uppercase tracking-wide px-8 py-3 rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        {unlockingIndex === viewAttachmentIndex ? '...' : 'VIEW PHOTO'}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Unlocked: clear image */
                  currentAtt?.url && (
                    <img
                      src={currentAtt.url}
                      alt="Attachment"
                      className="max-w-[66vw] max-h-[calc(90*var(--vh))] w-auto h-auto object-contain"
                    />
                  )
                )}

                {/* Close button - white X on dark circle, viewport top right */}
                <button
                  type="button"
                  onClick={() => setViewAttachmentIndex(null)}
                  className="fixed top-4 right-4 z-[70] w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <FaTimes className="text-xl" />
                </button>

                {/* Slider: Prev / Next for multiple photo attachments */}
                {hasPrev && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setViewAttachmentIndex(photoIndices[currentPos - 1]); }}
                    className="fixed left-4 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors focus:outline-none"
                  >
                    <FaChevronLeft className="text-xl" />
                  </button>
                )}
                {hasNext && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setViewAttachmentIndex(photoIndices[currentPos + 1]); }}
                    className="fixed right-4 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors focus:outline-none"
                  >
                    <FaChevronRight className="text-xl" />
                  </button>
                )}
              </div>
            </div>
          );
        })()
      )}

      {/* Full-screen video view: locked = thumbnail + lock + VIEW VIDEO; unlocked = video with native controls; prev/next for multiple videos */}
      {viewAttachmentIndex !== null && attachments[viewAttachmentIndex]?.type === 'video' && (() => {
        const currentAtt = attachments[viewAttachmentIndex];
        const videoIndices = attachments.map((a, i) => (a.type === 'video' ? i : null)).filter((i) => i !== null);
        const currentPos = videoIndices.indexOf(viewAttachmentIndex);
        const hasPrev = videoIndices.length > 1 && currentPos > 0;
        const hasNext = videoIndices.length > 1 && currentPos >= 0 && currentPos < videoIndices.length - 1;
        const isLocked = currentAtt?.locked;
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setViewAttachmentIndex(null)}
          >
            <div
              className="relative flex flex-col items-center justify-center w-full h-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {isLocked ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={VIDEO_THUMBNAIL_URL}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }}
                    />
                    <div className="absolute inset-0 bg-black/50" />
                  </div>
                  <div className="relative z-10 flex flex-col items-center justify-center gap-6">
                    <img src="/lock_icon.png" alt="Locked" className="w-24 h-24 object-contain drop-shadow-lg" />
                    <button
                      type="button"
                      disabled={unlockingIndex === viewAttachmentIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlockAttachment(currentAtt.index ?? viewAttachmentIndex);
                      }}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white font-semibold uppercase tracking-wide px-8 py-3 rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      {unlockingIndex === viewAttachmentIndex ? '...' : 'VIEW VIDEO'}
                    </button>
                  </div>
                </>
              ) : (
                currentAtt?.url && (
                  <video
                    src={currentAtt.url}
                    controls
                    className="max-w-[90vw] max-h-[calc(85*var(--vh))] w-auto h-auto rounded-lg shadow-2xl"
                    playsInline
                  />
                )
              )}
              <button
                type="button"
                onClick={() => setViewAttachmentIndex(null)}
                className="fixed top-4 right-4 z-[70] w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <FaTimes className="text-xl" />
              </button>
              {hasPrev && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewAttachmentIndex(videoIndices[currentPos - 1]); }}
                  className="fixed left-4 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors focus:outline-none"
                >
                  <FaChevronLeft className="text-xl" />
                </button>
              )}
              {hasNext && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewAttachmentIndex(videoIndices[currentPos + 1]); }}
                  className="fixed right-4 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors focus:outline-none"
                >
                  <FaChevronRight className="text-xl" />
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default EmailDetailModal;
