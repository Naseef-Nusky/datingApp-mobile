import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import { FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaTimes } from 'react-icons/fa';
import { validateChannelName } from '../utils/agoraUtils';
import {
  getRtcCodec,
  applyFrontCameraToTrack,
  getCameraTrackInitConfig,
  getLocalVideoPlayConfig,
  getRemoteVideoPlayConfig,
  isMobileDevice,
  isNativeMobile,
  playAgoraVideoTrack,
  requestCallMediaPermissions,
} from '../utils/agoraNative';

const AgoraVideoCall = ({ 
  channelName, 
  userId, 
  remoteUserId, 
  remoteUserProfile, // Full profile object with name, photos, etc.
  onEndCall,
  callType = 'video' // 'video' or 'voice'
}) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [callDuration, setCallDuration] = useState(0); // Call duration in seconds
  const [isRemoteConnected, setIsRemoteConnected] = useState(false); // Track if remote user is connected
  const [isRemoteVideoActive, setIsRemoteVideoActive] = useState(false); // Track if remote user has video active
  const [networkQuality, setNetworkQuality] = useState({ uplink: 0, downlink: 0 }); // Network quality (1-6)
  const [availableCameras, setAvailableCameras] = useState([]); // Available cameras
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0); // Current camera index
  const [connectionState, setConnectionState] = useState('DISCONNECTED'); // Connection state
  const [isReconnecting, setIsReconnecting] = useState(false); // Reconnection state
  
  const clientRef = useRef(null);
  const localVideoContainerRef = useRef(null);
  const remoteVideoContainerRef = useRef(null);
  const callStartTimeRef = useRef(null); // Track when call started
  const durationIntervalRef = useRef(null); // Interval for updating duration display
  const networkQualityIntervalRef = useRef(null); // Interval for network quality monitoring
  const localUidRef = useRef(null); // Store local UID to filter out local user events
  const remoteVideoTrackRef = useRef(null); // Store remote video track reference

  const refreshCameras = async () => {
    try {
      const cameras = await AgoraRTC.getCameras();
      setAvailableCameras(cameras);
      console.log(`📹 [CAMERA] Found ${cameras.length} camera(s):`, cameras.map(c => c.label || c.deviceId));
      return cameras;
    } catch (error) {
      console.warn('⚠️ [CAMERA] Could not get camera list:', error);
      setAvailableCameras([]);
      return [];
    }
  };

  // Helper function to extract profile data (avoid duplication)
  const getProfileData = () => {
    const profileImage = 
      remoteUserProfile?.photos?.[0]?.url || 
      (typeof remoteUserProfile?.photos?.[0] === 'string' ? remoteUserProfile.photos[0] : null) ||
      remoteUserProfile?.photo ||
      remoteUserProfile?.profilePhoto ||
      remoteUserProfile?.avatar ||
      null;
    
    const firstName = remoteUserProfile?.firstName || remoteUserProfile?.name || remoteUserId || 'Unknown';
    const lastName = remoteUserProfile?.lastName || '';
    
    return { profileImage, firstName, lastName };
  };

  // Helper component to render profile image
  const ProfileImage = ({ animate = false, size = 'w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48' }) => {
    const { profileImage, firstName } = getProfileData();
    const animateClass = animate ? 'animate-pulse' : '';
    
    return profileImage ? (
      <div className={`${size} rounded-full overflow-hidden mx-auto mb-6 border-4 border-white border-opacity-30 shadow-2xl ${animateClass}`}>
        <img 
          src={profileImage} 
          alt={firstName}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.warn('⚠️ [PROFILE] Image failed to load, showing initial');
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-6xl font-bold text-white">${firstName[0]?.toUpperCase() || 'U'}</span>`;
              parent.className = `${size} bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white border-opacity-30 shadow-2xl ${animateClass}`;
            }
          }}
        />
      </div>
    ) : (
      <div className={`${size} bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white border-opacity-30 shadow-2xl ${animateClass}`}>
        <span className="text-6xl font-bold text-white">
          {firstName[0]?.toUpperCase() || 'U'}
        </span>
      </div>
    );
  };

  // Helper function to clear video container (avoid duplication)
  const clearVideoContainer = () => {
    if (remoteVideoContainerRef.current) {
      const container = remoteVideoContainerRef.current;
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.innerHTML = '';
      console.log('🧹 [CLEANUP] Remote video container cleared');
    }
  };

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

  // Ensure local video is rendered into its container whenever it's available
  useEffect(() => {
    if (callType !== 'video') return;
    if (!localVideoTrack) return;
    if (!localVideoContainerRef.current) return;

    void playAgoraVideoTrack(
      localVideoTrack,
      localVideoContainerRef.current,
      getLocalVideoPlayConfig(),
    ).then((ok) => {
      if (ok) console.log('📹 [LOCAL VIDEO] Playing local video in container');
    });
  }, [callType, localVideoTrack, isJoined, isRemoteConnected]);

  // Clear video container when remote video becomes inactive
  useEffect(() => {
    if (!isRemoteVideoActive) {
      clearVideoContainer();
      
      // Also stop any playing video tracks
      if (remoteVideoTrackRef.current) {
        try {
          remoteVideoTrackRef.current.stop();
          console.log('🧹 [CLEANUP] Stopped remote video track');
        } catch (error) {
          console.warn('⚠️ [CLEANUP] Error stopping video track:', error);
        }
        remoteVideoTrackRef.current = null;
      }
    }
  }, [isRemoteVideoActive]);

  // Play remote video when container becomes available (common iOS timing issue)
  useEffect(() => {
    if (!isRemoteVideoActive || !remoteVideoTrackRef.current) return;

    const playRemote = () => {
      if (!remoteVideoContainerRef.current || !remoteVideoTrackRef.current) return;
      if (remoteVideoTrackRef.current.isPlaying) return;
      void playAgoraVideoTrack(
        remoteVideoTrackRef.current,
        remoteVideoContainerRef.current,
        getRemoteVideoPlayConfig(),
      ).then((ok) => {
        if (ok) console.log('📹 [EFFECT] Playing remote video track in container');
      });
    };

    const timeoutId = setTimeout(playRemote, 50);
    const retryId = setInterval(playRemote, 250);
    const stopRetry = setTimeout(() => clearInterval(retryId), 4000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(retryId);
      clearTimeout(stopRetry);
    };
  }, [isRemoteVideoActive, isRemoteConnected]);


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

      // H.264 on native mobile (especially iOS WKWebView); VP8 on desktop web
      const rtcCodec = getRtcCodec();
      console.log('📹 [RTC] Using codec:', rtcCodec, 'native mobile:', isNativeMobile());

      const client = AgoraRTC.createClient({
        mode: 'rtc',
        codec: rtcCodec,
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

      // Connection state monitoring with reconnect handling
      client.on('connection-state-change', (curState, revState) => {
        console.log(`🔄 [RTC CONNECTION] State changed: ${revState} -> ${curState}`);
        setConnectionState(curState);
        
        if (curState === 'CONNECTED') {
          console.log('✅ [RTC CONNECTION] Successfully connected to Agora');
          setIsReconnecting(false);
        } else if (curState === 'RECONNECTING') {
          console.warn('🔄 [RTC CONNECTION] Reconnecting...');
          setIsReconnecting(true);
        } else if (curState === 'DISCONNECTED' || curState === 'FAILED') {
          console.warn(`⚠️ [RTC CONNECTION] Connection issue: ${curState}`);
          setIsReconnecting(false);
        }
      });

      // Network quality monitoring
      client.on('network-quality', (stats) => {
        const uplinkQuality = stats.uplinkNetworkQuality || 0;
        const downlinkQuality = stats.downlinkNetworkQuality || 0;
        setNetworkQuality({ uplink: uplinkQuality, downlink: downlinkQuality });
        
        // Log poor network quality
        if (uplinkQuality >= 5 || downlinkQuality >= 5) {
          console.warn(`⚠️ [NETWORK] Poor network quality - Uplink: ${uplinkQuality}, Downlink: ${downlinkQuality}`);
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
        const uid = await client.join(appId, safeChannelName, token, agoraUid);
        localUidRef.current = uid; // Store local UID to filter out local user events
        setIsJoined(true);
        console.log('✅ [RTC JOIN] Successfully joined channel:', safeChannelName, 'UID:', uid);
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
          const retryUid = await client.join(newAppId, safeChannelName, newToken, newUid);
          localUidRef.current = retryUid; // Store local UID
          setIsJoined(true);
        } else {
          throw joinError; // Re-throw if it's not a UID_CONFLICT error
        }
      }

      // CRITICAL: Create and publish local tracks AFTER joining channel
      // MUST join first, then create tracks, then publish (as per Agora documentation)
      console.log('🔄 [RTC TRACK] Creating local tracks...');
      const tracksToPublish = [];

      if (callType === 'video') {
        try {
          if (isMobileDevice()) {
            await requestCallMediaPermissions(true);
          }
          const cameras = await refreshCameras();
          const videoTrack = await AgoraRTC.createCameraVideoTrack(
            getCameraTrackInitConfig(cameras),
          );
          const frontIdx = await applyFrontCameraToTrack(videoTrack, cameras);
          setCurrentCameraIndex(frontIdx);
          setLocalVideoTrack(videoTrack);
          tracksToPublish.push(videoTrack);
          console.log('✅ [RTC TRACK] Video track created (front camera on mobile)');
        } catch (videoError) {
          console.error('❌ [RTC TRACK] Video track error:', videoError);
          if (isNativeMobile()) {
            throw new Error(
              'Camera access is required for video calls. Allow Camera and Microphone in Settings → Vantage Dating.',
            );
          }
        }
      }

      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);
        tracksToPublish.push(audioTrack);
        console.log('✅ [RTC TRACK] Audio track created');
      } catch (audioError) {
        console.error('❌ [RTC TRACK] Audio track error:', audioError);
        throw new Error('Microphone access denied. Please allow microphone access and try again.');
      }

      // CRITICAL: Publish all tracks together
      // We're already joined at this point (join completed above)
      if (tracksToPublish.length > 0) {
        console.log(`🔄 [RTC PUBLISH] Publishing ${tracksToPublish.length} track(s)...`);
        await client.publish(tracksToPublish);
        console.log(`✅ [RTC PUBLISH] Published ${tracksToPublish.length} track(s):`, 
          tracksToPublish.map(t => t.getTrackLabel()).join(', '));
        console.log(`✅ [RTC PUBLISH] User is now broadcasting in channel: ${safeChannelName}`);
        console.log(`✅ [RTC PUBLISH] Other users should now see/hear this user`);
      } else {
        console.warn('⚠️ [RTC PUBLISH] No tracks to publish!');
        console.error('❌ [RTC PUBLISH] User will NOT be visible/audible to others!');
        throw new Error('No tracks available to publish');
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
    
    // Ignore local user events
    if (user.uid === localUidRef.current) {
      console.log('📹 [RTC EVENT] Ignoring local user published event');
      return;
    }

    await clientRef.current.subscribe(user, mediaType);

    if (mediaType === 'video') {
      console.log('📹 [RTC EVENT] Remote video published - setting isRemoteVideoActive to true');
      remoteVideoTrackRef.current = user.videoTrack;
      setIsRemoteVideoActive(true);

      // Play immediately when container exists (don't rely only on useEffect timing on iOS)
      requestAnimationFrame(() => {
        if (remoteVideoContainerRef.current && remoteVideoTrackRef.current) {
          void playAgoraVideoTrack(
            remoteVideoTrackRef.current,
            remoteVideoContainerRef.current,
            getRemoteVideoPlayConfig(),
          );
        }
      });
    }

    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    console.log('⚠️ [RTC EVENT] User unpublished:', user.uid, 'MediaType:', mediaType);
    
    if (mediaType !== 'video') return;

    // Ignore local user events
    if (user.uid === localUidRef.current) {
      console.log('📹 [RTC EVENT] Ignoring local user unpublished event');
      return;
    }

    // Stop the video track to prevent frozen video
    if (user.videoTrack) {
      try {
        user.videoTrack.stop();
        console.log('📹 [RTC EVENT] Remote video track stopped');
      } catch (error) {
        console.warn('⚠️ [RTC EVENT] Error stopping video track:', error);
      }
    }

    // Clear the video track reference
    remoteVideoTrackRef.current = null;
    
    // Immediately clear the video container
    clearVideoContainer();
    
    console.log('📹 [RTC EVENT] Remote video unpublished - setting isRemoteVideoActive to false');
    setIsRemoteVideoActive(false);
  };

  const handleUserLeft = (user) => {
    console.log('👋 [RTC EVENT] User left channel:', user.uid);
    setIsRemoteConnected(false); // Remote user disconnected
    setIsRemoteVideoActive(false); // Reset video state
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

  const toggleVideo = async () => {
    if (!localVideoTrack) return;

    try {
      const nextState = !isVideoOff;

      await localVideoTrack.setEnabled(!nextState);
      setIsVideoOff(nextState);

      console.log(
        nextState
          ? '📹 Camera turned OFF'
          : '📹 Camera turned ON'
      );
    } catch (err) {
      console.error('❌ Video toggle failed:', err);
    }
  };

  // Switch between front and back camera (mobile)
  const switchCamera = async () => {
    if (!localVideoTrack || availableCameras.length < 2) {
      console.warn('⚠️ [CAMERA] Cannot switch - not enough cameras available');
      return;
    }
    
    try {
      // Toggle between cameras
      const nextCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextCameraIndex];
      
      console.log(`📹 [CAMERA] Switching to camera ${nextCameraIndex}:`, nextCamera.label || nextCamera.deviceId);
      
      // Switch camera device
      try {
        await localVideoTrack.setDevice(nextCamera.deviceId);
        setCurrentCameraIndex(nextCameraIndex);
        console.log('✅ [CAMERA] Camera switched successfully');
      } catch (setDeviceErr) {
        // Some environments (including some iOS WebView setups) can fail setDevice().
        // Fallback: recreate track with the desired device and republish.
        console.warn('⚠️ [CAMERA] setDevice failed, recreating track:', setDeviceErr);

        const client = clientRef.current;
        if (!client) throw setDeviceErr;

        // Unpublish and close old track
        try {
          await client.unpublish([localVideoTrack]);
        } catch (e) {
          // ignore
        }
        try {
          localVideoTrack.stop();
          localVideoTrack.close();
        } catch (e) {
          // ignore
        }

        const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
          cameraId: nextCamera.deviceId,
          ...getCameraTrackInitConfig(availableCameras),
        });
        setLocalVideoTrack(newVideoTrack);
        await client.publish([newVideoTrack]);

        if (localVideoContainerRef.current) {
          void playAgoraVideoTrack(
            newVideoTrack,
            localVideoContainerRef.current,
            getLocalVideoPlayConfig(),
          );
        }

        setCurrentCameraIndex(nextCameraIndex);
        console.log('✅ [CAMERA] Camera switched successfully (recreated track)');
      }
    } catch (error) {
      console.error('❌ [CAMERA] Error switching camera:', error);
      alert('Failed to switch camera. Please try again.');
    }
  };

  const leaveChannel = async () => {
    try {
      // Clear network quality monitoring
      if (networkQualityIntervalRef.current) {
        clearInterval(networkQualityIntervalRef.current);
        networkQualityIntervalRef.current = null;
      }
      
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col w-screen h-[100dvh] overflow-hidden pt-[env(safe-area-inset-top,0px)]">
      {/* Remote Video Container */}
      <div className="flex-1 relative bg-gray-900 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Show waiting UI until remote user connects - Always show REMOTE user's profile */}
        {!isRemoteConnected ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              {/* Show REMOTE user's profile photo if available */}
              <ProfileImage animate={true} />
              
              {/* Show REMOTE user's name */}
              {(() => {
                const { firstName, lastName } = getProfileData();
                return (
                  <>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white">{firstName}</h2>
                    {lastName && (
                      <h3 className="text-xl sm:text-2xl lg:text-3xl text-gray-200 mb-6 font-semibold">{lastName}</h3>
                    )}
                  </>
                );
              })()}
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              <p className="text-gray-300 text-lg">
                {isJoined ? 'Calling...' : 'Connecting...'}
              </p>
            </div>
          </div>
        ) : isRemoteConnected && isRemoteVideoActive ? (
          // Show remote video when connected and video is active
          <div
            ref={remoteVideoContainerRef}
            className="w-full h-full bg-black relative z-10 [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
            key="remote-video-active"
          />
        ) : isRemoteConnected ? (
          // Show remote person's profile when connected but video is off or not started
          <div className="w-full h-full flex items-center justify-center bg-gray-900 relative z-10">
            <div className="text-center text-white">
              {/* Remote Person's Profile Image */}
              {(() => {
                // Debug: Log the profile data
                if (process.env.NODE_ENV === 'development') {
                  const { profileImage, firstName } = getProfileData();
                  console.log('📸 [PROFILE] Remote user profile:', remoteUserProfile);
                  console.log('📸 [PROFILE] Remote user ID:', remoteUserId);
                  console.log('📸 [PROFILE] Profile image found:', profileImage);
                  console.log('📸 [PROFILE] First name:', firstName);
                }
                return <ProfileImage />;
              })()}
              
              {/* Remote Person's Name - Always show something */}
              {(() => {
                const { firstName, lastName } = getProfileData();
                return (
                  <>
                    <h2 className="text-4xl font-bold mb-2 text-white">{firstName}</h2>
                    {lastName && (
                      <h3 className="text-3xl text-gray-200 mb-6 font-semibold">{lastName}</h3>
                    )}
                  </>
                );
              })()}
              
              {/* Show "Video Off" message if connected but video is not active */}
              {isRemoteConnected && !isRemoteVideoActive ? (
                <div className="mt-6">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22" />
                    </svg>
                    <p className="text-red-400 text-xl font-bold">Video Off</p>
                  </div>
                  <p className="text-gray-300 text-base">Their camera is turned off</p>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <p className="text-gray-400 text-base">Waiting for video...</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
        
        {/* Local preview (PiP) — show as soon as joined so iOS users see their camera */}
        {callType === 'video' && localVideoTrack && isJoined && (
          <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 w-28 h-20 sm:top-[calc(1rem+env(safe-area-inset-top,0px))] sm:right-4 sm:w-40 sm:h-28 lg:w-48 lg:h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-white z-30">
            <div ref={localVideoContainerRef} className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
          </div>
        )}

        {/* Call Info Overlay */}
        <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] left-4 bg-black bg-opacity-50 rounded-lg px-4 py-2 text-white">
          <p className="text-sm font-semibold">
            {remoteUserProfile?.firstName || remoteUserId || 'Unknown'}
            {remoteUserProfile?.lastName && ` ${remoteUserProfile.lastName}`}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${
              isReconnecting ? 'bg-yellow-500 animate-pulse' : 
              connectionState === 'CONNECTED' ? 'bg-green-500' : 
              'bg-yellow-500'
            }`} />
            <p className="text-xs text-gray-300">
              {isReconnecting ? 'Reconnecting...' : 
               connectionState === 'CONNECTED' ? 'Connected' : 
               connectionState === 'RECONNECTING' ? 'Reconnecting...' :
               'Connecting...'}
            </p>
          </div>
          {isJoined && callDuration > 0 && (
            <p className="text-xs text-gray-300 mt-1">
              {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
            </p>
          )}
          {isRemoteConnected && (
            <p className="text-xs text-green-400 mt-1">
              {isRemoteVideoActive ? '✓ Remote video active' : '✓ Connected (video off)'}
            </p>
          )}
          {/* Network Quality Indicator */}
          {(networkQuality.uplink > 0 || networkQuality.downlink > 0) && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-400">Network:</span>
              <div className={`w-2 h-2 rounded-full ${
                networkQuality.downlink <= 2 ? 'bg-green-500' :
                networkQuality.downlink <= 4 ? 'bg-yellow-500' :
                'bg-red-500'
              }`} title={`Uplink: ${networkQuality.uplink}, Downlink: ${networkQuality.downlink}`} />
              <span className="text-xs text-gray-400">
                {networkQuality.downlink <= 2 ? 'Good' :
                 networkQuality.downlink <= 4 ? 'Medium' :
                 'Poor'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex items-center justify-center space-x-4 border-t border-gray-800 flex-shrink-0">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          } text-white transition-all duration-200 transform hover:scale-110`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
        </button>

        {callType === 'video' && localVideoTrack && (
          <>
            <button
              onClick={toggleVideo}
              disabled={!localVideoTrack}
              className={`p-4 rounded-full ${
                isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              } text-white transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
            </button>
            {/* Camera Switch Button (only show if multiple cameras available and video is on) */}
            {availableCameras.length > 1 && !isVideoOff && localVideoTrack && (
              <button
                onClick={switchCamera}
                className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200 transform hover:scale-110"
                title={`Switch camera (${currentCameraIndex + 1}/${availableCameras.length})`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </>
        )}

        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 transform hover:scale-110"
          title="End call"
        >
          <FaPhone size={20} className="rotate-135" />
        </button>
      </div>
    </div>
  );
};

export default AgoraVideoCall;

