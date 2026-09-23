import { supabase } from './supabase';

export type VoicePostStatus = 'pending' | 'approved' | 'rejected';

export interface VoicePost {
  id: string;
  user_id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  for_meditation: boolean;
  status: VoicePostStatus;
  created_at: string;
  /** Only present when the row came from a query that joined `profiles` (the public feed) — a caller's own posts don't need it since it's always their own username. */
  username?: string;
}

/**
 * Both reads below go through a `SECURITY DEFINER` RPC rather than a
 * PostgREST embedded join (`profiles(username)`) — `profiles` RLS only
 * allows reading your own row, so a plain join silently returns a null
 * username for every post that isn't the viewer's own. The RPC returns
 * just the username, nothing else from `profiles`, for approved posts (or
 * the caller's own row regardless of status).
 */
export async function fetchApprovedPosts(): Promise<VoicePost[]> {
  const { data, error } = await supabase.rpc('get_voice_feed');
  if (error || !data) return [];
  return data as VoicePost[];
}

export async function fetchPost(id: string): Promise<VoicePost | null> {
  const { data, error } = await supabase.rpc('get_voice_post', { p_id: id });
  if (error || !data || data.length === 0) return null;
  return data[0] as VoicePost;
}

export async function fetchMyPosts(userId: string): Promise<VoicePost[]> {
  const { data, error } = await supabase
    .from('voice_posts')
    .select('id, user_id, title, body, image_url, for_meditation, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as VoicePost[];
}

interface SubmitPostInput {
  userId: string;
  title: string;
  body: string;
  imageUri: string | null;
  imageMimeType: string | null;
  forMeditation: boolean;
}

/** Uploads the photo first (if any) to the owner-scoped `voices` bucket, then inserts the post row — always as `status: 'pending'`, enforced server-side too (see the insert RLS policy). */
export async function submitPost(input: SubmitPostInput): Promise<{ error: string | null }> {
  try {
    let imageUrl: string | null = null;

    if (input.imageUri) {
      const ext = input.imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const path = `${input.userId}/${unique}.${ext}`;
      const response = await fetch(input.imageUri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('voices')
        .upload(path, arrayBuffer, { contentType: input.imageMimeType ?? 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('voices').getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const { error: insertError } = await supabase.from('voice_posts').insert({
      user_id: input.userId,
      title: input.title.trim() || null,
      body: input.body.trim() || null,
      image_url: imageUrl,
      for_meditation: input.forMeditation,
      status: 'pending',
    });
    if (insertError) throw insertError;

    return { error: null };
  } catch {
    return { error: 'unknown' };
  }
}

export async function deletePost(id: string): Promise<void> {
  await supabase.from('voice_posts').delete().eq('id', id);
}
