import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  FaCrown,
  FaGift,
  FaSmile,
  FaMagic,
  FaTrophy,
  FaBoxOpen,
  FaLock,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { useRefillModal } from '../context/RefillModalContext';
import { useLanguage } from '../context/LanguageContext';

const benefits = [
  { id: 'badge', title: 'VIP badge', icon: FaCrown },
  { id: 'gifts', title: 'Virtual Gifts Pack', icon: FaGift },
  { id: 'sticker', title: 'Sticker Pack', icon: FaSmile },
  { id: 'highlight', title: 'Highlighted Profile', icon: FaMagic },
  { id: 'moments', title: 'Moments Journey', icon: FaTrophy },
  { id: 'more', title: 'More Soon...', icon: FaBoxOpen },
];

const faqs = [
  {
    q: 'Can I get my VIP status back if it expires?',
    a: 'Yes, absolutely. If your VIP status expires, you can easily unlock it again. Simply keep your Premium subscription active and spend at least 160 credits within the last 30 days. Once you meet these conditions, VIP will be automatically reactivated for another 30 days of exclusive benefits.',
  },
  {
    q: 'Do I need to apply again for VIP every month?',
    a: 'No, there\'s no need to reapply. VIP status renews automatically as long as you maintain an active Premium subscription and spend 160 credits in the past 30 days. If you don\'t meet the requirement one month, you can qualify again anytime by meeting it later.',
  },
  {
    q: 'How do I become a VIP?',
    a: 'Becoming a VIP is simple. Just make sure you have an active Premium subscription and stay active on the platform. Spend 160 credits on eligible features such as chatting or video calls within 30 days, and VIP status will unlock instantly—along with 30 days of exclusive perks.',
  },
  {
    q: 'How long does VIP status last?',
    a: 'VIP status is valid for 30 days. After that, it will automatically renew each month if you continue your Premium subscription and meet the required credit spending during the previous 30 days.',
  },
  {
    q: 'How can I check my progress toward VIP renewal?',
    a: 'You can easily track your progress by visiting your VIP page and reviewing your credit spending history. This shows how many credits you\'ve used and how close you are to meeting the VIP renewal requirements.',
  },
  {
    q: 'What benefits do VIP members receive?',
    a: 'VIP members enjoy exclusive rewards, including special virtual gift packs, sticker bundles, a visible VIP crown badge on their profile, and profile highlighting for increased visibility. Additional VIP features will be introduced in the future.',
  },
  {
    q: 'What happens if I don\'t meet the VIP renewal requirements?',
    a: 'If you don\'t maintain an active Premium subscription or spend the required 160 credits within the last 30 days, your VIP status will not renew. However, you can regain VIP status at any time by meeting the requirements again.',
  },
  {
    q: 'What is VIP?',
    a: 'VIP is a special status designed to reward our most active users. It adds a golden crown badge to your profile, increases your visibility, and unlocks exclusive features like premium stickers and virtual gifts. VIP enhances your dating experience by helping you stand out and connect more easily with others.',
  },
];

function formatDeadline(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VipPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { openRefillModal } = useRefillModal();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [freeProfiles, setFreeProfiles] = useState([]);

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    axios.get('/api/vip/free-profiles?limit=12').then((res) => {
      setFreeProfiles(res.data.profiles || []);
    }).catch(() => setFreeProfiles([]));
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await axios.get('/api/vip/progress');
      setProgress(res.data);
    } catch (err) {
      console.error('VIP progress error:', err);
      setProgress({
        premiumActive: false,
        vipActive: false,
        totalCreditsSpent: 0,
        creditsSpentLast30Days: 0,
        creditsRequired: 160,
        remainingToVip: 160,
        deadlineDate: null,
        firstName: null,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  const p = progress || {};
  const creditsRequired = p.creditsRequired ?? 160;
  const canViewVip = p.premiumActive || (p.totalCreditsSpent ?? 0) > 0;
  if (!canViewVip) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white rounded-xl shadow-md p-8">
          <p className="text-lg mb-4">VIP is for Premium members and users who have used credits.</p>
          <p className="text-gray-500 text-sm mb-6">{t('vip.upgradeToSeeVip')}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-nex text-white font-medium rounded-lg hover:opacity-90 transition"
          >
            {t('nav.dashboard')}
          </button>
        </div>
      </div>
    );
  }

  const remaining = p.remainingToVip ?? creditsRequired;
  const spent = p.creditsSpentLast30Days ?? 0;
  const percent = creditsRequired > 0 ? Math.min(100, (spent / creditsRequired) * 100) : 0;
  const isVip = !!p.vipActive;
  const premiumActive = !!p.premiumActive;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Premium card */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-semibold mb-1 text-gray-900">Premium</h1>
          <p className="text-gray-600 mb-4">
            Hi, {p.firstName || 'there'}!
          </p>
          {!isVip && premiumActive && (
            <>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-nex"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Spend <strong className="text-gray-900">{remaining}</strong> credits before{' '}
                <strong className="text-gray-900">{formatDeadline(p.deadlineDate) || '—'}</strong> to get VIP.
              </p>
              <button
                type="button"
                className="text-nex-orange text-sm font-medium hover:underline"
              >
                More &gt;
              </button>
            </>
          )}
          {isVip && (
            <p className="text-nex-orange font-medium">{t('vip.youHaveVip')}</p>
          )}
          {!premiumActive && (
            <p className="text-nex-orange">{t('vip.upgradeForVip')}</p>
          )}
        </div>

        {/* Unlock VIP benefits & optional extras - commented out
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Unlock VIP benefits & optional extras</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {benefits.map((b) => {
            const Icon = b.icon;
            const unlocked = isVip;
            return (
              <div
                key={b.id}
                className="bg-white rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[120px] shadow-sm border border-gray-200"
              >
                {!unlocked && (
                  <span className="absolute top-2 right-2 text-gray-400">
                    <FaLock className="w-4 h-4" />
                  </span>
                )}
                <Icon className="w-10 h-10 text-nex-orange mb-2" />
                <span className="text-sm font-medium text-center text-gray-700">{b.title}</span>
              </div>
            );
          })}
        </div>
        */}

        {/* How to unlock */}
        <h2 className="text-lg font-semibold mb-2 text-gray-900">{t('vip.howToUnlockVip')}</h2>
        <p className="text-gray-600 text-sm mb-4">
          Spend credits on exclusive interactions with free users
        </p>
        <div className="flex flex-wrap gap-4 mb-8">
          {freeProfiles.length > 0 ? (
            freeProfiles.map((profile) => (
              <Link
                key={profile.id}
                to={`/profile/${profile.id}`}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="relative w-14 h-14">
                  <div className="w-14 h-14 rounded-full bg-gray-200 border-[3px] border-gray-500 overflow-hidden flex-shrink-0 group-hover:border-gray-600 transition">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-semibold">
                      {profile.firstName?.charAt(0) || '?'}
                    </span>
                  )}
                  </div>
                  {/* Small bottom-center status badge like sample UI */}
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-gray-500 flex items-center justify-center shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-500" />
                  </span>
                </div>
                <span className="text-xs text-gray-600 group-hover:text-nex-orange transition truncate max-w-[72px]">
                  {profile.firstName}
                  {profile.lastName ? ` ${profile.lastName.charAt(0)}.` : ''}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm">{t('vip.noFreeProfiles')}</p>
          )}
        </div>

        {/* FAQ */}
        <h2 className="text-lg font-semibold mb-4 text-gray-900">{t('vip.faq')}</h2>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
            >
              <button
                type="button"
                className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-gray-800 hover:bg-gray-50 transition"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                {faq.q}
                {openFaq === idx ? (
                  <FaChevronUp className="w-4 h-4 flex-shrink-0 text-nex-orange" />
                ) : (
                  <FaChevronDown className="w-4 h-4 flex-shrink-0 text-nex-orange" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-3 pt-0 text-gray-600 text-sm border-t border-gray-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Refill CTA */}
        {!isVip && premiumActive && remaining > 0 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => openRefillModal && openRefillModal()}
              className="px-6 py-3 bg-gradient-nex text-white font-medium rounded-lg hover:opacity-90 transition shadow-md"
            >
              Refill account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
