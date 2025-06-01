# 🎯 SoulScript Prompt Tuning Guide

## Overview
SoulScript uses OpenAI's GPT models in **two main areas** where you can customize the AI behavior through prompt engineering.

## 🧠 Where LLM is Used

### 1. **Question Generation** (`type: "question"`)
- **File**: `supabase/functions/generate-dialogue/index.ts` (Lines 47-120)
- **Purpose**: Generates empathetic therapeutic questions
- **Model**: GPT-4o-mini-2024-07-18 (fast, cost-effective GPT-4 class)
- **Max Tokens**: 80 (short, focused questions)
- **Temperature**: 0.6-0.7 (balanced creativity)
- **Dialogue Length**: Up to 10 steps (user can end anytime)

### 2. **Journal Synthesis** (`type: "synthesis"`)
- **File**: `supabase/functions/generate-dialogue/index.ts` (Lines 121-180)
- **Purpose**: Creates beautiful journal entries from dialogue
- **Model**: GPT-4o-mini-2024-07-18 (fast, cost-effective GPT-4 class)
- **Max Tokens**: 500 (longer, detailed entries)
- **Temperature**: 0.8 (more creative writing)

## 🔧 Prompt Tuning Areas

### **1. System Prompts** (AI Personality)

#### Question Generation System Prompt:
```typescript
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
```

#### Journal Synthesis System Prompt:
```typescript
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
```

### **2. User Prompts** (Task Instructions)

#### First Question Prompt Structure:
```
CONTEXT: This is their first sharing in a therapeutic dialogue.

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
```

#### Follow-up Questions with Dynamic Focus (Extended to 10 Steps):
```typescript
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
```

### **3. OpenAI Parameters** (Fine-tuning)

```typescript
{
  model: 'gpt-4o-mini-2024-07-18', // Fast, cost-effective GPT-4 class model
  max_tokens: maxTokens,         // 80 for questions, 500 for synthesis
  temperature: temperature,       // 0.6-0.8 based on creativity needed
  presence_penalty: 0.1,         // Reduces repetition
  frequency_penalty: 0.1,        // Encourages variety
  top_p: 0.9,                   // Nucleus sampling for quality
  // stop: ["\n\n", "Question:"] // Custom stop sequences
}
```

## 🎨 Customization Examples

### **Example 1: More Clinical Approach**
```typescript
systemPrompt = `You are a licensed clinical psychologist specializing in:
- Evidence-based therapeutic interventions
- Diagnostic assessment
- Treatment planning
- Crisis intervention

Your approach is:
- Professional and structured
- Research-informed
- Goal-oriented
- Clinically precise`
```

### **Example 2: Mindfulness Focus**
```typescript
systemPrompt = `You are a mindfulness teacher and emotional wellness coach with expertise in:
- Meditation and contemplative practices
- Present-moment awareness
- Body-mind connection
- Compassionate self-inquiry

Your style is:
- Gentle and present-centered
- Focused on awareness and acceptance
- Encouraging mindful observation
- Rooted in wisdom traditions`
```

### **Example 3: Creative Writing Style**
```typescript
// For journal synthesis
systemPrompt = `You are a poet and creative writer specializing in:
- Lyrical personal narrative
- Metaphorical expression
- Emotional imagery
- Transformative storytelling

Your writing style is:
- Rich with metaphors and imagery
- Emotionally evocative
- Artistically beautiful
- Deeply moving`
```

## 🔄 A/B Testing Prompts

### **Testing Different Question Styles:**

#### Version A (Direct):
```
"What emotions are you experiencing right now about this situation?"
```

#### Version B (Metaphorical):
```
"If this feeling had a color or texture, what would it be like?"
```

#### Version C (Somatic):
```
"Where do you notice this feeling showing up in your body?"
```

### **Testing Different Synthesis Styles:**

#### Version A (Reflective):
```
"Today, I found myself in a quiet moment of reflection..."
```

#### Version B (Narrative):
```
"This morning brought an unexpected journey into my inner world..."
```

#### Version C (Poetic):
```
"Like waves against the shore, my emotions today carried both turbulence and grace..."
```

## 📊 Performance Optimization

### **Model Selection:**
- **GPT-4o-mini-2024-07-18**: ✅ **Currently Used** - Fast, cost-effective, GPT-4 class quality
- **GPT-3.5-turbo**: Older, less capable but very fast
- **GPT-4**: Higher quality, more nuanced, slower, more expensive
- **GPT-4-turbo**: Balance of quality and speed

### **Token Management:**
- **Questions**: 80 tokens (concise, focused)
- **Synthesis**: 500 tokens (detailed, beautiful)
- **Monitor usage**: Track token consumption for cost optimization

### **Temperature Settings:**
- **0.3-0.5**: More consistent, predictable responses
- **0.6-0.7**: Balanced creativity and consistency
- **0.8-1.0**: More creative, varied responses

## 🧪 Testing Your Prompts

### **1. Use the Test Button**
Click the 🤖 button in your app header to test the Edge Function.

### **2. Manual Testing**
```bash
curl -X POST 'https://izygaoqusptzjlfwfjto.supabase.co/functions/v1/generate-dialogue' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"type":"question","userInput":"I feel overwhelmed at work"}'
```

### **3. A/B Testing Framework**
Create multiple prompt versions and test with real users to see which generates better engagement and insights.

## 🎯 Best Practices

### **1. Prompt Engineering Principles:**
- **Be specific**: Clear instructions yield better results
- **Use examples**: Show the AI what you want
- **Set constraints**: Word limits, tone, structure
- **Test iteratively**: Small changes, measure impact

### **2. Therapeutic Considerations:**
- **Safety first**: Avoid harmful or triggering content
- **Cultural sensitivity**: Consider diverse backgrounds
- **Ethical boundaries**: Maintain therapeutic ethics
- **Crisis handling**: Have fallback responses

### **3. User Experience:**
- **Consistency**: Maintain voice across interactions
- **Personalization**: Adapt to user's communication style
- **Progression**: Build on previous responses
- **Closure**: Provide satisfying conclusions

## 🚀 Advanced Techniques

### **1. Dynamic Prompt Selection**
```typescript
const promptVariants = {
  anxious: "Focus on grounding and safety...",
  sad: "Explore the depth of emotion...",
  angry: "Understand the underlying needs..."
}
```

### **2. Context-Aware Prompting**
```typescript
const userHistory = await getUserJournalHistory(userId)
const recentThemes = extractThemes(userHistory)
// Adapt prompts based on user's journey
```

### **3. Multi-Modal Prompting**
```typescript
// Future: Include user's mood, time of day, weather
const contextualPrompt = `Given it's ${timeOfDay} and the user typically feels ${moodPattern} at this time...`
```

## 📈 Measuring Success

### **Metrics to Track:**
- **Engagement**: How long users spend in dialogue
- **Completion**: How many finish the 5-question journey
- **Satisfaction**: User ratings of AI responses
- **Insights**: Quality of generated journal entries
- **Retention**: How often users return

### **Feedback Loop:**
1. Deploy prompt changes
2. Monitor user interactions
3. Collect feedback
4. Analyze patterns
5. Iterate and improve

---

## 🎯 Quick Start Customization

To customize your prompts:

1. **Edit** `supabase/functions/generate-dialogue/index.ts`
2. **Modify** the system prompts and user prompts
3. **Adjust** temperature and token settings
4. **Deploy** with `supabase functions deploy generate-dialogue`
5. **Test** using the 🤖 button in your app

Happy prompt tuning! 🚀 