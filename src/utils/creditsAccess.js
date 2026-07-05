/** Whether an API payload indicates blocked access due to credits or subscription. */
export function isCreditsAccessDenied(payload, status) {
  if (!payload || typeof payload !== 'object') return false;
  const code = String(payload.code || '').toUpperCase();
  if (code === 'INSUFFICIENT_CREDITS' || code === 'SUBSCRIPTION_REQUIRED') return true;
  if (status !== 400 && status !== 403) return false;
  const msg = payload.message;
  if (typeof msg !== 'string') return false;
  const lower = msg.toLowerCase();
  return lower.includes('insufficient') || lower.includes('upgrade');
}

export function isCreditsAccessDeniedError(error) {
  const status = error?.response?.status;
  const payload = error?.response?.data;
  return isCreditsAccessDenied(payload, status);
}

/** Mark error as handled so the global axios bridge does not open a second modal. */
export function markCreditsAccessHandled(error) {
  if (error?.config) {
    error.config.__creditsAccessHandled = true;
  }
}

export function wasCreditsAccessHandled(error) {
  return Boolean(error?.config?.__creditsAccessHandled);
}
