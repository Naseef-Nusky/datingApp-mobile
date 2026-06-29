export function isInsufficientCreditsError(error) {
  if (!error?.response || error.response.status !== 400) return false;
  const msg = error.response?.data?.message;
  return typeof msg === 'string' && msg.toLowerCase().includes('insufficient');
}
