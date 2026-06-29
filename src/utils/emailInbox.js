const PROVIDERS = [
  {
    id: 'gmail',
    label: 'Gmail',
    match: (domain) => domain === 'gmail.com' || domain === 'googlemail.com',
    inboxUrl: 'https://mail.google.com',
  },
  {
    id: 'outlook',
    label: 'Outlook',
    match: (domain) =>
      domain === 'outlook.com' ||
      domain.includes('outlook.') ||
      domain === 'hotmail.com' ||
      domain === 'hotmail.co.uk' ||
      domain.includes('live.') ||
      domain.includes('msn.'),
    inboxUrl: 'https://outlook.live.com',
  },
  {
    id: 'yahoo',
    label: 'Yahoo',
    match: (domain) => domain.includes('yahoo.'),
    inboxUrl: 'https://mail.yahoo.com',
  },
  {
    id: 'icloud',
    label: 'iCloud',
    match: (domain) => domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com',
    inboxUrl: 'https://www.icloud.com/mail',
  },
  {
    id: 'aol',
    label: 'AOL',
    match: (domain) => domain === 'aol.com',
    inboxUrl: 'https://mail.aol.com',
  },
  {
    id: 'proton',
    label: 'Proton Mail',
    match: (domain) => domain.includes('protonmail.') || domain === 'proton.me',
    inboxUrl: 'https://mail.proton.me',
  },
];

const emailDomain = (email) => {
  if (!email || typeof email !== 'string') return null;
  return email.split('@')[1]?.toLowerCase() || null;
};

/** Detect provider from email address (Gmail, Outlook, Yahoo, etc.). */
export function getEmailProvider(email) {
  const domain = emailDomain(email);
  if (!domain) return null;
  return PROVIDERS.find((p) => p.match(domain)) || null;
}

/** Display name for the provider, e.g. "Outlook". */
export function getEmailProviderLabel(email) {
  return getEmailProvider(email)?.label || null;
}

/** Button label, e.g. "CHECK YOUR OUTLOOK ACCOUNT". */
export function getCheckInboxButtonLabel(email) {
  const label = getEmailProviderLabel(email);
  if (label) return `CHECK YOUR ${label.toUpperCase()} ACCOUNT`;
  return 'CHECK YOUR EMAIL';
}

/**
 * Returns the webmail inbox URL for a given email address, or null if unknown.
 * Used so "Check your email" opens the correct provider (Gmail, Yahoo, Outlook, etc.).
 */
export function getEmailInboxUrl(email) {
  return getEmailProvider(email)?.inboxUrl || null;
}

/**
 * Opens the user's email inbox in a new tab when possible (Gmail, Yahoo, Outlook, etc.).
 * If the provider is unknown, does nothing (user can check their email manually).
 */
export function openEmailInbox(email) {
  const url = getEmailInboxUrl(email);
  if (url) {
    window.open(url, '_blank');
  }
}
