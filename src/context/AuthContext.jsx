import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { autoRegisterInChat } from '../utils/autoRegisterChat';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  /** Skip one /me fetch after magic-link verify (user already returned from API). */
  const skipNextTokenFetchRef = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me');
      const userData = response.data.user || response.data;
      setUser(userData);
      const credits = Number(userData?.credits);
      if (Number.isFinite(credits)) {
        window.dispatchEvent(new CustomEvent('credits-updated', { detail: { credits } }));
      }

      // Auto-register in Chat for ALL users immediately
      if (userData?.id && !sessionStorage.getItem(`chat_reg_${userData.id}`)) {
        sessionStorage.setItem(`chat_reg_${userData.id}`, 'true');
        setTimeout(async () => {
          try {
            const chatTokenResponse = await axios.post('/api/agora/chat-token', {
              userId: userData.id.toString(),
            });
            if (chatTokenResponse.data?.appKey) {
              console.log('🔄 Auto-registering user in Chat:', userData.id);
              const registered = await autoRegisterInChat(userData.id, chatTokenResponse.data.appKey);
              if (registered) {
                console.log('✅ User successfully auto-registered in Chat');
              } else {
                console.log('✅ User marked as chat-ready (will be registered when they open chat)');
              }
            }
          } catch (regError) {
            console.log('⚠️ Auto-registration attempt:', regError.message);
            sessionStorage.removeItem(`chat_reg_${userData.id}`);
          }
        }, 500);
      }

      return userData;
    } catch (error) {
      console.error('Fetch user error:', error);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  /** Merge fields from GET /api/auth/me without a second round-trip. */
  const applyAuthMeResponse = useCallback((data) => {
    const userData = data?.user;
    if (userData) {
      setUser((prev) => ({ ...(prev || {}), ...userData }));
      window.dispatchEvent(new CustomEvent('credits-updated', { detail: { credits: userData.credits } }));
    }
    return data?.profile ?? null;
  }, []);

  /** Fetch authoritative balance from /api/credits/balance. */
  const refreshCreditBalance = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/credits/balance');
      const credits = Number(data?.credits);
      const resolvedCredits = Number.isFinite(credits) ? credits : 0;
      setUser((prev) => ({
        ...(prev || {}),
        credits: resolvedCredits,
        ...(data.subscriptionPlan != null && { subscriptionPlan: data.subscriptionPlan }),
        ...(data.subscriptionExpires != null && { subscriptionExpires: data.subscriptionExpires }),
      }));
      window.dispatchEvent(
        new CustomEvent('credits-updated', { detail: { credits: resolvedCredits } }),
      );
      return resolvedCredits;
    } catch (error) {
      console.error('Refresh credit balance error:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const onCreditsUpdated = (event) => {
      const credits = Number(event?.detail?.credits);
      if (Number.isNaN(credits)) return;
      setUser((prev) => (prev ? { ...prev, credits } : prev));
    };
    const onRefreshRequested = () => {
      refreshCreditBalance();
    };
    window.addEventListener('credits-updated', onCreditsUpdated);
    window.addEventListener('credits-refresh-requested', onRefreshRequested);
    return () => {
      window.removeEventListener('credits-updated', onCreditsUpdated);
      window.removeEventListener('credits-refresh-requested', onRefreshRequested);
    };
  }, [refreshCreditBalance]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (skipNextTokenFetchRef.current) {
        skipNextTokenFetchRef.current = false;
        return;
      }
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    try {
      // General login supports member + streamer (same email can exist for both).
      // Fallback to streamer-login if an older API only matched the member row first.
      let response;
      try {
        response = await axios.post('/api/auth/login', { email, password });
      } catch (firstErr) {
        if (firstErr.response?.status === 401) {
          response = await axios.post('/api/auth/streamer-login', { email, password });
        } else {
          throw firstErr;
        }
      }
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setUser(userData);
      
      // Automatically register user in Agora Chat immediately on login
      if (userData?.id) {
        // Register in background (don't block login)
        setTimeout(async () => {
          try {
            const chatTokenResponse = await axios.post('/api/agora/chat-token', {
              userId: userData.id.toString(),
            });
            if (chatTokenResponse.data?.appKey) {
              console.log('🔄 Auto-registering user in Chat on login:', userData.id);
              const registered = await autoRegisterInChat(userData.id, chatTokenResponse.data.appKey);
              if (registered) {
                console.log('✅ User successfully registered in Chat on login');
              } else {
                console.log('⚠️ Chat registration may not have completed, but user can still open chat manually');
              }
            }
          } catch (chatError) {
            console.log('⚠️ Could not auto-register in chat (non-critical):', chatError.message);
            console.log('User can still open chat manually to register');
          }
        }, 500); // Small delay to not block login UI
      }
      
      return { success: true };
    } catch (error) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message;
      const url = error.config?.baseURL ? `${error.config.baseURL}${error.config.url || ''}` : error.config?.url;
      if (!error.response) {
        console.error('[login] network error', { message: error.message, url, code: error.code });
      }
      const message =
        serverMsg ||
        (status === 401 ? 'Invalid credentials' : null) ||
        (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')
          ? 'Cannot reach the server. On iOS Simulator use your Mac LAN IP or https API in VITE_API_URL, then npm run cap:sync.'
          : null) ||
        error.message ||
        'Login failed';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      const firstValidation =
        Array.isArray(data?.errors) && data.errors.length > 0
          ? data.errors[0].msg || data.errors[0].message
          : null;
      return {
        success: false,
        message: data?.message || firstValidation || 'Registration failed',
      };
    }
  };

  const loginWithToken = useCallback((newToken, userData = null) => {
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    if (userData) {
      skipNextTokenFetchRef.current = true;
      setUser(userData);
      setLoading(false);
    }
    setToken(newToken);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        register,
        logout,
        fetchUser,
        loginWithToken,
        applyAuthMeResponse,
        refreshCreditBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

