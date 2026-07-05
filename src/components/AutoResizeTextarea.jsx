import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Textarea that grows with content up to maxRows, then scrolls.
 */
export default function AutoResizeTextarea({
  minRows = 1,
  maxRows = 8,
  value,
  onChange,
  className = '',
  ...props
}) {
  const ref = useRef(null);

  const adjust = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 22;
    const padding =
      parseFloat(style.paddingTop || 0) + parseFloat(style.paddingBottom || 0);
    const border =
      parseFloat(style.borderTopWidth || 0) + parseFloat(style.borderBottomWidth || 0);
    const minH = lineHeight * minRows + padding + border;
    const maxH = lineHeight * maxRows + padding + border;
    const scrollH = el.scrollHeight;
    const next = Math.min(Math.max(scrollH, minH), maxH);
    el.style.height = `${next}px`;
    el.style.overflowY = scrollH > maxH ? 'auto' : 'hidden';
  }, [minRows, maxRows]);

  useLayoutEffect(() => {
    adjust();
  }, [value, adjust, minRows, maxRows]);

  const handleChange = (e) => {
    onChange?.(e);
    requestAnimationFrame(adjust);
  };

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={handleChange}
      className={`resize-none ${className}`.trim()}
      {...props}
    />
  );
}
