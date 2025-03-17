// utils/colorGenerator.ts
export const generateColorFromName = (name: string) => {
    if (!name) return '#6B7280'; // Fallback to gray
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to hue (0-360)
    const hue = Math.abs(hash % 360);
    
    // Use HSL for consistent brightness/saturation
    return `hsl(${hue}, 70%, 40%)`; // Adjust saturation and lightness as needed
  };