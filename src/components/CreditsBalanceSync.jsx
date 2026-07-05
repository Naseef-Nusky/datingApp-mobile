import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectAppSocket } from '../utils/socketServerUrl';
import { useCreditsSync } from '../hooks/useCreditsSync';

/**
 * Keeps header + profile credit counts in sync after chat, calls, and navigation.
 */
export default function CreditsBalanceSync() {
  const { user } = useAuth();
  const { syncCreditsNow, syncCreditsAfterCall } = useCreditsSync();
  const location = useLocation();

  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = connectAppSocket();
    socket.emit('join-room', String(user.id));

    const onCallEnded = () => {
      void syncCreditsAfterCall();
    };

    const onCreditsUpdated = (payload) => {
      const credits = Number(payload?.credits);
      if (Number.isFinite(credits)) {
        window.dispatchEvent(new CustomEvent('credits-updated', { detail: { credits } }));
        return;
      }
      void syncCreditsNow();
    };

    const onContactUpdate = (data) => {
      if (data?.action === 'call_ended') {
        void syncCreditsAfterCall();
      }
    };

    socket.on('call-ended', onCallEnded);
    socket.on('credits-updated', onCreditsUpdated);
    socket.on('contact-update', onContactUpdate);

    return () => {
      socket.off('call-ended', onCallEnded);
      socket.off('credits-updated', onCreditsUpdated);
      socket.off('contact-update', onContactUpdate);
    };
  }, [user?.id, syncCreditsAfterCall, syncCreditsNow]);

  useEffect(() => {
    if (location.pathname === '/profile/me') {
      void syncCreditsNow();
    }
  }, [location.pathname, syncCreditsNow]);

  return null;
}
