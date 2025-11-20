import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://otmxcvnclhhfmodrhqqz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bXhjdm5jbGhoZm1vZHJocXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDMzNzYsImV4cCI6MjA3NjE3OTM3Nn0.yDR-m45DYyYy4Wx3jV_2kkrTxpMcQkz-E-UoWr7RJnE'

export const supabase = createClient(supabaseUrl, supabaseKey)
