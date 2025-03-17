import React from 'react';

// Define the props interface
interface LoadingAnimationProps {
  text?: string; // Text to display (e.g., "Loading", "Processing")
  ringColor?: string; // Custom color for the ring
  size?: number; // Size of the ring in pixels
}

// Define the component with TypeScript
const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  text = 'Loading',
  ringColor = '#3b82f6', // Default color (blue)
  size = 16,
}) => {
  // Define the ring style using React.CSSProperties
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