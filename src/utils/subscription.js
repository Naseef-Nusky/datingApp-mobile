/**
 * Whether the member has an active paid subscription (upgrade vs refill decision).
 */
export function hasActiveSubscription(user) {
  if (!user) return false;
  const plan = user.subscriptionPlan;
  if (!plan || plan === 'free') return false;

  const now = new Date();

  if (user.subscriptionEndsAt) {
    return new Date(user.subscriptionEndsAt) > now;
  }

  const expires = user.subscriptionExpires;
  if (!expires) return true;

  return new Date(expires) > now;
}
