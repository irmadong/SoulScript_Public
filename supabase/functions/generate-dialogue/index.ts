// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

// SoulScript AI Dialogue Generation Edge Function
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

interface DialogueRequest {
  type: 'question' | 'synthesis'
  userInput?: string
  messages?: Array<{
    type: 'user' | 'ai'
    content: string
  }>
  dialogueStep?: number
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Parse request body
    const { type, userInput, messages, dialogueStep }: DialogueRequest = await req.json()

    // ===== PROMPT TUNING SECTION =====
    // This is where you can customize the AI behavior
    
    let prompt = ""
    let maxTokens = 150
    let temperature = 0.7  // Controls creativity (0.0-1.0)
    let systemPrompt = ""  // Controls overall AI personality
    
    if (type === "question") {
      // ===== SYSTEM PROMPT TUNING =====
      systemPrompt = `You are a compassionate AI therapist with expertise in:
- Cognitive Behavioral Therapy (CBT)
- Mindfulness-based approaches
- Emotional intelligence development
- Trauma-informed care

Your style is:
- Warm and non-judgmental
- Curious and exploratory
- Focused on insights and growth
- Culturally sensitive and inclusive

Always ask questions that help users discover their own wisdom.`

      if (!messages || messages.length === 0) {
        // ===== FIRST QUESTION PROMPT TUNING =====
        prompt = `The user has shared: "${userInput}"

CONTEXT: This is their first sharing in a therapeutic dialogue. They're opening up about something important.

TASK: Ask ONE gentle, open-ended question that:
1. Validates their experience
2. Invites deeper exploration
3. Feels safe and supportive
4. Uses their exact words when possible
5. Stays under 40 words

THERAPEUTIC TECHNIQUES TO USE:
- Reflection: "It sounds like..."
- Curiosity: "I'm wondering..."
- Exploration: "Can you tell me more about..."
- Validation: "That makes sense that you'd feel..."

AVOID:
- Multiple questions
- Advice or solutions
- Minimizing their experience
- Clinical jargon

Your empathetic question:`

        temperature = 0.6  // Slightly less creative for consistency
        maxTokens = 80     // Shorter responses for questions
        
      } else {
        // ===== FOLLOW-UP QUESTIONS PROMPT TUNING =====
        const conversation = messages.map(m => `${m.type}: ${m.content}`).join('\n')
        const questionNumber = Math.floor(messages.length / 2) + 1
        
        // Dynamic question focus based on dialogue progression (extended to 10 steps)
        const questionFocus = {
          2: "emotional impact and physical sensations",
          3: "relationships and social connections", 
          4: "personal values and meaning-making",
          5: "patterns and recurring themes",
          6: "past experiences and learning",
          7: "future aspirations and growth",
          8: "self-compassion and acceptance",
          9: "strengths and resilience",
          10: "insights, growth, and forward movement"
        }[questionNumber] || "deeper self-understanding"
        
        prompt = `CONVERSATION HISTORY:
${conversation}

CONTEXT: This is question ${questionNumber} in a therapeutic dialogue (user can end anytime, questions 1-9, step 10 is positive closing).

CURRENT FOCUS: Explore ${questionFocus}

TASK: Ask ONE question that:
1. Builds on their previous response
2. Explores ${questionFocus}
3. Helps them gain new insights
4. Feels natural and conversational
5. Stays under 40 words

Your thoughtful question:` 
//Note: do not use the following question progression strategy, make it more varied and creative.
//QUESTION PROGRESSION STRATEGY:
// - Question 2: "How is this affecting other parts of your life?"
// - Question 3: "What would you tell a close friend in this situation?"
// - Question 4: "What do you think this feeling is trying to tell you?"
// - Question 5: "What insights are you taking from this conversation?"


        temperature = 0.7  // More creative for varied questions
        maxTokens = 80
      }
      
    } else if (type === "synthesis") {
      // ===== JOURNAL SYNTHESIS PROMPT TUNING =====
      systemPrompt = `You are a skilled writer specializing in:
- Therapeutic journaling
- Emotional processing
- Personal narrative
- Mindful reflection

Your writing style is:
- Warm and authentic
- Insightful and reflective  
- Hopeful and empowering
- Beautifully crafted`

      maxTokens = 500    // Longer for journal entries
      temperature = 0.8  // More creative for beautiful writing
      
      const userMessages = messages?.filter(m => m.type === 'user') || []
      const conversation = messages?.map(m => m.content).join('\n') || ''
      
      prompt = `EMOTIONAL JOURNEY:
${conversation}

TASK: Transform this therapeutic dialogue into a beautiful, personal journal entry.

STRUCTURE:
1. Opening: "Today, I found myself reflecting on..."
2. Journey: Capture the emotional exploration
3. Insights: Highlight key realizations
4. Growth: Show personal development
5. Hope: End with forward-looking wisdom

WRITING STYLE:
- First person ("I discovered...", "I realized...")
- Present tense for immediacy
- Metaphors and imagery for depth
- Authentic emotional language
- 250-300 words

TONE: Reflective, hopeful, authentic, empowering

INCLUDE:
- Today's date: ${new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
- Key emotions explored
- Personal insights gained
- Growth and learning
- Gratitude or appreciation

Your beautiful journal entry:`
    }

    // ===== OPENAI API CALL WITH TUNED PARAMETERS =====
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-2024-07-18',  // Fast, cost-effective GPT-4 class model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,        // Tuned per request type
        presence_penalty: 0.1,          // Reduces repetition
        frequency_penalty: 0.1,         // Encourages variety
        top_p: 0.9,                     // Nucleus sampling for quality
        // stop: ["\n\n", "Question:", "Answer:"]  // Custom stop sequences
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()

    return new Response(
      JSON.stringify({ 
        content,
        success: true 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )

  } catch (error) {
    console.error('Error in generate-dialogue function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
})

/* To test locally:

1. Set your OpenAI API key:
   echo "OPENAI_API_KEY=your_key_here" >> supabase/.env

2. Start Supabase:
   supabase start

3. Test the function:
   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-dialogue' \
     --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
     --header 'Content-Type: application/json' \
     --data '{"type":"question","userInput":"I feel overwhelmed at work"}'

*/
