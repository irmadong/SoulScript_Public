import { supabase } from './supabase'

export const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('journal_entries')
      .select('count', { count: 'exact', head: true })
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError)
      return {
        success: false,
        error: connectionError,
        message: 'Database tables may not exist. Please run the database setup SQL.'
      }
    }
    
    console.log('✅ Database connection successful!')
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth check failed:', authError)
      return {
        success: false,
        error: authError,
        message: 'Authentication error'
      }
    }
    
    console.log('✅ Authentication check passed!')
    console.log('👤 Current user:', user?.email || 'Not signed in')
    
    return {
      success: true,
      user,
      message: 'Database and authentication working correctly!'
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return {
      success: false,
      error,
      message: 'Unexpected error occurred'
    }
  }
}

export const checkTablesExist = async () => {
  try {
    console.log('🔍 Checking if database tables exist...')
    
    // Try to query each table
    const tables = ['journal_entries', 'profiles', 'dialogue_sessions']
    const results: Record<string, boolean> = {}
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true })
        
        results[table] = !error
        console.log(`${error ? '❌' : '✅'} Table "${table}": ${error ? 'Missing' : 'Exists'}`)
        
        if (error) {
          console.error(`   Error: ${error.message}`)
        }
      } catch (err) {
        results[table] = false
        console.log(`❌ Table "${table}": Error checking`)
      }
    }
    
    const allTablesExist = Object.values(results).every(exists => exists)
    
    return {
      success: allTablesExist,
      tables: results,
      message: allTablesExist 
        ? 'All database tables exist!' 
        : 'Some database tables are missing. Please run the database setup SQL.'
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error)
    return {
      success: false,
      error,
      message: 'Could not check database tables'
    }
  }
} 