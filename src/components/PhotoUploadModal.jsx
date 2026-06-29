import { useState, useRef, useEffect } from 'react';
import { FaCamera, FaTimes, FaLock, FaUnlock } from 'react-icons/fa';
import ImageCropEditor from './ImageCropEditor';
import {
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_HINT,
  isAllowedProfileImageFile,
  prepareProfileImageForUpload,
} from '../utils/profileImage';

const PhotoUploadModal = ({ isOpen, onClose, onUpload, isMainPhoto = false, uploading = false, buttonPosition = null }) => {
  const [showOptions, setShowOptions] = useState(true); // Show dropdown options first
  const [uploadMode, setUploadMode] = useState(null); // 'file' or 'webcam' or null
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cropSource, setCropSource] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [webcamError, setWebcamError] = useState(null);
  
  const fileInputRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const modalRef = useRef(null);

  const revokeCropSource = () => {
    setCropSource((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const clearPreview = () => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const resetToOptions = () => {
    setShowOptions(true);
    setUploadMode(null);
    setSelectedFile(null);
    clearPreview();
    revokeCropSource();
    stopWebcam();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropConfirm = (file) => {
    revokeCropSource();
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setUploadMode('file');
  };

  // Start webcam when webcam mode is selected
  useEffect(() => {
    if (isOpen && uploadMode === 'webcam') {
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
      clearPreview();
      revokeCropSource();
      setUploadMode(null);
      setShowOptions(true);
      setIsPublic(true);
      setWebcamError(null);
      stopWebcam();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && isOpen && showOptions) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showOptions, onClose]);

  const startWebcam = async () => {
    try {
      setWebcamError(null);
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
      setWebcamError('Failed to access webcam. Please allow camera access.');
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
          stopWebcam();
          revokeCropSource();
          setCropSource(URL.createObjectURL(blob));
          setUploadMode('file');
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isAllowedProfileImageFile(file)) {
      alert(`Please select a supported image (${PROFILE_IMAGE_HINT})`);
      return;
    }

    try {
      const ready = await prepareProfileImageForUpload(file);
      revokeCropSource();
      setCropSource(URL.createObjectURL(ready));
      setShowOptions(false);
      setUploadMode('file');
    } catch (err) {
      console.error('Photo prepare error:', err);
      alert('Could not open this photo. Try JPG or PNG, or take a new photo.');
    }
  };

  const handleChooseFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handleTakeViaWebcam = () => {
    setUploadMode('webcam');
    setShowOptions(false);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    onUpload(selectedFile, isPublic);
  };

  if (!isOpen) return null;

  // If showing options dropdown (initial state)
  if (showOptions && !selectedFile && uploadMode !== 'webcam') {
    // Calculate dropdown position
    const getDropdownStyle = () => {
      if (!buttonPosition) {
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000
        };
      }

      const dropdownWidth = 256; // w-64 = 256px
      const spacing = 8;
      const dropdownHeight = 120; // Approximate height for 2 options
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate position - show below button
      let top = (buttonPosition.bottom || buttonPosition.top + buttonPosition.height) + spacing;
      let left = buttonPosition.left;
      
      // Adjust if dropdown would go off right edge
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      
      // Adjust if dropdown would go off left edge
      if (left < 16) {
        left = 16;
      }
      
      // Adjust if dropdown would go off bottom edge (show above button instead)
      if (top + dropdownHeight > viewportHeight - 16) {
        top = buttonPosition.top - dropdownHeight - spacing;
        // If still off screen, center vertically
        if (top < 16) {
          top = Math.max(16, (viewportHeight - dropdownHeight) / 2);
        }
      }
      
      return {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 10000
      };
    };

    return (
      <>
        {/* Backdrop - invisible overlay to catch clicks outside */}
        <div 
          className="fixed inset-0 z-[9999]" 
          onClick={onClose}
          style={{ backgroundColor: 'transparent' }}
        />
        {/* Dropdown */}
        <div 
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-64"
          style={getDropdownStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Option 1: Choose Photo from Device */}
          <button
            onClick={handleChooseFromDevice}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-200 first:rounded-t-lg"
            disabled={uploading}
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-gray-800 font-medium text-sm">CHOOSE PHOTO FROM DEVICE</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={PROFILE_IMAGE_ACCEPT}
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </button>

          {/* Option 2: Take via Webcam */}
          <button
            onClick={handleTakeViaWebcam}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition text-left last:rounded-b-lg"
            disabled={uploading}
          >
            <div className="flex-shrink-0">
              <FaCamera className="text-gray-600 text-xl" />
            </div>
            <span className="text-gray-800 font-medium text-sm">TAKE VIA WEBCAM</span>
          </button>
        </div>
      </>
    );
  }

  // Full modal for webcam, crop, or preview
  const modalTitle = cropSource && !preview
    ? 'Adjust your photo'
    : uploadMode === 'webcam' && !cropSource
      ? 'Take Photo'
      : 'Preview Photo';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(90*var(--vh))] overflow-y-auto" ref={modalRef}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{modalTitle}</h2>
          <button
            onClick={resetToOptions}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Webcam Mode */}
          {uploadMode === 'webcam' && !cropSource && !preview && (
            <div className="mb-6">
              {webcamError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <p>{webcamError}</p>
                  <button
                    onClick={startWebcam}
                    className="mt-2 text-sm underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto max-h-96"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button
                      onClick={capturePhoto}
                      className="bg-white rounded-full p-4 hover:bg-gray-100 transition shadow-lg"
                    >
                      <FaCamera size={24} className="text-gray-800" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Crop / reposition step */}
          {cropSource && !preview && (
            <ImageCropEditor
              imageSrc={cropSource}
              aspect={1}
              onConfirm={handleCropConfirm}
              onCancel={resetToOptions}
            />
          )}

          {/* Preview */}
          {preview && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={resetToOptions}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                  disabled={uploading}
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Privacy Toggle */}
          {preview && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Photo Privacy:</p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 p-4 border-2 rounded-lg transition ${
                    isPublic
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={uploading}
                >
                  <FaUnlock className="mx-auto mb-2 text-2xl text-gray-600" />
                  <p className="font-medium">Public</p>
                  <p className="text-xs text-gray-500 mt-1">Visible to everyone</p>
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 p-4 border-2 rounded-lg transition ${
                    !isPublic
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={uploading}
                >
                  <FaLock className="mx-auto mb-2 text-2xl text-gray-600" />
                  <p className="font-medium">Private</p>
                  <p className="text-xs text-gray-500 mt-1">Only visible to you</p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
            <button
              onClick={resetToOptions}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoUploadModal;

