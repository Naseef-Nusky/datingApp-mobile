import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCamera, FaVideo, FaUpload, FaSpinner, FaStop } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AddStoryModal = ({ isOpen, onClose, onStoryAdded }) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(true);
  const [uploadMode, setUploadMode] = useState(null); // 'file', 'webcam-photo', 'webcam-video', or null
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fileInputRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const [mediaType, setMediaType] = useState(null); // 'photo' or 'video'

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please select an image or video file');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    setMediaType(file.type.startsWith('image/') ? 'photo' : 'video');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      // For videos, create a video element preview
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        video.currentTime = 0.1; // Seek to a frame
      };
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPreview(canvas.toDataURL());
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('media', selectedFile);

      const response = await axios.post('/api/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        // Reset form
        setSelectedFile(null);
        setPreview(null);
        setMediaType(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Notify parent component
        if (onStoryAdded) {
          onStoryAdded(response.data);
        }
        
        // Close modal
        onClose();
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      setError(error.response?.data?.message || error.message || 'Failed to upload story');
    } finally {
      setUploading(false);
    }
  };

  // Start webcam when webcam mode is selected
  useEffect(() => {
    if (isOpen && (uploadMode === 'webcam-photo' || uploadMode === 'webcam-video')) {
      startWebcam();
    } else {
      stopWebcam();
    }
    
    return () => {
      stopWebcam();
    };
  }, [isOpen, uploadMode]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreview(null);
      setMediaType(null);
      setError('');
      setShowOptions(true);
      setUploadMode(null);
      setIsRecording(false);
      setRecordingTime(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      stopWebcam();
      stopRecording();
    }
  }, [isOpen]);

  const startWebcam = async () => {
    try {
      setError('');
      const constraints = uploadMode === 'webcam-video' 
        ? { video: { facingMode: 'user' }, audio: true }
        : { video: { facingMode: 'user' }, audio: false };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        webcamVideoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setError('Failed to access camera. Please allow camera access.');
      setUploadMode(null);
      setShowOptions(true);
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
  };

  const capturePhoto = () => {
    if (!webcamVideoRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = webcamVideoRef.current.videoWidth;
      canvas.height = webcamVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(webcamVideoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `story-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedFile(file);
          setMediaType('photo');
          setPreview(URL.createObjectURL(blob));
          setUploadMode('file');
          stopWebcam();
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('Failed to capture photo');
    }
  };

  const startRecording = () => {
    if (!webcamStreamRef.current) return;
    
    try {
      const mediaRecorder = new MediaRecorder(webcamStreamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `story-video-${Date.now()}.webm`, { type: 'video/webm' });
        setSelectedFile(file);
        setMediaType('video');
        setPreview(URL.createObjectURL(blob));
        setUploadMode('file');
        stopWebcam();
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setPreview(null);
      setMediaType(null);
      setError('');
      setShowOptions(true);
      setUploadMode(null);
      setIsRecording(false);
      setRecordingTime(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      stopWebcam();
      stopRecording();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2 z-10 disabled:opacity-50"
          >
            <FaTimes />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 text-center">Add Story</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Options Selection */}
          {showOptions && !selectedFile && (
            <div className="mb-4 space-y-3">
              <button
                onClick={() => {
                  setShowOptions(false);
                  setUploadMode('file');
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaUpload />
                <span>Choose from Device</span>
              </button>
              
              <button
                onClick={() => {
                  setShowOptions(false);
                  setUploadMode('webcam-photo');
                }}
                disabled={uploading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaCamera />
                <span>Take Photo</span>
              </button>
              
              <button
                onClick={() => {
                  setShowOptions(false);
                  setUploadMode('webcam-video');
                }}
                disabled={uploading}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaVideo />
                <span>Record Video</span>
              </button>
            </div>
          )}

          {/* Webcam View */}
          {uploadMode === 'webcam-photo' && !selectedFile && (
            <div className="mb-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-center space-x-4 mt-4">
                <button
                  onClick={() => {
                    setShowOptions(true);
                    setUploadMode(null);
                    stopWebcam();
                  }}
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
          )}

          {/* Video Recording View */}
          {uploadMode === 'webcam-video' && !selectedFile && (
            <div className="mb-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="font-semibold">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center space-x-4 mt-4">
                <button
                  onClick={() => {
                    stopRecording();
                    setShowOptions(true);
                    setUploadMode(null);
                    stopWebcam();
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                  >
                    <FaVideo />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                  >
                    <FaStop />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Preview Area */}
          {preview && selectedFile && (
            <div className="mb-4">
              {mediaType === 'photo' ? (
                <img
                  src={preview}
                  alt="Story preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="relative w-full h-64 bg-black rounded-lg flex items-center justify-center">
                  <video
                    src={preview}
                    className="max-w-full max-h-full"
                    controls
                  />
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setMediaType(null);
                  setShowOptions(true);
                  setUploadMode(null);
                }}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Change
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FaCamera />
                <span>Add Story</span>
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Your story will be visible for 24 hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddStoryModal;
