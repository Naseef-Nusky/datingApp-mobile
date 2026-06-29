import { createContext, useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import en from '../locales/en.json';

const LanguageContext = createContext(null);

const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'zh', label: '中文' },
  { value: 'it', label: 'Italiano' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
];

// Use relative URL in dev so Vite proxy forwards to backend (avoids CORS when backend has PROXY_HANDLES_CORS=1)
const API_URL = import.meta.env.VITE_API_URL || '';

/** Get nested value by dot path, e.g. 'nav.inbox' -> obj.nav.inbox */
function getNested(obj, path) {
  if (!obj || !path) return path || '';
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj) ?? path;
}

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [loadingLang, setLoadingLang] = useState(false);
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('app_language') || 'en';
    } catch {
      return 'en';
    }
  });
  const [translationCache, setTranslationCache] = useState(() => ({ en }));

  const translations = translationCache[language] ?? translationCache.en ?? en;

  const t = useCallback(
    (key) => {
      return getNested(translations, key) || key;
    },
    [translations]
  );

  const changeLanguage = useCallback(
    async (lang) => {
      if (!SUPPORTED_LANGUAGES.some((l) => l.value === lang)) return;

      try {
        localStorage.setItem('app_language', lang);
        localStorage.setItem('selectedLanguage', lang);
      } catch (e) {}

      if (user) {
        try {
          await axios.put(`${API_URL}/api/settings`, { language: lang });
        } catch (err) {
          console.warn('Could not save language to server:', err?.message);
        }
      }

      // Reload so the whole website updates: on load, translatePage() will run for non-English
      window.location.reload();
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    const loadSavedLanguage = async () => {
      try {
        const currentStored = localStorage.getItem('app_language') || localStorage.getItem('selectedLanguage') || '';
        const { data } = await axios.get(`${API_URL}/api/settings`);
        const saved = data?.language;
        if (!saved || saved === language) return;
        // On refresh: do not overwrite with server 'en' if user already has a non-English choice in localStorage
        const serverIsDefaultEn = (saved === 'en' || saved === 'en-uk');
        const hasNonEnglishStored = currentStored && currentStored !== 'en' && currentStored !== 'en-uk';
        if (serverIsDefaultEn && hasNonEnglishStored) return;

        if (saved !== 'en' && saved !== 'en-uk' && !translationCache[saved]) {
          setLoadingLang(true);
          try {
            const { data: locData } = await axios.get(`${API_URL}/api/translate/locale?target=${encodeURIComponent(saved)}`);
            setTranslationCache((prev) => ({ ...prev, [saved]: locData }));
          } catch (e) {
            return;
          } finally {
            setLoadingLang(false);
          }
        }
        setLanguageState(saved);
        try {
          localStorage.setItem('app_language', saved);
          localStorage.setItem('selectedLanguage', saved);
        } catch (e) {}
        // After login: translate current page so UI matches DB-saved language
        if (saved !== 'en' && saved !== 'en-uk') {
          import('../utils/translatePage').then(({ translatePage }) => {
            translatePage(saved);
            setTimeout(() => translatePage(saved), 800);
            setTimeout(() => translatePage(saved), 2000);
          });
        }
      } catch (err) {
        // use existing language from state/localStorage
      }
    };
    loadSavedLanguage();
  }, [user?.id]);

  const translatePageNow = useCallback(() => {
    const lang = localStorage.getItem('app_language') || localStorage.getItem('selectedLanguage') || language || 'en';
    if (lang === 'en' || lang === 'en-uk') return;
    import('../utils/translatePage').then(({ translatePage }) => translatePage(lang));
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      languages: SUPPORTED_LANGUAGES,
      loadingLang,
      t,
      translatePageNow,
    }),
    [language, changeLanguage, loadingLang, t, translatePageNow]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
