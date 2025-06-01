# SoulScript – Product Requirements Document (PRD)

**Author:** Elena D.  
**Date:** May 23, 2025  
**Platform:** Cursor (AI-first IDE)  
**Target:** Web-based journaling MVP with AI-driven reflection and journal history

---

## 1. Product Summary

SoulScript is an AI-powered journaling app that guides users through emotional expression using multi-turn, reflective dialogue. At any point, users may end the session and generate a personalized journal entry, which is stored in a browsable Journal History with options to view, edit, and delete. Users authenticate via Google and their data is securely stored in Supabase.

---

## 2. Objectives & Success Metrics

### Objectives

- Guide users through a multi-turn conversation to uncover deeper thoughts
- Allow early exits from conversations and generate meaningful entries
- Let users build and manage a personal library of AI-crafted journal entries
- **NEW:** Provide secure user authentication and data persistence
- **NEW:** Enable cross-device access to journal entries

### Success Metrics

- **80%** session completion or early journal generation
- **70%** of users save or revisit past entries
- **90%** successful edit/delete actions in database
- **NEW:** **95%** successful Google authentication rate
- **NEW:** **85%** user retention after first week (cross-device usage)

---

## 3. Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Freewriting Input** | User writes any initial thought/feeling | ✅ Implemented |
| **Multi-Turn Reflective Chat** | AI guides user through 1–5 turns of introspective Q&A | ✅ Implemented |
| **Early Exit Option** | User may click "Finish Journal" at any point | ✅ Implemented |
| **Journal Synthesis** | Generates full, date-stamped journal entry | ✅ Implemented |
| **Journal History** | View list of past journal entries, sorted by date | ✅ Implemented |
| **Edit Journal** | Edit saved entries in place (inline editor or modal) | ✅ Implemented |
| **Delete Journal** | Permanently delete an entry from database | ✅ Implemented |
| **🆕 Google Authentication** | Secure login/logout with Google OAuth | 🔄 To Implement |
| **🆕 Cloud Storage** | Persistent storage with Supabase database | 🔄 To Implement |
| **🆕 Cross-Device Sync** | Access journals from any device | 🔄 To Implement |

---

## 4. Technical Requirements

### Frontend

#### Framework & Architecture
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Single-page application** with state-based routing
- **Tailwind CSS** for styling with custom gradient themes

#### Component Structure

| Component | Current Implementation | Role |
|-----------|----------------------|------|
| `app/page.tsx` | Main SoulScript component | Single-page app with state management for all views |
| `app/layout.tsx` | Root layout | App-wide layout and providers |
| `components/ui/*` | shadcn/ui components | Pre-built UI components (Button, Card, Textarea, etc.) |
| `components/theme-provider.tsx` | Theme provider | Dark/light mode support |
| **🆕 `components/auth/`** | Authentication components | Login/logout, auth guards, user profile |
| **🆕 `components/auth/google-signin.tsx`** | Google sign-in button | OAuth integration component |
| **🆕 `components/auth/auth-guard.tsx`** | Route protection | Redirect unauthenticated users |

#### Current State Management
- React `useState` for all application state
- AppState type: `"landing" | "input" | "dialogue" | "synthesis" | "history"`
- **🆕 Authentication state** with user session management
- **🆕 Supabase client** for database operations
- **REMOVED:** localStorage (replaced with Supabase)

#### Key Dependencies
- `@radix-ui/*` - Accessible UI primitives
- `lucide-react` - Icon library
- `tailwindcss` - Utility-first CSS
- `next-themes` - Theme management
- `class-variance-authority` & `clsx` - Conditional styling
- `date-fns` - Date formatting
- **🆕 `@supabase/supabase-js`** - Supabase client
- **🆕 `@supabase/auth-helpers-nextjs`** - Next.js auth integration
- **🆕 `@supabase/auth-ui-react`** - Pre-built auth components

#### Routing Strategy
- State-based navigation within single page
- Header navigation between "Home" and "History" views
- **🆕 Protected routes** requiring authentication
- **🆕 Auth callback handling** for Google OAuth

### Backend

#### Current Implementation
- ❌ No API routes implemented yet
- ⚠️ Hardcoded AI responses in frontend
- ⚠️ Client-side journal synthesis

#### Planned API Integration
- API route: `/api/generate` (OpenAI integration)
- **🆕 API route: `/api/auth/callback`** (Supabase auth callback)
- Server-side journal synthesis with OpenAI
- **🆕 Real-time subscriptions** for journal updates

#### Database Schema (Supabase)

```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Data Models

```typescript
// Authentication
interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Existing models (updated)
interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

interface JournalEntry {
  id: string
  user_id: string
  title?: string
  content: string
  initial_input: string
  raw_dialogue?: Message[]
  created_at: Date
  updated_at: Date
  is_deleted: boolean
}

interface DialogueSession {
  id: string
  user_id: string
  messages: Message[]
  status: 'active' | 'completed' | 'abandoned'
  created_at: Date
  updated_at: Date
}

type AppState = "landing" | "input" | "dialogue" | "synthesis" | "history" | "auth"
```

#### Authentication Flow
1. **Google OAuth Setup**
   - Configure Google Cloud Console
   - Set up OAuth 2.0 credentials
   - Configure Supabase Auth with Google provider

2. **Authentication States**
   - Unauthenticated: Show landing page with sign-in
   - Authenticated: Full app access
   - Loading: Show loading spinner during auth checks

3. **Session Management**
   - Automatic token refresh
   - Secure session storage
   - Logout functionality

#### Storage & Security
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth with Google OAuth
- **Security:** Row Level Security (RLS) policies
- **Real-time:** Supabase real-time subscriptions
- **File Storage:** Supabase Storage (for future features)

#### Row Level Security Policies

```sql
-- Users can only access their own journal entries
CREATE POLICY "Users can view own journal entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for dialogue_sessions and profiles
```

#### Styling System
- Custom gradient theme: rose → orange → amber
- Glassmorphism effects with backdrop-blur
- Responsive design with mobile-first approach
- Consistent spacing and typography scale
- **🆕 Authentication UI** matching app theme

---

## 5. Prompt Examples

### Reflective Question Prompt
```
User input: "I feel numb lately."
Ask a gentle, open-ended question to help explore this emotion.
```

### Follow-up Prompt
```
Conversation so far:
1. I feel numb lately.
2. I've been just going through the motions.
Now ask another reflective question.
```

### Final Journal Synthesis
```
Synthesize this multi-turn conversation into a ~200-word emotionally supportive journal entry. Include today's date.
Conversation:
- I feel numb lately.
- I've been just going through the motions.
- I want to feel something again.
Tone: Gentle, introspective.
```

---

## 6. Journal History Feature

### Goals
- Let users revisit and reflect on their previous entries
- Provide lightweight editing to refine the past
- Allow clean-up via deletion
- **🆕 Sync across all user devices**
- **🆕 Search and filter capabilities**

### Actions

| Action | Behavior | Implementation |
|--------|----------|----------------|
| **View** | List of journals with previews by date | Supabase query with pagination |
| **Edit** | Inline or modal editor; updates `updated_at` | Real-time updates via Supabase |
| **Delete** | Soft delete (sets `is_deleted: true`) | Maintains data integrity |
| **🆕 Search** | Full-text search across journal content | PostgreSQL full-text search |
| **🆕 Filter** | Filter by date range, keywords | Advanced query capabilities |

---

## 7. User Flow

```mermaid
graph TD
    A[User visits app] --> B{Authenticated?}
    B -->|No| C[Show Google Sign-In]
    C --> D[Google OAuth Flow]
    D --> E[Create/Update Profile]
    E --> F[Landing Page]
    B -->|Yes| F[Landing Page]
    F --> G[User writes a feeling]
    G --> H[AI asks a question]
    H --> I[User replies]
    I --> J{Continue dialogue?}
    J -->|Yes| H
    J -->|No| K[User ends chat with "Finish Journal"]
    K --> L[AI synthesizes journal entry]
    L --> M[Save to Supabase]
    M --> N[Journal saved to cloud]
    N --> O[User visits history to view/edit/delete]
    O --> P[Real-time sync across devices]
```

**Flow Description:**
1. **🆕 Authentication Check:** Verify if user is signed in
2. **🆕 Google Sign-In:** OAuth flow if not authenticated
3. User writes a feeling
4. AI asks a question
5. User replies → Repeat for 1–5 turns
6. User ends chat anytime with "Finish Journal"
7. AI synthesizes journal entry
8. **🆕 Save to Supabase:** Persistent cloud storage
9. **🆕 Cross-device sync:** Access from any device

---

## 8. Timeline (Workshop-Friendly Build)

| Time | Task | Dependencies |
|------|------|--------------|
| **0–15 min** | Project scaffold + styling | ✅ Complete |
| **15–30 min** | Chat UI and input logic | ✅ Complete |
| **30–50 min** | **🆕 Supabase setup + Google Auth** | Supabase project, Google OAuth |
| **50–70 min** | **🆕 Database schema + RLS policies** | Supabase configuration |
| **70–90 min** | **🆕 Auth integration + protected routes** | Auth components |
| **90–110 min** | Multi-turn OpenAI integration | OpenAI API key |
| **110–130 min** | Journal synthesis with database storage | Supabase client |
| **130–150 min** | History screen with cloud data | Real-time subscriptions |

---

## 9. Risks & Mitigation

| Risk | Mitigation | Priority |
|------|------------|----------|
| User forgets to end chat | Reminder button or timeout after idle | Medium |
| **🆕 Google OAuth setup complexity** | Use Supabase Auth helpers, detailed docs | High |
| **🆕 Database connection issues** | Error boundaries, retry logic, offline mode | High |
| **🆕 Authentication state management** | Use Supabase auth hooks, proper loading states | High |
| Edits not saved properly | Debounce + confirm feedback + real-time sync | Medium |
| **🆕 Data privacy concerns** | Clear privacy policy, GDPR compliance | High |
| **🆕 Rate limiting (OpenAI)** | Implement request queuing, user feedback | Medium |

---

## 10. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth (configured in Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

---

## 11. Deployment Checklist

### Supabase Setup
- [ ] Create Supabase project
- [ ] Configure Google OAuth provider
- [ ] Set up database schema
- [ ] Configure RLS policies
- [ ] Test authentication flow

### Google Cloud Setup
- [ ] Create Google Cloud project
- [ ] Enable Google+ API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs

### Next.js Deployment
- [ ] Configure environment variables
- [ ] Test authentication in production
- [ ] Verify database connections
- [ ] Test cross-device functionality

---

## 12. Tagline

> **SoulScript: A journal that grows with you, one reflection at a time.**
> *Now with secure cloud storage and access from anywhere.* 