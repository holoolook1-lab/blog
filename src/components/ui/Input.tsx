import React from 'react';
import { designTokens } from '@/lib/design-tokens';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'textarea';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  rows?: number;
  className?: string;
  maxLength?: number;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyDown,
  disabled = false,
  rows = 4,
  className = '',
  maxLength,
  required = false,
}) => {
  const baseClasses = 'w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-50 disabled:text-secondary-500';
  
  const allClasses = `${baseClasses} ${className}`;
  
  if (type === 'textarea') {
    return (
      <textarea
        className={allClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        required={required}
      />
    );
  }
  
  return (
    <input
      type={type}
      className={allClasses}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      maxLength={maxLength}
      required={required}
    />
  );
};

export default Input;