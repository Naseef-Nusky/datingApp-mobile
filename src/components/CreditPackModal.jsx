import { useEffect, useState } from 'react';
import { FaTimes, FaApple, FaGoogle, FaBitcoin, FaCreditCard, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';

// Default refill credit packs; can be overridden by CRM config
const DEFAULT_REFILL_PACKS = [
  { id: 'p20', credits: 20, price: 16, saveLabel: 'SAVE 20%', badge: 'BESTSELLER', imageUrl: '' },
  { id: 'p50', credits: 50, price: 39, saveLabel: 'SAVE 17%', badge: '', imageUrl: '' },
  { id: 'p160', credits: 160, price: 99, saveLabel: 'SAVE 16%', badge: '', imageUrl: '' },
  { id: 'p1000', credits: 1000, price: 480, saveLabel: 'SAVE 16%', badge: 'BEST VALUE', imageUrl: '' },
];

const CreditPackModal = ({ isOpen, onClose, onCreditsAdded, requiredCredits = 0, returnPath = null }) => {
  const [packs, setPacks] = useState(DEFAULT_REFILL_PACKS);
  const [selectedPackId, setSelectedPackId] = useState(DEFAULT_REFILL_PACKS[0]?.id || null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios
      .get(`${apiUrl}/api/credits/refill-packs`)
      .then((res) => {
        if (Array.isArray(res.data?.packs) && res.data.packs.length) {
          setPacks(res.data.packs);
          setSelectedPackId(res.data.packs[0]?.id || res.data.packs[0]?.credits?.toString() || null);
        }
      })
      .catch(() => {
        // fallback to defaults
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!Array.isArray(packs) || packs.length === 0) return;

    const minimumCredits = Math.max(0, Number(requiredCredits) || 0);
    const eligiblePacks = minimumCredits > 0
      ? packs.filter((p) => (Number(p?.credits) || 0) >= minimumCredits)
      : packs;
    const packsToShow = eligiblePacks.length > 0 ? eligiblePacks : packs;
    if (packsToShow.length === 0) return;

    const selectedIsStillVisible = packsToShow.some((p) => p.id === selectedPackId);
    if (!selectedIsStillVisible) {
      setSelectedPackId(packsToShow[0].id);
    }
  }, [isOpen, packs, requiredCredits, selectedPackId]);

  if (!isOpen) return null;

  const minimumCredits = Math.max(0, Number(requiredCredits) || 0);
  const eligiblePacks = minimumCredits > 0
    ? (packs || []).filter((p) => (Number(p?.credits) || 0) >= minimumCredits)
    : (packs || []);
  const packsToShow = eligiblePacks.length > 0 ? eligiblePacks : (packs || []);
  const selectedPack = packsToShow.find((p) => p.id === selectedPackId) || packsToShow[0];
  const maxStart = Math.max(0, (packsToShow?.length || 0) - 3);
  const clampedIndex = Math.min(currentIndex, maxStart);
  const visiblePacks = (packsToShow || []).slice(clampedIndex, clampedIndex + 3);

  const handlePurchase = async () => {
    if (!selectedPack) return;
    setError(null);
    setPurchasing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const { data } = await axios.post(`${apiUrl}/api/credits/refill-checkout-session`, {
        packId: selectedPack.id,
        returnPath: returnPath || undefined,
      });
      if (data?.url) {
        onClose?.();
        window.location.href = data.url;
        return;
      }
      if (data?.message?.includes('not configured')) {
        setError('Payment is not configured. Please try again later.');
        return;
      }
      setError('Could not start checkout.');
    } catch (err) {
      if (err.response?.status === 503 || err.response?.data?.message?.includes('Stripe')) {
        setError('Payment is not configured. Please try again later.');
        return;
      }
      const msg = err.response?.data?.message || 'Failed to start checkout';
      setError(msg);
    } finally {
      setPurchasing(false);
    }
  };

  const payWith = () => {
    if (!selectedPack) {
      setError('Please select a credit pack first.');
      return;
    }
    handlePurchase();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[calc(90*var(--vh))] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Purchase Credits and continue communicating!
            </h2>
            {minimumCredits > 0 && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                You need at least {minimumCredits} credits to complete this action.
              </p>
            )}
            <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-xl">
              Communication with Free Users costs: Live Chat — 1 Credit per minute, Offline message — 1 Credit,
              Email — 10 Credits.&nbsp;
              <button
                type="button"
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Read more
              </button>
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Packs */}
        <div className="px-6 pt-4 pb-2">
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={clampedIndex === 0}
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaChevronLeft />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              {visiblePacks.map((pack) => {
              const isActive = selectedPackId === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setSelectedPackId(pack.id)}
                  className={[
                    'relative flex flex-col items-stretch rounded-xl border p-4 shadow-sm text-left transition',
                    isActive
                      ? 'border-red-500 ring-2 ring-red-200 bg-red-50'
                      : 'border-gray-200 hover:border-red-400 hover:bg-red-50/40',
                  ].join(' ')}
                >
                  {pack.badge && (
                    <span
                      className={`absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-semibold shadow ${
                        pack.badge === 'BEST VALUE'
                          ? 'bg-emerald-400 text-emerald-900'
                          : 'bg-amber-400 text-amber-900'
                      }`}
                    >
                      {pack.badge}
                    </span>
                  )}
                  <div className="mt-1 space-y-1">
                    {pack.imageUrl && (
                      <div className="w-full flex justify-center mb-1">
                        <img
                          src={pack.imageUrl}
                          alt={`${pack.credits} Credits`}
                          className="h-16 w-16 object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="text-sm font-semibold text-gray-900">
                      {pack.credits} Credits
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {pack.credits > 0 && pack.price > 0 && (
                        <>
                          ≈{' '}
                          <span className="line-through">
                            {(() => {
                              const unitNow = pack.price / pack.credits;
                              const match = String(pack.saveLabel || '').match(/(\d+)%/);
                              if (!match) return unitNow.toFixed(2);
                              const percent = parseInt(match[1], 10);
                              if (!percent || percent >= 100) return unitNow.toFixed(2);
                              const unitWas = unitNow / (1 - percent / 100);
                              return unitWas.toFixed(2);
                            })()}
                          </span>{' '}
                          <span className="font-semibold text-gray-800">
                            {(pack.price / pack.credits).toFixed(2)} USD
                          </span>{' '}
                          each
                        </>
                      )}
                    </div>
                    <div className="pt-1 text-2xl font-bold text-gray-900">
                      ${pack.price}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700">
                      {pack.saveLabel}
                    </div>
                  </div>
                </button>
              );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(maxStart, i + 1))}
              disabled={clampedIndex >= maxStart}
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Single payment button */}
        <div className="px-6 pt-4 pb-6 space-y-3">
          <button
            type="button"
            onClick={() => payWith()}
            disabled={purchasing}
            className="w-full inline-flex items-center justify-center rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {purchasing ? 'PROCESSING...' : `PAY ${selectedPack ? `$${selectedPack.price} USD` : ''}`}
          </button>
          <p className="text-[11px] text-center text-gray-500">
            You&apos;ve selected {selectedPack?.credits ?? 0} Credits. They will be added to your balance
            instantly after successful payment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditPackModal;
