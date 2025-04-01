import React from 'react';

// Define the props interface
interface LoadingAnimationProps {
  text?: string; // Text to display (e.g., "Loading", "Processing")
  ringColor?: string; // Custom color for the ring
  size?: number; // Size of the ring in pixels
}


// components/ActivityLogSkeleton.tsx
export const ActivityLogSkeleton = () => (
  <div className="animate-pulse space-y-4 p-6">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="h-4 bg-gray-200 rounded w-1/6" />
        <div className="h-4 bg-gray-200 rounded w-1/6" />
        <div className="h-4 bg-gray-200 rounded w-1/6" />
        <div className="h-4 bg-gray-200 rounded w-1/6" />
        <div className="h-4 bg-gray-200 rounded w-2/6" />
      </div>
    ))}
  </div>
);
const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  text = 'Loading',
  ringColor = '#3b82f6', 
  size = 16,
}) => {
  const ringStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    border: `2px solid ${ringColor}`,
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Ring Animation */}
      <div style={ringStyle} data-testid="loading-ring" />
      {/* Text */}
      <span >{text}</span>

      {/* CSS for Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingAnimation;