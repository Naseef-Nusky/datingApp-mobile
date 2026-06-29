import { FaCircle } from 'react-icons/fa';

const TypingIndicator = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center space-x-1 bg-white rounded-full px-3 py-1.5 ${className}`}>
      <FaCircle className="w-1.5 h-1.5 text-gray-400 animate-pulse" style={{ animationDelay: '0ms' }} />
      <FaCircle className="w-1.5 h-1.5 text-gray-400 animate-pulse" style={{ animationDelay: '150ms' }} />
      <FaCircle className="w-1.5 h-1.5 text-gray-400 animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

export default TypingIndicator;
