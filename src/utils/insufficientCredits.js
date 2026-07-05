export function isInsufficientCreditsError(error) {
  const payload = error?.response?.data;
  if (!payload) return false;
  const code = String(payload.code || '').toUpperCase();
  if (code === 'INSUFFICIENT_CREDITS') return true;
  if (error.response.status !== 400 && error.response.status !== 403) return false;
  const msg = payload.message;
  return typeof msg === 'string' && msg.toLowerCase().includes('insufficient');
}

export function isSubscriptionRequiredError(error) {
  const payload = error?.response?.data;
  if (!payload) return false;
  const code = String(payload.code || '').toUpperCase();
  if (code === 'SUBSCRIPTION_REQUIRED') return true;
  if (error.response?.status !== 403) return false;
  const msg = payload.message;
  return typeof msg === 'string' && msg.toLowerCase().includes('upgrade');
}
