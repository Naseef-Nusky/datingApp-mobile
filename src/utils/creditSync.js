/**
 * Sync credit balance from API responses (senderCreditsBalance, creditsUsed, etc.)
 * and request a balance refresh when usage is reported without a new balance.
 */

export function extractCreditsFromResponse(data) {
  if (!data || typeof data !== 'object') return null;

  const creditsUsed = Number(data.creditsUsed);
  const hasUsage = Number.isFinite(creditsUsed) && creditsUsed > 0;

  const balanceKeys = [
    'senderCreditsBalance',
    'balance',
    'credits',
    'totalCredits',
    'remainingCredits',
  ];
  for (const key of balanceKeys) {
    const value = data[key];
    if (value != null && Number.isFinite(Number(value))) {
      return { balance: Number(value), creditsUsed: hasUsage ? creditsUsed : 0 };
    }
  }

  if (hasUsage) return { balance: null, creditsUsed };
  return null;
}

export function notifyCreditsChanged(credits) {
  if (!Number.isFinite(Number(credits))) return;
  window.dispatchEvent(
    new CustomEvent('credits-updated', { detail: { credits: Number(credits) } }),
  );
}

export function notifyCreditsRefreshNeeded() {
  window.dispatchEvent(new CustomEvent('credits-refresh-requested'));
}

/** Apply credit info from a successful API response body. */
export function processApiCreditsPayload(data) {
  const info = extractCreditsFromResponse(data);
  if (!info) return { synced: false, needsRefresh: false };

  if (info.balance != null) {
    notifyCreditsChanged(info.balance);
    return { synced: true, needsRefresh: false, balance: info.balance };
  }

  if (info.creditsUsed > 0) {
    notifyCreditsRefreshNeeded();
    return { synced: false, needsRefresh: true, creditsUsed: info.creditsUsed };
  }

  return { synced: false, needsRefresh: false };
}
