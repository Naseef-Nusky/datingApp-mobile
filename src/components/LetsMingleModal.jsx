import { useState, useEffect } from 'react';
import { FaTimes, FaEdit } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useInsufficientCreditsHandler } from '../hooks/useInsufficientCreditsHandler';
import { useServiceAccess } from '../hooks/useServiceAccess';
import { useCreditsSync } from '../hooks/useCreditsSync';
import { CONTACT_INFO_WARNING, hasBlockedContactInfo } from '../utils/contactInfoBlock';
import AutoResizeTextarea from './AutoResizeTextarea';

const LetsMingleModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { syncCreditsAfterAction } = useCreditsSync();
  const { handleInsufficientCreditsError } = useInsufficientCreditsHandler();
  const { ensureCanSendMingle } = useServiceAccess();
  const [gender, setGender] = useState('female');
  const [ageMin, setAgeMin] = useState(20);
  const [ageMax, setAgeMax] = useState(35);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Fetch user profile preferences when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserPreferences();
    }
  }, [isOpen, user]);

  const fetchUserPreferences = async () => {
    try {
      const response = await axios.get('/api/profiles/me');
      const profile = response.data;
      
      if (profile?.preferences) {
        // Set gender preference
        const lookingFor = profile.preferences.lookingFor;
        if (lookingFor === 'male') {
          setGender('male');
        } else if (lookingFor === 'female') {
          setGender('female');
        } else if (lookingFor === 'both') {
          setGender('both');
        }
        
        // Set age range
        if (profile.preferences.ageRange) {
          if (profile.preferences.ageRange.min) {
            setAgeMin(profile.preferences.ageRange.min);
          }
          if (profile.preferences.ageRange.max) {
            setAgeMax(profile.preferences.ageRange.max);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      // Keep default values if fetch fails
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (hasBlockedContactInfo(message.trim())) {
      setError(CONTACT_INFO_WARNING);
      return;
    }

    if (!(await ensureCanSendMingle())) return;

    setSending(true);
    setError('');

    try {
      console.log('Sending mingle request:', { gender, ageMin, ageMax, message: message.trim() });
      
      const response = await axios.post('/api/messages/mingle', {
        gender,
        ageMin,
        ageMax,
        message: message.trim(),
      });

      console.log('Mingle response:', response.data);

      if (response.data && response.data.success) {
        console.log('Mingle successful, matched profiles:', response.data.matchedProfiles);
        await syncCreditsAfterAction(response.data);
        onSuccess(response.data.matchedProfiles || []);
        // Reset form
        setMessage('');
        setError('');
      } else {
        const errorMsg = response.data?.message || 'Failed to send mingle requests';
        console.error('Mingle failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Mingle error:', error);
      console.error('Error response:', error.response?.data);
      const data = error.response?.data;
      const errorMsg = data?.message || error.message || 'Failed to send mingle requests';
      if (handleInsufficientCreditsError(error)) {
        setError('');
      } else {
        setError(errorMsg);
      }
    } finally {
      // Always reset sending state so button doesn't get stuck
      setSending(false);
    }
  };

  // When modal is reopened, make sure state is clean
  useEffect(() => {
    if (isOpen) {
      setSending(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="relative p-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2 z-10"
          >
            <FaTimes />
          </button>
          
          {/* Profile Pictures Cluster - Using lets_mingle.png */}
          <div className="relative w-full flex items-center justify-center mb-6" style={{ height: '300px' }}>
            <img
              src="/lets_mingle.png"
              alt="Let's Mingle"
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Failed to load lets_mingle.png');
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 flex-1 flex flex-col min-h-0">
          {/* Preferences Section */}
          <div className="flex-shrink-0">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              I'm looking for a mingle with
            </h3>
            
            {/* Display selected preferences in readable format */}
            <div className="mb-4 flex items-center space-x-2">
              <span className="text-gray-700 text-sm">
                {gender === 'female' ? 'Women' : gender === 'male' ? 'Men' : 'Men or Women'}, {ageMin} - {ageMax} years old
              </span>
              <button
                type="button"
                onClick={() => {
                  // Toggle edit mode
                  const editMode = document.getElementById('preferences-edit-mode');
                  if (editMode) {
                    editMode.style.display = editMode.style.display === 'none' ? 'block' : 'none';
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaEdit className="text-xs" />
              </button>
            </div>

            {/* Editable preferences (hidden by default, shown when edit button clicked) */}
            <div id="preferences-edit-mode" className="space-y-3 mb-4" style={{ display: 'none' }}>
              {/* Gender Selection */}
              <div className="flex items-center space-x-3">
                <label className="text-gray-700 font-medium text-sm whitespace-nowrap">Gender:</label>
                <select
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value);
                    // Hide edit mode after selection
                    const editMode = document.getElementById('preferences-edit-mode');
                    if (editMode) {
                      editMode.style.display = 'none';
                    }
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                >
                  <option value="female">Women</option>
                  <option value="male">Men</option>
                  <option value="both">Men or Women</option>
                </select>
              </div>

              {/* Age Range */}
              <div className="flex items-center space-x-3">
                <label className="text-gray-700 font-medium text-sm whitespace-nowrap">Age Range:</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={ageMin}
                    onChange={(e) => {
                      setAgeMin(parseInt(e.target.value));
                      // Hide edit mode after selection
                      const editMode = document.getElementById('preferences-edit-mode');
                      if (editMode) {
                        editMode.style.display = 'none';
                      }
                    }}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  >
                    {Array.from({ length: 50 }, (_, i) => i + 18).map(age => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 text-sm">-</span>
                  <select
                    value={ageMax}
                    onChange={(e) => {
                      setAgeMax(parseInt(e.target.value));
                      // Hide edit mode after selection
                      const editMode = document.getElementById('preferences-edit-mode');
                      if (editMode) {
                        editMode.style.display = 'none';
                      }
                    }}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  >
                    {Array.from({ length: 50 }, (_, i) => i + 18).map(age => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 text-xs">years old</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="flex-1 min-h-0 flex flex-col">
            <AutoResizeTextarea
              minRows={3}
              maxRows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Example message: Hey there! Ready to find someone who's as serious about love as they are about having fun together!"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base sm:text-sm"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 px-6 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
          >
            {sending ? 'Sending...' : "LET'S MINGLE"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LetsMingleModal;
