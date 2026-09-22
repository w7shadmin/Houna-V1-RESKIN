import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/* ──────────────────────── Types ──────────────────────── */

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  country: string | null;
  created_at: string;
}

/** Structured error codes so screens can localize the message themselves — this context has no access to the string catalogue. */
export type AuthErrorCode =
  | 'email_in_use'
  | 'weak_password'
  | 'invalid_email'
  | 'invalid_credentials'
  | 'username_taken'
  | 'invalid_username'
  | 'cancelled'
  | 'unknown';

interface AuthResult {
  error: AuthErrorCode | null;
  /** signUpWithEmail only — Supabase's default project settings require confirming the address before a session exists. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  /** Still restoring a persisted session — screens should hold off rendering guest/Alias-specific UI until this clears. */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isGuest: boolean;
  /** Signed in but hasn't claimed a username yet — the one moment sign-up is incomplete. */
  needsUsername: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  claimUsername: (username: string) => Promise<AuthResult>;
  updateProfile: (fields: Partial<Pick<Profile, 'avatar_url' | 'country'>>) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ──────────────────────── Helpers ──────────────────────── */

function mapAuthError(message: string | undefined): AuthErrorCode {
  const m = (message ?? '').toLowerCase();
  if (m.includes('already registered') || m.includes('already exists')) return 'email_in_use';
  if (m.includes('password')) return 'weak_password';
  if (m.includes('invalid') && m.includes('email')) return 'invalid_email';
  if (m.includes('invalid login credentials')) return 'invalid_credentials';
  return 'unknown';
}

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

/* ──────────────────────── Provider ──────────────────────── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    setProfile(data as Profile | null);
  }, [session]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: mapAuthError(error.message) };
    return { error: null, needsEmailConfirmation: !data.session };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mapAuthError(error.message) };
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    const redirectTo = AuthSession.makeRedirectUri({ scheme: 'houna' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return { error: 'unknown' };

    if (Platform.OS === 'web') {
      window.location.href = data.url;
      return { error: null };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return { error: 'cancelled' };

    const hashIndex = result.url.indexOf('#');
    const params = new URLSearchParams(hashIndex >= 0 ? result.url.slice(hashIndex + 1) : '');
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return { error: 'unknown' };

    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    return { error: sessionError ? 'unknown' : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const claimUsername = useCallback(
    async (username: string): Promise<AuthResult> => {
      if (!session) return { error: 'unknown' };
      if (!USERNAME_PATTERN.test(username)) return { error: 'invalid_username' };

      const { data: available } = await supabase.rpc('is_username_available', { candidate: username });
      if (!available) return { error: 'username_taken' };

      const { error } = await supabase.from('profiles').insert({ id: session.user.id, username });
      if (error) return { error: error.code === '23505' ? 'username_taken' : 'unknown' };

      await refreshProfile();
      return { error: null };
    },
    [session, refreshProfile],
  );

  const updateProfile = useCallback(
    async (fields: Partial<Pick<Profile, 'avatar_url' | 'country'>>): Promise<AuthResult> => {
      if (!session) return { error: 'unknown' };
      const { error } = await supabase.from('profiles').update(fields).eq('id', session.user.id);
      if (error) return { error: 'unknown' };
      await refreshProfile();
      return { error: null };
    },
    [session, refreshProfile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      profile,
      isGuest: !session,
      needsUsername: !!session && !profile,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      claimUsername,
      updateProfile,
      refreshProfile,
    }),
    [loading, session, profile, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, claimUsername, updateProfile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ──────────────────────── Hook ──────────────────────── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
