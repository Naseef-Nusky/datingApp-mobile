import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaFire } from 'react-icons/fa';

/** Free User flame icon with hover/click popup. Popup is portaled to body so it's not clipped. */
export default function FreeUserBadge({ className = '', size = 'sm' }) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const anchorRef = useRef(null);
  const popupRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => setShowPopup(false), 150);
  };

  useEffect(() => {
    return () => clearCloseTimeout();
  }, []);

  const updatePosition = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopupStyle({
        position: 'fixed',
        left: rect.left,
        top: rect.bottom + 8,
        zIndex: 99999,
      });
    }
  };

  useEffect(() => {
    if (!showPopup) return;
    updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showPopup]);

  useEffect(() => {
    if (!showPopup) return;
    const handleOutside = (e) => {
      if (
        anchorRef.current?.contains(e.target) ||
        popupRef.current?.contains(e.target)
      )
        return;
      setShowPopup(false);
    };
    // Use 'click' so popup button clicks fire before we check; mousedown could close before onClick
    document.addEventListener('click', handleOutside, true);
    return () => document.removeEventListener('click', handleOutside, true);
  }, [showPopup]);

  const iconSize = size === 'lg' ? 'text-sm' : 'text-xs';
  const padding = size === 'lg' ? 'p-2' : 'p-1 sm:p-1.5';

  const popupEl = showPopup && (
    <div
      ref={popupRef}
      style={popupStyle}
      className="w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-left"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={clearCloseTimeout}
      onMouseLeave={scheduleClose}
    >
      <h4 className="font-bold text-gray-900 text-sm mb-2">Free User</h4>
      <p className="text-gray-700 text-xs leading-relaxed mb-4">
        Free Users enjoy free access to the service in exchange for active participation and adherence to conduct rules.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowPopup(false);
          }}
          className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            setShowPopup(false);
            window.dispatchEvent(new CustomEvent('openAboutWithSection', { detail: { sectionId: 'section-free-users' } }));
          }}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:underline text-left"
        >
          learn more
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={`relative inline-flex ${className}`} ref={anchorRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowPopup((v) => !v);
          }}
          onMouseEnter={() => {
            clearCloseTimeout();
            setShowPopup(true);
          }}
          onMouseLeave={scheduleClose}
          className={`bg-white rounded-full shadow ${padding} cursor-pointer hover:ring-2 hover:ring-orange-300 transition focus:outline-none focus:ring-2 focus:ring-orange-400`}
          title="Free User"
          aria-label="Free User"
        >
          <FaFire className={`${iconSize} text-orange-500`} />
        </button>
      </div>
      {popupEl && createPortal(popupEl, document.body)}
    </>
  );
}
