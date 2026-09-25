import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Loads rows from the `trial_sessions` table.
 * Used by both the home page fixtures board and the registration form.
 */
export function useTrialSessions() {
  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus('error')
      setErrorMessage(
        'The site is not connected to the database yet. Add your Supabase URL and anon key to .env, then restart the dev server.'
      )
      return
    }

    setStatus('loading')
    setErrorMessage('')

    const { data, error } = await supabase
      .from('trial_sessions')
      .select('id, city, trial_date, venue, reporting_time')
      .order('trial_date', { ascending: true })

    if (error) {
      console.error('Failed to load trial sessions', error)
      setStatus('error')
      setErrorMessage('Trial dates could not be loaded. Check your connection and try again.')
      return
    }

    setSessions(data ?? [])
    setStatus('ready')
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { sessions, status, errorMessage, reload: load }
}
