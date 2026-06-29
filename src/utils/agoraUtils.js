/**
 * Sanitizes and validates Agora channel names
 * Channel names must be ≤ 64 bytes and only contain allowed characters
 * Allowed: a-z A-Z 0-9 space ! # $ % & ( ) + - : ; < = . > ? @ [ ] ^ _ { } | ~ ,
 * NOT allowed: / \ ? = (in URLs) Emojis Base64 UUIDs longer than 64 bytes
 */

/**
 * Creates a safe channel name from user IDs
 * @param {string} prefix - Prefix like 'call' or 'chat'
 * @param {string|number} userId1 - First user ID
 * @param {string|number} userId2 - Second user ID (optional)
 * @returns {string} Safe channel name ≤ 64 bytes
 */
export const createSafeChannelName = (prefix, userId1, userId2 = null) => {
  // Convert to strings and remove invalid characters
  const sanitizeId = (id) => {
    if (!id) return '';
    const str = id.toString();
    // Remove UUID dashes and take first 12 chars, or use hash if too long
    const cleaned = str.replace(/-/g, '').replace(/[^a-zA-Z0-9]/g, '');
    // Take first 12 characters to keep it short
    return cleaned.substring(0, 12);
  };

  const id1 = sanitizeId(userId1);
  const id2 = userId2 ? sanitizeId(userId2) : '';

  // Create channel name
  let channelName;
  if (id2) {
    // Sort IDs to ensure same channel for both users
    const ids = [id1, id2].sort();
    channelName = `${prefix}_${ids[0]}_${ids[1]}`;
  } else {
    channelName = `${prefix}_${id1}`;
  }

  // Ensure it's within 64 bytes
  // JavaScript strings are UTF-16, but Agora counts bytes
  // For ASCII characters, 1 char = 1 byte
  const byteLength = new TextEncoder().encode(channelName).length;
  
  if (byteLength > 64) {
    // Truncate to fit within 64 bytes
    const maxLength = 64 - prefix.length - 2; // -2 for underscores
    const truncated = channelName.substring(0, maxLength);
    console.warn(`Channel name truncated from ${byteLength} to 64 bytes:`, channelName, '->', truncated);
    return truncated;
  }

  // Validate characters (only allowed characters)
  const allowedPattern = /^[a-zA-Z0-9\s!#$%&()+-\:;<=.>?@\[\]^_{}|~,]+$/;
  if (!allowedPattern.test(channelName)) {
    // Remove invalid characters
    const sanitized = channelName.replace(/[^a-zA-Z0-9\s!#$%&()+-\:;<=.>?@\[\]^_{}|~,]/g, '');
    console.warn(`Channel name sanitized (removed invalid chars):`, channelName, '->', sanitized);
    return sanitized;
  }

  return channelName;
};

/**
 * Validates a channel name before use
 * @param {string} channelName - Channel name to validate
 * @returns {object} { valid: boolean, error?: string, sanitized?: string }
 */
export const validateChannelName = (channelName) => {
  if (!channelName || typeof channelName !== 'string') {
    return { valid: false, error: 'Channel name must be a non-empty string' };
  }

  const byteLength = new TextEncoder().encode(channelName).length;
  
  if (byteLength > 64) {
    return { 
      valid: false, 
      error: `Channel name exceeds 64 bytes (${byteLength} bytes)`,
      sanitized: channelName.substring(0, 64)
    };
  }

  // Check for invalid characters
  const invalidChars = /[\/\\?=]/;
  if (invalidChars.test(channelName)) {
    const sanitized = channelName.replace(/[\/\\?=]/g, '');
    return {
      valid: false,
      error: 'Channel name contains invalid characters (/ \\ ? =)',
      sanitized
    };
  }

  return { valid: true };
};

/**
 * Creates a short hash from a UUID or long string
 * @param {string} str - String to hash
 * @returns {string} Short hash (8-12 chars)
 */
export const createShortHash = (str) => {
  if (!str) return '';
  const cleaned = str.toString().replace(/-/g, '');
  // Take first 12 characters and convert to alphanumeric
  return cleaned.substring(0, 12).replace(/[^a-zA-Z0-9]/g, '');
};

