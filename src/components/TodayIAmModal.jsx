import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Heart, Users, Rose, CheckCircle, Smile } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TodayIAmModal = ({ isOpen, onClose, onStatusUpdate, currentStatus }) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // Keep local selection in sync with the currently saved status
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus ?? null);
    }
  }, [isOpen, currentStatus]);

  const statusOptions = [
    {
      id: 'serious',
      label: 'Serious',
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      selectedBg: 'bg-teal-500',
    },
    {
      id: 'penpal',
      label: 'Pen pal',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      selectedBg: 'bg-orange-500',
    },
    {
      id: 'romantic',
      label: 'Romantic',
      icon: Rose,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      selectedBg: 'bg-red-500',
    },
    {
      id: 'flirty',
      label: 'Flirty',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      selectedBg: 'bg-pink-500',
    },
    {
      id: 'naughty',
      label: 'Naughty',
      icon: Smile,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      selectedBg: 'bg-orange-500',
    },
  ];

  const handleStatusSelect = async (statusId) => {
    setSelectedStatus(statusId);
    setSaving(true);

    try {
      // Update user's today status
      await axios.put('/api/profiles/me', {
        todayStatus: statusId,
      });

      // Notify parent component
      if (onStatusUpdate) {
        onStatusUpdate(statusId);
      }

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        setSelectedStatus(null);
        setSaving(false);
      }, 500);
    } catch (error) {
      console.error('Error updating status:', error);
      setSaving(false);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDontKnow = async () => {
    setSaving(true);
    
    try {
      // Clear/reset the status to null or default
      await axios.put('/api/profiles/me', {
        todayStatus: null,
      });

      // Notify parent component
      if (onStatusUpdate) {
        onStatusUpdate(null);
      }

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        setSaving(false);
      }, 300);
    } catch (error) {
      console.error('Error updating status:', error);
      setSaving(false);
      alert('Failed to update status. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[90]" 
        onClick={onClose}
      ></div>
      
      {/* Dropdown - Positioned below button */}
      <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl w-96 z-[100] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="relative p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 text-center pr-8">Today I am</h2>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Status Options with Timeline */}
          <div className="mb-4 relative">
            {/* Dashed Timeline - Horizontal line connecting all options */}
            <div className="absolute top-6 left-0 right-0 h-0.5 border-t-2 border-dashed border-gray-300"></div>
            
            {/* Options */}
            <div className="flex items-start justify-between relative z-10">
              {statusOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                <div key={option.id} className="flex flex-col items-center flex-1 relative">
                  {/* Icon Circle */}
                  <button
                    onClick={() => handleStatusSelect(option.id)}
                    disabled={saving}
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-1.5 transition-all relative z-10 ${
                      selectedStatus === option.id
                        ? `${option.selectedBg} text-white scale-110 shadow-lg`
                        : `${option.bgColor} ${option.color} hover:opacity-80`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Icon size={20} />
                  </button>
                  
                  {/* Vertical Line from Icon to Button */}
                  <div className="h-6 w-0.5 bg-gray-300 mb-1.5"></div>
                  
                  {/* Label Button - Oval shaped */}
                  <button
                    onClick={() => handleStatusSelect(option.id)}
                    disabled={saving}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedStatus === option.id
                        ? `${option.selectedBg} text-white`
                        : `${option.bgColor} ${option.color} hover:opacity-80`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ borderRadius: '9999px' }}
                  >
                    {option.label}
                  </button>
                </div>
              );
              })}
            </div>
          </div>

          {/* Don't Know Button */}
          <div className="text-center pt-2 border-t border-gray-200">
            <button
              onClick={handleDontKnow}
              disabled={saving}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Don't know...
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TodayIAmModal;
