const { getDefaultConfig } = require('expo/metro-config');

// Cross-populate Clerk publishable key from any standard naming scheme
if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  const clerkKey =
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    '';
  if (clerkKey) {
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = clerkKey.replace(/^["']|["']$/g, '').trim();
  }
}

// Cross-populate API base URL
if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
  const apiBase =
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'https://bloodchain-api.onrender.com';
  process.env.EXPO_PUBLIC_API_BASE_URL = apiBase.replace(/^["']|["']$/g, '').trim();
}

module.exports = getDefaultConfig(__dirname);

