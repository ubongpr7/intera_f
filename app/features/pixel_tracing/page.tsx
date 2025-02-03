'use client';

import { useEffect } from 'react';
import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = 'YOUR_PIXEL_ID';

const options = {
  autoConfig: true, // Set to false if you don’t want automatic config
  debug: false, // Set to true to enable debugging
};

const PixelTracking: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ReactPixel.init(PIXEL_ID, {}, options);
      ReactPixel.pageView(); // Track page view
    }
  }, []);

  // Function to track leads
  const trackLead = () => {
    ReactPixel.track('Lead', { value: 10, currency: 'USD' });
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">Facebook Pixel Tracking</h2>
      <p className="mb-4">Pixel is initialized and tracking page views.</p>
      <button
        onClick={trackLead}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Track Lead Event
      </button>
    </div>
  );
};

export default PixelTracking;
