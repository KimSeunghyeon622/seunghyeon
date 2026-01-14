import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qycwdncplofgzdrjtklb.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5Y3dkbmNwbG9mZ3pkcmp0a2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDM1MDAsImV4cCI6MjA1MTQ3OTUwMH0.kWHt0xGYvQSx9YLpJKP4aH1dKMRW5-pZPvRJBZGXx0U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
