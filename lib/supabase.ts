import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema
export interface JournalEntry {
  id: string
  user_id: string
  title?: string
  content: string
  initial_input: string
  raw_dialogue?: any[]
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export interface Profile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface DialogueSession {
  id: string
  user_id: string
  messages: any[]
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  updated_at: string
}

// Database helper functions
export const saveJournalEntry = async (entry: {
  content: string
  initialInput: string
  dialogue: any[]
  title?: string
}, user: any) => {
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      content: entry.content,
      initial_input: entry.initialInput,
      raw_dialogue: entry.dialogue,
      title: entry.title || `Journal Entry - ${new Date().toLocaleDateString()}`
    })
    .select()
  
  if (error) throw error
  return data[0]
}

export const loadJournalEntries = async (user: any): Promise<JournalEntry[]> => {
  if (!user) return []
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const updateJournalEntry = async (id: string, content: string, user: any) => {
  const { error } = await supabase
    .from('journal_entries')
    .update({ 
      content, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) throw error
}

export const deleteJournalEntry = async (id: string, user: any) => {
  const { error } = await supabase
    .from('journal_entries')
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) throw error
} 