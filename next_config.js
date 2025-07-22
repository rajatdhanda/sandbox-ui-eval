/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,  // Add this line
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Ensure API routes work properly
  experimental: {
    esmExternals: false,
  },
  // Handle TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable support for TypeScript and JavaScript files
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
}

module.exports = nextConfig