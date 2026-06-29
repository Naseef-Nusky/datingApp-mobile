import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { FaUser, FaHeart, FaGift, FaCog, FaQuestionCircle, FaTag, FaFileContract, FaSignOutAlt, FaCrown, FaPhotoVideo, FaInfoCircle, FaLock, FaShieldAlt, FaChevronDown, FaChevronRight } from 'react-icons/fa';

function formatVipDeadline(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ProfileDropdown = ({ onOpenSettings, onOpenPresents, onOpenAbout, onOpenHelp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [termsSubmenuOpen, setTermsSubmenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [vipProgress, setVipProgress] = useState(null);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const { t, translatePageNow } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      axios.get('/api/vip/progress').then((res) => setVipProgress(res.data)).catch(() => setVipProgress(null));
    } else if (!isOpen) {
      setVipProgress(null);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen && typeof translatePageNow === 'function') {
      const id = setTimeout(translatePageNow, 150);
      return () => clearTimeout(id);
    }
  }, [isOpen, translatePageNow]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  const canViewVip = vipProgress && (vipProgress.premiumActive || (vipProgress.totalCreditsSpent ?? 0) > 0);
  const creditsRequired = vipProgress?.creditsRequired ?? 160;
  const vipPercent = vipProgress && creditsRequired > 0
    ? Math.min(100, (vipProgress.creditsSpentLast30Days ?? 0) / creditsRequired * 100)
    : 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setTermsSubmenuOpen(false);
      }
    };

    // Use pointer events so mobile taps also close reliably
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const menuItems = [
    { id: 'profile', labelKey: 'nav.myProfile', icon: FaUser, path: '/profile/me', active: true, color: 'text-red-600' },
    { id: 'mingle', labelKey: 'nav.letsMingle', icon: FaHeart, path: null, color: 'text-gray-800', action: 'openMingleModal' },
    // { id: 'network', labelKey: 'nav.ourDatingNetwork', icon: FaGlobe, path: '/network', color: 'text-gray-500', disabled: true },
    { id: 'presents', labelKey: 'nav.presents', icon: FaGift, path: null, color: 'text-gray-800', action: 'openPresents' },
    { id: 'settings', labelKey: 'nav.settings', icon: FaCog, path: null, color: 'text-gray-800', action: 'openSettings' },
    { id: 'help', labelKey: 'home.helpCenter', icon: FaQuestionCircle, path: null, color: 'text-gray-800', action: 'openHelp' },
    { 
      id: 'terms-parent', 
      labelKey: 'dropdown.termsPrivacy', 
      icon: FaFileContract, 
      path: null,
      color: 'text-gray-500',
      hasSubmenu: true,
      submenu: [
        { id: 'about', labelKey: 'dropdown.aboutVantage', action: 'openAbout' },
        { id: 'terms', labelKey: 'dropdown.termsOfUse', action: 'openTermsOfUse' },
        { id: 'privacy', labelKey: 'dropdown.privacyPolicy', action: 'openPrivacyPolicy' },
        { id: 'refund', labelKey: 'dropdown.refundPolicy', action: 'openRefundPolicy' },
        { id: 'safety', labelKey: 'dropdown.safetyPolicy', action: 'openSafetyPolicy' },
      ]
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Picture Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
          {profile?.photos?.[0] ? (
            <img 
              src={profile.photos[0].url} 
              alt={profile.firstName || 'User'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-lg font-semibold">
              {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 min-w-[14rem] max-w-[calc(100vw-2rem)] max-h-[calc(100*var(--vh)-5rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col">
          {/* Profile Header + Menu Items - scrollable on mobile */}
          <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 min-w-0">
          {/* Profile Header */}
          <div className="px-6 py-4 border-b border-gray-200 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                {profile?.photos?.[0] ? (
                  <img 
                    src={profile.photos[0].url} 
                    alt={profile.firstName || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-semibold">
                    {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {profile?.firstName && profile?.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile?.firstName || user?.email?.split('@')[0] || 'User'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              ID: {user?.id?.substring(0, 12) || 'N/A'}
            </p>

            {/* VIP progress – only for paid / credit-used customers */}
            {canViewVip && !vipProgress.vipActive && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-nex-orange to-nex-pink rounded-full transition-all"
                      style={{ width: `${vipPercent}%` }}
                    />
                  </div>
                  <FaCrown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                </div>
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Become a VIP member
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Spend {vipProgress.remainingToVip ?? 0} credits by {formatVipDeadline(vipProgress.deadlineDate)} to earn VIP status.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/vip');
                  }}
                  className="mt-2 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 px-2 py-1.5 rounded transition"
                >
                  More &gt;
                </button>
              </div>
            )}
            {canViewVip && vipProgress.vipActive && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600">VIP member</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/vip');
                  }}
                  className="text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 px-2 py-1.5 rounded transition"
                >
                  More &gt;
                </button>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;
              
              // Handle mingle modal action
              if (item.action === 'openMingleModal') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.disabled) {
                        return;
                      }
                      setIsOpen(false);
                      // Navigate to dashboard if not already there, then open intro modal
                      if (window.location.pathname !== '/dashboard') {
                        navigate('/dashboard', { state: { openMingleIntro: true } });
                      } else {
                        // Dispatch event to open mingle intro modal
                        window.dispatchEvent(new CustomEvent('openMingleIntro'));
                      }
                    }}
                    className={`w-full flex items-center px-6 py-3 transition ${
                      item.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-gray-50 cursor-pointer'
                    } ${isActive ? 'bg-red-50' : ''}`}
                  >
                    <Icon className={`mr-3 ${item.color} ${isActive ? 'text-red-600' : ''}`} />
                    <span
                      className={`${item.color} ${isActive ? 'font-semibold text-red-600' : ''} ${
                        item.underline ? 'underline' : ''
                      }`}
                    >
                      {item.labelKey ? t(item.labelKey) : item.label}
                    </span>
                  </button>
                );
              }

              if (item.action === 'openSettings') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!onOpenSettings) {
                        return;
                      }
                      setIsOpen(false);
                      onOpenSettings();
                    }}
                    className={`w-full flex items-center px-6 py-3 transition hover:bg-gray-50 cursor-pointer ${
                      isActive ? 'bg-red-50' : ''
                    }`}
                  >
                    <Icon className={`mr-3 ${item.color} ${isActive ? 'text-red-600' : ''}`} />
                    <span
                      className={`${item.color} ${isActive ? 'font-semibold text-red-600' : ''} ${
                        item.underline ? 'underline' : ''
                      }`}
                    >
                      {item.labelKey ? t(item.labelKey) : item.label}
                    </span>
                  </button>
                );
              }

              if (item.action === 'openPresents') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!onOpenPresents) return;
                      setIsOpen(false);
                      onOpenPresents();
                    }}
                    className={`w-full flex items-center px-6 py-3 transition hover:bg-gray-50 cursor-pointer ${
                      isActive ? 'bg-red-50' : ''
                    }`}
                  >
                    <Icon className={`mr-3 ${item.color} ${isActive ? 'text-red-600' : ''}`} />
                    <span
                      className={`${item.color} ${isActive ? 'font-semibold text-red-600' : ''} ${
                        item.underline ? 'underline' : ''
                      }`}
                    >
                      {item.labelKey ? t(item.labelKey) : item.label}
                    </span>
                  </button>
                );
              }

              if (item.action === 'openHelp') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!onOpenHelp) return;
                      setIsOpen(false);
                      onOpenHelp();
                    }}
                    className={`w-full flex items-center px-6 py-3 transition hover:bg-gray-50 cursor-pointer ${
                      isActive ? 'bg-red-50' : ''
                    }`}
                  >
                    <Icon className={`mr-3 ${item.color} ${isActive ? 'text-red-600' : ''}`} />
                    <span
                      className={`${item.color} ${isActive ? 'font-semibold text-red-600' : ''} ${
                        item.underline ? 'underline' : ''
                      }`}
                    >
                      {item.labelKey ? t(item.labelKey) : item.label}
                    </span>
                  </button>
                );
              }

              if (item.hasSubmenu) {
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => setTermsSubmenuOpen(!termsSubmenuOpen)}
                      className="w-full flex items-center justify-between px-6 py-3 transition hover:bg-gray-50 cursor-pointer text-left"
                    >
                      <div className="flex items-center">
                        <Icon className={`mr-3 ${item.color}`} />
                        <span className={item.color}>{item.labelKey ? t(item.labelKey) : item.label}</span>
                      </div>
                      {termsSubmenuOpen ? (
                        <FaChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FaChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    {termsSubmenuOpen && item.submenu && (
                      <div className="bg-gray-50 border-l-2 border-gray-200 ml-2">
                        {item.submenu.map((sub) => (
                          sub.path ? (
                            <Link
                              key={sub.id}
                              to={sub.path}
                              onClick={() => {
                                setIsOpen(false);
                                setTermsSubmenuOpen(false);
                              }}
                              className="block px-6 py-3 min-h-[44px] pl-10 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition break-words"
                            >
                              {sub.labelKey ? t(sub.labelKey) : sub.label}
                            </Link>
                          ) : (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                setTermsSubmenuOpen(false);
                                if (sub.action === 'openAbout') onOpenAbout?.();
                                if (sub.action === 'openTermsOfUse') window.dispatchEvent(new CustomEvent('openTermsOfUse'));
                                if (sub.action === 'openPrivacyPolicy') window.dispatchEvent(new CustomEvent('openPrivacyPolicy'));
                                if (sub.action === 'openRefundPolicy') window.dispatchEvent(new CustomEvent('openRefundPolicy'));
                                if (sub.action === 'openSafetyPolicy') window.dispatchEvent(new CustomEvent('openSafetyPolicy'));
                              }}
                              className="block w-full text-left px-6 py-3 min-h-[44px] pl-10 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition break-words"
                            >
                              {sub.labelKey ? t(sub.labelKey) : sub.label}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.disabled ? '#' : item.path}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                      return;
                    }
                    setIsOpen(false);
                  }}
                  className={`flex items-center px-6 py-3 transition ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-gray-50 cursor-pointer'
                  } ${isActive ? 'bg-red-50' : ''}`}
                >
                  <Icon className={`mr-3 ${item.color} ${isActive ? 'text-red-600' : ''}`} />
                  <span
                    className={`${item.color} ${isActive ? 'font-semibold text-red-600' : ''} ${
                      item.underline ? 'underline' : ''
                    }`}
                  >
                    {item.labelKey ? t(item.labelKey) : item.label}
                  </span>
                </Link>
              );
            })}

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 transition cursor-pointer"
            >
              <FaSignOutAlt className="mr-3" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;

