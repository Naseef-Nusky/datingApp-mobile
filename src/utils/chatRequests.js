import axios from 'axios';

/**
 * Map API chat request row for ContactsSidebar.
 */
export function mapChatRequestFromApi(request, fallbackLabel = 'New message') {
  const messageText =
    request.firstMessage || request.content || request.message || fallbackLabel;
  const sourceType = request.sourceType || 'chat';
  const isEmail = sourceType === 'email';

  return {
    id: request.id,
    name: null,
    age: null,
    message: messageText,
    avatar: null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    status: request.status || 'pending',
    senderId: request.senderData?.id || request.senderId,
    senderData: request.senderData,
    sourceType,
    emailMessageId: request.relatedMessageId || null,
    isVideoChat:
      !isEmail &&
      (messageText.toLowerCase().includes('video chat') ||
        messageText.toLowerCase().includes('inviting you to video')),
    isAudioChat:
      !isEmail &&
      (messageText.toLowerCase().includes('audio chat') ||
        messageText.toLowerCase().includes('voice chat')),
    hasEmail: isEmail || messageText.toLowerCase().includes('email'),
  };
}

/**
 * Enrich mapped requests with profile name/avatar (optional).
 */
export async function enrichChatRequestsWithProfiles(requests) {
  return Promise.all(
    requests.map(async (base) => {
      try {
        if (!base.senderId) return { ...base, name: 'Unknown' };
        const profileResponse = await axios.get(`/api/profiles/${base.senderId}`);
        const profile = profileResponse.data;
        return {
          ...base,
          name: profile?.firstName || base.senderData?.email?.split('@')[0] || 'Unknown',
          avatar: profile?.photos?.[0]?.url || null,
          age: profile?.age ?? null,
        };
      } catch {
        return {
          ...base,
          name: base.senderData?.email?.split('@')[0] || 'Unknown',
        };
      }
    })
  );
}

/**
 * Accept chat request; email-type opens inbox, others open profile chat.
 */
export async function acceptChatRequestAndNavigate(request, { navigate, fetchChatRequests, fetchContacts }) {
  let responseData = null;
  try {
    const { data } = await axios.put(`/api/messages/chat-requests/${request.id}/accept`);
    responseData = data;
  } catch (error) {
    console.error('Accept chat request error:', error);
  } finally {
    if (fetchChatRequests) fetchChatRequests();
    if (fetchContacts) fetchContacts();

    const emailId =
      responseData?.emailMessageId || request.emailMessageId || null;
    const isEmail =
      responseData?.sourceType === 'email' ||
      request.sourceType === 'email' ||
      request.hasEmail;

    if (isEmail) {
      navigate(emailId ? `/inbox?messageId=${emailId}` : '/inbox');
      return;
    }

    const senderId = responseData?.senderId || request.senderId;
    if (senderId) {
      navigate(`/profile/${senderId}`, {
        state: { openChat: true, from: 'chat-request', requestId: request.id },
      });
    }
  }
}
