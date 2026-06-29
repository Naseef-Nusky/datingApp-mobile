import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgoraChat from 'agora-chat';
import axios from 'axios';
import { CONTACT_INFO_WARNING, hasBlockedContactInfo } from '../utils/contactInfoBlock';
import io from 'socket.io-client';
import { FaPaperPlane, FaTimes, FaSync, FaFire, FaCheckCircle, FaEllipsisV, FaEnvelope, FaPaperclip, FaSmile, FaGift, FaCamera, FaVideo, FaMicrophone, FaStop } from 'react-icons/fa';
import TypingIndicator from './TypingIndicator';
import ChatEmailMessageCard from './ChatEmailMessageCard';
import { useAuth } from '../context/AuthContext';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { connectAppSocket } from '../utils/socketServerUrl';

const AgoraChatComponent = ({ userId, remoteUserId, onClose, embedded = false, onOpenEmail = null }) => {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const { handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [appKey, setAppKey] = useState('');
  const [connectionError, setConnectionError] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [remoteUserProfile, setRemoteUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [catalogGifts, setCatalogGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [sendingGiftId, setSendingGiftId] = useState(null);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const webcamMediaRecorderRef = useRef(null);
  const chatClient = useRef(null);
  const messagesEndRef = useRef(null);
  const connectionEstablished = useRef(false);
  const error204Occurred = useRef(false);
  const error204Timestamp = useRef(0);
  const isInitializing = useRef(false);
  const isReconnecting = useRef(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 2; // Only try to reconnect twice

  // Fetch remote user profile
  useEffect(() => {
    const fetchRemoteProfile = async () => {
      if (remoteUserId) {
        try {
          const response = await axios.get(`/api/profiles/${remoteUserId}`);
          setRemoteUserProfile(response.data);
        } catch (error) {
          console.error('Error fetching remote user profile:', error);
        }
      }
    };
    fetchRemoteProfile();
  }, [remoteUserId]);

  // Fetch gift catalog when chat is open (virtual gifts only)
  useEffect(() => {
    if (!remoteUserId) return;
    let cancelled = false;
    const load = async () => {
      setLoadingGifts(true);
      try {
        const { data } = await axios.get('/api/gifts/catalog?type=virtual');
        if (!cancelled) setCatalogGifts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setCatalogGifts([]);
      } finally {
        if (!cancelled) setLoadingGifts(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [remoteUserId]);

  useEffect(() => {
    // Reset state when userId or remoteUserId changes
    setIsConnected(false);
    setMessage('');
    connectionEstablished.current = false;
    error204Occurred.current = false;
    isReconnecting.current = false;
    reconnectAttempts.current = 0;
    setConnectionError(null);
    
    // Load existing messages from database when opening chat
    const loadMessages = async () => {
      if (userId && remoteUserId) {
        try {
          console.log('🔄 Loading messages for conversation with:', remoteUserId);
          const params = chatId 
            ? { chatId: chatId }
            : { userId: remoteUserId.toString() };
          
          const response = await axios.get('/api/messages', { params });
          
          if (response.data && Array.isArray(response.data)) {
            // Extract chatId from first message if available
            if (!chatId && response.data.length > 0) {
              if (response.data[0].chatId) {
                setChatId(response.data[0].chatId);
              } else if (response.data[0].chat?.id) {
                setChatId(response.data[0].chat.id);
              }
            }
            
            // Convert database messages to chat format
            const dbMessages = response.data.map(msg => ({
              text: msg.content || msg.message_text || '',
              senderId: msg.sender || msg.senderId || msg.sender_id || msg.senderData?.id,
              timestamp: new Date(msg.createdAt || msg.created_at || msg.timestamp),
              id: msg.id || msg._id,
              isRead: msg.isRead || msg.is_read || false,
              readAt: msg.readAt || msg.read_at ? new Date(msg.readAt || msg.read_at) : null,
              messageType: msg.messageType || msg.message_type || 'text',
              mediaUrl: msg.mediaUrl || msg.media_url || null,
            }))
            // Sort by timestamp to ensure chronological order
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            setMessages(dbMessages);
            console.log('✅ Loaded', dbMessages.length, 'messages from database');
            // Scroll to bottom after messages are loaded
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          } else {
            console.log('⚠️ No messages found or invalid response format');
            setMessages([]);
          }
        } catch (error) {
          console.error('❌ Error loading messages from database:', error);
          console.error('Error details:', error.response?.data || error.message);
          // Set empty array if load fails, but don't prevent chat from working
          setMessages([]);
        }
      } else {
        // Reset messages if userId or remoteUserId is missing
        setMessages([]);
        setChatId(null);
      }
    };
    
    // Load messages first, then initialize chat
    loadMessages();
    
    // Also reload messages after a short delay to catch any new messages
    const reloadTimer = setTimeout(() => {
      loadMessages();
    }, 2000); // Reload after 2 seconds
    
    return () => {
      clearTimeout(reloadTimer);
    };
    
    // Initialize chat
    if (userId && !isInitializing.current) {
      initializeAgoraChat();
    }
    
    return () => {
      disconnect();
    };
  }, [remoteUserId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prevent body scroll when modal is open (non-embedded mode)
  useEffect(() => {
    if (!embedded) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        // Restore body scroll when modal closes
        document.body.style.overflow = '';
      };
    }
  }, [embedded]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Only scroll within the messages container, not the entire page
      const messagesContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Function to reload messages from database (defined outside useEffect so it can be called from UI)
  const reloadMessages = async () => {
    if (!userId || !remoteUserId) return;
    
    try {
      console.log('🔄 Reloading messages...');
      const currentChatId = chatId; // Use current chatId value
      const params = currentChatId 
        ? { chatId: currentChatId }
        : { userId: remoteUserId.toString() };
      
      const response = await axios.get('/api/messages', { params });
      
      if (response.data && Array.isArray(response.data)) {
        // Extract chatId from first message if available
        if (!currentChatId && response.data.length > 0) {
          const firstMsg = response.data[0];
          if (firstMsg.chatId) {
            setChatId(firstMsg.chatId);
          } else if (firstMsg.chat?.id) {
            setChatId(firstMsg.chat.id);
          }
        }
        
        // Convert database messages to chat format
        const dbMessages = response.data.map(msg => ({
          text: msg.content || msg.message_text || '',
          senderId: msg.sender || msg.senderId || msg.sender_id || msg.senderData?.id,
          timestamp: new Date(msg.createdAt || msg.created_at || msg.timestamp),
          id: msg.id || msg._id,
          isRead: msg.isRead || msg.is_read || false,
          readAt: msg.readAt || msg.read_at ? new Date(msg.readAt || msg.read_at) : null,
          messageType: msg.messageType || msg.message_type || 'text',
          mediaUrl: msg.mediaUrl || msg.media_url || null,
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Only update if we have new messages or message count changed
        setMessages((prev) => {
          const prevIds = new Set(prev.map(m => m.id));
          const newMessages = dbMessages.filter(m => !prevIds.has(m.id));
          
          if (newMessages.length > 0) {
            console.log(`✅ Found ${newMessages.length} new messages, reloading all`);
            return dbMessages;
          } else if (prev.length !== dbMessages.length) {
            console.log(`✅ Message count changed (${prev.length} → ${dbMessages.length}), reloading`);
            return dbMessages;
          }
          
          return prev;
        });
        
        // Scroll to bottom if new messages
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error reloading messages:', error);
    }
  };

  // Poll for new messages every 5 seconds (fallback if Agora doesn't work)
  useEffect(() => {
    if (!userId || !remoteUserId) return;
    
    const pollInterval = setInterval(() => {
      reloadMessages();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(pollInterval);
  }, [userId, remoteUserId, chatId]);

  // Reload messages when window gains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (userId && remoteUserId) {
        console.log('🔄 Window focused, reloading messages...');
        reloadMessages();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId, remoteUserId, chatId]);

  // Real-time: reload when a new email (or message) arrives for this user
  useEffect(() => {
    if (!userId) return;
    const socket = connectAppSocket();
    socket.emit('join-room', String(userId));
    const onRefresh = () => {
      if (remoteUserId) reloadMessages();
    };
    socket.on('new-email', onRefresh);
    socket.on('new-message', onRefresh);
    return () => {
      socket.off('new-email', onRefresh);
      socket.off('new-message', onRefresh);
      socket.disconnect();
    };
  }, [userId, remoteUserId, chatId]);

  const handleReadEmailMessage = (messageId) => {
    if (!messageId) return;
    navigate(`/inbox?messageId=${messageId}`);
  };

  const openEmailComposerFromChat = () => {
    if (onOpenEmail) {
      onOpenEmail();
    } else {
      setActiveTab('email');
    }
    setShowEmojiPicker(false);
  };

  const openMediaFromEmailActions = () => {
    setActiveTab('media');
    setShowEmojiPicker(false);
    setTimeout(() => fileInputRef.current?.click(), 150);
  };

  const initializeAgoraChat = async () => {
    if (isInitializing.current) {
      console.log('Chat initialization already in progress, skipping...');
      return;
    }

    isInitializing.current = true;
    setConnectionError(null);

    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('🔄 Initializing Agora Chat for user:', userId);

      // Get Chat token and appKey from backend
      const tokenResponse = await axios.post('/api/agora/chat-token', {
        userId: userId.toString(),
      });

      if (!tokenResponse.data || !tokenResponse.data.token) {
        throw new Error('Failed to get Agora Chat token. Please check your Agora credentials in .env file.');
      }

      const { token, appKey: receivedAppKey } = tokenResponse.data;

      if (!receivedAppKey || receivedAppKey === '') {
        throw new Error('Agora App Key is not configured. Please add AGORA_APP_KEY to your backend .env file.');
      }

      if (!receivedAppKey.includes('#')) {
        throw new Error(`Invalid AppKey format: ${receivedAppKey}. AppKey must be in format: orgName#appName`);
      }

      setAppKey(receivedAppKey);

      // Close existing connection if any
      if (chatClient.current) {
        try {
          await chatClient.current.close();
        } catch (e) {
          console.log('Note: Error closing existing client (may not be connected):', e.message);
        }
      }

      // Initialize Chat client
      chatClient.current = new AgoraChat.connection({
        appKey: receivedAppKey,
      });

      // Helper function to handle received messages (text, image, video, audio)
      const handleReceivedMessage = async (message, messageType, content) => {
        const receivedMessage = {
          text: messageType === 'text' ? content : (messageType === 'image' ? '[Image]' : messageType === 'video' ? '[Video]' : messageType === 'voice' ? '[Voice]' : content),
          senderId: message.from || 'unknown',
          timestamp: new Date(),
          id: `agora-${Date.now()}-${Math.random()}`,
          isRead: false,
          messageType: messageType,
          mediaUrl: messageType !== 'text' ? content : null,
        };
        
        // Add to local state immediately, but check for duplicates
        setMessages((prev) => {
          // Check if this message already exists (might have been loaded from DB)
          const isDuplicate = prev.some(
            msg => {
              if (messageType === 'text') {
                return msg.text === receivedMessage.text && 
                       msg.senderId === receivedMessage.senderId &&
                       Math.abs(new Date(msg.timestamp) - receivedMessage.timestamp) < 5000;
              } else {
                return msg.mediaUrl === receivedMessage.mediaUrl && 
                       msg.senderId === receivedMessage.senderId &&
                       msg.messageType === messageType &&
                       Math.abs(new Date(msg.timestamp) - receivedMessage.timestamp) < 5000;
              }
            }
          );
          
          if (isDuplicate) {
            console.log('⚠️ Duplicate message detected, skipping');
            return prev;
          }
          
          console.log('✅ Adding received message to UI:', messageType);
          return [...prev, receivedMessage];
        });
        
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        // When we receive a message via Agora, it should already be in the database
        // from when the sender sent it. We just need to:
        // 1. Load the message from database to get the real ID and chatId
        // 2. Mark it as read
        // 3. Update our local state with the correct data
        
        // Wait a moment for the message to be saved to database, then load it
        setTimeout(() => {
          const loadReceivedMessage = async () => {
            try {
              const params = chatId 
                ? { chatId: chatId }
                : { userId: message.from };
              
              const response = await axios.get('/api/messages', { params });
              
              if (response.data && Array.isArray(response.data)) {
                // Extract chatId from first message if we don't have it
                if (!chatId && response.data.length > 0) {
                  const firstMsg = response.data[0];
                  if (firstMsg.chatId) {
                    setChatId(firstMsg.chatId);
                  } else if (firstMsg.chat?.id) {
                    setChatId(firstMsg.chat.id);
                  }
                }
                
                // Find the message we just received (within last 30 seconds)
                const dbMessage = response.data.find(
                  msg => {
                    if (messageType === 'text') {
                      return msg.content === content && 
                             msg.sender === message.from &&
                             Math.abs(new Date(msg.createdAt) - new Date()) < 30000;
                    } else {
                      return (msg.mediaUrl === content || msg.media_url === content) && 
                             msg.sender === message.from &&
                             msg.messageType === messageType &&
                             Math.abs(new Date(msg.createdAt) - new Date()) < 30000;
                    }
                  }
                );
                
                if (dbMessage) {
                  console.log('✅ Found received message in database:', dbMessage.id);
                  // Update the received message with database info
                  setMessages((prev) => {
                    return prev.map(m => {
                      if (m.id === receivedMessage.id || 
                          (messageType === 'text' && m.text === receivedMessage.text && m.senderId === receivedMessage.senderId) ||
                          (messageType !== 'text' && m.mediaUrl === receivedMessage.mediaUrl && m.senderId === receivedMessage.senderId)) {
                        return {
                          ...m,
                          id: dbMessage.id,
                          isRead: dbMessage.isRead || false,
                          mediaUrl: dbMessage.mediaUrl || dbMessage.media_url || m.mediaUrl,
                        };
                      }
                      return m;
                    });
                  });
                  
                  // Mark as read if not already
                  if (!dbMessage.isRead) {
                    axios.put(`/api/messages/${dbMessage.id}/read`).catch(err => {
                      console.log('Note: Could not mark message as read:', err.message);
                    });
                  }
                } else {
                  console.log('⚠️ Received message not found in database yet, will retry...');
                  // Retry once more after a longer delay
                  setTimeout(loadReceivedMessage, 2000);
                }
              }
            } catch (err) {
              console.error('❌ Error loading received message from database:', err);
            }
          };
          
          loadReceivedMessage();
        }, 500); // Wait 500ms for message to be saved to database
      };

      // Add event handlers BEFORE opening connection
      chatClient.current.addEventHandler('connection&message', {
        // Occurs when the app is connected to Agora Chat
        onConnected: () => {
          console.log('✅ Chat client connected successfully - onConnected event fired');
          connectionEstablished.current = true;
          setIsConnected(true);
          setConnectionError(null);
          error204Occurred.current = false;
          isInitializing.current = false;
          isReconnecting.current = false;
          reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
          console.log('Connection state updated - isConnected: true');
        },
        // Occurs when the app is disconnected from Agora Chat
        onDisconnected: () => {
          // Check if disconnection was caused by error 204 (User not found)
          const timeSinceError204 = Date.now() - error204Timestamp.current;
          
          // Error 204 is about the recipient, not the current user's connection
          // Completely ignore disconnections caused by error 204
          if (error204Occurred.current && timeSinceError204 < 10000) {
            // Silently ignore - connection is fine, just recipient not found
            error204Occurred.current = false;
            // Keep connection state as is - don't disconnect
            return;
          }
          
          // Only reconnect if it's a genuine disconnection and we haven't exceeded max attempts
          // But make it silent and non-blocking
          if (!isReconnecting.current && reconnectAttempts.current < maxReconnectAttempts) {
            // Silently reconnect in background - don't log or show errors
            isReconnecting.current = true;
            reconnectAttempts.current += 1;
            
            // Auto-reconnect after a short delay (silently)
            setTimeout(async () => {
              try {
                const tokenResponse = await axios.post('/api/agora/chat-token', {
                  userId: userId.toString(),
                });
                const { token } = tokenResponse.data;
                
                // Reopen connection
                await chatClient.current.open({
                  user: userId.toString(),
                  accessToken: token,
                });
                
                // Successfully reconnected - reset flags
                isReconnecting.current = false;
                reconnectAttempts.current = 0;
                connectionEstablished.current = true;
                setIsConnected(true);
              } catch (reconnectError) {
                // Silently handle reconnect error - don't show to user
                isReconnecting.current = false;
                // Don't set connection error - let it retry on next message send
              }
            }, 2000);
            
            return; // Don't update connection state - we're reconnecting silently
          }
          
          // Max reconnect attempts reached - but don't show error, just log
          // Connection will be re-established when user tries to send a message
          isReconnecting.current = false;
          // Don't set isConnected to false - keep it as true so user can still try to send
        },
        // Occurs when a text message is received
        onTextMessage: async (message) => {
          console.log('📨 Received text message from:', message.from, 'Message:', message.msg);
          
          // Check if message contains media JSON
          try {
            const parsed = JSON.parse(message.msg);
            if (parsed.type && parsed.url) {
              // This is a media message sent as JSON
              console.log(`📎 Received ${parsed.type} media message:`, parsed.url);
              handleReceivedMessage(message, parsed.type, parsed.url);
              return;
            }
          } catch (e) {
            // Not JSON, treat as regular text message
          }
          
          handleReceivedMessage(message, 'text', message.msg);
        },
        // Occurs when an image message is received
        onImageMessage: async (message) => {
          console.log('🖼️ Received image message from:', message.from, 'URL:', message.url || message.msg);
          const mediaUrl = message.url || message.msg || message.body?.url;
          handleReceivedMessage(message, 'image', mediaUrl);
        },
        // Occurs when a video message is received
        onVideoMessage: async (message) => {
          console.log('🎥 Received video message from:', message.from, 'URL:', message.url || message.msg);
          const mediaUrl = message.url || message.msg || message.body?.url;
          handleReceivedMessage(message, 'video', mediaUrl);
        },
        // Occurs when an audio message is received
        onAudioMessage: async (message) => {
          console.log('🎵 Received audio message from:', message.from, 'URL:', message.url || message.msg);
          const mediaUrl = message.url || message.msg || message.body?.url;
          handleReceivedMessage(message, 'voice', mediaUrl);
        },
        // Occurs when the token is about to expire
        onTokenWillExpire: () => {
          console.log('⚠️ Token is about to expire');
        },
        // Occurs when the token has expired
        onTokenExpired: () => {
          console.log('❌ Token has expired');
          alert('Your session has expired. Please refresh the page.');
          setIsConnected(false);
          connectionEstablished.current = false;
        },
        onError: (error) => {
          // Handle error 204 (User not found) - completely ignore it
          // This is expected when recipient hasn't opened chat yet, but chat will still work
          if (error.type === 204 || error.message?.includes('User not found')) {
            // Silently ignore - don't log as error, don't show anything
            // Chat will work anyway when recipient opens chat
            return;
          }
          
          // Only log other errors
          console.error('❌ Chat error:', error);
          console.error('Error details:', {
            type: error.type,
            message: error.message,
            code: error.code,
          });
          
          // Handle other errors
          if (error.type === 1 || error.type === 2) {
            // Connection or login error
            console.error('Critical chat error:', error.message);
            setIsConnected(false);
            connectionEstablished.current = false;
            setConnectionError(error.message || 'Connection failed. Please refresh the page.');
            isInitializing.current = false;
          }
        },
      });

      // Log in to Chat
      console.log('🔐 Logging in to Chat with userId:', userId);
      console.log('Token length:', token.length, 'AppKey:', receivedAppKey.substring(0, 20) + '...');
      
      try {
        await chatClient.current.open({
          user: userId.toString(),
          accessToken: token, // Use accessToken for Chat SDK v1.2.2+
        });
        
        console.log('✅ Chat login initiated - waiting for onConnected event...');
      } catch (openError) {
        console.error('❌ Error calling chatClient.open():', openError);
        throw new Error(`Failed to open chat connection: ${openError.message || 'Unknown error'}`);
      }
      
      // Don't wait for connection - allow immediate messaging
      // The connection will establish in the background via onConnected event
      // Users can start chatting immediately, messages will queue if needed
      console.log('✅ Chat login initiated - connection will establish in background');
      
      // Set connected immediately so UI shows "Connected" and messages can be sent
      setIsConnected(true);
      connectionEstablished.current = true;
      setConnectionError(null);
      isInitializing.current = false;
      
      console.log('💬 Chat ready - you can start messaging now');

    } catch (error) {
      console.error('❌ Initialize Agora Chat error:', error);
      isInitializing.current = false;
      
      let errorMessage = 'Failed to initialize chat. ';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Chat connection timeout. Please check your internet connection and try again.';
      } else if (error.response) {
        errorMessage += error.response.data?.message || error.response.statusText || 'Server error';
        if (error.response.data?.details) {
          errorMessage += '\n' + error.response.data.details;
        }
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your Agora credentials and try again.';
      }
      
      setIsConnected(false);
      setConnectionError(errorMessage);
      connectionEstablished.current = false;
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !remoteUserId) {
      return;
    }

    // Ensure chat client exists
    if (!chatClient.current) {
      console.log('⚠️ Chat client not initialized - initializing now...');
      await initializeAgoraChat();
      // Wait a moment for connection to start
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Try to ensure connection is open (non-blocking)
    try {
      const currentState = chatClient.current?.getConnectionState?.();
      if (currentState !== 'CONNECTED' && currentState !== 2 && currentState !== 'OPENED' && currentState !== 'OPEN') {
        console.log('⚠️ Connection not ready - ensuring connection is open...');
        // Get fresh token and reopen if needed
        const tokenResponse = await axios.post('/api/agora/chat-token', {
          userId: userId.toString(),
        });
        const { token } = tokenResponse.data;
        
        try {
          await chatClient.current.open({
            user: userId.toString(),
            accessToken: token,
          });
          console.log('✅ Connection opened for message sending');
          // Wait briefly for connection
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (openError) {
          console.log('Note: Connection may already be open:', openError.message);
          // Continue anyway - try to send
        }
      }
    } catch (stateError) {
      console.log('Note: Could not check/ensure connection state:', stateError.message);
      // Continue anyway - try to send
    }

    try {
      const messageText = message.trim();
      if (hasBlockedContactInfo(messageText)) {
        alert(CONTACT_INFO_WARNING);
        return;
      }
      console.log('📤 Sending message to:', remoteUserId, 'Message:', messageText);
      
      // Create message options
      const options = {
        chatType: 'singleChat', // One-to-one chat
        type: 'txt', // Text message type
        to: remoteUserId.toString(), // Recipient user ID
        msg: messageText, // Message content
      };

      // Create message object
      let msg = AgoraChat.message.create(options);

      // Add message to local state IMMEDIATELY (optimistic update)
      // This way user sees their message right away, even if send is still processing
      setMessages((prev) => [
        ...prev,
        {
          text: messageText,
          senderId: userId.toString(),
          timestamp: new Date(),
        },
      ]);
      setMessage(''); // Clear input immediately
      
      // Ensure we're marked as connected so UI shows "Connected" not "Connecting"
      setIsConnected(true);
      connectionEstablished.current = true;
      
      // Save message to database FIRST (before sending via Agora)
      // This ensures the message is in the database even if Agora fails
      let dbResponse = null;
      try {
        console.log('💾 Saving message to database...');
        dbResponse = await axios.post('/api/messages', {
          receiverId: remoteUserId.toString(),
          content: messageText,
          messageType: 'text',
          chatId: chatId, // Include chatId if we have it
        });
        
        // Update chatId if we got it from the response
        if (dbResponse.data?.chatId) {
          setChatId(dbResponse.data.chatId);
        } else if (dbResponse.data?.chat?.id) {
          setChatId(dbResponse.data.chat.id);
        }
        
        // Update the optimistic message with the real database ID
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].text === messageText) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              id: dbResponse.data.id,
              isRead: false,
            };
          }
          return updated;
        });

        // Refresh user data so updated credit balance is shown
        if (fetchUser) {
          fetchUser();
        }
        
        console.log('✅ Message saved to database with ID:', dbResponse.data.id);
        
        // Reload messages after sending to catch any new messages
        setTimeout(() => {
          reloadMessages();
        }, 1000);
      } catch (dbError) {
        console.error('❌ Failed to save message to database:', dbError.response?.data || dbError.message);

        if (dbError.response?.status === 400 && dbError.response?.data?.code === 'CONTACT_INFO_BLOCKED') {
          setMessages((prev) => {
            const updated = [...prev];
            updated.pop();
            return updated;
          });
          setMessage(messageText);
          alert(CONTACT_INFO_WARNING);
          return;
        }

        const msg = dbError.response?.data?.message || dbError.message || 'Failed to send message';
        if (dbError.response?.status === 400 && msg.toLowerCase().includes('insufficient')) {
          // Remove optimistic message because send actually failed
          setMessages((prev) => {
            const updated = [...prev];
            updated.pop();
            return updated;
          });
          if (!handleInsufficientCreditsError(dbError)) {
            alert(msg);
          }
          return;
        }
        // Continue anyway - try to send via Agora, but we know DB save failed
      }
      
      // Send message via Agora (real-time delivery)
      try {
        await chatClient.current.send(msg);
        console.log('✅ Message sent successfully via Agora Chat');
      } catch (agoraError) {
        console.error('❌ Failed to send message via Agora:', agoraError.message);
        // Message is already in database, so receiver can still see it when they load chat
        // This is acceptable - database is the source of truth
        
        // Try to retry sending via Agora
        try {
          console.log('⚠️ Retrying Agora send...');
          const tokenResponse = await axios.post('/api/agora/chat-token', {
            userId: userId.toString(),
          });
          const { token } = tokenResponse.data;
          
          await chatClient.current.open({
            user: userId.toString(),
            accessToken: token,
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retry sending
          await chatClient.current.send(msg);
          console.log('✅ Message sent successfully on retry');
        } catch (retryError) {
          console.error('❌ Retry also failed:', retryError);
          // Message is already in database, so receiver can still see it when they load chat
        }
      }
    } catch (error) {
      console.error('❌ Send message error:', error);
      
      let errorMessage = 'Failed to send message. ';
      
      if (error.message?.includes('not login') || error.message?.includes('not logged in')) {
        // Try to reconnect and retry sending
        console.log('⚠️ Not logged in yet - attempting to reconnect and retry...');
        try {
          // Get fresh token
          const tokenResponse = await axios.post('/api/agora/chat-token', {
            userId: userId.toString(),
          });
          const { token, appKey: receivedAppKey } = tokenResponse.data;
          
          // Reopen connection
          await chatClient.current.open({
            user: userId.toString(),
            accessToken: token,
          });
          
          // Wait for connection
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retry sending the message
          console.log('🔄 Retrying message send after reconnection...');
          const messageText = message.trim();
          const options = {
            chatType: 'singleChat',
            type: 'txt',
            to: remoteUserId.toString(),
            msg: messageText,
          };
          let msg = AgoraChat.message.create(options);
          await chatClient.current.send(msg);
          
          console.log('✅ Message sent successfully after retry');
          setMessages((prev) => [
            ...prev,
            {
              text: messageText,
              senderId: userId.toString(),
              timestamp: new Date(),
            },
          ]);
          setMessage('');
          return; // Success - exit
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
          // Continue to show error below
        }
      } else if (error.type === 204 || error.message?.includes('User not found')) {
        // Error 204 - ignore it, chat will work anyway
        console.log('⚠️ Error 204 - ignoring, will retry');
        return; // Exit early, don't show alert
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      // Don't show alert - just log errors
      // Connection issues will resolve automatically
      console.error('Send message error:', errorMessage);
    }
  };

  const disconnect = async () => {
    try {
      if (chatClient.current) {
        await chatClient.current.close();
        console.log('Chat client closed');
        setIsConnected(false);
        connectionEstablished.current = false;
        isInitializing.current = false;
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRetryConnection = () => {
    isInitializing.current = false;
    initializeAgoraChat();
  };

  // Emoji picker - common emojis
  const commonEmojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const sendGift = async (giftId) => {
    if (!remoteUserId || !giftId) return;
    setSendingGiftId(giftId);
    try {
      await axios.post('/api/gifts/send', { receiverId: remoteUserId.toString(), giftId });
      if (fetchUser) fetchUser();
      setTimeout(() => reloadMessages(), 500);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || 'Failed to send gift';
      if (!handleInsufficientCreditsError(err)) {
        alert(msg);
      }
    } finally {
      setSendingGiftId(null);
    }
  };

  // File upload handler
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Don't show selected file - upload immediately
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', remoteUserId);
      
      // Determine message type based on file type
      let messageType = 'text';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'voice';
      }
      
      formData.append('messageType', messageType);

      // Upload file
      const uploadResponse = await axios.post('/api/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.data && uploadResponse.data.url) {
        // Send message with file URL - this will show the media immediately in chat
        await sendMessageWithContent(uploadResponse.data.url, uploadResponse.data.messageType);
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Switch back to chat tab after sending
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file');
    }
  };

  // Send message with content (text, image, video, voice)
  const sendMessageWithContent = async (content, messageType = 'text') => {
    if (!content && !message.trim()) return;

    const messageContent = content || message.trim();
    if (messageType === 'text' && hasBlockedContactInfo(messageContent)) {
      alert(CONTACT_INFO_WARNING);
      return;
    }
    const isMediaMessage = messageType !== 'text' && content && (content.startsWith('http') || content.startsWith('https'));
    
    // Optimistically add message to UI immediately (for sender)
    // For media messages, show the media immediately
    const optimisticMessage = {
      text: messageType === 'text' ? messageContent : '', // Don't show placeholder text for media
      senderId: userId.toString(),
      timestamp: new Date(),
      messageType: messageType,
      mediaUrl: isMediaMessage ? content : null,
      id: `temp-${Date.now()}`, // Temporary ID
      isRead: false,
    };
    
    console.log('📎 Adding optimistic message with media:', {
      messageType,
      mediaUrl: optimisticMessage.mediaUrl,
      content,
      isMediaMessage
    });
    
    setMessages((prev) => [...prev, optimisticMessage]);
    
    try {
      
      // Scroll to bottom immediately to show the attachment
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Save to database
      // For media messages, don't put URL in content - only in mediaUrl
      const dbResponse = await axios.post('/api/messages', {
        receiverId: remoteUserId.toString(),
        content: messageType === 'text' ? messageContent : '', // Empty content for media messages
        messageType: messageType,
        chatId: chatId,
        mediaUrl: isMediaMessage ? content : null, // Store URL in mediaUrl field
      });

      if (dbResponse.data?.chatId) {
        setChatId(dbResponse.data.chatId);
      }

      // Replace optimistic message with real one from database
      if (dbResponse.data) {
        setMessages((prev) => {
          const filtered = prev.filter(m => m.id !== optimisticMessage.id);
          const realMessage = {
            text: isMediaMessage ? (dbResponse.data.content || '') : (dbResponse.data.content || optimisticMessage.text), // Only show text if it's not a media message or if user added text with media
            senderId: userId.toString(),
            timestamp: new Date(dbResponse.data.createdAt || dbResponse.data.created_at),
            messageType: dbResponse.data.messageType || messageType,
            mediaUrl: dbResponse.data.mediaUrl || dbResponse.data.media_url || optimisticMessage.mediaUrl,
            id: dbResponse.data.id,
            isRead: false,
          };
          console.log('✅ Replacing optimistic message with real one:', realMessage);
          return [...filtered, realMessage];
        });

        // Refresh user data so updated credit balance is shown
        if (fetchUser) {
          fetchUser();
        }
      }

      // Send via Agora Chat (for all message types)
      if (chatClient.current && isConnected) {
        try {
          // For media messages, send as text with JSON payload containing the media info
          // This ensures compatibility with Agora Chat SDK
          let agoraMsgContent;
          
          if (isMediaMessage) {
            // Send media URL as JSON in text message
            agoraMsgContent = JSON.stringify({
              type: messageType,
              url: content,
              mediaType: messageType
            });
          } else {
            agoraMsgContent = messageContent;
          }
          
          const options = {
            chatType: 'singleChat',
            type: 'txt', // Always use txt type for compatibility
            to: remoteUserId.toString(),
            msg: agoraMsgContent,
          };
          
          const msg = AgoraChat.message.create(options);
          await chatClient.current.send(msg);
          console.log(`✅ ${messageType} message sent successfully via Agora Chat`, {
            type: messageType,
            url: isMediaMessage ? content : null
          });
        } catch (agoraError) {
          console.error('Agora send error:', agoraError);
          // Don't fail the whole operation if Agora send fails
          // The message is already saved to database
        }
      } else {
        console.warn('⚠️ Cannot send via Agora: chatClient or connection not available');
      }

      if (messageType === 'text') {
        setMessage('');
      }

      // Reload messages to ensure consistency
      setTimeout(() => {
        reloadMessages();
      }, 500);
    } catch (error) {
      console.error('Send message error:', error);

      if (error.response?.status === 400 && error.response?.data?.code === 'CONTACT_INFO_BLOCKED') {
        const tempId = optimisticMessage.id;
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert(CONTACT_INFO_WARNING);
        return;
      }

      const msg = error.response?.data?.message || error.message || 'Failed to send message';
      if (error.response?.status === 400 && msg.toLowerCase().includes('insufficient')) {
        // Remove optimistic message on insufficient credits
        const tempId = optimisticMessage.id;
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        if (!handleInsufficientCreditsError(error)) {
          alert(msg);
        }
        return;
      }

      // Remove optimistic message on any other error
      const tempId = optimisticMessage.id;
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      alert('Failed to send message');
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        
        // Upload audio file
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('receiverId', remoteUserId);
        formData.append('messageType', 'voice');

        try {
          const uploadResponse = await axios.post('/api/messages/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          if (uploadResponse.data && uploadResponse.data.url) {
            // This will show the audio immediately in chat
            await sendMessageWithContent(uploadResponse.data.url, 'voice');
            // Switch back to chat tab after sending
            setActiveTab('chat');
          }
        } catch (error) {
          console.error('Voice upload error:', error);
          alert('Failed to upload voice message');
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Webcam handlers
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        webcamVideoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Failed to access webcam. Please allow camera access.');
      setShowWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
    }
    setShowWebcam(false);
  };

  const capturePhoto = async () => {
    if (!webcamVideoRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = webcamVideoRef.current.videoWidth;
      canvas.height = webcamVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(webcamVideoRef.current, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          // Upload and send immediately - don't show selected file
          const formData = new FormData();
          formData.append('file', file);
          formData.append('receiverId', remoteUserId);
          formData.append('messageType', 'image');
          
          try {
            const uploadResponse = await axios.post('/api/messages/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            
            if (uploadResponse.data && uploadResponse.data.url) {
              // This will show the image immediately in chat
              await sendMessageWithContent(uploadResponse.data.url, 'image');
            }
          } catch (error) {
            console.error('Photo upload error:', error);
            alert('Failed to upload photo');
          }
        }
      }, 'image/jpeg', 0.9);
      
      stopWebcam();
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo');
    }
  };

  // Start webcam when modal opens
  useEffect(() => {
    if (showWebcam) {
      startWebcam();
    } else {
      stopWebcam();
    }
    
    return () => {
      stopWebcam();
    };
  }, [showWebcam]);

  // If embedded, render without modal overlay
  if (embedded) {
    const remoteUserName = remoteUserProfile?.firstName || remoteUserId;
    const remoteUserAvatar = remoteUserProfile?.photos?.[0]?.url || null;
    
    // Helper function to safely format dates
    const safeDate = (timestamp) => {
      if (!timestamp) return null;
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
      const dateObj = safeDate(msg.timestamp);
      if (!dateObj) return groups;
      const date = dateObj.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    }, {});

    // Get today's date for timestamp display
    const today = new Date().toDateString();
    const lastMessageDate = messages.length > 0 
      ? (safeDate(messages[messages.length - 1].timestamp)?.toDateString() || null)
      : null;
    const isToday = lastMessageDate === today;

    return (
      <div className="h-full min-h-0 flex flex-col bg-gray-100 relative overflow-hidden">
        {/* Background decorative hearts */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-20 left-10 text-6xl">💗</div>
          <div className="absolute top-40 right-20 text-8xl">💗</div>
          <div className="absolute bottom-40 left-20 text-7xl">💗</div>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between gap-2 z-10 min-w-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {remoteUserAvatar ? (
              <img 
                src={remoteUserAvatar} 
                alt={remoteUserName}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center shrink-0">
                <span className="text-white font-semibold">{remoteUserName?.[0]?.toUpperCase() || '?'}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-y-1">
                <h3 className="font-semibold text-gray-900 truncate max-w-[10rem] sm:max-w-none">{remoteUserName}</h3>
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <FaFire className="text-white text-xs" />
                </div>
                <FaCheckCircle className="text-blue-500 text-sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button type="button" className="text-gray-600 hover:text-gray-800 p-2" aria-label="More">
              <FaEllipsisV />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-2"
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Connection Error Message */}
        {connectionError && (
          <div className={`border-l-4 p-3 mx-4 mt-2 z-10 ${
            connectionError.includes('timeout')
              ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
              : 'bg-red-100 border-red-500 text-red-700'
          }`}>
            <p className="text-sm">{connectionError}</p>
            {!connectionError.includes('timeout') && (
              <button
                onClick={handleRetryConnection}
                className="mt-2 text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div className={`flex-1 min-h-0 overflow-y-auto py-4 space-y-4 relative z-10 ${embedded ? 'px-4 sm:px-5 lg:px-6' : 'px-4 sm:px-6 lg:px-8'}`}>
          <div className={`w-full mx-auto ${embedded ? 'max-w-full' : 'max-w-3xl'}`}>
          {/* View Older Messages Link */}
          {messages.length > 10 && (
            <div className="text-center">
              <button className="text-red-600 text-sm font-medium hover:underline">
                VIEW OLDER MESSAGES
              </button>
            </div>
          )}

          {/* Date Grouping */}
          {Object.entries(groupedMessages).map(([date, dateMessages]) => {
            const isTodayDate = date === today;
            const dateObj = safeDate(date);
            const firstMsgDate = safeDate(dateMessages[0]?.timestamp);
            
            if (!dateObj || !firstMsgDate) return null;
            
            const displayDate = isTodayDate ? 'Today' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const displayTime = firstMsgDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={date}>
                {/* Date Header */}
                <div className="text-center mb-4">
                  <span className="text-gray-500 text-sm">
                    {displayDate}, {displayTime}
                  </span>
                </div>

                {/* Messages for this date */}
                {dateMessages
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  .map((msg, index) => {
                  const isOwn = msg.senderId === userId.toString();
                  const isEmailMsg = msg.messageType === 'email';
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                    >
                      {isEmailMsg ? (
                        <ChatEmailMessageCard
                          previewText={msg.text}
                          isOwn={isOwn}
                          onReadEmail={() => handleReadEmailMessage(msg.id)}
                          onOpenComposer={openEmailComposerFromChat}
                          onPhotoVideo={openMediaFromEmailActions}
                        />
                      ) : (
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isOwn
                            ? 'bg-white text-black'
                            : 'bg-white text-black'
                        }`}
                      >
                        {msg.messageType === 'image' && (msg.mediaUrl || msg.media_url) ? (
                          <div>
                            <div className="relative group">
                              <img 
                                src={msg.mediaUrl || msg.media_url} 
                                alt="Shared image" 
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                                style={{ 
                                  backgroundColor: 'transparent',
                                  maxHeight: '400px', 
                                  maxWidth: '100%', 
                                  width: 'auto',
                                  height: 'auto',
                                  objectFit: 'contain',
                                  display: 'block'
                                }}
                                onClick={() => {
                                  window.open(msg.mediaUrl || msg.media_url, '_blank');
                                }}
                                onError={(e) => {
                                  console.error('Image load error:', msg.mediaUrl || msg.media_url);
                                  e.target.style.display = 'none';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'text-sm text-red-500 p-2';
                                  errorDiv.textContent = 'Failed to load image';
                                  e.target.parentElement.appendChild(errorDiv);
                                }}
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition rounded-lg pointer-events-none"></div>
                            </div>
                            {msg.text && msg.text !== '[Image]' && msg.text !== '[image]' && msg.text.trim() && (
                              <p className="text-sm mt-2 leading-relaxed">{msg.text}</p>
                            )}
                          </div>
                        ) : msg.messageType === 'gift' && (msg.mediaUrl || msg.media_url) ? (
                          <div className="cursor-pointer">
                            <div className="relative inline-block rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg active:scale-95">
                              <img 
                                src={msg.mediaUrl || msg.media_url} 
                                alt="Gift" 
                                className="max-w-full rounded-lg cursor-pointer"
                                style={{ maxHeight: '120px', width: 'auto', objectFit: 'contain', display: 'block' }}
                                onClick={() => window.open(msg.mediaUrl || msg.media_url, '_blank')}
                                loading="lazy"
                              />
                            </div>
                          </div>
                        ) : msg.messageType === 'video' && (msg.mediaUrl || msg.media_url) ? (
                          <div style={{ padding: 0, margin: 0 }}>
                            <video 
                              src={msg.mediaUrl || msg.media_url} 
                              controls 
                              className="max-w-full"
                              style={{ 
                                backgroundColor: 'transparent',
                                maxHeight: '400px', 
                                maxWidth: '100%',
                                width: 'auto',
                                height: 'auto',
                                display: 'block',
                                padding: 0,
                                margin: 0
                              }}
                              preload="metadata"
                              onError={(e) => {
                                console.error('Video load error:', msg.mediaUrl || msg.media_url);
                                e.target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'text-sm text-red-500 p-2';
                                errorDiv.textContent = 'Failed to load video';
                                e.target.parentElement.appendChild(errorDiv);
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                            {msg.text && msg.text !== '[Video]' && msg.text !== '[video]' && msg.text.trim() && (
                              <p className="text-sm mt-2 leading-relaxed">{msg.text}</p>
                            )}
                          </div>
                        ) : msg.messageType === 'voice' && (msg.mediaUrl || msg.media_url) ? (
                          <div style={{ padding: 0, margin: 0 }}>
                            <audio 
                              src={msg.mediaUrl || msg.media_url} 
                              controls 
                              className="w-full min-w-0 max-w-full"
                              style={{ backgroundColor: 'transparent', padding: 0, margin: 0 }}
                              preload="metadata"
                              onError={(e) => {
                                console.error('Audio load error:', msg.mediaUrl || msg.media_url);
                                e.target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'text-sm text-red-500 p-2';
                                errorDiv.textContent = 'Failed to load audio';
                                e.target.parentElement.appendChild(errorDiv);
                              }}
                            />
                            {msg.text && msg.text !== '[Voice]' && msg.text !== '[voice]' && msg.text.trim() && (
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        )}
                        {isOwn && (
                          <div className="flex items-center justify-end mt-1">
                            <span className={`text-xs ${
                              msg.isRead ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {msg.isRead ? '✓✓' : '✓'}
                            </span>
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p>No messages yet. Start the conversation!</p>
              {!isConnected && (
                <p className="text-xs mt-2 text-gray-400">
                  Waiting for connection...
                </p>
              )}
            </div>
          )}
          
          {/* Typing Indicator */}
          {isRemoteTyping && (
            <div className="flex justify-start mb-3">
              <div className="max-w-[70%] rounded-2xl px-4 py-2.5 bg-white">
                <TypingIndicator />
              </div>
            </div>
          )}
          
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Section - Tabs, Input */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white z-10">
          {/* Always-visible virtual gifts row (no separate Gift tab) */}
          <div className="px-4 pt-3 border-t border-gray-200 bg-white">
            {loadingGifts ? (
              <div className="text-sm text-gray-500 py-3">Loading gifts...</div>
            ) : catalogGifts.length === 0 ? (
              <div className="text-sm text-gray-500 py-3">No gifts available.</div>
            ) : (
              <div className="flex items-center gap-3 overflow-x-auto overflow-y-hidden pb-2">
                {catalogGifts.map((g) => {
                  const cost = g.creditCost ?? 0;
                  const isFree = cost === 0;
                  const sending = sendingGiftId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => sendGift(g.id)}
                      disabled={sending}
                      className="group/gift flex-shrink-0 flex flex-col items-center justify-center p-2 bg-transparent border-0 rounded-lg transition-all duration-200 relative min-w-[72px] disabled:opacity-60 hover:-translate-y-1 hover:scale-110"
                      title={g.name}
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50/50 flex items-center justify-center mb-1 relative">
                        {g.imageUrl ? (
                          <img
                            src={g.imageUrl}
                            alt={g.name || ''}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">🎁</span>
                        )}
                        {isFree && (
                          <span className="absolute bottom-0 left-0 bg-red-500 text-white text-[9px] font-bold px-1 rounded-tr">
                            FREE
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-600 opacity-0 group-hover/gift:opacity-100 transition-opacity min-h-[1rem]">
                        {isFree ? 'FREE' : `${cost} Credits`}
                      </span>
                      {sending && <span className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-500 bg-white/80">...</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabs (Chat / Email / Media / Smiles) */}
          <div className="px-2 sm:px-4 border-t border-gray-200">
            <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden pb-0 -mx-1 px-1 sm:gap-4 sm:pb-0 [scrollbar-width:thin]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  setShowEmojiPicker(false);
                }}
                className={`py-3 flex items-center space-x-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600'
                }`}
              >
                <span className="font-medium">Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenEmail) {
                    // Open the email composer component
                    onOpenEmail();
                  } else {
                    // Fallback: just set tab (for backward compatibility)
                    setActiveTab('email');
                  }
                  setShowEmojiPicker(false);
                }}
                className={`py-3 flex items-center space-x-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'email'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600'
                }`}
              >
                <FaEnvelope className="text-sm" />
                <span className="font-medium">Email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('media');
                  setShowEmojiPicker(false);
                }}
                className={`py-3 flex items-center space-x-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'media'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600'
                }`}
              >
                <FaPaperclip className="text-sm shrink-0" />
                <span className="font-medium">
                  <span className="sm:hidden">Media</span>
                  <span className="hidden sm:inline">Photo/Video/Audio</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('smiles');
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className={`py-3 flex items-center space-x-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'smiles'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600'
                }`}
              >
                <FaSmile className="text-sm" />
                <span className="font-medium">Smiles</span>
              </button>
            </div>
          </div>

          {/* Tab Content - Photo/Video/Audio */}
          {activeTab === 'media' && (
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <div className="space-y-0 bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Choose from Device */}
                <label className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition">
                  <FaCamera className="text-gray-600 text-lg" />
                  <span className="text-sm font-medium text-gray-700 uppercase">Choose from Device</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => {
                      handleFileSelect(e);
                      setActiveTab('chat');
                    }}
                    className="hidden"
                  />
                </label>
                
                {/* Take via Webcam */}
                <button
                  onClick={() => {
                    setShowWebcam(true);
                    setActiveTab('chat');
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition"
                >
                  <FaVideo className="text-gray-600 text-lg" />
                  <span className="text-sm font-medium text-gray-700 uppercase">Take via Webcam</span>
                </button>
                
                {/* Record Audio */}
                <button
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                    setActiveTab('chat');
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-b-lg transition ${
                    isRecording
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <FaMicrophone className={`text-lg ${isRecording ? 'text-red-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium uppercase ${isRecording ? 'text-red-600' : 'text-gray-700'}`}>
                    {isRecording ? `Stop Recording (${formatRecordingTime(recordingTime)})` : 'Record Audio'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && activeTab === 'smiles' && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:bg-gray-200 rounded p-2 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Field */}
          <div className="px-3 sm:px-4 py-3 sm:py-4 relative">
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Emit typing event
                  if (socketRef.current && socketRef.current.connected && remoteUserId) {
                    socketRef.current.emit('typing', {
                      userId: String(userId),
                      remoteUserId: String(remoteUserId),
                    });
                    
                    // Clear existing timeout
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    
                    // Emit stopped typing after 2 seconds of inactivity
                    typingTimeoutRef.current = setTimeout(() => {
                      if (socketRef.current && socketRef.current.connected) {
                        socketRef.current.emit('stopped-typing', {
                          userId: String(userId),
                          remoteUserId: String(remoteUserId),
                        });
                      }
                    }, 2000);
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
              
              <button
                type="button"
                onClick={() => sendMessageWithContent(message, 'text')}
                disabled={!message.trim() && !selectedFile}
                className="bg-green-600 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-sm sm:text-base"
              >
                SEND
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to safely format dates (for modal mode)
  const safeDate = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  };

  // Modal mode (default)
  return (
    <>
      {/* Webcam Modal */}
      {showWebcam && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Take Photo</h3>
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={stopWebcam}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
              >
                <FaCamera />
                <span>Capture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ overflow: 'hidden' }}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[calc(80*var(--vh))] max-h-[calc(80*var(--vh))] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-nex text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Chat with {remoteUserId}</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white text-opacity-80">
                {isConnected ? '✅ Connected' : connectionError ? '❌ Error' : '🔄 Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reloadMessages}
              className="text-white hover:text-gray-200 transition"
              title="Refresh messages"
            >
              <FaSync />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Connection Error Message */}
        {connectionError && (
          <div className={`border-l-4 p-3 mx-4 mt-2 ${
            connectionError.includes('timeout')
              ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
              : 'bg-red-100 border-red-500 text-red-700'
          }`}>
            <p className="text-sm">{connectionError}</p>
            {!connectionError.includes('timeout') && (
              <button
                onClick={handleRetryConnection}
                className="mt-2 text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>No messages yet. Start the conversation!</p>
              {!isConnected && (
                <p className="text-xs mt-2 text-gray-400">
                  Waiting for connection...
                </p>
              )}
            </div>
          ) : (
            [...messages]
              .sort((a, b) => {
                const dateA = safeDate(a.timestamp);
                const dateB = safeDate(b.timestamp);
                if (!dateA || !dateB) return 0;
                return dateA - dateB;
              })
              // Hide add/remove-contact system messages from chat view
              .filter((msg) => {
                const raw = (msg.text || '').toLowerCase().trim();
                if (!raw) return true;
                if (raw.includes('added you to my contacts') || raw.includes('removed you from my contacts')) {
                  return false;
                }
                return true;
              })
              .map((msg, index) => {
              const isOwn = msg.senderId === userId.toString();
              const msgDate = safeDate(msg.timestamp);

              const rawText = (msg.text || '').trim();
              let displayText = rawText;
              if (rawText === 'Added you to my contacts.') {
                displayText = isOwn ? 'Added to my contacts' : 'Added you to contacts';
              }

              const isEmailMsg = msg.messageType === 'email';

              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {isEmailMsg ? (
                    <ChatEmailMessageCard
                      previewText={displayText || msg.text}
                      isOwn={isOwn}
                      onReadEmail={() => handleReadEmailMessage(msg.id)}
                      onOpenComposer={openEmailComposerFromChat}
                      onPhotoVideo={openMediaFromEmailActions}
                    />
                  ) : (
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-white text-black'
                        : 'bg-white text-black'
                    }`}
                  >
                    {msg.messageType === 'image' && (msg.mediaUrl || msg.media_url) ? (
                      <div className="mt-1">
                        <div className="relative group">
                          <img 
                            src={msg.mediaUrl || msg.media_url} 
                            alt="Shared image" 
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                            style={{ 
                              backgroundColor: 'transparent',
                              maxHeight: '400px', 
                              maxWidth: '100%', 
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                            onClick={() => {
                              // Open in new tab for full view
                              window.open(msg.mediaUrl || msg.media_url, '_blank');
                            }}
                            onError={(e) => {
                              console.error('Image load error:', msg.mediaUrl || msg.media_url);
                              e.target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'text-sm text-red-500 p-2';
                              errorDiv.textContent = 'Failed to load image';
                              e.target.parentElement.appendChild(errorDiv);
                            }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition rounded-lg pointer-events-none"></div>
                        </div>
                        {displayText &&
                          displayText !== '[Image]' &&
                          displayText !== '[image]' && (
                            <p className="text-sm mt-2">{displayText}</p>
                          )}
                      </div>
                    ) : msg.messageType === 'gift' && (msg.mediaUrl || msg.media_url) ? (
                      <div className="mt-1 cursor-pointer">
                        <div className="relative inline-block rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg active:scale-95">
                          <img 
                            src={msg.mediaUrl || msg.media_url} 
                            alt="Gift" 
                            className="max-w-full rounded-lg cursor-pointer"
                            style={{ maxHeight: '120px', width: 'auto', objectFit: 'contain', display: 'block' }}
                            onClick={() => window.open(msg.mediaUrl || msg.media_url, '_blank')}
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ) : msg.messageType === 'video' && (msg.mediaUrl || msg.media_url) ? (
                      <div style={{ padding: 0, margin: 0 }}>
                        <video 
                          src={msg.mediaUrl || msg.media_url} 
                          controls 
                          className="max-w-full"
                          style={{ 
                            backgroundColor: 'transparent',
                            maxHeight: '400px', 
                            maxWidth: '100%',
                            width: 'auto',
                            height: 'auto',
                            display: 'block',
                            padding: 0,
                            margin: 0
                          }}
                          preload="metadata"
                          onError={(e) => {
                            console.error('Video load error:', msg.mediaUrl || msg.media_url);
                            e.target.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'text-sm text-red-500 p-2';
                            errorDiv.textContent = 'Failed to load video';
                            e.target.parentElement.appendChild(errorDiv);
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                        {displayText &&
                          displayText !== '[Video]' &&
                          displayText !== '[video]' && (
                            <p className="text-sm mt-2">{displayText}</p>
                          )}
                      </div>
                    ) : msg.messageType === 'voice' && (msg.mediaUrl || msg.media_url) ? (
                      <div style={{ padding: 0, margin: 0 }}>
                        <audio 
                          src={msg.mediaUrl || msg.media_url} 
                          controls 
                          className="w-full min-w-0 max-w-full"
                          style={{ backgroundColor: 'transparent', padding: 0, margin: 0 }}
                          preload="metadata"
                          onError={(e) => {
                            console.error('Audio load error:', msg.mediaUrl || msg.media_url);
                            e.target.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'text-sm text-red-500 p-2';
                            errorDiv.textContent = 'Failed to load audio';
                            e.target.parentElement.appendChild(errorDiv);
                          }}
                        />
                        {displayText &&
                          displayText !== '[Voice]' &&
                          displayText !== '[voice]' && (
                            <p className="text-sm">{displayText}</p>
                          )}
                      </div>
                    ) : (
                      <p className="text-sm">{displayText}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-xs ${
                          isOwn ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      >
                        {msgDate ? msgDate.toLocaleTimeString() : ''}
                      </p>
                      {isOwn && (
                        <span
                          className={`text-xs ml-2 ${
                            msg.isRead
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          }`}
                          title={msg.isRead ? 'Seen' : 'Sent'}
                        >
                          {msg.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="bg-gradient-nex text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AgoraChatComponent;
