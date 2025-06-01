# 🚀 SoulScript Backend Integration Plan - Today's Implementation

Based on your PRD and guidance document, here's a focused plan to complete the backend integration today. I'll break this into manageable chunks with clear priorities.

## 📋 **Phase 1: Supabase Setup & Database (1-2 hours)**

### **Step 1.1: Create Supabase Project (15 min)**
1. Go to [supabase.com](https://supabase.com) and create new project
2. Choose project name: "soulscript" 
3. Set strong database password (save it securely)
4. Select closest region
5. Copy Project URL and anon key from Settings → API

### **Step 1.2: Database Schema Setup (30 min)**
Create the database tables as defined in your PRD:

```sql
-- Profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal entries table  
CREATE TABLE public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  initial_input TEXT NOT NULL,
  raw_dialogue JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Dialogue sessions table
CREATE TABLE public.dialogue_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Step 1.3: Row Level Security (15 min)**
Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogue_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for journal_entries
CREATE POLICY "Users can view own journal entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for dialogue_sessions
CREATE POLICY "Users can view own dialogue sessions" ON dialogue_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dialogue sessions" ON dialogue_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dialogue sessions" ON dialogue_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

## 📋 **Phase 2: Google OAuth Setup (30 min)**

### **Step 2.1: Google Cloud Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to APIs & Services → OAuth consent screen
5. Configure consent screen with your app details

### **Step 2.2: OAuth Credentials**
1. APIs & Services → Credentials → Create OAuth client ID
2. Choose "Web Application"
3. Add authorized origins: `http://localhost:3000`
4. Get callback URL from Supabase (Authentication → Providers → Google)
5. Add callback URL to authorized redirect URIs
6. Copy Client ID and Client Secret

### **Step 2.3: Configure Supabase Auth**
1. In Supabase: Authentication → Providers → Google
2. Enable Google provider
3. Paste Client ID and Client Secret
4. Set Site URL to `http://localhost:3000`

## 📋 **Phase 3: Frontend Integration (1-2 hours)**

### **Step 3.1: Install Dependencies**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### **Step 3.2: Environment Variables**
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 3.3: Supabase Client Setup**
Create `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
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
```

### **Step 3.4: Update Authentication Logic**
Replace the hardcoded auth in your existing auth page with real Supabase auth:

```typescript
// In your auth component
const handleGoogleSignIn = async () => {
  setIsLoading(true)
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  })
  if (error) {
    console.error('Error:', error)
    setIsLoading(false)
  }
}

const handleSignOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Error signing out:', error)
}
```

### **Step 3.5: Auth State Management**
Add auth state checking to your main app component:

```typescript
const [user, setUser] = useState<any>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
    setLoading(false)
  })

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }
  )

  return () => subscription.unsubscribe()
}, [])

// Update your app state logic to check authentication
if (loading) {
  return <div>Loading...</div>
}

if (!user && appState !== "auth") {
  setAppState("auth")
}
```

## 📋 **Phase 4: Database Integration (1 hour)**

### **Step 4.1: Replace localStorage with Supabase**
Update your journal saving logic:

```typescript
// Save journal entry
const saveJournalEntry = async (entry: {
  content: string
  initialInput: string
  dialogue: any[]
  title?: string
}) => {
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

// Load journal entries
const loadJournalEntries = async () => {
  if (!user) return []
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Update journal entry
const updateJournalEntry = async (id: string, content: string) => {
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

// Delete journal entry (soft delete)
const deleteJournalEntry = async (id: string) => {
  const { error } = await supabase
    .from('journal_entries')
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) throw error
}
```

### **Step 4.2: Update History Loading**
Replace the localStorage history loading with Supabase:

```typescript
useEffect(() => {
  if (user && appState === "history") {
    loadJournalEntries()
      .then(setJournalEntries)
      .catch(console.error)
  }
}, [user, appState])
```

## 📋 **Phase 5: OpenAI Integration (1-2 hours)**

### **Step 5.1: Get OpenAI API Key**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create API key
3. Save it securely (we'll add to Supabase secrets)

### **Step 5.2: Create Edge Function**
Install Supabase CLI and create function:

```bash
npm install -g supabase
supabase login
supabase init
supabase functions new generate-dialogue
```

### **Step 5.3: Implement Edge Function**
Create the dialogue generation function based on your PRD prompts:

```typescript
// supabase/functions/generate-dialogue/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

serve(async (req) => {
  try {
    const { messages, type, userInput } = await req.json()
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      return new Response('OpenAI API key not configured', { status: 500 })
    }

    let prompt = ""
    
    if (type === "question") {
      if (messages.length === 0) {
        prompt = `User input: "${userInput}"\nAsk a gentle, open-ended question to help explore this emotion deeper. Keep it conversational and empathetic.`
      } else {
        const conversation = messages.map((m: any) => `${m.type}: ${m.content}`).join('\n')
        prompt = `Conversation so far:\n${conversation}\n\nAsk another gentle, reflective question to help the user explore their feelings deeper. Keep it conversational and empathetic.`
      }
    } else if (type === "synthesis") {
      const conversation = messages.map((m: any) => m.content).join('\n')
      prompt = `Synthesize this multi-turn conversation into a ~200-word emotionally supportive journal entry. Include today's date (${new Date().toLocaleDateString()}). Tone: Gentle, introspective, supportive.\n\nConversation:\n${conversation}\n\nCreate a beautiful, reflective journal entry that captures the essence of this emotional exploration.`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ 
          role: 'system', 
          content: 'You are a compassionate AI therapist helping users explore their emotions through gentle questioning and supportive reflection.' 
        }, { 
          role: 'user', 
          content: prompt 
        }],
        max_tokens: type === "synthesis" ? 400 : 150,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error')
    }

    return new Response(JSON.stringify({ 
      content: data.choices[0].message.content.trim()
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in generate-dialogue function:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate response' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### **Step 5.4: Deploy Edge Function**
```bash
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase functions deploy generate-dialogue
```

### **Step 5.5: Update Frontend to Use Real AI**
Replace hardcoded responses with Edge Function calls:

```typescript
const generateAIResponse = async (messages: any[], type: 'question' | 'synthesis', userInput?: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-dialogue', {
      body: { messages, type, userInput }
    })
    
    if (error) throw error
    return data.content
  } catch (error) {
    console.error('Error generating AI response:', error)
    // Fallback to hardcoded responses if AI fails
    return getHardcodedResponse(messages, type)
  }
}

// Update your dialogue logic
const handleUserResponse = async (response: string) => {
  const newUserMessage = {
    id: Date.now().toString(),
    type: "user" as const,
    content: response,
    timestamp: new Date()
  }
  
  const updatedMessages = [...messages, newUserMessage]
  setMessages(updatedMessages)
  setCurrentInput("")
  setIsLoading(true)

  try {
    if (updatedMessages.filter(m => m.type === "user").length < 5) {
      // Generate next question
      const aiResponse = await generateAIResponse(updatedMessages, 'question')
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai" as const,
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages([...updatedMessages, aiMessage])
    }
  } catch (error) {
    console.error('Error generating AI response:', error)
  } finally {
    setIsLoading(false)
  }
}

// Update synthesis logic
const handleFinishJournal = async () => {
  setIsLoading(true)
  try {
    const aiSynthesis = await generateAIResponse(messages, 'synthesis')
    setSynthesizedEntry(aiSynthesis)
    setAppState("synthesis")
  } catch (error) {
    console.error('Error generating synthesis:', error)
    // Fallback to hardcoded synthesis
  } finally {
    setIsLoading(false)
  }
}
```

## 📋 **Phase 6: Testing & Deployment (30 min)**

### **Step 6.1: Local Testing Checklist**
- [ ] Google OAuth flow works
- [ ] User can sign in and sign out
- [ ] Journal entries save to Supabase
- [ ] Journal history loads from database
- [ ] Edit functionality updates database
- [ ] Delete functionality (soft delete) works
- [ ] AI dialogue generation works
- [ ] Journal synthesis works
- [ ] Error handling for offline/API failures

### **Step 6.2: Deploy to Vercel**
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Update Google OAuth settings for production URL
5. Update Supabase Site URL for production

### **Step 6.3: Production Testing**
- [ ] Test OAuth flow on production
- [ ] Test database operations on production
- [ ] Test AI functions on production
- [ ] Test cross-device sync

## 🎯 **Priority Order for Today**

### **HIGH PRIORITY** (Must complete):
1. ✅ Supabase project setup
2. ✅ Database schema creation
3. ✅ Google OAuth configuration
4. ✅ Basic auth integration in frontend
5. ✅ Database CRUD operations
6. ✅ Replace localStorage with Supabase

### **MEDIUM PRIORITY** (If time allows):
7. 🔄 OpenAI Edge Functions setup
8. 🔄 Real AI dialogue generation
9. 🔄 Error handling and fallbacks

### **LOW PRIORITY** (Nice to have):
10. 📋 Production deployment
11. 📋 Advanced features (search, analytics)
12. 📋 Performance optimizations

## 🛠️ **Tools You'll Need**

- ✅ Supabase account
- ✅ Google Cloud Console access
- ✅ OpenAI API key
- ✅ Terminal access for CLI commands
- ✅ Code editor (Cursor recommended)

## 📝 **Notes & Tips**

### **Common Issues & Solutions**
- **OAuth redirect issues**: Double-check URLs match exactly in Google Console and Supabase
- **RLS policy errors**: Start with simple policies, can refine later
- **Environment variables**: Make sure they're properly set in both local and production
- **Edge function errors**: Check Supabase function logs for debugging

### **Testing Strategy**
1. Test each phase incrementally
2. Keep hardcoded fallbacks during development
3. Use console.log extensively for debugging
4. Test with multiple users/accounts

### **Deployment Considerations**
- Set up staging environment first
- Test OAuth flow thoroughly before going live
- Monitor Supabase usage limits
- Set up error tracking (Sentry, etc.)

---

**Let's build this! 🚀**

Start with Phase 1 and work through systematically. Each phase builds on the previous one, so complete them in order for best results. 