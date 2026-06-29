import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * Identity verification entry UI. Verification is completed by staff in the CRM;
 * this modal explains requirements and lets members attach a reference photo for their request.
 */
export default function VerifyIdentityModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const alreadyVerified = Boolean(user?.isVerified);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const loadProfilePhoto = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/profiles/me');
      const photos = data?.photos;
      const first = Array.isArray(photos) ? photos[0] : null;
      const url = typeof first === 'string' ? first : first?.url || null;
      setProfilePhotoUrl(url);
    } catch {
      setProfilePhotoUrl(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    loadProfilePhoto();
  }, [isOpen, loadProfilePhoto]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  if (!isOpen) return null;

  const displayPhoto = previewUrl || profilePhotoUrl;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      alert('Please upload a clear photo for verification (selfie or ID per instructions).');
      return;
    }
    setSubmitted(true);
  };

  const modal = (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-identity-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[calc(90*var(--vh))] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-5 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
          <h2 id="verify-identity-title" className="text-xl font-bold text-gray-900 pr-10">
            Verify your identity
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Get the verified badge after our team confirms your details. Upload a photo that meets the criteria below.
          </p>
        </div>

        <div className="overflow-y-auto px-5 py-4 text-gray-800 text-sm">
          {alreadyVerified ? (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-blue-900">
              <p className="font-semibold mb-2">You&apos;re verified</p>
              <p className="text-sm leading-relaxed">
                Your account already has an active verified badge. Remember to renew when your team notifies you before it expires (valid for six months after approval).
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          ) : submitted ? (
            <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 text-teal-900">
              <p className="font-semibold mb-2">Thanks — request received</p>
              <p className="text-sm leading-relaxed">
                Hang tight while our team reviews your submission. For questions, email{' '}
                <a href="mailto:support@vantagedating.com" className="font-semibold text-teal-800 underline">
                  support@vantagedating.com
                </a>
                .
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-gray-700">
                Please start verification by selecting a photo that meets the criteria below.
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-4 text-gray-700">
                <li>Your face must be clearly visible</li>
                <li>No hats, sunglasses, or heavy filters</li>
                <li>Good lighting, plain background preferred</li>
                <li>Match the appearance on your profile</li>
              </ul>

              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                The selected photo
              </p>
              <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center min-h-[160px] mb-2 overflow-hidden">
                {displayPhoto ? (
                  <img
                    src={displayPhoto}
                    alt="Photo for verification"
                    className="max-h-56 w-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-sm p-6 text-center">
                    Upload a verification photo — your profile photo will appear here once you add one.
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                The selected photo cannot be deleted or hidden after verification is complete.
              </p>

              <label className="block">
                <span className="sr-only">Upload verification photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                />
              </label>

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Submit for review
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Badge approval is handled by our team after review. Automated checks may be added in the future.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
