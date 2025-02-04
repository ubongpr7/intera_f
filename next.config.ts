import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    // Handling CSS imports in your Next.js project
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });

    return config;
  },

  // Optional: If you want to enable React Strict Mode (recommended for new apps)
  reactStrictMode: true,

  // Add custom Webpack configuration here if needed
};

export default nextConfig;
