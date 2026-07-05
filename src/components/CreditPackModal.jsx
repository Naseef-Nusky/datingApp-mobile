import { useEffect, useState } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import { openStripeCheckout } from '../utils/stripeCheckout';

const DEFAULT_REFILL_PACKS = [
  { id: 'p20', credits: 20, price: 16, saveLabel: 'SAVE 20%', badge: 'BESTSELLER', imageUrl: '' },
  { id: 'p50', credits: 50, price: 39, saveLabel: 'SAVE 17%', badge: '', imageUrl: '' },
  { id: 'p160', credits: 160, price: 99, saveLabel: 'SAVE 16%', badge: '', imageUrl: '' },
  { id: 'p1000', credits: 1000, price: 480, saveLabel: 'SAVE 16%', badge: 'BEST VALUE', imageUrl: '' },
];

const DEFAULT_SERVICE_COSTS = {
  chatMessage: 1,
  emailSendCredits: 10,
  mingleCredits: 5,
  photoViewCredits: 15,
  videoViewCredits: 15,
  voiceMessageCredits: 10,
  voiceCallPerMinute: 1,
  videoCallPerMinute: 2,
};

function creditLabel(n) {
  const v = Number(n) || 0;
  return `${v} credit${v === 1 ? '' : 's'}`;
}

function buildCostsSummary(costs) {
  const liveChat = costs.voiceCallPerMinute ?? costs.videoCallPerMinute ?? 1;
  const message = costs.chatMessage ?? 1;
  const email = costs.emailSendCredits ?? 10;
  return `Communication with Free Users costs: Live Chat — ${creditLabel(liveChat)} per minute, Offline message — ${creditLabel(message)}, Email — ${creditLabel(email)}.`;
}

function unitWasPrice(pack) {
  const unitNow = pack.price / pack.credits;
  const match = String(pack.saveLabel || '').match(/(\d+)%/);
  if (!match) return unitNow.toFixed(2);
  const percent = parseInt(match[1], 10);
  if (!percent || percent >= 100) return unitNow.toFixed(2);
  return (unitNow / (1 - percent / 100)).toFixed(2);
}

const CreditPackModal = ({ isOpen, onClose, onCreditsAdded, requiredCredits = 0, returnPath = null }) => {
  const [packs, setPacks] = useState(DEFAULT_REFILL_PACKS);
  const [selectedPackId, setSelectedPackId] = useState(DEFAULT_REFILL_PACKS[0]?.id || null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [serviceCosts, setServiceCosts] = useState(DEFAULT_SERVICE_COSTS);

  useEffect(() => {
    if (!isOpen) return;
    axios
      .get('/api/credits/refill-packs')
      .then((res) => {
        if (Array.isArray(res.data?.packs) && res.data.packs.length) {
          setPacks(res.data.packs);
          setSelectedPackId(res.data.packs[0]?.id || res.data.packs[0]?.credits?.toString() || null);
        }
      })
      .catch(() => {});

    axios
      .get('/api/credits/service-costs')
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          setServiceCosts({ ...DEFAULT_SERVICE_COSTS, ...res.data });
        }
      })
      .catch(() => setServiceCosts(DEFAULT_SERVICE_COSTS));
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
  const desktopPacks = (packsToShow || []).slice(clampedIndex, clampedIndex + 3);
  const costsSummary = buildCostsSummary(serviceCosts);

  const handlePurchase = async () => {
    if (!selectedPack) return;
    setError(null);
    setPurchasing(true);
    try {
      const { data } = await axios.post('/api/credits/refill-checkout-session', {
        packId: selectedPack.id,
        returnPath: returnPath || undefined,
        platform: 'mobile',
      });
      if (data?.url) {
        onClose?.();
        await openStripeCheckout(data.url, { sessionId: data.sessionId, kind: 'refill' });
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
      setError(err.response?.data?.message || 'Failed to start checkout');
    } finally {
      setPurchasing(false);
    }
  };

  const renderPackCard = (pack, compact = false) => {
    const isActive = selectedPackId === pack.id;
    return (
      <button
        key={pack.id}
        type="button"
        onClick={() => setSelectedPackId(pack.id)}
        className={[
          'relative flex flex-col rounded-xl border text-left transition active:scale-[0.98]',
          compact ? 'p-3 min-h-[7.5rem]' : 'p-4 shadow-sm',
          isActive
            ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50'
            : 'border-gray-200 bg-white hover:border-teal-300',
        ].join(' ')}
      >
        {pack.badge && (
          <span
            className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow whitespace-nowrap ${
              pack.badge === 'BEST VALUE'
                ? 'bg-emerald-400 text-emerald-900'
                : 'bg-amber-400 text-amber-900'
            }`}
          >
            {pack.badge}
          </span>
        )}
        <div className={pack.badge ? 'mt-2' : ''}>
          {pack.imageUrl && (
            <img
              src={pack.imageUrl}
              alt=""
              className={`object-contain mx-auto mb-1 ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}
              loading="lazy"
            />
          )}
          <div className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
            {pack.credits} Credits
          </div>
          {!compact && pack.credits > 0 && pack.price > 0 && (
            <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">
              ≈ <span className="line-through">{unitWasPrice(pack)}</span>{' '}
              <span className="font-semibold text-gray-700">
                {(pack.price / pack.credits).toFixed(2)}
              </span>{' '}
              USD each
            </div>
          )}
          <div className={`font-extrabold text-gray-900 ${compact ? 'text-xl mt-1' : 'text-2xl mt-1'}`}>
            ${pack.price}
          </div>
          {pack.saveLabel && (
            <div className={`font-semibold text-emerald-700 ${compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'}`}>
              {pack.saveLabel}
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Refill credits"
    >
      <div
        className="relative bg-white w-full sm:max-w-3xl sm:mx-4 flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[min(92dvh,100%)] sm:max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-start gap-3 px-4 sm:px-6 pt-2 sm:pt-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-2xl font-bold text-gray-900 leading-snug">
              <span className="sm:hidden">Refill Credits</span>
              <span className="hidden sm:inline">Purchase Credits and continue communicating!</span>
            </h2>
            {minimumCredits > 0 && (
              <p className="mt-1.5 text-xs sm:text-sm font-semibold text-teal-700">
                Need at least {minimumCredits} credits for this action
              </p>
            )}
            <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
              {costsSummary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2.5 -mr-1 rounded-full hover:bg-gray-100 text-gray-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Packs — 2-col grid on mobile, carousel grid on desktop */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-3 sm:py-4">
          {error && (
            <p className="text-red-600 text-sm mb-3 rounded-lg bg-red-50 px-3 py-2">{error}</p>
          )}

          {/* Mobile: all packs in 2-column grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:hidden">
            {packsToShow.map((pack) => renderPackCard(pack, true))}
          </div>

          {/* Desktop: 3-column with arrows */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={clampedIndex === 0}
              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-40"
              aria-label="Previous packs"
            >
              <FaChevronLeft />
            </button>
            <div className="grid grid-cols-3 gap-4 flex-1">
              {desktopPacks.map((pack) => renderPackCard(pack, false))}
            </div>
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(maxStart, i + 1))}
              disabled={clampedIndex >= maxStart}
              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-40"
              aria-label="Next packs"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Sticky pay footer */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 sm:px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
          <div className="flex items-center justify-between text-sm sm:hidden">
            <span className="text-gray-600">Selected</span>
            <span className="font-bold text-gray-900">
              {selectedPack?.credits ?? 0} credits · ${selectedPack?.price ?? 0}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!selectedPack) {
                setError('Please select a credit pack first.');
                return;
              }
              handlePurchase();
            }}
            disabled={purchasing || !selectedPack}
            className="w-full inline-flex items-center justify-center rounded-xl bg-teal-600 py-3.5 text-base font-bold text-white hover:bg-teal-700 active:bg-teal-800 disabled:opacity-60 min-h-[50px] touch-manipulation shadow-md shadow-teal-600/20"
          >
            {purchasing ? 'Processing…' : `Pay $${selectedPack?.price ?? 0} USD`}
          </button>
          <p className="text-[10px] sm:text-xs text-center text-gray-500 leading-snug">
            Credits added instantly after payment
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditPackModal;
