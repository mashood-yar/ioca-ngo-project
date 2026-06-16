import { supabase } from './supabase';

export const signIn = async (email: string, password: string) =>
  await supabase.auth.signInWithPassword({ email, password });

export const signOut = async () => await supabase.auth.signOut();

export const getSession = async () => await supabase.auth.getSession();
