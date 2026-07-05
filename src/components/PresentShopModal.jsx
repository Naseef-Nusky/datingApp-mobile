import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaTimes, FaGift } from 'react-icons/fa';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { useAuth } from '../context/AuthContext';
import { useCreditsSync } from '../hooks/useCreditsSync';
import { useServiceAccess } from '../hooks/useServiceAccess';

const PresentShopModal = ({ isOpen, onClose, receiver, initialStep = 'shop', initialCartItems = [] }) => {
  const { handleInsufficientCredits, isInsufficientCreditsError } = useInsufficientCreditsHandler();
  const { user } = useAuth();
  const { syncCreditsAfterAction } = useCreditsSync();
  const { ensureCanAffordCredits } = useServiceAccess();
  const [gifts, setGifts] = useState([]);
  const [presentCategories, setPresentCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('shop'); // 'shop' | 'checkout'
  const [checkingOut, setCheckingOut] = useState(false);
  const [appliedInitialState, setAppliedInitialState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [catalogRes, categoriesRes] = await Promise.all([
          axios.get('/api/gifts/catalog?type=physical'),
          axios.get('/api/gifts/present-categories').catch(() => ({ data: { categories: [] } })),
        ]);
        if (!cancelled) {
          setGifts(Array.isArray(catalogRes.data) ? catalogRes.data : []);
          setPresentCategories(categoriesRes.data?.categories || []);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Present shop catalog error:', e);
          setError('Failed to load presents. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setAppliedInitialState(false);
      return;
    }
    if (appliedInitialState) return;

    if (Array.isArray(initialCartItems) && initialCartItems.length > 0) {
      setCart(
        initialCartItems.map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          creditCost: Number(item.creditCost) || 0,
        }))
      );
    }
    if (initialStep === 'checkout') {
      setStep('checkout');
    } else {
      setStep('shop');
    }
    setAppliedInitialState(true);
  }, [isOpen, initialStep, initialCartItems, appliedInitialState]);

  const categoryDisplayName = (cat) => {
    if (!cat) return '';
    const found = presentCategories.find((c) => c.slug === cat || c.name === cat);
    return found ? found.name : cat;
  };

  const categoryImageUrl = (cat) => {
    if (!cat) return null;
    const found = presentCategories.find((c) => c.slug === cat || c.name === cat);
    return found?.imageUrl || null;
  };

  const categories = useMemo(() => {
    const set = new Set();
    gifts.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set);
  }, [gifts]);

  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    if (!categories.length) {
      setActiveCategory('');
      return;
    }
    if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0] || '');
    }
  }, [categories, activeCategory]);

  const visibleGifts = useMemo(() => {
    if (!activeCategory) return gifts;
    return gifts.filter((g) => g.category === activeCategory);
  }, [gifts, activeCategory]);

  const addToCart = (gift) => {
    setCart((prev) => {
      if (prev.some((g) => g.id === gift.id)) return prev;
      return [
        ...prev,
        {
          id: gift.id,
          name: gift.name,
          imageUrl: gift.imageUrl,
          creditCost: gift.creditCost ?? 0,
        },
      ];
    });
  };

  const removeFromCart = (giftId) => {
    setCart((prev) => prev.filter((g) => g.id !== giftId));
  };

  const totalCredits = useMemo(
    () => cart.reduce((sum, g) => sum + (g.creditCost || 0), 0),
    [cart]
  );
  const userCredits = Number(user?.credits) || 0;
  const creditsShortfall = Math.max(0, totalCredits - userCredits);

  const extraSuggestions = useMemo(() => {
    if (!gifts.length) return [];
    const cartIds = new Set(cart.map((c) => c.id));
    return gifts.filter((g) => !cartIds.has(g.id)).slice(0, 3);
  }, [gifts, cart]);

  const receiverUserId = receiver?.userId ?? receiver?.id;

  const handleCheckout = async () => {
    if (!receiver || !receiverUserId || cart.length === 0) return;
    if (!(await ensureCanAffordCredits(totalCredits))) return;
    setCheckingOut(true);
    try {
      let lastResponse = null;
      for (const item of cart) {
        const res = await axios.post('/api/gifts/send', {
          receiverId: receiverUserId,
          giftId: item.id,
          message: null,
        });
        lastResponse = res.data;
      }
      await syncCreditsAfterAction(lastResponse);
      alert('Your presents have been sent!');
      setCart([]);
      setStep('shop');
      onClose?.();
    } catch (e) {
      const msg = e.response?.data?.message;
      if (isInsufficientCreditsError(e) || msg === 'Insufficient credits') {
        const pendingCheckout = {
          receiverId: String(receiverUserId),
          cart: cart.map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl || '',
            creditCost: Number(item.creditCost) || 0,
          })),
          step: 'checkout',
        };
        sessionStorage.setItem('pendingPresentCheckout', JSON.stringify(pendingCheckout));
        const currentPath = window.location.pathname + window.location.search;
        const joiner = currentPath.includes('?') ? '&' : '?';
        const returnPath = `${currentPath}${joiner}openPresentShop=1&presentReceiverId=${encodeURIComponent(
          String(receiverUserId)
        )}&presentStep=checkout`;
        handleInsufficientCredits({
          requiredCredits: creditsShortfall || totalCredits,
          returnPath,
        });
      } else {
        alert(msg || 'Failed to send presents');
      }
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[calc(95*var(--vh)-env(safe-area-inset-bottom,0px))] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {step === 'checkout' ? 'Checkout' : 'Present Shop'}
            </h2>
            {step === 'checkout' ? (
              <p className="text-sm text-gray-500 mt-1">
                Review your presents for{' '}
                <span className="font-semibold">{receiver?.firstName || 'your match'}</span>{' '}
                and confirm your order.
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Choose a gift that will make{' '}
                <span className="font-semibold">{receiver?.firstName || 'your match'}</span> smile.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === 'shop' && (
            <div className="px-6 py-4">
              {/* Category tabs (no "All" – only real categories) */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => {
                    const imgUrl = categoryImageUrl(cat);
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm border ${
                          isActive
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        ) : null}
                        <span>{categoryDisplayName(cat)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {loading && (
                <div className="text-center text-gray-500 py-10">
                  Loading presents...
                </div>
              )}
              {error && !loading && (
                <div className="text-center text-red-500 py-6 text-sm">
                  {error}
                </div>
              )}
              {!loading && !error && visibleGifts.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                  No presents available right now.
                </div>
              )}

              {!loading && !error && visibleGifts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleGifts.map((g) => {
                    const inCart = cart.some((item) => item.id === g.id);
                    return (
                      <div
                        key={g.id}
                        className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white flex flex-col"
                      >
                        <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {g.imageUrl ? (
                            <img
                              src={g.imageUrl}
                              alt={g.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FaGift className="text-4xl text-gray-400" />
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {g.name}
                          </h3>
                          {g.description && (
                            <p className="text-xs text-gray-500 line-clamp-3 mb-3">
                              {g.description}
                            </p>
                          )}
                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">
                              {g.creditCost ?? 0} Credits
                            </span>
                            <button
                              type="button"
                              onClick={() => !inCart && addToCart(g)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${
                                inCart
                                  ? 'bg-gray-200 text-gray-600 cursor-default'
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            >
                              {inCart ? 'ADDED TO CART' : 'ADD TO CART'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 'checkout' && (
            <div className="px-6 py-4 space-y-6">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No presents selected yet. Go back to the Present Shop to add some.
                </p>
              ) : (
                <>
                  {/* Top: selected presents + info box */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Presents for {receiver?.firstName || 'your match'}
                      </h3>
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 bg-white"
                        >
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-12 h-12 rounded-full object-contain bg-gray-100"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <FaGift className="text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {item.creditCost ?? 0} Credits
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-gray-500 hover:text-red-500"
                          >
                            REMOVE
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="w-full lg:w-72 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-gray-700">
                      <div className="font-semibold text-gray-800 mb-1">
                        We&apos;ll coordinate delivery
                      </div>
                      <p>
                        We&apos;ll coordinate delivery with{' '}
                        <span className="font-semibold">
                          {receiver?.firstName || 'your match'}
                        </span>
                        . The actual present may vary slightly. You&apos;ll be notified in
                        Chat when it&apos;s received. Delivery may take up to 10 days.
                      </p>
                    </div>
                  </div>

                  {/* Deliver even more delight */}
                  {extraSuggestions.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 space-y-2">
                      <div className="text-sm font-semibold text-gray-900">
                        Deliver even more delight:
                      </div>
                      <div className="flex items-center gap-3">
                        {extraSuggestions.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => addToCart(g)}
                            className="flex flex-col items-center gap-1"
                          >
                            <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center relative">
                              {g.imageUrl ? (
                                <img
                                  src={g.imageUrl}
                                  alt={g.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <FaGift className="text-xl text-gray-400" />
                              )}
                            </div>
                            <span className="text-xs text-blue-600 font-semibold">+</span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('shop')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        SHOW ALL PRESENTS
                      </button>
                    </div>
                  )}

                  {/* Total + checkout button */}
                  <div className="mt-2 border-t border-gray-200 pt-3 text-center">
                    <div className="text-xs sm:text-sm text-gray-700 mb-3">
                      TOTAL (including delivery):{' '}
                      <span className="font-semibold text-gray-900">
                        {totalCredits} Credits
                      </span>
                    </div>
                    {creditsShortfall > 0 && (
                      <div className="text-xs sm:text-sm text-red-600 font-semibold mb-3">
                        You need {creditsShortfall} more credits to send these presents.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={checkingOut || cart.length === 0}
                      className="inline-flex items-center justify-center px-8 py-2.5 rounded-md bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {checkingOut ? 'PROCESSING...' : 'CHECKOUT'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom bar with selected presents (like screenshot) - only on shop view */}
        {step === 'shop' && cart.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-800">
                Presents for {receiver?.firstName || 'your match'}:
              </span>
              <div className="flex flex-wrap gap-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1 bg-white rounded-full border border-gray-200 px-2 py-1 shadow-sm"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-6 h-6 rounded-full object-contain bg-gray-100"
                      />
                    )}
                    <span className="text-xs text-gray-700 max-w-[120px] truncate">
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="ml-1 text-xs text-gray-400 hover:text-red-500"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep('checkout')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-full bg-red-500 text-white text-xs sm:text-sm font-semibold hover:bg-red-600 transition"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentShopModal;

