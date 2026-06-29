import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTwitter, FaMusic } from 'react-icons/fa';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

export default function SiteFooter() {
  const { language, changeLanguage, languages, t } = useLanguage();

  const flagUrlFor = (lang) => {
    switch (lang) {
      case 'es': return 'https://flagcdn.com/w40/es.png';
      case 'zh': return 'https://flagcdn.com/w40/cn.png';
      case 'it': return 'https://flagcdn.com/w40/it.png';
      case 'fr': return 'https://flagcdn.com/w40/fr.png';
      case 'de': return 'https://flagcdn.com/w40/de.png';
      case 'ja': return 'https://flagcdn.com/w40/jp.png';
      case 'en':
      default: return 'https://flagcdn.com/w40/us.png';
    }
  };

  return (
    <footer className="bg-[#2f3136] text-white py-10 border-t border-white/10">
      <div className="px-4 sm:px-6 lg:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        <div>
          <div className="mb-4">
            <Logo className="h-10 sm:h-12 w-auto object-contain" />
          </div>
          <p className="text-xl leading-[1.2] font-semibold max-w-md mb-6">
            {t('footer.tagline')}
          </p>
          <Link
            to="/signup-email"
            className="inline-block text-white font-semibold px-8 py-3 rounded-md transition hover:opacity-90"
            style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
          >
            {t('footer.joinUs')}
          </Link>
          <div className="mt-8 ml-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-black/40 text-white text-sm font-medium border border-white/20">
            <img
              src={flagUrlFor(language || 'en')}
              alt={languages.find((l) => l.value === language)?.label || 'English'}
              className="w-5 h-5 rounded-full object-cover"
            />
            <select
              className="bg-transparent outline-none cursor-pointer text-sm"
              value={language || 'en'}
              onChange={(e) => changeLanguage(e.target.value)}
            >
              {languages.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#2f3136] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">{t('footer.company')}</h4>
          <ul className="space-y-3 text-white/70 text-base">
            <li><Link to="/about" className="hover:text-white">{t('footer.about')}</Link></li>
          </ul>
          <div className="flex items-center gap-3 mt-6">
            {[
              { Icon: FaFacebookF, href: 'https://facebook.com', label: 'Facebook' },
              { Icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
              { Icon: FaTwitter, href: 'https://twitter.com', label: 'Twitter' },
              { Icon: FaMusic, href: 'https://tiktok.com', label: 'TikTok' },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white/90"
                aria-label={label}
                title={label}
              >
                <Icon className="text-sm" />
              </a>
            ))}
          </div>
          <div className="mt-6">
            <img
              src="/payment.png"
              alt={t('common.acceptedPayments')}
              className="h-6 w-auto opacity-90"
            />
          </div>
          <p className="mt-4 text-xs text-white/60">
            © {new Date().getFullYear()} {t('footer.allRightsReserved')}
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">{t('footer.contact')}</h4>
          <ul className="space-y-3 text-white/70 text-base">
            <li><Link to="/contact" className="hover:text-white">{t('footer.contactUs')}</Link></li>
            <li><Link to="/help" className="hover:text-white">{t('footer.helpCenter')}</Link></li>
            <li><Link to="/safety" className="hover:text-white">{t('footer.datingSecurely')}</Link></li>
            <li><Link to="/online-dating-advice" className="hover:text-white">{t('footer.onlineDatingAdvice')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">{t('footer.conditions')}</h4>
          <ul className="space-y-3 text-white/70 text-base">
            <li><Link to="/terms" className="hover:text-white">{t('footer.termsConditions')}</Link></li>
            <li><Link to="/privacy" className="hover:text-white">{t('footer.privacyPolicy')}</Link></li>
            <li><Link to="/refund" className="hover:text-white">{t('footer.refundPolicy')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">{t('footer.searchForSingles')}</h4>
          <ul className="space-y-3 text-white/70 text-base">
            <li>
              <Link to="/mature-online-dating" className="hover:text-white">
                {t('footer.matureSinglesLink')}
              </Link>
            </li>
            <li>
              <Link to="/asian-online-dating" className="hover:text-white">
                {t('footer.asianSinglesLink')}
              </Link>
            </li>
            <li>
              <Link to="/gay-online-dating" className="hover:text-white">
                {t('footer.gaySinglesLink')}
              </Link>
            </li>
            <li>
              <Link to="/online-dating-singles" className="hover:text-white">
                {t('footer.userReviewsLink')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

