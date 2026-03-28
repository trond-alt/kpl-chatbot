import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tsubhqyasdkqkgrofjri.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdWJocXlhc2RrcWtncm9manJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDI3NjcsImV4cCI6MjA5MDI3ODc2N30.eyvl-oVdlGBsg_dBgVA4anY3uu3qv78i2fomdDF4Igw";

export const supabase = createClient(supabaseUrl, supabaseKey);
