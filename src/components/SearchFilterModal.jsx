import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const SearchFilterModal = ({ isOpen, onClose, onApplyFilters }) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('interests');
  const [filters, setFilters] = useState({
    gender: 'woman',
    lookingFor: 'man',
    ageMin: 20,
    ageMax: 35,
    location: '',
    availableForVideoChat: false,
    compatibleZodiacOnly: false,
    zodiacSigns: [],
    interests: [],
    education: '',
    languages: [],
    relationship: '',
    kids: '',
    smoke: '',
    drink: '',
    heightMin: '',
    heightMax: '',
    bodyType: '',
    eyes: '',
    hair: '',
  });

  const zodiacSigns = [
    { id: 'aries', name: 'Aries', symbol: '♈' },
    { id: 'taurus', name: 'Taurus', symbol: '♉' },
    { id: 'gemini', name: 'Gemini', symbol: '♊' },
    { id: 'cancer', name: 'Cancer', symbol: '♋' },
    { id: 'leo', name: 'Leo', symbol: '♌' },
    { id: 'virgo', name: 'Virgo', symbol: '♍' },
    { id: 'libra', name: 'Libra', symbol: '♎' },
    { id: 'scorpio', name: 'Scorpio', symbol: '♏' },
    { id: 'sagittarius', name: 'Sagittarius', symbol: '♐' },
    { id: 'capricorn', name: 'Capricorn', symbol: '♑' },
    { id: 'aquarius', name: 'Aquarius', symbol: '♒' },
    { id: 'pisces', name: 'Pisces', symbol: '♓' },
  ];

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

  const educationOptions = ['High School', 'Collage', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Doctorate'];
  const languageOptions = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Russian', 'Arabic'];
  const relationshipOptions = ['Single', 'Divorced', 'Widowed', 'Separated'];
  const kidsOptions = ['No kids', 'Have kids'];
  const smokeOptions = ['Yes', 'No', 'Sometimes'];
  const drinkOptions = ['Yes', 'No', 'Sometimes'];
  // Height options: match profile format 4'0" to 7'0"
  const heightOptions = Array.from({ length: 37 }, (_, i) => {
    const feet = Math.floor((i + 48) / 12);
    const inches = (i + 48) % 12;
    const cm = Math.round((feet * 30.48) + (inches * 2.54));
    return `${feet}'${inches}" (${cm}cm)`;
  });
  const bodyTypeOptions = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size'];
  const eyesOptions = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Other'];
  const hairOptions = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Other'];

  const handleChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleZodiacSign = (signId) => {
    setFilters(prev => ({
      ...prev,
      zodiacSigns: prev.zodiacSigns.includes(signId)
        ? prev.zodiacSigns.filter(id => id !== signId)
        : [...prev.zodiacSigns, signId],
    }));
  };

  const toggleInterest = (interest) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleLanguage = (language) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language],
    }));
  };

  const selectAllZodiac = () => {
    setFilters(prev => ({
      ...prev,
      zodiacSigns: zodiacSigns.map(sign => sign.id),
    }));
  };

  const setToDefault = () => {
    setFilters({
      gender: 'woman',
      lookingFor: 'man',
      ageMin: 20,
      ageMax: 35,
      location: '',
      availableForVideoChat: false,
      compatibleZodiacOnly: false,
      zodiacSigns: [],
      interests: [],
      education: '',
      languages: [],
      relationship: '',
      kids: '',
      smoke: '',
      drink: '',
      heightMin: '',
      heightMax: '',
      bodyType: '',
      eyes: '',
      hair: '',
    });
    setShowMoreOptions(false);
    setSelectedCategory('interests');
  };

  const handleShowMatches = () => {
    onApplyFilters(filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/40 sm:bg-transparent"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel — full-screen sheet on mobile, dropdown on desktop */}
      <div
        className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:left-auto sm:mt-2 z-[100] flex flex-col bg-white sm:rounded-lg shadow-2xl border border-gray-200 w-full sm:w-[500px] lg:w-[600px] max-h-none sm:max-h-[calc(100*var(--vh)-5rem)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800">Search for Your Matches</h2>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={setToDefault}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition underline"
            >
              Set to default
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 min-h-0 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {/* Gender Preference and Age Range - One Line on desktop, stacked on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Gender Preference */}
            <div className="flex-1">
              <label className="block text-gray-700 mb-2 font-medium text-sm">
                Looking for
              </label>
              <select
                value={filters.lookingFor}
                onChange={(e) => handleChange('lookingFor', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="man">Man Looking for a Woman</option>
                <option value="woman">Woman Looking for a Man</option>
                <option value="man-man">Man Looking for a Man</option>
                <option value="woman-woman">Woman Looking for a Woman</option>
                <option value="man-both">Man Looking for a Man or Woman</option>
                <option value="woman-both">Woman Looking for a Man or Woman</option>
              </select>
            </div>

            {/* Age Range */}
            <div className="flex-1">
              <label className="block text-gray-700 mb-2 font-medium text-sm">Ages</label>
              <div className="flex items-center space-x-2">
                <select
                  value={filters.ageMin}
                  onChange={(e) => handleChange('ageMin', parseInt(e.target.value))}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 50 }, (_, i) => i + 18).map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
                <span className="text-gray-500 font-medium">-</span>
                <select
                  value={filters.ageMax}
                  onChange={(e) => handleChange('ageMax', parseInt(e.target.value))}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 50 }, (_, i) => i + 18).map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium text-sm">Enter city or country</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Enter city or country"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.availableForVideoChat}
                onChange={(e) => handleChange('availableForVideoChat', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 text-sm">Available for Video Chat</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.compatibleZodiacOnly}
                onChange={(e) => handleChange('compatibleZodiacOnly', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 text-sm">Show only the Zodiac Signs that are compatible with me</span>
            </label>
          </div>

          {/* Zodiac Signs */}
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800">Zodiac Signs</h3>
              <button
                onClick={selectAllZodiac}
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
              >
                Select all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {zodiacSigns.map((sign) => (
                <label
                  key={sign.id}
                  className="flex items-center gap-2 cursor-pointer p-2.5 sm:p-2 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition min-h-[44px] touch-manipulation"
                >
                  <input
                    type="checkbox"
                    checked={filters.zodiacSigns.includes(sign.id)}
                    onChange={() => toggleZodiacSign(sign.id)}
                    className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                  />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-lg sm:text-xl flex-shrink-0">{sign.symbol}</span>
                    <span className="text-xs sm:text-sm text-gray-700 truncate">{sign.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Add more options */}
          <div className="text-center border-t border-gray-200 pt-3 sm:pt-4">
            <button
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm underline decoration-dotted font-medium"
            >
              Add more options
            </button>
            {showMoreOptions && (
              <div className="mt-3 sm:mt-4 border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Left Column - Categories */}
                  <div className="w-full sm:w-1/3 border-r-0 sm:border-r border-gray-200 pr-0 sm:pr-4 border-b sm:border-b-0 pb-3 sm:pb-0">
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory('interests')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'interests' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Interests
                      </button>
                      <button
                        onClick={() => setSelectedCategory('education')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'education' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Education
                      </button>
                      <button
                        onClick={() => setSelectedCategory('languages')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'languages' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Languages
                      </button>
                      <button
                        onClick={() => setSelectedCategory('relationship')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'relationship' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Relationship
                      </button>
                      <button
                        onClick={() => setSelectedCategory('kids')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'kids' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Kids
                      </button>
                      <button
                        onClick={() => setSelectedCategory('smoke')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'smoke' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Smoke
                      </button>
                      <button
                        onClick={() => setSelectedCategory('drink')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'drink' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Drink
                      </button>
                      <button
                        onClick={() => setSelectedCategory('height')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'height' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Height
                      </button>
                      <button
                        onClick={() => setSelectedCategory('bodyType')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'bodyType' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Body type
                      </button>
                      <button
                        onClick={() => setSelectedCategory('eyes')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'eyes' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Eyes
                      </button>
                      <button
                        onClick={() => setSelectedCategory('hair')}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === 'hair' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Hair
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Options */}
                  <div className="flex-1 pl-4">
                    {selectedCategory === 'interests' && (
                      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                        {interests.map((interest) => (
                          <label
                            key={interest}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-200"
                          >
                            <input
                              type="checkbox"
                              checked={filters.interests.includes(interest)}
                              onChange={() => toggleInterest(interest)}
                              className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{interest}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategory === 'education' && (
                      <div className="space-y-2">
                        {educationOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="education"
                              value={option}
                              checked={filters.education === option}
                              onChange={(e) => handleChange('education', e.target.value)}
                              className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategory === 'languages' && (
                      <div className="max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {languageOptions.map((language) => (
                            <label key={language} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded border border-gray-200">
                              <input
                                type="checkbox"
                                checked={filters.languages.includes(language)}
                                onChange={() => toggleLanguage(language)}
                                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">{language}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCategory === 'relationship' && (
                      <div className="space-y-2">
                        {relationshipOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="relationship"
                              value={option}
                              checked={filters.relationship === option}
                              onChange={(e) => handleChange('relationship', e.target.value)}
                              className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategory === 'kids' && (
                      <div className="space-y-2">
                        {kidsOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="kids"
                              value={option}
                              checked={filters.kids === option}
                              onChange={(e) => handleChange('kids', e.target.value)}
                              className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategory === 'smoke' && (
                      <div className="space-y-2">
                        {smokeOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="smoke"
                              value={option}
                              checked={filters.smoke === option}
                              onChange={(e) => handleChange('smoke', e.target.value)}
                              className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategory === 'drink' && (
                      <div className="space-y-2">
                        {drinkOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="drink"
                              value={option}
                              checked={filters.drink === option}
                              onChange={(e) => handleChange('drink', e.target.value)}
                              className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategory === 'height' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <select
                            value={filters.heightMin}
                            onChange={(e) => handleChange('heightMin', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                          >
                            <option value="">From</option>
                            {heightOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <span className="text-gray-500">-</span>
                          <select
                            value={filters.heightMax}
                            onChange={(e) => handleChange('heightMax', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                          >
                            <option value="">To</option>
                            {heightOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-gray-500">
                          Select minimum and maximum height (90 cm to 240 cm)
                        </p>
                      </div>
                    )}

                    {selectedCategory === 'bodyType' && (
                      <div className="space-y-2">
                        {bodyTypeOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="bodyType"
                              value={option}
                              checked={filters.bodyType === option}
                              onChange={(e) => handleChange('bodyType', e.target.value)}
                              className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategory === 'eyes' && (
                      <div className="space-y-2">
                        {eyesOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="eyes"
                              value={option}
                              checked={filters.eyes === option}
                              onChange={(e) => handleChange('eyes', e.target.value)}
                              className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategory === 'hair' && (
                      <div className="space-y-2">
                        {hairOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="hair"
                              value={option}
                              checked={filters.hair === option}
                              onChange={(e) => handleChange('hair', e.target.value)}
                              className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={handleShowMatches}
            className="w-full bg-red-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-red-600 transition text-sm sm:text-base shadow-md"
          >
            SHOW MATCHES
          </button>
        </div>
      </div>
    </>
  );
};

export default SearchFilterModal;




