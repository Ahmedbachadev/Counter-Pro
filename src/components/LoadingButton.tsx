import React from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * A button that automatically disables itself and shows a spinner
 * while isLoading is true. Prevents duplicate submissions.
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className = '',
  ...rest
}) => {
  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      className={`relative flex items-center justify-center gap-2 transition-all ${className} ${
        isLoading ? 'cursor-not-allowed opacity-80' : ''
      }`}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
};

export default LoadingButton;
