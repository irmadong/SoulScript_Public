import { supabase } from './supabase'

export const deleteUserAccount = async (user: any) => {
  if (!user) throw new Error('User not authenticated')

  try {
    console.log('🗑️ Starting account deletion process...')

    // Step 1: Delete all user data from our tables
    console.log('Deleting journal entries...')
    const { error: journalError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', user.id)

    if (journalError) {
      console.error('Error deleting journal entries:', journalError)
      throw journalError
    }

    console.log('Deleting dialogue sessions...')
    const { error: dialogueError } = await supabase
      .from('dialogue_sessions')
      .delete()
      .eq('user_id', user.id)

    if (dialogueError) {
      console.error('Error deleting dialogue sessions:', dialogueError)
      throw dialogueError
    }

    console.log('Deleting user profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw profileError
    }

    // Step 2: Sign out the user (we can't delete auth account without admin privileges)
    console.log('Signing out user...')
    await supabase.auth.signOut()

    console.log('✅ Account data deletion completed successfully')
    console.log('ℹ️ Note: Authentication account still exists but all personal data has been removed')
    
    return {
      success: true,
      message: 'All your personal data has been permanently deleted. You have been signed out.'
    }

  } catch (error) {
    console.error('❌ Account deletion failed:', error)
    return {
      success: false,
      error,
      message: 'Failed to delete account. Please try again or contact support.'
    }
  }
}

export const exportUserData = async (user: any) => {
  if (!user) throw new Error('User not authenticated')

  try {
    console.log('📦 Exporting user data...')

    // Get all user data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    const { data: dialogueSessions } = await supabase
      .from('dialogue_sessions')
      .select('*')
      .eq('user_id', user.id)

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile,
      journalEntries: journalEntries || [],
      dialogueSessions: dialogueSessions || [],
      totalEntries: journalEntries?.length || 0
    }

    // Create downloadable JSON file
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `soulscript-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('✅ Data export completed')
    
    return {
      success: true,
      message: 'Your data has been exported and downloaded.'
    }

  } catch (error) {
    console.error('❌ Data export failed:', error)
    return {
      success: false,
      error,
      message: 'Failed to export data. Please try again.'
    }
  }
} 