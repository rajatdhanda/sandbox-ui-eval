// metro.config.js - Fix for Metro bundler issues

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom configuration
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Disable source maps in production to avoid <anonymous> file issues
    sourceMap: false,
  },
};

// Add resolver configuration
config.resolver = {
  ...config.resolver,
  // Add extensions if needed
  sourceExts: [...config.resolver.sourceExts, 'jsx', 'tsx'],
};

module.exports = config;