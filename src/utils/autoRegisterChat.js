/**
 * Automatically register a user in Agora Chat by opening and closing the connection
 * This ensures the user is registered in Agora Chat system
 */
import AgoraChat from 'agora-chat';
import axios from 'axios';

export const autoRegisterInChat = async (userId, appKey) => {
  if (!userId || !appKey) {
    console.log('Cannot auto-register: missing userId or appKey');
    return false;
  }

  try {
    console.log('🔄 Auto-registering user in Chat:', userId);

    // Get chat token
    const tokenResponse = await axios.post('/api/agora/chat-token', {
      userId: userId.toString(),
    });

    if (!tokenResponse.data || !tokenResponse.data.token) {
      console.error('❌ Failed to get chat token for auto-registration');
      return false;
    }

    const { token, appKey: receivedAppKey } = tokenResponse.data;
    const chatAppKey = receivedAppKey || appKey;

    if (!chatAppKey || !chatAppKey.includes('#')) {
      console.error('❌ Invalid appKey for auto-registration');
      return false;
    }

    // Create a temporary chat client
    const tempClient = new AgoraChat.connection({
      appKey: chatAppKey,
    });

    // Set up event handlers before opening
    let connected = false;
    let connectionResolved = false;
    
    const connectionPromise = new Promise((resolve) => {
      tempClient.addEventHandler('connection&message', {
        onConnected: () => {
          console.log('✅ User auto-registered in Chat:', userId);
          connected = true;
          if (!connectionResolved) {
            connectionResolved = true;
            resolve(true);
          }
        },
        onError: (error) => {
          // Error 204 (User not found) shouldn't happen for self-registration
          // But if it does, we still consider it a success if we got this far
          if (error.type === 204) {
            console.log('Note: Got 204 error during auto-registration (may be expected)');
          } else {
            console.error('Auto-registration connection error:', error);
          }
          if (!connectionResolved) {
            connectionResolved = true;
            resolve(false);
          }
        },
      });
    });

    // Open connection (this automatically registers the user)
    try {
      await tempClient.open({
        user: userId.toString(),
        accessToken: token,
      });
      
      // Wait for connection event (with timeout)
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (!connectionResolved) {
            connectionResolved = true;
            resolve(false);
          }
        }, 8000); // Increased timeout to 8 seconds
      });

      const result = await Promise.race([connectionPromise, timeoutPromise]);

      // Close connection immediately (we just needed to register)
      try {
        await tempClient.close();
      } catch (closeError) {
        console.log('Note: Error closing temp client (non-critical):', closeError.message);
      }

      if (result || connected) {
        console.log('✅ Successfully auto-registered user:', userId);
        return true;
      } else {
        console.log('⚠️ Auto-registration may not have completed for:', userId);
        return false;
      }
    } catch (openError) {
      console.error('Error opening connection:', openError);
      return false;
    }
  } catch (error) {
    console.error('❌ Auto-registration error:', error);
    console.error('Error details:', {
      message: error.message,
      userId,
      hasAppKey: !!appKey
    });
    // Don't throw - this is a background process
    return false;
  }
};

