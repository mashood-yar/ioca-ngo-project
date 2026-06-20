import { supabase } from './supabase'

// Sign up with email/password
export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  // Validate inputs
  if (!email || !password || password.length < 8 || !fullName) {
    throw new Error('All fields required. Password must be at least 8 characters.')
  }

  // Create Supabase auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  // Verification email sent automatically by Supabase
  return {
    user: data.user,
    message: 'Check your email to verify your account',
  }
}

// Sign in with email/password
export const signInWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email and password required')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Password reset
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { message: 'Password reset link sent to your email' }
}

// Update password (for password reset flow)
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { message: 'Password updated successfully' }
}
