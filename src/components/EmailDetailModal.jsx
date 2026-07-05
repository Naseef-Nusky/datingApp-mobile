import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEnvelope, FaUser, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { useCreditsSync } from '../hooks/useCreditsSync';
import { useServiceAccess } from '../hooks/useServiceAccess';
import {
  EMAIL_COMPOSER_MODAL_OVERLAY,
  EMAIL_DETAIL_MODAL_PANEL,
  EMAIL_DETAIL_HEADER,
  EMAIL_DETAIL_SCROLL,
  EMAIL_DETAIL_CONTENT,
  EMAIL_DETAIL_REPLY_FOOTER,
  EMAIL_COMPOSER_SEND_BTN,
  EMAIL_COMPOSER_AVATAR,
  EMAIL_COMPOSER_AVATAR_FALLBACK,
} from '../utils/emailComposerLayout';

const VIDEO_THUMBNAIL_URL = 'https://nexdatingmedia.lon1.digitaloceanspaces.com/Icons/video_thumbnail.png';

const EmailDetailModal = ({ isOpen, onClose, email, onReply, user }) => {
  const navigate = useNavigate();
  const { handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const { syncCreditsAfterAction } = useCreditsSync();
  const { ensureCanUnlockAttachment } = useServiceAccess();
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
    const attachment = attachments[index];
    if (!attachment) return;
    if (!(await ensureCanUnlockAttachment(attachment.type))) return;

    setUnlockingIndex(index);
    try {
      const { data } = await axios.post(`/api/messages/emails/${currentEmail.id}/unlock-attachment`, { index });
      await syncCreditsAfterAction(data);
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
      className={EMAIL_COMPOSER_MODAL_OVERLAY}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-detail-title"
    >
      <div
        className={EMAIL_DETAIL_MODAL_PANEL}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[max(0.75rem,env(safe-area-inset-top,0px))] right-3 sm:top-4 sm:right-4 z-20 text-gray-600 hover:text-gray-800 bg-white/90 rounded-full p-2 shadow-md transition"
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>

        {/* Header — compact decorative banner */}
        <div className={EMAIL_DETAIL_HEADER}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, #ff8c42 0%, #ffa366 30%, #ffb380 60%, #ffc299 100%)',
            }}
          >
            <div
              className="absolute top-2 right-4 sm:top-4 sm:right-6 w-20 h-20 sm:w-32 sm:h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ff8c42 0%, #ff6b35 100%)',
                boxShadow: '0 0 40px rgba(255, 140, 66, 0.5)',
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-40">
              <div className="absolute bottom-0 left-2 w-12 sm:w-20 h-20 sm:h-32 rounded-t-full opacity-80" style={{ background: '#1a3009' }} />
              <div className="absolute bottom-0 right-4 w-10 sm:w-14 h-16 sm:h-24 rounded-t-full opacity-90" style={{ background: '#1a3009' }} />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center h-full px-3 pt-2 pb-3">
            {senderImage ? (
              <img src={senderImage} alt={senderName} className={`${EMAIL_COMPOSER_AVATAR} mb-1.5 sm:mb-3 border-white`} />
            ) : (
              <div className={`${EMAIL_COMPOSER_AVATAR_FALLBACK} mb-1.5 sm:mb-3`}>
                <span className="text-white font-semibold text-lg sm:text-2xl">
                  {senderName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <p
              id="email-detail-title"
              className="text-white font-semibold text-sm sm:text-lg drop-shadow-lg px-10 text-center break-words line-clamp-2"
            >
              Email from {senderName}
            </p>
          </div>
        </div>

        {/* Scrollable content + reply (no dead space on short emails) */}
        <div className={EMAIL_DETAIL_SCROLL}>
          <div className={EMAIL_DETAIL_CONTENT}>
            <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 break-words pr-8">
              {subject}
            </h3>

            <div className="mb-4 sm:mb-5">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                {messageBody || 'No message content'}
              </p>
              {isReceiver && senderId && (
                <button
                  type="button"
                  onClick={() => { navigate(`/profile/${senderId}`); onClose(); }}
                  className="mt-3 text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5 text-sm font-medium"
                >
                  <FaUser className="text-xs shrink-0" /> Open profile
                </button>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="mb-4">
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

          <div className={EMAIL_DETAIL_REPLY_FOOTER}>
            <button
              type="button"
              onClick={() => {
                if (onReply) onReply(currentEmail);
              }}
              className={EMAIL_COMPOSER_SEND_BTN}
            >
              <FaEnvelope className="text-base sm:text-lg shrink-0" />
              <span>REPLY</span>
            </button>
          </div>
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
