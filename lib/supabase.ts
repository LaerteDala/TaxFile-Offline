
import { createClient } from '@supabase/supabase-js';

// URL corrigido: funaiuvzkcbbntaxdylj
const supabaseUrl = 'https://funaiuvzkcbbntaxdylj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bmFpdXZ6a2NiYm50YXhkeWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODA5ODgsImV4cCI6MjA4MzI1Njk4OH0.tlEGbDSPP05kFclC6ddYtap_85hRCh6umttK5dtFMHY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
