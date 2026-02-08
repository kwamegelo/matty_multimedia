

// ============================================
// SUPABASE CONFIGURATION
// ============================================

// IMPORTANT: Replace these with your actual Supabase credentials
// Find them in: Supabase Dashboard → Settings → API

const SUPABASE_CONFIG = {
  url: 'https://nxhehybodtlnennrvgaw.supabase.co', // e.g., 'https://xyzcompany.supabase.co'
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aGVoeWJvZHRsbmVubnJ2Z2F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODg1MzksImV4cCI6MjA4Mzk2NDUzOX0.86_x2y0HcGFPdqrGrJriXCK7qyzel07TmygcsG33Ajc', // Your anon/public key
};

// Validate configuration
if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || 
    SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('⚠️ SUPABASE NOT CONFIGURED!');
  console.error('Please update config.js with your Supabase credentials');
  console.error('Find them in: Supabase Dashboard → Settings → API');
}

// Initialize Supabase client
let supabaseClient;

try {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.error('❌ Supabase library not loaded. Check your internet connection.');
  }
} catch (error) {
  console.error('❌ Error initializing Supabase:', error);
}

// Make it globally available
window.supabaseClient = supabaseClient;