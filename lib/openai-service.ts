// OpenAI Service for SoulScript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
)

export interface DialogueMessage {
  type: 'user' | 'ai'
  content: string
}

export interface DialogueRequest {
  type: 'question' | 'synthesis'
  userInput?: string
  messages?: DialogueMessage[]
  dialogueStep?: number
}

export interface DialogueResponse {
  content: string
  success: boolean
  error?: string
}

/**
 * Generate AI question based on user input or conversation history
 */
export async function generateQuestion(
  userInput?: string,
  messages?: DialogueMessage[]
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-dialogue', {
      body: {
        type: 'question',
        userInput,
        messages
      }
    })

    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(error.message || 'Failed to generate question')
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate question')
    }

    return data.content
  } catch (error) {
    console.error('Error generating question:', error)
    
    // Fallback to hardcoded questions if API fails
    const fallbackQuestions = [
      "I hear what you're sharing. Can you tell me more about what specifically triggered these feelings today?",
      "That sounds significant. How has this been affecting other areas of your life?",
      "If a close friend came to you with this same situation, what would you tell them?",
      "What do you think these emotions might be trying to tell you?",
      "Looking back on our conversation, what insights have you gained about yourself?"
    ]
    
    const questionIndex = messages ? Math.floor(messages.length / 2) : 0
    return fallbackQuestions[questionIndex] || fallbackQuestions[0]
  }
}

/**
 * Generate journal entry synthesis from conversation
 */
export async function generateSynthesis(messages: DialogueMessage[]): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-dialogue', {
      body: {
        type: 'synthesis',
        messages
      }
    })

    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(error.message || 'Failed to generate synthesis')
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate synthesis')
    }

    return data.content
  } catch (error) {
    console.error('Error generating synthesis:', error)
    
    // Fallback synthesis if API fails
    const userMessages = messages.filter(m => m.type === 'user')
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    return `Today, ${today}, I found myself reflecting on some important feelings and thoughts.

Through our conversation, I explored ${userMessages.length > 0 ? userMessages[0].content.toLowerCase() : 'my emotions'}, and discovered some meaningful insights about myself.

${userMessages.slice(1).map((msg, index) => 
  `I realized that ${msg.content.toLowerCase()}.`
).join(' ')}

This reflection has helped me understand myself better, and I'm grateful for the opportunity to explore these feelings in a safe space. Moving forward, I want to remember the insights I've gained and continue to be compassionate with myself as I navigate these emotions.

I'm learning that it's okay to feel deeply, and that taking time to reflect can lead to greater self-understanding and growth.`
  }
}

/**
 * Test Edge Function connectivity
 */
export async function testEdgeFunction(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-dialogue', {
      body: {
        type: 'question',
        userInput: 'test'
      }
    })

    return !error && data?.success === true
  } catch (error) {
    console.error('Edge Function test failed:', error)
    return false
  }
} 