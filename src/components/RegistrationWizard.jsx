import { useState, useEffect } from 'react';
import PasswordInput from './PasswordInput';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import RegistrationSuccessModal from './RegistrationSuccessModal';
import ImageCropEditor from './ImageCropEditor';
import {
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_HINT,
  isAllowedProfileImageFile,
  prepareProfileImageForUpload,
} from '../utils/profileImage';

const REQUIRED_GALLERY_PHOTOS = 2;
const PHOTO_SLOT_COUNT = 1 + REQUIRED_GALLERY_PHOTOS; // profile + 2 gallery

const RegistrationWizard = ({ completeProfileOnly = false, initialProfile = null, onComplete }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(completeProfileOnly ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [photoCropSource, setPhotoCropSource] = useState(null);
  const [photoCropTarget, setPhotoCropTarget] = useState(null);
  const [existingPhotos, setExistingPhotos] = useState({ profile: null, gallery: [] });

  const [formData, setFormData] = useState({
    // Step 0: Account credentials
    email: '',
    password: '',
    // Step 1: About you
    firstName: '',
    gender: '',
    seeking: '',
    birthday: {
      month: '',
      day: '',
      year: '',
    },
    hometown: '',
    // Step 2: About you details
    bio: '',
    // Step 3: Ideal partner
    idealPartner: '',
    // Step 4: Interests
    interests: [],
    // Step 5: [profile, gallery1, gallery2] — new uploads only (existing server photos tracked separately)
    photos: Array(PHOTO_SLOT_COUNT).fill(null),
  });

  const interests = [
    'Lying on the beach',
    'Camping',
    'Dancing',
    'Fishing & Hunting',
    'Hockey',
    'Music & Concerts',
    'Sailing',
    'Travelling',
    'Biking',
    'Cars',
    'Diving',
    'Games',
    'Movies',
    'Nature',
    'Shopping',
    'Watching TV',
    'Reading books',
    'Cooking',
    'Fashion',
    'Hobbies & Crafts',
    'Museums & Art',
    'Party & Night Clubs',
    'Sports',
    'Meditation & Yoga',
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Prefill form when completing profile (magic-link signup)
  useEffect(() => {
    if (!completeProfileOnly || !initialProfile) return;
    const loc = initialProfile.location || {};
    const city = loc.city || '';
    const country = loc.country || '';
    const hometown = city && country ? `${city}, ${country}` : (city || country || '');
    const age = initialProfile.age || 18;
    const prefs = initialProfile.preferences || {};
    setFormData(prev => ({
      ...prev,
      // Do NOT prefill nickname or birthday on the About step – user should choose these.
      firstName: prev.firstName || '',
      lastName: initialProfile.lastName != null ? initialProfile.lastName : prev.lastName,
      gender: initialProfile.gender || prev.gender,
      seeking: prefs.lookingFor || prev.seeking,
      // Leave birthday empty so month/day/year are not pre-selected
      birthday: {
        month: prev.birthday.month || '',
        day: prev.birthday.day || '',
        year: prev.birthday.year || '',
      },
      hometown: hometown || prev.hometown,
      bio: initialProfile.bio != null ? initialProfile.bio : prev.bio,
      idealPartner: (prefs.description != null ? prefs.description : prev.idealPartner) || '',
      interests: Array.isArray(initialProfile.interests) ? initialProfile.interests : prev.interests,
    }));

    const serverPhotos = Array.isArray(initialProfile.photos) ? initialProfile.photos : [];
    const toUrl = (p) => (typeof p === 'string' ? p : p?.url || null);
    const profileUrl = serverPhotos.length > 0 ? toUrl(serverPhotos[0]) : null;
    const galleryUrls = serverPhotos.slice(1).map(toUrl).filter(Boolean);
    setExistingPhotos({ profile: profileUrl, gallery: galleryUrls });
  }, [completeProfileOnly, initialProfile]);

  // Auto-detect city/country for hometown when step 1 is shown
  useEffect(() => {
    if (currentStep !== 1) return;
    const base = import.meta.env.VITE_API_URL || '';
    const url = base ? `${base}/api/auth/location` : '/api/auth/location';
    axios.get(url)
      .then((res) => {
        const { city, country } = res.data || {};
        if (city && country && String(city).trim() && String(country).trim()) {
          const c = String(city).trim();
          const co = String(country).trim();
          if (c !== 'Unknown' && co !== 'Unknown') {
            setFormData((prev) => ({
              ...prev,
              hometown: prev.hometown || `${c}, ${co}`,
            }));
          }
        }
      })
      .catch(() => {});
  }, [currentStep]);

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const registrationPhotosComplete = () => {
    const newProfile = formData.photos?.[0];
    const newGallery = (formData.photos || []).slice(1).filter(Boolean);
    const hasProfile = Boolean(existingPhotos.profile) || Boolean(newProfile);
    const galleryCount = existingPhotos.gallery.length + newGallery.length;
    return hasProfile && galleryCount >= REQUIRED_GALLERY_PHOTOS;
  };

  const uploadRegistrationPhotos = async (photos) => {
    const profileFile = photos?.[0];
    const galleryFiles = (photos || []).slice(1).filter(Boolean);

    if (profileFile) {
      const profileFormData = new FormData();
      profileFormData.append('photo', profileFile);
      await axios.post('/api/profiles/me/photos', profileFormData);
    }

    for (const file of galleryFiles) {
      const galleryFormData = new FormData();
      galleryFormData.append('photo', file);
      await axios.post('/api/profiles/me/photos/add', galleryFormData);
    }
  };

  const handlePhotoChange = async (e, photoIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedProfileImageFile(file)) {
      alert(`Please select a supported image (${PROFILE_IMAGE_HINT})`);
      return;
    }
    try {
      const ready = await prepareProfileImageForUpload(file);
      setPhotoCropTarget(photoIndex);
      setPhotoCropSource((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(ready);
      });
    } catch (err) {
      console.error('Photo prepare error:', err);
      alert('Could not open this photo. Try JPG or PNG, or take a new photo.');
    }
    e.target.value = '';
  };

  const handlePhotoCropConfirm = (file) => {
    const targetIndex = photoCropTarget;
    setPhotoCropSource((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoCropTarget(null);
    if (targetIndex === null || targetIndex === undefined) return;
    setFormData((prev) => {
      const photos = [...(prev.photos || Array(PHOTO_SLOT_COUNT).fill(null))];
      photos[targetIndex] = file;
      return { ...prev, photos };
    });
    if (targetIndex === 0) {
      setExistingPhotos((prev) => ({ ...prev, profile: null }));
    }
  };

  const handlePhotoCropCancel = () => {
    setPhotoCropSource((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoCropTarget(null);
  };

  const removeRegistrationPhoto = (photoIndex) => {
    setFormData((prev) => {
      const photos = [...(prev.photos || Array(PHOTO_SLOT_COUNT).fill(null))];
      photos[photoIndex] = null;
      return { ...prev, photos };
    });
  };

  const calculateAge = () => {
    if (formData.birthday.year && formData.birthday.month && formData.birthday.day) {
      const birthDate = new Date(
        parseInt(formData.birthday.year),
        parseInt(formData.birthday.month) - 1,
        parseInt(formData.birthday.day)
      );
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return null;
  };

  const buildBirthDateIso = () => {
    const { year, month, day } = formData.birthday;
    if (!year || !month || !day) return null;

    const yearPart = String(year).padStart(4, '0');
    const monthPart = String(month).padStart(2, '0');
    const dayPart = String(day).padStart(2, '0');
    return `${yearPart}-${monthPart}-${dayPart}`;
  };

  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) {
      return false; // Invalid email format, let validation handle it
    }
    
    try {
      setCheckingEmail(true);
      setEmailError('');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/auth/check-email`, { email });
      return response.data.exists;
    } catch (error) {
      console.error('Email check error:', error);
      // If there's an error, don't block the user - let backend handle it during registration
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateStep = async (step) => {
    switch (step) {
      case 0:
        if (!formData.email || !formData.password) {
          setError('Please enter email and password');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        
        // Check if email already exists
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists) {
          setEmailError('This email address is already registered. Please use a different email or log in.');
          return false;
        }
        
        return true;
      case 1:
        if (!formData.firstName || !formData.gender || !formData.seeking) {
          setError('Please fill in all required fields');
          return false;
        }
        if (!formData.birthday.month || !formData.birthday.day || !formData.birthday.year) {
          setError('Please select your birthday');
          return false;
        }
        const age = calculateAge();
        if (age < 18) {
          setError('You must be 18 or older to register');
          return false;
        }
        return true;
      case 2:
        // Bio is optional
        return true;
      case 3:
        // Ideal partner is optional
        return true;
      case 4:
        // Interests are optional
        return true;
      case 5:
        if (!registrationPhotosComplete()) {
          setError('Please add your profile photo and 2 gallery photos to continue');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    setError('');
    setEmailError('');
    const isValid = await validateStep(currentStep);
    if (isValid) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    if (completeProfileOnly && currentStep === 1) return;
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const age = calculateAge();
      const birthDateIso = buildBirthDateIso();
      const apiUrl = import.meta.env.VITE_API_URL || '';

      if (completeProfileOnly) {
        const profilePayload = {
          firstName: formData.firstName,
          lastName: formData.lastName || '',
          age: age,
          gender: formData.gender,
          bio: formData.bio || null,
          preferences: {
            lookingFor: formData.seeking,
            description: formData.idealPartner || '',
          },
          interests: formData.interests,
          lifestyle: birthDateIso ? { birthDate: birthDateIso } : {},
          location: {
            city: formData.hometown.split(',')[0]?.trim() || '',
            country: formData.hometown.split(',')[1]?.trim() || '',
          },
        };
        await axios.put('/api/profiles/me', profilePayload);
        if (registrationPhotosComplete()) {
          await uploadRegistrationPhotos(formData.photos);
        }
        await axios.put('/api/auth/me/registration-complete');
        if (onComplete) onComplete();
        return;
      }

      // Only send profile data; backend always creates real users (userType: regular, isAdminCreated: false)
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName || '',
        age: age,
        gender: formData.gender,
        bio: formData.bio,
        preferences: {
          lookingFor: formData.seeking,
          description: formData.idealPartner,
        },
        interests: formData.interests,
        lifestyle: birthDateIso ? { birthDate: birthDateIso } : {},
        location: {
          city: formData.hometown.split(',')[0] || formData.hometown,
          country: formData.hometown.split(',')[1]?.trim() || '',
        },
      };

      const result = await register(registrationData);

      if (result.success) {
        if (registrationPhotosComplete()) {
          try {
            await uploadRegistrationPhotos(formData.photos);
          } catch (photoError) {
            console.error('Photo upload error:', photoError);
            setError('Account created but some photos failed to upload. Add them from your profile.');
          }
        }
        setRegisteredUser({
          firstName: formData.firstName,
          email: formData.email,
        });
        setShowSuccessModal(true);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || (completeProfileOnly ? 'Failed to save profile' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    try {
      // Call API to resend verification email
      await axios.post('/api/auth/resend-verification', {
        email: formData.email,
      });
      return true;
    } catch (error) {
      console.error('Resend email error:', error);
      throw error;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>
            
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  handleChange('email', e.target.value);
                  setEmailError(''); // Clear error when user types
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                required
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
              {checkingEmail && (
                <p className="mt-2 text-sm text-gray-500">Checking email availability...</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Password (min 6 characters)</label>
              <PasswordInput
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                inputClassName="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Create a password"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">About you</h2>
            
            <div>
              <label className="block text-gray-700 mb-2">Name or nickname:</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">I am a:</label>
                <div className="flex space-x-6">
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'male')}
                    className={`flex flex-col items-center justify-center transition ${
                      formData.gender === 'male'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-1 overflow-hidden ${
                        formData.gender === 'male'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <img src="/male_icon.png" alt="Man" className="w-16 h-16 object-cover" />
                    </div>
                    <span className="text-sm font-medium">Man</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'female')}
                    className={`flex flex-col items-center justify-center transition ${
                      formData.gender === 'female'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-1 overflow-hidden ${
                        formData.gender === 'female'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <img src="/female_icon.png" alt="Woman" className="w-16 h-16 object-cover" />
                    </div>
                    <span className="text-sm font-medium">Woman</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Seeking a:</label>
                <div className="flex space-x-6">
                  <button
                    type="button"
                    onClick={() => handleChange('seeking', 'male')}
                    className={`flex flex-col items-center justify-center transition ${
                      formData.seeking === 'male'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-1 overflow-hidden ${
                        formData.seeking === 'male'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <img src="/male_icon.png" alt="Man" className="w-16 h-16 object-cover" />
                    </div>
                    <span className="text-sm font-medium">Man</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('seeking', 'female')}
                    className={`flex flex-col items-center justify-center transition ${
                      formData.seeking === 'female'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-1 overflow-hidden ${
                        formData.seeking === 'female'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <img src="/female_icon.png" alt="Woman" className="w-16 h-16 object-cover" />
                    </div>
                    <span className="text-sm font-medium">Woman</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Birthday:</label>
              <div className="grid grid-cols-3 gap-4">
                <select
                  value={formData.birthday.month}
                  onChange={(e) => handleChange('birthday.month', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Month</option>
                  {months.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
                <select
                  value={formData.birthday.day}
                  onChange={(e) => handleChange('birthday.day', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Day</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <select
                  value={formData.birthday.year}
                  onChange={(e) => handleChange('birthday.year', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Hometown:</label>
              <input
                type="text"
                value={formData.hometown}
                onChange={(e) => handleChange('hometown', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="City, Country"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">Some interesting details about you</h2>
            
            <div className="text-sm text-gray-600 italic mb-4">
              <p className="mb-2">E.G.:</p>
              <p>
                Hello, I'm looking for a companion. Someone with a big personality but able to give me plenty of attention too. 
                Please message me if you've got a good appetite, interesting conversation and the ability to laugh at yourself.
              </p>
            </div>

            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="w-full h-48 px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Some interesting details about me..."
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">About your ideal partner</h2>
            
            <textarea
              value={formData.idealPartner}
              onChange={(e) => handleChange('idealPartner', e.target.value)}
              className="w-full h-48 px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Few words about your ideal partner"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">Your interests</h2>
            
            <div className="grid grid-cols-3 gap-2">
              {interests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-2 py-2 text-xs sm:text-sm rounded-lg border transition ${
                    formData.interests.includes(interest)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        );

      case 5: {
        const renderPhotoSlot = (slotIndex, label, previewUrl, isExisting = false) => {
          const photo = formData.photos?.[slotIndex];
          const uploadId = `photo-upload-${slotIndex}`;
          const replaceId = `photo-upload-replace-${slotIndex}`;
          const displaySrc = photo ? URL.createObjectURL(photo) : previewUrl;

          return (
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
              <div className="w-full max-w-[220px] aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center relative">
                {displaySrc ? (
                  <img
                    src={displaySrc}
                    alt={label}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center flex flex-col items-center px-3">
                    <img
                      src="/profile.png"
                      alt="Photo placeholder"
                      className="w-20 h-20 object-cover rounded-full mb-3 opacity-70"
                    />
                    <input
                      type="file"
                      accept={PROFILE_IMAGE_ACCEPT}
                      onChange={(e) => handlePhotoChange(e, slotIndex)}
                      className="hidden"
                      id={uploadId}
                    />
                    <label
                      htmlFor={uploadId}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition text-xs sm:text-sm text-center"
                    >
                      UPLOAD PHOTO
                    </label>
                  </div>
                )}
                {isExisting && !photo && (
                  <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                    ADDED
                  </span>
                )}
                {photo && (
                  <button
                    type="button"
                    onClick={() => removeRegistrationPhoto(slotIndex)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    aria-label={`Remove ${label}`}
                  >
                    ×
                  </button>
                )}
                {(photo || (isExisting && displaySrc)) && (
                  <label
                    htmlFor={replaceId}
                    className="absolute bottom-2 left-2 right-2 bg-gray-800 bg-opacity-90 text-white text-xs py-2 text-center rounded cursor-pointer hover:bg-opacity-100"
                  >
                    CHANGE PHOTO
                    <input
                      type="file"
                      accept={PROFILE_IMAGE_ACCEPT}
                      onChange={(e) => handlePhotoChange(e, slotIndex)}
                      className="hidden"
                      id={replaceId}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-2">Add your photos</h2>
            <p className="text-center text-sm text-gray-600 mb-6">
              1 profile photo{existingPhotos.profile ? ' (already on your profile)' : ''} and 2 gallery photos required.
            </p>
            {photoCropSource ? (
              <ImageCropEditor
                imageSrc={photoCropSource}
                aspect={1}
                onConfirm={handlePhotoCropConfirm}
                onCancel={handlePhotoCropCancel}
              />
            ) : (
              <div className="space-y-8">
                <div className="flex justify-center">
                  {renderPhotoSlot(
                    0,
                    'Profile photo',
                    existingPhotos.profile,
                    Boolean(existingPhotos.profile)
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Array.from({ length: REQUIRED_GALLERY_PHOTOS }, (_, galleryIndex) => {
                    const slotIndex = galleryIndex + 1;
                    const existingUrl = existingPhotos.gallery[galleryIndex] || null;
                    return (
                      <div key={slotIndex}>
                        {renderPhotoSlot(
                          slotIndex,
                          `Gallery photo ${galleryIndex + 1}`,
                          existingUrl,
                          Boolean(existingUrl)
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!photoCropSource && (
              <p className="text-xs text-gray-500 text-center">Supported: {PROFILE_IMAGE_HINT}</p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      {showSuccessModal && (
        <RegistrationSuccessModal
          user={registeredUser}
          email={formData.email}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/dashboard');
          }}
          onResendEmail={handleResendVerificationEmail}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-b from-blue-200 via-blue-100 to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cloud background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-20 bg-white opacity-30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-40 h-25 bg-white opacity-30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-22 bg-white opacity-30 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {renderStep()}

            <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || (completeProfileOnly && currentStep === 1)}
              className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleNext}
                className={`px-12 py-3 rounded-lg font-semibold text-white transition bg-gradient-nex hover:opacity-90 shadow-md ${
                  loading || checkingEmail || (currentStep === 5 && !registrationPhotosComplete())
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                disabled={loading || checkingEmail || (currentStep === 5 && !registrationPhotosComplete())}
              >
                {loading
                  ? (completeProfileOnly ? 'Saving...' : 'Registering...')
                  : checkingEmail
                    ? 'Checking...'
                    : 'NEXT'}
              </button>

              <div className="flex space-x-2 mt-4">
                {(completeProfileOnly ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5]).map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      step === currentStep ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {currentStep > 0 && currentStep < 5 && !completeProfileOnly && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-blue-600 hover:text-blue-800"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default RegistrationWizard;

