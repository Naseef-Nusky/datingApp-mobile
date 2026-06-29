import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * Password field with show/hide toggle (eye icon).
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Password',
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  minLength,
  id,
  name,
  autoComplete,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`w-full pr-11 ${inputClassName}`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 disabled:opacity-40"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <FaEyeSlash size={18} aria-hidden /> : <FaEye size={18} aria-hidden />}
      </button>
    </div>
  );
}
