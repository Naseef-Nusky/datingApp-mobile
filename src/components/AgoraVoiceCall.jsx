import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import { FaPhone, FaMicrophone, FaMicrophoneSlash, FaTimes } from 'react-icons/fa';
import { validateChannelName } from '../utils/agoraUtils';
import { getRtcCodec, isNativeMobile, requestCallMediaPermissions } from '../utils/agoraNative';

const AgoraVoiceCall = ({ 
  channelName, 
  userId, 
  remoteUserId, 
  remoteUserProfile, // Full profile object with name, photos, etc.
  onEndCall 
}) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [callDuration, setCallDuration] = useState(0); // Call duration in seconds
  const [isRemoteConnected, setIsRemoteConnected] = useState(false); // Track if remote user is connected
  
  const clientRef = useRef(null);
  const callStartTimeRef = useRef(null); // Track when call started
  const durationIntervalRef = useRef(null); // Interval for updating duration display

  useEffect(() => {
    initializeAgora();
    return () => {
      // Clear duration interval on unmount
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      leaveChannel();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!channelName) {
        throw new Error('Channel name is required');
      }

      // Validate channel name
      const validation = validateChannelName(channelName);
      if (!validation.valid) {
        console.error('Invalid channel name:', validation.error);
        throw new Error(`Invalid channel name: ${validation.error}`);
      }

      // Use sanitized channel name if validation provided one
      const safeChannelName = validation.sanitized || channelName;
      console.log('RTC Channel:', safeChannelName, 'Length:', new TextEncoder().encode(safeChannelName).length, 'bytes');

      // Get RTC token from backend
      // Send userId as-is (backend will convert it to numeric UID)
      const tokenResponse = await axios.post('/api/agora/rtc-token', {
        channelName: safeChannelName,
        uid: userId, // Send original userId, backend will convert
      });

      if (!tokenResponse.data || !tokenResponse.data.token || !tokenResponse.data.appId) {
        throw new Error('Failed to get Agora token. Please check your Agora credentials in .env file.');
      }

      const { token, appId, uid: tokenUid } = tokenResponse.data;

      if (!appId || appId === '') {
        throw new Error('Agora App ID is not configured. Please add AGORA_APP_ID to your .env file.');
      }

      if (!token || token === '') {
        throw new Error('Failed to get valid token from server. Please check your Agora credentials.');
      }

      // Use the UID from token response to ensure it matches
      console.log('Token received - AppID:', appId, 'UID from token:', tokenUid);

      const client = AgoraRTC.createClient({
        mode: 'rtc',
        codec: getRtcCodec(),
      });
      clientRef.current = client;

      // Set up event handlers with detailed logging
      client.on('user-joined', (user) => {
        console.log('✅ [RTC EVENT] User joined channel:', user.uid);
        setIsRemoteConnected(true); // Remote user is now connected
        
        // Start timer when remote user joins (call is now active - receiver has accepted)
        if (!callStartTimeRef.current) {
          callStartTimeRef.current = new Date();
          console.log('⏱️ [CALL TIMER] Call started at (remote user joined):', callStartTimeRef.current);
          
          // Start duration timer
          durationIntervalRef.current = setInterval(() => {
            if (callStartTimeRef.current) {
              const duration = Math.floor((new Date() - callStartTimeRef.current) / 1000);
              setCallDuration(duration);
            }
          }, 1000); // Update every second
        }
      });

      // Connection state monitoring
      client.on('connection-state-change', (curState, revState) => {
        console.log(`🔄 [RTC CONNECTION] State changed: ${revState} -> ${curState}`);
        if (curState === 'CONNECTED') {
          console.log('✅ [RTC CONNECTION] Successfully connected to Agora');
        } else if (curState === 'DISCONNECTED' || curState === 'FAILED') {
          console.warn(`⚠️ [RTC CONNECTION] Connection issue: ${curState}`);
        }
      });

      // Suppress non-critical ICE errors (code 701 is usually harmless)
      client.on('exception', (event) => {
        // Only log critical errors, suppress common ICE candidate errors
        if (event.code !== 701 && event.code !== 1301) {
          console.warn('⚠️ [RTC EXCEPTION]', event.code, event.msg);
        }
        // Code 701 = ICE candidate error (usually non-critical)
        // Code 1301 = Network quality warning (non-critical)
      });

      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);
      client.on('user-left', handleUserLeft);

      // Use the UID from token response (backend already converted it correctly)
      const agoraUid = tokenUid || 0;

      // CRITICAL: Log channel name and UID for debugging
      console.log('🔑 [RTC JOIN] Joining channel:', safeChannelName);
      console.log('🔑 [RTC JOIN] UID:', agoraUid);
      console.log('🔑 [RTC JOIN] AppID:', appId);
      console.log('🔑 [RTC JOIN] Token length:', token.length);
      console.log('🔑 [RTC JOIN] User ID:', userId);
      console.log('🔑 [RTC JOIN] Remote User ID:', remoteUserId);

      // Join the channel (use the same channel name and UID as token)
      // Pass token as string (not null) - Agora requires the token parameter
      try {
        console.log('🔄 [RTC JOIN] Attempting to join...');
        await client.join(appId, safeChannelName, token, agoraUid);
        setIsJoined(true);
        console.log('✅ [RTC JOIN] Successfully joined channel:', safeChannelName, 'UID:', agoraUid);
        console.log('✅ [RTC JOIN] User is now in the channel and ready to publish tracks');
        
        // Don't start timer yet - wait for call to be accepted (receiver accepts)
        // Timer will start when remote user joins or when call-accepted event is received
      } catch (joinError) {
        console.error('❌ [RTC JOIN] Failed to join channel:', joinError);
        // Handle UID_CONFLICT by getting a new token with a different UID
        if (joinError.code === 'UID_CONFLICT' || joinError.message?.includes('UID_CONFLICT')) {
          console.warn('UID_CONFLICT detected, requesting new token with different UID...');
          
          // Request a new token (will have different UID due to timestamp/random component)
          const retryTokenResponse = await axios.post('/api/agora/rtc-token', {
            channelName: safeChannelName,
            uid: userId,
          });
          
          const { token: newToken, appId: newAppId, uid: newUid } = retryTokenResponse.data;
          
          console.log('Retrying join with new UID:', newUid);
          
          // Retry join with new token and UID
          await client.join(newAppId, safeChannelName, newToken, newUid);
          setIsJoined(true);
        } else {
          throw joinError; // Re-throw if it's not a UID_CONFLICT error
        }
      }

      // CRITICAL: Create and publish local audio track (VOICE-ONLY CALL)
      // MUST join first, then create track, then publish (as per Agora documentation)
      // We're already joined at this point (join completed above)
      try {
        console.log('🔄 [RTC TRACK] Creating audio track...');
        if (isNativeMobile()) {
          await requestCallMediaPermissions(false);
        }
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);
        console.log('✅ [RTC TRACK] Audio track created');
        
        // CRITICAL: Publish audio track
        console.log('🔄 [RTC PUBLISH] Publishing audio track...');
        await client.publish([audioTrack]);
        console.log('✅ [RTC PUBLISH] Published audio track:', audioTrack.getTrackLabel());
        console.log(`✅ [RTC PUBLISH] User is now broadcasting in channel: ${safeChannelName}`);
        console.log(`✅ [RTC PUBLISH] Other users should now hear this user`);
      } catch (audioError) {
        console.error('❌ [RTC TRACK] Audio track error:', audioError);
        throw new Error('Microphone access denied. Please allow microphone access and try again.');
      }

    } catch (error) {
      console.error('Initialize Agora error:', error);
      let errorMessage = 'Failed to initialize call. ';
      
      if (error.response) {
        // Backend error
        errorMessage += error.response.data?.message || error.response.statusText || 'Server error';
      } else if (error.message) {
        // Frontend error
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your Agora credentials and try again.';
      }
      
      alert(errorMessage);
      onEndCall();
    }
  };

  const handleUserPublished = async (user, mediaType) => {
    console.log('✅ [RTC EVENT] User published:', user.uid, 'MediaType:', mediaType);
    
    // Subscribe to the remote user (as per Agora documentation)
    await clientRef.current.subscribe(user, mediaType);

    if (mediaType === 'audio') {
      // Get the RemoteAudioTrack object from the AgoraRTCRemoteUser object
      const remoteAudioTrack = user.audioTrack;
      
      // Play the remote audio track (as per Agora documentation)
      if (remoteAudioTrack) {
        remoteAudioTrack.play();
        console.log('✅ [RTC EVENT] Remote audio playing for user:', user.uid);
      }
      
      // Add user to remote users list (avoid duplicates)
      setRemoteUsers((prev) => {
        if (prev.find(u => u.uid === user.uid)) return prev;
        return [...prev, user];
      });
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    console.log('⚠️ [RTC EVENT] User unpublished:', user.uid, 'MediaType:', mediaType);
    
    // Handle user-unpublished event (as per Agora documentation)
    // The SDK automatically releases the RemoteTrack object, so we just update UI
    if (mediaType === 'audio') {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      // Note: The SDK automatically stops audio playback when track is unpublished
    }
  };

  const handleUserLeft = (user) => {
    console.log('👋 [RTC EVENT] User left channel:', user.uid);
    // Remove user from remote users list when they leave
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    setIsRemoteConnected(false); // Remote user disconnected
  };

  const toggleMute = async () => {
    if (!localAudioTrack) {
      console.warn('⚠️ [MUTE] No audio track available');
      return;
    }

    try {
      const newMuteState = !isMuted;
      // setEnabled(true) = unmuted, setEnabled(false) = muted
      await localAudioTrack.setEnabled(!newMuteState);
      setIsMuted(newMuteState);
      console.log(`🎤 [MUTE] Microphone ${newMuteState ? 'MUTED' : 'UNMUTED'}`);
    } catch (error) {
      console.error('❌ [MUTE] Error toggling mute:', error);
      alert('Failed to toggle microphone. Please try again.');
    }
  };

  const leaveChannel = async () => {
    try {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (clientRef.current) {
        await clientRef.current.leave();
      }
    } catch (error) {
      console.error('Leave channel error:', error);
    }
  };

  const handleEndCall = async () => {
    // Calculate call duration
    let duration = 0;
    if (callStartTimeRef.current) {
      duration = Math.floor((new Date() - callStartTimeRef.current) / 1000);
      console.log('⏱️ [CALL TIMER] Call duration:', duration, 'seconds');
    }
    
    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    await leaveChannel();
    onEndCall(duration); // Pass duration to parent component
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 flex flex-col h-[100dvh] pt-[env(safe-area-inset-top)] pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4">
      <div className="flex-1 flex flex-col items-center justify-center text-center text-white min-h-0">
        {/* Avatar */}
        {remoteUserProfile?.photos?.[0]?.url || (typeof remoteUserProfile?.photos?.[0] === 'string' ? remoteUserProfile.photos[0] : null) ? (
          <div className={`w-28 h-28 sm:w-40 sm:h-40 rounded-full overflow-hidden mx-auto mb-4 sm:mb-6 shadow-2xl border-4 border-white border-opacity-30 ${!isRemoteConnected ? 'animate-pulse' : ''}`}>
            <img 
              src={remoteUserProfile.photos[0]?.url || remoteUserProfile.photos[0]} 
              alt={remoteUserProfile.firstName || remoteUserId}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`w-28 h-28 sm:w-40 sm:h-40 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl border-4 border-white border-opacity-30 ${!isRemoteConnected ? 'animate-pulse' : ''}`}>
            <span className="text-4xl sm:text-5xl font-bold">
              {(remoteUserProfile?.firstName || remoteUserId)?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        
        {/* Name */}
        <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
          {remoteUserProfile?.firstName || remoteUserId || 'Unknown'}
        </h2>
        {remoteUserProfile?.lastName && (
          <h3 className="text-2xl text-gray-200 mb-3">{remoteUserProfile.lastName}</h3>
        )}
        
        {/* Status - Show waiting until remote connects */}
        {!isRemoteConnected ? (
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-gray-300 text-lg">
              {isJoined ? 'Waiting for user to connect...' : 'Connecting...'}
            </p>
          </div>
        ) : (
          <>
            {/* Status - Connected */}
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <p className="text-gray-300 text-lg">Connected</p>
            </div>
            
            {/* Call Duration */}
            {callDuration > 0 && (
              <p className="text-gray-400 text-xl font-mono mb-2">
                {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
              </p>
            )}
            
            {/* Call Status */}
            {remoteUsers.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm text-green-400 font-semibold flex items-center justify-center gap-2 px-2">
                  <span>●</span>
                  <span>Audio connected</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-yellow-400 mt-4">Waiting for audio...</p>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex items-center justify-center gap-6 pb-2">
        <button
          onClick={toggleMute}
          className={`p-5 rounded-full ${
            isMuted 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-white bg-opacity-20 hover:bg-opacity-30'
          } text-white transition-all duration-200 transform hover:scale-110 shadow-lg`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <FaMicrophoneSlash size={28} /> : <FaMicrophone size={28} />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-6 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 transform hover:scale-110 shadow-lg"
          title="End call"
        >
          <FaPhone size={28} className="rotate-135" />
        </button>
      </div>
    </div>
  );
};

export default AgoraVoiceCall;

