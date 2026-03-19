import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ugxxucjrcmjbgbtyocdq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVneHh1Y2pyY21qYmdidHlvY2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODU0NjAsImV4cCI6MjA4OTE2MTQ2MH0.l0Lu7PIzdpkDN63aVg0fmMM96WKSsXiSnGbR2lD_kYg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);