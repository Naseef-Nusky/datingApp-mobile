import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPhone, FaTimes, FaVideo } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createSafeChannelName } from '../utils/agoraUtils';
import { connectAppSocket, getSocketServerUrl } from '../utils/socketServerUrl';

/**
 * Global incoming video/voice call UI — works on inbox, dashboard, profile, etc.
 */
export default function IncomingCallManager() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerProfile, setCallerProfile] = useState(null);
  const socketRef = useRef(null);
  const ringtoneRef = useRef(null);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const playRingtone = async () => {
    try {
      const userProfileResponse = await axios.get('/api/profiles/me');
      const ringtoneFile = userProfileResponse.data.ringtone || 'defaultRingtone.mp3';
      const ringtonePath = `/ringtones/${ringtoneFile}`;
      if (ringtoneRef.current) {
        ringtoneRef.current.src = ringtonePath;
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 0.7;
        await ringtoneRef.current.play().catch(() => {});
      }
    } catch {
      if (ringtoneRef.current) {
        ringtoneRef.current.src = '/ringtones/defaultRingtone.mp3';
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 0.7;
        await ringtoneRef.current.play().catch(() => {});
      }
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = getSocketServerUrl() || window.location.origin;
    console.log('[IncomingCall] Socket.IO:', socketUrl);
    const socket = connectAppSocket();
    socketRef.current = socket;

    const join = () => socket.emit('join-room', String(user.id));

    socket.on('connect', join);
    socket.on('reconnect', join);

    socket.on('incoming-call', async (data) => {
      const channelName =
        data.channelName || createSafeChannelName('call', data.callerId, user.id);
      setIncomingCall({
        callerId: String(data.callerId),
        callType: data.callType,
        channelName,
      });
      setCallerProfile(null);
      try {
        const profileResponse = await axios.get(`/api/profiles/${data.callerId}`);
        setCallerProfile(profileResponse.data);
      } catch {
        /* optional */
      }
      await playRingtone();
    });

    socket.on('call-cancelled', () => {
      stopRingtone();
      setIncomingCall(null);
      setCallerProfile(null);
    });

    socket.on('call-rejected', () => {
      stopRingtone();
      setIncomingCall(null);
      setCallerProfile(null);
    });

    return () => {
      stopRingtone();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const handleAcceptCall = () => {
    if (!incomingCall || !socketRef.current || !user?.id) return;
    stopRingtone();

    const callerId = incomingCall.callerId;
    const channelName =
      incomingCall.channelName || createSafeChannelName('call', callerId, user.id);

    socketRef.current.emit('call-accept', {
      callerId,
      receiverId: String(user.id),
    });

    const callPayload = {
      callType: incomingCall.callType,
      channelName,
      callerId,
    };

    const onCallerProfile =
      location.pathname === `/profile/${callerId}` ||
      location.pathname === `/profile/${callerId}/`;

    if (onCallerProfile) {
      window.dispatchEvent(
        new CustomEvent('accept-incoming-call', { detail: callPayload })
      );
    } else {
      sessionStorage.setItem('pendingCall', JSON.stringify(callPayload));
      navigate(`/profile/${callerId}`);
    }

    setIncomingCall(null);
    setCallerProfile(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall || !socketRef.current || !user?.id) return;
    stopRingtone();
    socketRef.current.emit('call-reject', {
      callerId: incomingCall.callerId,
      receiverId: String(user.id),
    });
    setIncomingCall(null);
    setCallerProfile(null);
  };

  if (!incomingCall) {
    return <audio ref={ringtoneRef} preload="auto" className="hidden" aria-hidden />;
  }

  const photo =
    callerProfile?.photos?.[0]?.url ||
    (typeof callerProfile?.photos?.[0] === 'string' ? callerProfile.photos[0] : null);

  return (
    <>
      <audio ref={ringtoneRef} preload="auto" className="hidden" aria-hidden />
      <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 pb-[env(safe-area-inset-bottom)]">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-0 sm:mx-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
          <div className="text-center mb-6">
            {photo ? (
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-teal-400 shadow-lg">
                <img
                  src={photo}
                  alt={callerProfile?.firstName || ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                {incomingCall.callType === 'video' ? (
                  <FaVideo className="text-white text-4xl" />
                ) : (
                  <FaPhone className="text-white text-4xl" />
                )}
              </div>
            )}
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {callerProfile?.firstName || t('profilePage.incomingCall')}
            </h3>
            <p className="text-gray-600 mb-4">
              {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call
            </p>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <div
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleRejectCall}
              className="flex-1 bg-red-500 text-white py-4 px-6 rounded-xl hover:bg-red-600 transition-all font-semibold flex items-center justify-center space-x-2 shadow-lg"
            >
              <FaTimes size={18} />
              <span>Decline</span>
            </button>
            <button
              type="button"
              onClick={handleAcceptCall}
              className="flex-1 bg-green-500 text-white py-4 px-6 rounded-xl hover:bg-green-600 transition-all font-semibold flex items-center justify-center space-x-2 shadow-lg"
            >
              {incomingCall.callType === 'video' ? <FaVideo size={18} /> : <FaPhone size={18} />}
              <span>Accept</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
