import { FC } from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: FC<Props> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border-t-primary
          border-r-primary/30
          border-b-primary/30
          border-l-primary/30
          rounded-full
          animate-spin
        `}
      />
    </div>
  );
};