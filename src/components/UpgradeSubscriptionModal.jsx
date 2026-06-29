import { useState, useEffect } from 'react';
import { FaTimes, FaComment, FaPaperPlane, FaCoins } from 'react-icons/fa';
import axios from 'axios';

const DEFAULT_PACKS = [
  { plan: 'basic', creditsLabel: '150 Credits/Mo', wasPrice: '69', price: '19.99', save: 'SAVE 66%' },
  { plan: 'premium', creditsLabel: '600 Credits/Mo', wasPrice: '179', price: '149', save: 'SAVE 16%' },
  { plan: 'vip', creditsLabel: '1500 Credits/Mo', wasPrice: '369', price: '299', save: 'SAVE 16%' },
];

const DEFAULT_BONUSES = [
  { iconType: 'infinity', iconBg: 'bg-blue-500', bold: 'Free Communication', rest: ' with all members, except Free Users' },
  { iconType: 'coins', iconBg: 'bg-amber-500', bold: 'Get Credits Each Month', rest: ' to spend on gifts and communication' },
  { iconType: 'comment', iconBg: 'bg-teal-500', bold: 'Read All Messages', rest: ' you receive in chat' },
  { iconType: 'paperplane', iconBg: 'bg-red-500', bold: "Let's Mingle", rest: ' to reach out to members with one message.' },
];

function renderBonusIcon(iconType) {
  switch (iconType) {
    case 'coins': return <FaCoins className="text-white text-lg" />;
    case 'comment': return <FaComment className="text-white text-lg" />;
    case 'paperplane': return <FaPaperPlane className="text-white text-lg" />;
    default: return <span className="text-xl font-bold">∞</span>;
  }
}

export default function UpgradeSubscriptionModal({ isOpen, onClose, onSubscribed }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.get(`${apiUrl}/api/credits/subscription-modal`).then((res) => {
      if (res.data && (res.data.subscriptionPacks?.length || res.data.subscriptionModalTitle)) {
        setConfig(res.data);
      }
    }).catch(() => setConfig({}));
  }, [isOpen]);

  const packs = (config?.subscriptionPacks?.length ? config.subscriptionPacks : DEFAULT_PACKS);
  const bonuses = (config?.subscriptionBonuses?.length ? config.subscriptionBonuses : DEFAULT_BONUSES);
  const title = config?.subscriptionModalTitle ?? 'Subscribe to a Monthly Credit Pack & Date FREELY!';
  const step1Title = config?.subscriptionStep1Title ?? '1. Choose Monthly Credit Pack Size:';
  const step2Title = config?.subscriptionStep2Title ?? '2. Get Bonuses:';
  const costLinkText = config?.subscriptionCostLinkText ?? 'Click here to see the cost of services.';
  const disclaimer = config?.subscriptionDisclaimer ?? '*1st month discounted: starting from the 2nd month you will be charged 49.99 USD.';

  if (!isOpen) return null;

  const handleSubscribe = async (pack) => {
    if (!pack?.plan) return;
    setError(null);
    setSubmitting(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    try {
      const { data } = await axios.post(`${apiUrl}/api/credits/create-checkout-session`, { plan: pack.plan });
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
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[calc(90*var(--vh))] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-10">
            {title.includes('FREELY') ? (
              <>
                {title.split('FREELY')[0]}
                <span className="text-teal-600">FREELY</span>
                {title.includes('!') ? '!' : ''}
              </>
            ) : title}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">{step1Title}</h3>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              {packs.map((pack) => (
                <button
                  key={pack.plan}
                  type="button"
                  onClick={() => handleSubscribe(pack)}
                  disabled={submitting}
                  className="w-full relative bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white rounded-lg p-4 text-left transition shadow-md"
                >
                  <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-sm shadow">
                    {pack.save}
                  </span>
                  <div className="font-semibold text-lg">{pack.creditsLabel}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="line-through text-teal-200 text-sm">{pack.wasPrice}</span>
                    <span className="font-bold text-lg">{pack.price} USD*</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">{step2Title}</h3>
            <ul className="space-y-4">
              {bonuses.map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full ${item.iconBg || 'bg-gray-400'} flex items-center justify-center text-white border-2 border-white shadow`}
                  >
                    {renderBonusIcon(item.iconType)}
                  </div>
                  <p className="text-gray-700 text-sm pt-1.5">
                    <span className="font-semibold text-gray-900">{item.bold}</span>
                    {item.rest}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-6 pt-0 text-center text-xs text-gray-600">
          <button
            type="button"
            className="text-gray-500 text-sm underline hover:text-gray-700"
          >
            {costLinkText}
          </button>
          <p className="mt-2">{disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
