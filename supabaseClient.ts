import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://emohxildnltguwboneir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtb2h4aWxkbmx0Z3V3Ym9uZWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODg0NDgsImV4cCI6MjA4MDg2NDQ0OH0.CH5QIZECKqabClxUArrM8dvuhgIE6ItCcjziBHAuDTI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
