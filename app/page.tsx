"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Heart, MessageCircle, BookOpen, Sparkles, ArrowRight, RotateCcw, Edit, Trash2, Save, X, Shield, Lock, Globe, Users, Database, Settings, Download, UserX } from "lucide-react"
import { supabase, saveJournalEntry, loadJournalEntries, updateJournalEntry, deleteJournalEntry, type JournalEntry } from "@/lib/supabase"
import { testDatabaseConnection, checkTablesExist } from "@/lib/database-test"
import { deleteUserAccount, exportUserData } from "@/lib/account-management"
import { generateQuestion, generateSynthesis as generateAISynthesis, testEdgeFunction, type DialogueMessage } from "@/lib/openai-service"

type AppState = "auth" | "landing" | "input" | "dialogue" | "synthesis" | "history" | "settings"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

export default function SoulScript() {
  const [currentState, setCurrentState] = useState<AppState>("auth")
  const [initialInput, setInitialInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [dialogueStep, setDialogueStep] = useState(0)
  const [finalEntry, setFinalEntry] = useState("")
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])

  // New state for edit/delete functionality
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)

  // Account management state
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState("")

  // Authentication state with Supabase
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
      if (session?.user) {
        setCurrentState("landing")
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
        if (session?.user) {
          setCurrentState("landing")
        } else {
          setCurrentState("auth")
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Load journal entries when user is authenticated and viewing history
  useEffect(() => {
    if (user && currentState === "history") {
      loadJournalEntries(user)
        .then(setJournalEntries)
        .catch(console.error)
    }
  }, [user, currentState])

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to auth if not authenticated
  if (!user && currentState !== "auth") {
    setCurrentState("auth")
  }

  // Extended dialogue responses for fallback (9 questions, step 10 gets positive closing)
  const aiResponses = [
    "I hear that you're feeling this way. Can you tell me more about what specifically triggered these emotions today?",
    "That sounds significant. How do you think this situation is affecting other areas of your life?",
    "It's interesting that you mention that. What would you say to a close friend who was experiencing something similar?",
    "I'm sensing there might be deeper layers here. What do you think your emotions are trying to tell you?",
    "How does this connect to your values and what matters most to you?",
    "What patterns do you notice in how you respond to situations like this?",
    "If you could send a message to yourself from a year ago about this, what would you say?",
    "What would it look like if you approached this with complete self-compassion?",
    "What strengths have you discovered about yourself through this experience?",
    "As we wrap up our dialogue, what insights have emerged for you through this conversation?",
  ]

  // Maximum dialogue steps (can be ended early by user)
  const MAX_DIALOGUE_STEPS = 10

  // Real Google Sign-In with Supabase
  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) {
        console.error('Error signing in with Google:', error)
        setAuthLoading(false)
      }
      // Note: Don't set loading to false here - the auth state change will handle it
    } catch (error) {
      console.error('Error signing in with Google:', error)
      setAuthLoading(false)
    }
  }

  // Real Sign-Out with Supabase
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        // Clear local state
        setJournalEntries([])
        setMessages([])
        setInitialInput("")
        setCurrentMessage("")
        setDialogueStep(0)
        setFinalEntry("")
        setCurrentState("auth")
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Database Test Function
  const handleDatabaseTest = async () => {
    console.log('🧪 Running database tests...')
    
    // Test database connection
    const connectionResult = await testDatabaseConnection()
    console.log('Connection test result:', connectionResult)
    
    // Check if tables exist
    const tablesResult = await checkTablesExist()
    console.log('Tables check result:', tablesResult)
    
    // Show results in alert
    if (!connectionResult.success || !tablesResult.success) {
      alert(`❌ Database Issue Detected!\n\n${connectionResult.message}\n${tablesResult.message}\n\nCheck the browser console for details.`)
    } else {
      alert(`✅ Database Working!\n\n${connectionResult.message}\n${tablesResult.message}`)
    }
  }

  // Account Management Functions
  const handleExportData = async () => {
    const result = await exportUserData(user)
    if (result.success) {
      alert(`✅ ${result.message}`)
    } else {
      alert(`❌ ${result.message}`)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmation !== "DELETE MY ACCOUNT") {
      alert("Please type 'DELETE MY ACCOUNT' exactly to confirm.")
      return
    }

    const result = await deleteUserAccount(user)
    if (result.success) {
      alert(`✅ ${result.message}`)
      // Sign out and redirect to auth
      setCurrentState("auth")
      setUser(null)
    } else {
      alert(`❌ ${result.message}`)
    }
    setShowDeleteAccountDialog(false)
    setDeleteAccountConfirmation("")
  }

  const handleInitialSubmit = async () => {
    if (initialInput.trim()) {
      setAiLoading(true)
      
      const userMessage: Message = {
        id: "1",
        type: "user",
        content: initialInput,
        timestamp: new Date(),
      }

      try {
        // Generate AI question using OpenAI
        const aiResponse = await generateQuestion(initialInput)
        
        const aiMessage: Message = {
          id: "2",
          type: "ai",
          content: aiResponse,
          timestamp: new Date(),
        }
        
        setMessages([userMessage, aiMessage])
        setCurrentState("dialogue")
        setDialogueStep(1)
      } catch (error) {
        console.error('Error generating AI response:', error)
        // Fallback to hardcoded response
        const aiMessage: Message = {
          id: "2",
          type: "ai",
          content: aiResponses[0],
          timestamp: new Date(),
        }
        setMessages([userMessage, aiMessage])
        setCurrentState("dialogue")
        setDialogueStep(1)
      } finally {
        setAiLoading(false)
      }
    }
  }

  const handleDialogueSubmit = async () => {
    if (currentMessage.trim()) {
      setAiLoading(true)
      
      const userMessage: Message = {
        id: `${messages.length + 1}`,
        type: "user",
        content: currentMessage,
        timestamp: new Date(),
      }

      const newMessages = [...messages, userMessage]

      if (dialogueStep < MAX_DIALOGUE_STEPS - 1) {
        try {
          // Convert messages to DialogueMessage format for OpenAI
          const dialogueMessages: DialogueMessage[] = newMessages.map(m => ({
            type: m.type,
            content: m.content
          }))
          
          // Generate AI question using OpenAI
          const aiResponse = await generateQuestion(undefined, dialogueMessages)
          
          const aiMessage: Message = {
            id: `${messages.length + 2}`,
            type: "ai",
            content: aiResponse,
            timestamp: new Date(),
          }
          newMessages.push(aiMessage)
          setDialogueStep(dialogueStep + 1)
        } catch (error) {
          console.error('Error generating AI response:', error)
          // Fallback to hardcoded response (use modulo to cycle through if needed)
          const responseIndex = Math.min(dialogueStep, aiResponses.length - 1)
          const aiMessage: Message = {
            id: `${messages.length + 2}`,
            type: "ai",
            content: aiResponses[responseIndex],
            timestamp: new Date(),
          }
          newMessages.push(aiMessage)
          setDialogueStep(dialogueStep + 1)
        }
      } else if (dialogueStep === MAX_DIALOGUE_STEPS - 1) {
        // At the final step, provide positive closing message instead of another question
        const closingMessages = [
          "Thank you for sharing so openly and honestly. Your willingness to explore your inner world shows incredible courage and self-awareness. You've gained valuable insights today that will serve you well on your journey.",
          "What a beautiful dialogue we've had together. Your thoughtful reflections and genuine curiosity about yourself are truly inspiring. You have everything within you to navigate whatever comes next with wisdom and grace.",
          "I'm deeply moved by your openness and the depth of your self-reflection. You've shown such strength in exploring these feelings and thoughts. Trust in the insights you've discovered today—they are your inner wisdom speaking.",
          "This has been a profound journey of self-discovery. Your honesty and vulnerability have led to meaningful insights that will continue to guide you. You should feel proud of the inner work you've done today.",
          "Thank you for allowing me to witness your journey of self-exploration. Your capacity for reflection and growth is remarkable. The insights you've uncovered today are treasures that will illuminate your path forward."
        ]
        
        const randomClosing = closingMessages[Math.floor(Math.random() * closingMessages.length)]
        
        const aiMessage: Message = {
          id: `${messages.length + 2}`,
          type: "ai",
          content: randomClosing,
          timestamp: new Date(),
        }
        newMessages.push(aiMessage)
        setDialogueStep(dialogueStep + 1)
      }

      setMessages(newMessages)
      setCurrentMessage("")
      setAiLoading(false)

      if (dialogueStep >= MAX_DIALOGUE_STEPS) {
        // Generate synthesis after reaching max steps (including the closing message)
        setTimeout(() => {
          generateSynthesis(newMessages)
        }, 1000)
      }
    }
  }

  const handleEndDialogue = () => {
    if (currentMessage.trim()) {
      const userMessage: Message = {
        id: `${messages.length + 1}`,
        type: "user",
        content: currentMessage,
        timestamp: new Date(),
      }
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      setCurrentMessage("")
      generateSynthesis(newMessages)
    } else {
      generateSynthesis(messages)
    }
  }

  const generateSynthesis = async (allMessages: Message[]) => {
    setAiLoading(true)
    
    try {
      // Convert messages to DialogueMessage format for OpenAI
      const dialogueMessages: DialogueMessage[] = allMessages.map(m => ({
        type: m.type,
        content: m.content
      }))
      
      // Generate AI synthesis using OpenAI
      const synthesis = await generateAISynthesis(dialogueMessages)
      setFinalEntry(synthesis)

      // Save to Supabase database
      try {
        const newEntry = {
          content: synthesis,
          initialInput: initialInput,
          dialogue: allMessages,
          title: `Journal Entry - ${new Date().toLocaleDateString()}`
        }
        
        const savedEntry = await saveJournalEntry(newEntry, user)
        console.log('Journal entry saved:', savedEntry)
      } catch (error) {
        console.error('Error saving journal entry:', error)
      }

      setCurrentState("synthesis")
    } catch (error) {
      console.error('Error generating synthesis:', error)
      
      // Fallback synthesis
      const userMessages = allMessages.filter((m) => m.type === "user")
      const synthesis = `Today, I found myself reflecting on ${userMessages[0].content.toLowerCase()}

Through this dialogue with myself, I've discovered that my emotions are more layered than I initially realized. ${userMessages[1]?.content || "I explored deeper into my feelings."} 

${userMessages[2]?.content || "I gained new perspectives on my situation."} This conversation has helped me understand that ${userMessages[3]?.content || "there are insights waiting to be uncovered within me."} 

Moving forward, I feel more connected to my inner wisdom and ready to embrace whatever comes next with greater self-awareness.`

      setFinalEntry(synthesis)

      // Save to Supabase database
      try {
        const newEntry = {
          content: synthesis,
          initialInput: initialInput,
          dialogue: allMessages,
          title: `Journal Entry - ${new Date().toLocaleDateString()}`
        }
        
        const savedEntry = await saveJournalEntry(newEntry, user)
        console.log('Journal entry saved:', savedEntry)
      } catch (error) {
        console.error('Error saving journal entry:', error)
      }

      setCurrentState("synthesis")
    } finally {
      setAiLoading(false)
    }
  }

  // New handlers for edit/delete functionality
  const handleEditEntry = (entryId: string, content: string) => {
    setEditingEntry(entryId)
    setEditContent(content)
  }

  const handleSaveEdit = async () => {
    if (editingEntry && editContent.trim()) {
      try {
        await updateJournalEntry(editingEntry, editContent.trim(), user)
        // Refresh the journal entries list
        if (currentState === "history") {
          const updatedEntries = await loadJournalEntries(user)
          setJournalEntries(updatedEntries)
        }
        setEditingEntry(null)
        setEditContent("")
      } catch (error) {
        console.error('Error updating journal entry:', error)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
    setEditContent("")
  }

  const handleDeleteEntry = (entryId: string) => {
    setDeleteEntryId(entryId)
  }

  const confirmDeleteEntry = async () => {
    if (deleteEntryId) {
      try {
        await deleteJournalEntry(deleteEntryId, user)
        // Refresh the journal entries list
        if (currentState === "history") {
          const updatedEntries = await loadJournalEntries(user)
          setJournalEntries(updatedEntries)
        }
        setDeleteEntryId(null)
      } catch (error) {
        console.error('Error deleting journal entry:', error)
        setDeleteEntryId(null)
      }
    }
  }

  const cancelDeleteEntry = () => {
    setDeleteEntryId(null)
  }

  const resetApp = () => {
    setCurrentState("landing")
    setInitialInput("")
    setMessages([])
    setCurrentMessage("")
    setDialogueStep(0)
    setFinalEntry("")
  }

  const renderHeader = () => (
    <div className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm border-b border-rose-200">
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 text-rose-500" />
        <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
          SoulScript
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <Button
          variant="ghost"
          onClick={() => setCurrentState("landing")}
          className="text-gray-600 hover:text-rose-600"
        >
          Home
        </Button>
        <Button
          variant="ghost"
          onClick={() => setCurrentState("history")}
          className="text-gray-600 hover:text-rose-600"
        >
          History
        </Button>
        <Button
          variant="ghost"
          onClick={() => setCurrentState("settings")}
          className="text-gray-600 hover:text-purple-600"
          title="Account Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={handleDatabaseTest}
          className="text-gray-600 hover:text-blue-600"
          title="Test Database Connection"
        >
          <Database className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            const isWorking = await testEdgeFunction()
            alert(isWorking ? '✅ OpenAI Edge Function Working!' : '❌ OpenAI Edge Function Not Working')
          }}
          className="text-gray-600 hover:text-green-600"
          title="Test OpenAI Edge Function"
        >
          🤖
        </Button>
        {user && (
          <div className="flex items-center gap-3 ml-2">
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-rose-200"
                />
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-red-600"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  if (currentState === "auth") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Heart className="h-10 w-10 text-rose-500" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                SoulScript
              </h1>
            </div>
            <p className="text-2xl text-gray-600 mb-4 max-w-2xl mx-auto">Welcome to Your Inner Journey</p>
            <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto leading-relaxed">
              Sign in securely with Google to begin your personalized dialogue experience. Your journal entries will be safely stored and accessible across all your devices.
            </p>
          </div>

          {/* Authentication Card */}
          <div className="max-w-md mx-auto mb-12">
            <Card className="bg-white/90 backdrop-blur-sm border-rose-200 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Shield className="h-6 w-6 text-rose-500" />
                  <CardTitle className="text-xl text-gray-800">Secure Sign In</CardTitle>
                </div>
                <p className="text-gray-600 text-sm">
                  Continue with your Google account to access your personal journal space
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm py-3 px-4 text-base font-medium"
                >
                  {authLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-500"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </div>
                  )}
                </Button>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Lock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <CardTitle className="text-blue-700">Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm">
                  Your journal entries are encrypted and stored securely. Only you can access your personal reflections.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Globe className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-green-700">Cross-Device Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm">
                  Access your journal from any device. Your entries sync automatically across all platforms.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <CardTitle className="text-purple-700">AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm">
                  Get personalized reflections and insights powered by advanced AI to deepen your self-understanding.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Why Choose SoulScript?</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="text-left">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Guided Self-Discovery</h4>
                    <p className="text-gray-600 text-sm">AI-powered questions help you explore your emotions and thoughts more deeply than traditional journaling.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Beautiful Journal Entries</h4>
                    <p className="text-gray-600 text-sm">Transform your raw thoughts into beautifully crafted journal entries that capture your inner journey.</p>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Personal Growth</h4>
                    <p className="text-gray-600 text-sm">Track your emotional patterns and growth over time with a searchable history of your reflections.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Always Available</h4>
                    <p className="text-gray-600 text-sm">Your personal AI companion is available 24/7 to help you process emotions and gain clarity.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16 pt-8 border-t border-rose-200">
            <p className="text-gray-500 text-sm">
              Join thousands of users on their journey to self-discovery
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (currentState === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Heart className="h-8 w-8 text-rose-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                SoulScript
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'friend'}! 👋
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto leading-relaxed">
              Ready for another dialogue with yourself? Transform your emotions into deeper self-understanding through AI-guided conversation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-rose-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <MessageCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <CardTitle className="text-rose-700">Express</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">Share your current emotional state or what's on your mind</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Sparkles className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <CardTitle className="text-orange-700">Explore</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">Engage in guided dialogue that deepens your self-awareness</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <CardTitle className="text-amber-700">Synthesize</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Receive a beautiful journal entry that captures your journey
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => setCurrentState("input")}
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white px-8 py-3 text-lg"
              >
                Begin Your Dialogue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => setCurrentState("history")}
                variant="outline"
                size="lg"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 px-8 py-3 text-lg"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                View History
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {journalEntries.length > 0 
                ? `You have ${journalEntries.length} journal ${journalEntries.length === 1 ? 'entry' : 'entries'}`
                : "Start your first dialogue to create your first journal entry"
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (currentState === "input") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4">
        {renderHeader()}
        <div className="max-w-2xl mx-auto py-12">
          <div className="text-center mb-8">
            <Heart className="h-8 w-8 text-rose-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">How are you feeling right now?</h2>
            <p className="text-gray-600">
              Share whatever is on your mind or in your heart. There's no right or wrong way to begin.
            </p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-rose-200">
            <CardContent className="p-6">
              <Textarea
                value={initialInput}
                onChange={(e) => setInitialInput(e.target.value)}
                placeholder="I'm feeling... I've been thinking about... Today has been..."
                className="min-h-[200px] border-rose-200 focus:border-rose-400 resize-none text-lg leading-relaxed"
              />
              <div className="flex justify-between items-center mt-6">
                <Button variant="ghost" onClick={() => setCurrentState("landing")} className="text-gray-500">
                  Back
                </Button>
                <Button
                  onClick={handleInitialSubmit}
                  disabled={!initialInput.trim() || aiLoading}
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      Start Dialogue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentState === "dialogue") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4">
        {renderHeader()}
        <div className="max-w-3xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MessageCircle className="h-6 w-6 text-rose-500" />
              <h2 className="text-2xl font-bold text-gray-800">Dialogue in Progress</h2>
            </div>
            <Badge variant="secondary" className="bg-rose-100 text-rose-700">
              Step {Math.min(dialogueStep, MAX_DIALOGUE_STEPS)} of {MAX_DIALOGUE_STEPS}
            </Badge>
          </div>

          <div className="space-y-6 mb-8">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white"
                      : "bg-white/80 backdrop-blur-sm border-rose-200"
                  }`}
                >
                  <CardContent className="p-4">
                    <p className="leading-relaxed">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {dialogueStep < MAX_DIALOGUE_STEPS && (
            <Card className="bg-white/80 backdrop-blur-sm border-rose-200">
              <CardContent className="p-6">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Continue the dialogue..."
                  className="min-h-[120px] border-rose-200 focus:border-rose-400 resize-none"
                />
                <div className="flex justify-between mt-4">
                  <Button
                    onClick={handleEndDialogue}
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    End Dialogue
                  </Button>
                  <Button
                    onClick={handleDialogueSubmit}
                    disabled={!currentMessage.trim() || aiLoading}
                    className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
                  >
                    {aiLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Thinking...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(dialogueStep >= MAX_DIALOGUE_STEPS || aiLoading) && (
            <div className="text-center">
              <div className="animate-pulse">
                <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  {aiLoading ? "AI is thinking..." : "Synthesizing your dialogue into a journal entry..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentState === "synthesis") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4">
        {renderHeader()}
        <div className="max-w-3xl mx-auto py-12">
          <div className="text-center mb-8">
            <BookOpen className="h-8 w-8 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Journal Entry</h2>
            <p className="text-gray-600">A synthesis of your inner dialogue, crafted with care</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-lg">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line font-serif text-lg">{finalEntry}</div>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-amber-200">
                <p className="text-sm text-gray-500">
                  Created on{" "}
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <Button
                  onClick={resetApp}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Dialogue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentState === "history") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
        {renderHeader()}
        <div className="max-w-4xl mx-auto p-4 py-8">
          <div className="text-center mb-8">
            <BookOpen className="h-8 w-8 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Journal History</h2>
            <p className="text-gray-600">A collection of your inner dialogues and discoveries</p>
          </div>

          {journalEntries.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-rose-200">
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No journal entries yet</h3>
                <p className="text-gray-500 mb-6">Start your first dialogue to create your first journal entry</p>
                <Button
                  onClick={() => setCurrentState("input")}
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
                >
                  Begin Your First Dialogue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {journalEntries.map((entry) => (
                <Card key={entry.id} className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-800">
                          {new Date(entry.created_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Started with: "{entry.initial_input.substring(0, 100)}..."
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          {new Date(entry.created_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEntry(entry.id, entry.content)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-gray-700 leading-relaxed whitespace-pre-line font-serif">
                        {entry.content.length > 300 ? `${entry.content.substring(0, 300)}...` : entry.content}
                      </div>
                    </div>
                    {entry.content.length > 300 && (
                      <Button
                        variant="ghost"
                        className="mt-4 text-rose-600 hover:text-rose-700 p-0 h-auto"
                        onClick={() => {
                          setFinalEntry(entry.content)
                          setCurrentState("synthesis")
                        }}
                      >
                        Read full entry →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Dialog open={editingEntry !== null} onOpenChange={handleCancelEdit}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Edit Journal Entry
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your journal entry..."
                className="min-h-[300px] border-rose-200 focus:border-rose-400 resize-none text-base leading-relaxed"
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteEntryId !== null} onOpenChange={cancelDeleteEntry}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold text-gray-800">
                Delete Journal Entry
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete this journal entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={cancelDeleteEntry}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteEntry}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  if (currentState === "settings") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
        {renderHeader()}
        <div className="max-w-2xl mx-auto p-4 py-8">
          <div className="text-center mb-8">
            <Settings className="h-8 w-8 text-purple-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Account Settings</h2>
            <p className="text-gray-600">Manage your account and data</p>
          </div>

          <div className="space-y-6">
            {/* Profile Information */}
            <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {user?.user_metadata?.avatar_url && (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full border-2 border-purple-200"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {user?.user_metadata?.full_name || 'No name provided'}
                    </p>
                    <p className="text-gray-600">{user?.email}</p>
                    <p className="text-sm text-gray-500">
                      Member since {new Date(user?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Export Your Data</h4>
                    <p className="text-sm text-gray-600">Download all your journal entries and data</p>
                  </div>
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Journal Entries</h4>
                    <p className="text-sm text-gray-600">
                      You have {journalEntries.length} journal {journalEntries.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setCurrentState("history")}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-white/90 backdrop-blur-sm border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-500" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">Delete Account Data</h4>
                  <p className="text-sm text-red-600 mb-4">
                    Permanently delete all your personal data and journal entries. This action cannot be undone.
                  </p>
                  <Button
                    onClick={() => setShowDeleteAccountDialog(true)}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Delete Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold text-red-800">
                Delete All Personal Data
              </AlertDialogTitle>
              <div className="text-gray-600 space-y-3">
                <p>This will permanently delete all your personal data including:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All journal entries</li>
                  <li>Dialogue history</li>
                  <li>Profile information</li>
                </ul>
                <p className="text-sm text-gray-500 mt-2">
                  Note: Your Google account will remain active, but all SoulScript data will be removed.
                </p>
                <p className="font-semibold text-red-600">This action cannot be undone.</p>
              </div>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE MY ACCOUNT" to confirm:
              </label>
              <input
                type="text"
                value={deleteAccountConfirmation}
                onChange={(e) => setDeleteAccountConfirmation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="DELETE MY ACCOUNT"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => {
                  setShowDeleteAccountDialog(false)
                  setDeleteAccountConfirmation("")
                }}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteAccountConfirmation !== "DELETE MY ACCOUNT"}
                className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <UserX className="mr-2 h-4 w-4" />
                Delete Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return null
}
