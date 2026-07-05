import { useEffect, useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { useCreditsSync } from '../hooks/useCreditsSync';
import { useNavigate } from 'react-router-dom';

const QuickPresentsModal = ({ isOpen, onClose, receiverId, receiverPool = [] }) => {
  const { user } = useAuth();
  const { syncCreditsAfterAction } = useCreditsSync();
  const { handleInsufficientCredits, handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const navigate = useNavigate();

  const [receiver, setReceiver] = useState(null);
  const [receiverChoices, setReceiverChoices] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [giftByReceiver, setGiftByReceiver] = useState({});
  const [activeReceiverId, setActiveReceiverId] = useState(receiverId || null);

  const pickRandom = (arr, excludeValue = null) => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const pool = excludeValue ? arr.filter((v) => String(v) !== String(excludeValue)) : arr;
    const finalPool = pool.length > 0 ? pool : arr;
    return finalPool[Math.floor(Math.random() * finalPool.length)] || null;
  };

  useEffect(() => {
    if (!isOpen) return;
    if (receiverId) {
      setActiveReceiverId(String(receiverId));
      return;
    }
    const picked = pickRandom(receiverPool);
    setActiveReceiverId(picked ? String(picked) : null);
  }, [isOpen, receiverId, receiverPool]);

  useEffect(() => {
    if (!isOpen) return;
    const pool = Array.isArray(receiverPool) ? receiverPool.slice(0, 3) : [];
    if (pool.length === 0) {
      setReceiverChoices([]);
      return;
    }

    let cancelled = false;
    const loadChoices = async () => {
      const results = await Promise.allSettled(
        pool.map((id) => axios.get(`/api/profiles/${id}`))
      );
      if (cancelled) return;
      const choices = results
        .map((res, idx) => {
          if (res.status !== 'fulfilled') return null;
          const p = res.value.data;
          return {
            id: String(pool[idx]),
            name: p?.firstName || 'User',
            photo: Array.isArray(p?.photos) && p.photos.length > 0 ? p.photos[0]?.url || null : null,
          };
        })
        .filter(Boolean);
      setReceiverChoices(choices);
    };
    loadChoices();
    return () => {
      cancelled = true;
    };
  }, [isOpen, receiverPool]);

  useEffect(() => {
    if (!isOpen || !activeReceiverId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, catalogRes] = await Promise.allSettled([
          axios.get(`/api/profiles/${activeReceiverId}`),
          axios.get('/api/gifts/catalog?type=physical'),
        ]);

        if (!cancelled) {
          const profileData = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
          setReceiver(profileData || null);

          const catalogData = catalogRes.status === 'fulfilled' ? catalogRes.value.data : [];
          const allGifts = Array.isArray(catalogData) ? catalogData : [];
          setGifts(allGifts);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Quick presents load error:', error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeReceiverId]);

  const pickRandomGift = (source, excludeGiftId = null) => {
    if (!Array.isArray(source) || source.length === 0) return null;
    const pool = excludeGiftId ? source.filter((g) => g?.id !== excludeGiftId) : source;
    const finalPool = pool.length > 0 ? pool : source;
    return finalPool[Math.floor(Math.random() * finalPool.length)] || null;
  };

  const displayReceivers = useMemo(() => {
    if (receiverChoices.length > 0) return receiverChoices.slice(0, 2);
    if (!activeReceiverId) return [];
    return [
      {
        id: String(activeReceiverId),
        name: receiver?.firstName || 'your match',
        photo:
          Array.isArray(receiver?.photos) && receiver.photos.length > 0
            ? receiver.photos[0]?.url || null
            : null,
      },
    ];
  }, [receiverChoices, activeReceiverId, receiver]);

  useEffect(() => {
    if (!isOpen || !Array.isArray(gifts) || gifts.length === 0 || displayReceivers.length === 0) return;
    setGiftByReceiver((prev) => {
      const next = { ...prev };
      displayReceivers.forEach((r) => {
        const current = next[r.id];
        if (!current || !gifts.some((g) => g.id === current.id)) {
          next[r.id] = pickRandomGift(gifts);
        }
      });
      return next;
    });
  }, [isOpen, gifts, displayReceivers]);

  const handleSend = async (targetReceiverId, gift) => {
    if (!targetReceiverId || !gift?.id) return;

    const requiredCredits = Number(gift?.creditCost) || 0;
    const balance = Number(user?.credits) || 0;
    if (requiredCredits > 0 && balance < requiredCredits) {
      const currentPath = window.location.pathname + window.location.search;
      const joiner = currentPath.includes('?') ? '&' : '?';
      handleInsufficientCredits({
        requiredCredits,
        balance,
        returnPath: `${currentPath}${joiner}openQuickPresents=1&presentReceiverId=${encodeURIComponent(
          String(targetReceiverId),
        )}`,
      });
      return;
    }

    setSendingId(`${targetReceiverId}-${gift.id}`);
    try {
      const response = await axios.post('/api/gifts/send', {
        receiverId: targetReceiverId,
        giftId: gift.id,
        message: null,
      });
      await syncCreditsAfterAction(response.data);
      alert('Your present has been sent!');
      onClose?.();
    } catch (error) {
      const currentPath = window.location.pathname + window.location.search;
      const joiner = currentPath.includes('?') ? '&' : '?';
      const returnPath = `${currentPath}${joiner}openQuickPresents=1&presentReceiverId=${encodeURIComponent(
        String(targetReceiverId),
      )}`;
      if (
        !handleInsufficientCreditsError(error, {
          requiredCredits,
          returnPath,
        })
      ) {
        alert(error.response?.data?.message || 'Failed to send present');
      }
    } finally {
      setSendingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4 pb-[env(safe-area-inset-bottom)]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[calc(90*var(--vh)-env(safe-area-inset-bottom,0px))] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-10 pt-6 pb-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Delight your match with a present
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              Touch the heart of your match with an amazing present which will be carefully
              delivered to their doorstep.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center px-4 sm:px-10 py-6">
          {loading && (
            <div className="text-sm text-gray-500">Loading presents...</div>
          )}
          {!loading && displayReceivers.length === 0 && (
            <div className="text-sm text-gray-500">No presents available right now.</div>
          )}
          {!loading && displayReceivers.length > 0 && (
            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-6">
              {displayReceivers.map((person) => {
                const currentGift = giftByReceiver[person.id];
                if (!currentGift) return null;
                const sendKey = `${person.id}-${currentGift.id}`;
                return (
                  <div
                    key={person.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 px-6 py-6 flex flex-col items-center text-center h-full"
                  >
                    <div className="relative mb-4">
                      {currentGift.imageUrl ? (
                        <img
                          src={currentGift.imageUrl}
                          alt={currentGift.name}
                          className="w-24 h-24 rounded-full object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-3xl">
                          🎁
                        </div>
                      )}
                      {person.photo && (
                        <img
                          src={person.photo}
                          alt={person.name}
                          className="absolute -right-1 -top-1 w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                        />
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {currentGift.name}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500 font-semibold">
                      For {person.name}
                    </p>
                    <p className="mt-3 text-xs sm:text-sm text-gray-600">
                      {currentGift.description ||
                        'A special present carefully delivered to make your match smile.'}
                    </p>
                    <div className="mt-auto pt-5 w-full flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => handleSend(person.id, currentGift)}
                        disabled={sendingId === sendKey}
                        className="w-full max-w-xs bg-gradient-vantage text-white text-xs sm:text-sm font-semibold py-2.5 rounded-md shadow hover:opacity-95 transition"
                      >
                        {sendingId === sendKey ? 'SENDING...' : 'SEND PRESENT'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (person.id) {
                            navigate(
                              `/profile/${encodeURIComponent(
                                String(person.id)
                              )}?openPresentShop=1&presentReceiverId=${encodeURIComponent(
                                String(person.id)
                              )}`
                            );
                          }
                          onClose?.();
                        }}
                        className="mt-2 text-xs sm:text-sm font-semibold text-vantage-purple hover:text-nex-pink"
                      >
                        CHOOSE ANOTHER
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickPresentsModal;

